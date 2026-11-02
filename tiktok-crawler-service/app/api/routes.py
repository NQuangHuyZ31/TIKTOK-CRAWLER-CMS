from contextlib import asynccontextmanager
import logging
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, model_validator

from core.config import (
    CRAWLER_TOKEN,
    MAX_ACCOUNTS_PER_JOB,
    normalize_callback_url,
)
from core.utils import extract_username_from_url, normalize_username
from engine.queue_manager import QueueFullError, QueueManager
from services.dataset import DatasetInsufficientError, DatasetLoader

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
        self.callback_url = normalize_callback_url(self.callback_url)
        self.callback_token = self.callback_token or CRAWLER_TOKEN
        return self


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
) -> FastAPI:
    qm = queue_manager or QueueManager()
    ds = dataset_loader or DatasetLoader()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await qm.start()
        try:
            yield
        finally:
            await qm.stop()

    app = FastAPI(title="TikTok Crawler Service", lifespan=lifespan)
    app.state.queue_manager = qm
    app.state.dataset_loader = ds

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
        targets = _resolve_targets(request, ds)
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
            result = await qm.enqueue_job(
                job_id=request.job_id,
                source_type=request.source_type or "usernames",
                targets=targets,
                callback_url=request.callback_url,
                callback_token=request.callback_token,
                done_usernames=request.done_usernames,
                crawl_mode=request.crawl_mode,
                max_videos_per_account=request.max_videos_per_account,
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

    return app


def _resolve_targets(request: CrawlRequest, dataset_loader: DatasetLoader) -> list[str]:
    """Deduplicate and resolve target usernames/URLs or sample from dataset for 'count' mode."""
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
