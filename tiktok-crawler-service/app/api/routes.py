from contextlib import asynccontextmanager
import logging
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, model_validator

from core.config import (
    CRAWLER_TOKEN,
    MAX_ACCOUNTS_PER_JOB,
    QUEUE_DB_PATH,
    CRAWLER_DISCOVERY_ENABLED,
    normalize_callback_url,
)
from core.utils import extract_username_from_url, normalize_username, resolve_date_bounds
from engine.queue_manager import QueueFullError, QueueManager
from services.dataset import DatasetInsufficientError, DatasetLoader

try:
    from workers.discovery_worker import DiscoveryWorker, DiscoveryWorkerPool
    from engine.sagas.privacy_saga import PrivacySagaCoordinator
    from engine.schema import initialize_database
    from repositories.candidate_repo import CandidateRepository
    from repositories.queue_store import QueueStore
except ImportError:
    from app.workers.discovery_worker import DiscoveryWorker, DiscoveryWorkerPool
    from app.engine.sagas.privacy_saga import PrivacySagaCoordinator
    from app.engine.schema import initialize_database
    from app.repositories.candidate_repo import CandidateRepository
    from app.repositories.queue_store import QueueStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


class CrawlRequest(BaseModel):
    job_id: int = Field(gt=0)
    callback_url: str | None = None
    callback_token: str | None = None
    source_type: Literal["usernames", "urls", "count"] | None = None
    crawl_mode: str = "account_with_videos"
    max_videos_per_account: int = Field(default=20, ge=0, le=100)
    usernames: list[str] | None = None
    urls: list[str] | None = None
    total_accounts: int | None = Field(default=None, gt=0)
    done_usernames: list[str] | None = None
    target_date: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    timezone: str | None = "Asia/Ho_Chi_Minh"

    @model_validator(mode="after")
    def validate_source(self):
        values = {
            "usernames": bool(self.usernames),
            "urls": bool(self.urls),
            "count": self.total_accounts is not None and not self.usernames and not self.urls,
        }
        selected = [source for source, active in values.items() if active]
        if len(selected) != 1:
            raise ValueError("Select exactly one crawl mode: usernames, urls, or count")

        if self.source_type and self.source_type != selected[0]:
            raise ValueError(
                f"source_type '{self.source_type}' does not match the supplied data"
            )

        self.source_type = selected[0]
        if self.crawl_mode == "account_only":
            self.max_videos_per_account = 0
        self.callback_url = normalize_callback_url(self.callback_url)
        self.callback_token = self.callback_token or CRAWLER_TOKEN
        return self


class PrivacyPurgeRequest(BaseModel):
    entity_type: str = Field(..., description="Entity type: 'username', 'sec_uid', or 'account'")
    entity_key: str = Field(..., description="Identifier: username or sec_uid")
    purge_request_id: str = Field(..., description="Correlation ID from CMS purge request")
    reason: str | None = Field(default="privacy_request")


def verify_bearer_token(authorization: str | None = Header(default=None)) -> None:
    """Verify shared Bearer token when CRAWLER_TOKEN is configured."""
    if not CRAWLER_TOKEN:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    supplied = authorization.removeprefix("Bearer ").strip()
    if supplied != CRAWLER_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid crawler token")


def create_app(
    queue_manager: QueueManager | None = None,
    dataset_loader: DatasetLoader | None = None,
    discovery_pool: DiscoveryWorkerPool | None = None,
    candidate_repo: CandidateRepository | None = None,
) -> FastAPI:
    qm = queue_manager or QueueManager()
    ds = dataset_loader or DatasetLoader()
    cr = candidate_repo or CandidateRepository(QUEUE_DB_PATH)
    dp = discovery_pool
    if dp is None and CRAWLER_DISCOVERY_ENABLED:
        try:
            dp = DiscoveryWorkerPool(QUEUE_DB_PATH)
        except Exception as e:
            logger.warning(f"DiscoveryWorkerPool initialization warning: {e}")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # 1. Ensure full SQLite WAL schema (all 24 tables & rate limit state) is initialized
        try:
            init_conn = initialize_database(QUEUE_DB_PATH)
            init_conn.close()
        except Exception as e:
            logger.warning(f"Database schema initialization warning: {e}")

        # 2. Start legacy QueueManager workers
        await qm.start()

        # 3. Discovery Refill Worker pre-warm and start dedicated Discovery Worker Pool
        if CRAWLER_DISCOVERY_ENABLED and dp:
            try:
                dp.worker.check_and_refill_on_startup()
                await dp.start()
                app.state.discovery_worker = dp.worker
                app.state.discovery_pool = dp
            except Exception as e:
                logger.warning(f"Discovery pool startup skipped or failed: {e}")

        try:
            yield
        finally:
            if dp:
                await dp.stop()
            await qm.stop()

    app = FastAPI(title="TikTok Crawler Service", lifespan=lifespan)
    app.state.queue_manager = qm
    app.state.dataset_loader = ds
    app.state.candidate_repo = cr

    @app.get("/health")
    async def health():
        overview = qm.get_queue_overview()
        return {
            "status": "ok",
            "running_jobs": overview["active_workers"],
            "queued_jobs": overview["queued_jobs_count"],
            "worker_count": overview["worker_count"],
        }

    @app.get("/api/queue", dependencies=[Depends(verify_bearer_token)])
    async def queue_status():
        return qm.get_queue_overview()

    @app.post("/api/crawl-jobs", status_code=202, dependencies=[Depends(verify_bearer_token)])
    @app.post("/api/crawl-jobs/start", status_code=202, dependencies=[Depends(verify_bearer_token)])
    async def submit_crawl_job(request: CrawlRequest):
        targets = _resolve_targets(request, ds, cr, qm.store)
        if len(targets) > MAX_ACCOUNTS_PER_JOB:
            raise HTTPException(
                status_code=422,
                detail=f"Job exceeds maximum allowed accounts ({MAX_ACCOUNTS_PER_JOB}).",
            )
        if not targets:
            raise HTTPException(
                status_code=422,
                detail="No valid TikTok accounts found in crawl request.",
            )

        try:
            df_utc, dt_utc = resolve_date_bounds(
                target_date=request.target_date,
                date_from=request.date_from,
                date_to=request.date_to,
                tz_name=request.timezone,
            )
            result = await qm.enqueue_job(
                job_id=request.job_id,
                source_type=request.source_type or "usernames",
                targets=targets,
                callback_url=request.callback_url,
                callback_token=request.callback_token,
                done_usernames=request.done_usernames,
                crawl_mode=request.crawl_mode,
                max_videos_per_account=request.max_videos_per_account,
                requested_total=request.total_accounts if request.source_type == "count" else None,
                date_from=df_utc,
                date_to=dt_utc,
            )
            return result
        except QueueFullError as err:
            raise HTTPException(status_code=503, detail=str(err)) from err

    @app.get("/api/crawl-jobs/{job_id}", dependencies=[Depends(verify_bearer_token)])
    async def get_crawl_job(job_id: int):
        status = await qm.get_job_status(job_id)
        if not status:
            raise HTTPException(status_code=404, detail="Crawl job not found in queue")
        return status

    @app.delete("/api/crawl-jobs/{job_id}", dependencies=[Depends(verify_bearer_token)])
    async def cancel_crawl_job(job_id: int):
        cancelled = await qm.cancel_job(job_id)
        if not cancelled:
            raise HTTPException(
                status_code=404,
                detail="Crawl job not found or already completed/cancelled",
            )
        return {"job_id": job_id, "status": "cancelled"}

    @app.post("/api/crawler/privacy/purge", dependencies=[Depends(verify_bearer_token)])
    async def purge_privacy_entity(payload: PrivacyPurgeRequest):
        try:
            coordinator = PrivacySagaCoordinator(QUEUE_DB_PATH)
            result = coordinator.purge_entity(
                entity_type=payload.entity_type,
                entity_key=payload.entity_key,
                purge_request_id=payload.purge_request_id,
                reason=payload.reason or "gdpr_purge",
            )
            return {"status": "success", "data": result}
        except Exception as e:
            logger.error(f"Privacy purge failed for {payload.entity_key}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    return app


def _resolve_targets(
    request: CrawlRequest,
    dataset_loader: DatasetLoader,
    candidate_repo: CandidateRepository | None = None,
    queue_store: QueueStore | None = None,
) -> list[str]:
    """Deduplicate and resolve target usernames/URLs or sample balanced 50/50 targets for 'count' mode."""
    seen: set[str] = set()
    targets: list[str] = []

    if request.source_type == "usernames" and request.usernames:
        for raw in request.usernames:
            clean = normalize_username(raw)
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                targets.append(clean)
        return targets

    if request.source_type == "urls" and request.urls:
        for raw_url in request.urls:
            url = str(raw_url).strip()
            clean = extract_username_from_url(url) or normalize_username(url)
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                targets.append(url)
        return targets

    if request.source_type == "count" and request.total_accounts:
        if request.total_accounts > MAX_ACCOUNTS_PER_JOB:
            raise HTTPException(
                status_code=422,
                detail=f"Requested count ({request.total_accounts}) exceeds maximum allowed ({MAX_ACCOUNTS_PER_JOB}).",
            )

        # 1. Primary resolver: Sample 50% Historical + 50% Fresh Discovery from SQLite Candidate Pool (v2.2 Architecture)
        if candidate_repo:
            try:
                active_targets = (
                    queue_store.get_active_job_targets_sync(exclude_job_id=request.job_id)
                    if queue_store
                    else set()
                )
                exclude_list = list(set(request.done_usernames or []).union(active_targets))
                sampled = candidate_repo.sample_targets_balanced(
                    count=request.total_accounts,
                    exclude=exclude_list,
                    allow_fallback=True,
                    job_id=str(request.job_id) if request.job_id is not None else None,
                )
                if sampled:
                    return sampled
            except Exception as e:
                logger.warning(f"Error sampling balanced targets from candidate_repo: {e}")

        # 2. Fallback resolver for cold start or tests without candidate pool
        try:
            return dataset_loader.sample_usernames(
                count=request.total_accounts,
                exclude=request.done_usernames,
            )
        except DatasetInsufficientError as err:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": str(err),
                    "requested": err.requested,
                    "available": err.available,
                },
            ) from err

    return []


app = create_app()
