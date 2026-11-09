"""
Job Runner Worker
Executes crawl jobs sequentially on background workers.
"""

import asyncio
import logging
from typing import Literal

from core.config import ACCOUNT_TIMEOUT
from core.utils import build_profile_url, extract_username_from_url, normalize_username
from crawler.tiktok_client import TikTokClient
from engine.store import QueueStore
try:
    from repositories.candidate_repo import CandidateRepository
except ImportError:
    from app.repositories.candidate_repo import CandidateRepository
from schemas.models import AccountCrawlOutcome, CrawlJobRecord
from services.laravel_client import LaravelClient, LaravelDeliveryError, LaravelJobNotFoundError

logger = logging.getLogger(__name__)


def parse_target_entry(entry: str) -> tuple[str, str]:
    """Convert a target string (username or URL) into (clean_username, profile_url)."""
    raw = str(entry).strip()
    if "tiktok.com/" in raw.lower() or raw.lower().startswith(("http://", "https://")):
        username = extract_username_from_url(raw) or normalize_username(raw)
        url = raw if username else ""
        return username, url or (build_profile_url(username) if username else "")
    username = normalize_username(raw)
    return username, build_profile_url(username) if username else ""


class JobRunner:
    """
    Executes a single CrawlJobRecord sequentially on a worker:
    - Sends 'started' event to Laravel
    - Skips accounts already present in SQLite `done_accounts`
    - Enforces `ACCOUNT_TIMEOUT` per account
    - Sends 'account' result to Laravel immediately after each account finishes
    - Marks account done in SQLite only AFTER Laravel acknowledges receipt
    - Sends 'completed' event when all targets are processed
    """

    def __init__(
        self,
        store: QueueStore,
        tiktok_client: TikTokClient,
        laravel_client: LaravelClient,
        candidate_repo: CandidateRepository | None = None,
        account_timeout: float = ACCOUNT_TIMEOUT,
    ):
        self.store = store
        self.tiktok_client = tiktok_client
        self.laravel_client = laravel_client
        self.candidate_repo = candidate_repo
        self.account_timeout = account_timeout

    async def run(
        self,
        job: CrawlJobRecord,
        worker_id: str,
        stop_event: asyncio.Event,
    ) -> Literal["completed", "cancelled", "interrupted"]:
        job_id = job.job_id
        resumed = job.resume_count > 0

        await self.laravel_client.send_started(
            job_id=job_id,
            worker_id=worker_id,
            resumed=resumed,
            callback_url=job.callback_url,
            callback_token=job.callback_token,
        )

        done_accounts = await self.store.get_done_accounts(job_id)
        parsed_targets = [parse_target_entry(t) for t in job.targets]
        parsed_targets = [(u, url) for u, url in parsed_targets if u]

        total_accounts = len(parsed_targets)
        success_count = len(done_accounts)
        failed_count = 0

        requested_goal = getattr(job, "requested_total", None) or total_accounts
        target_idx = 0
        refill_attempts = 0

        logger.info(
            "[Job #%d] [Worker %s] Started (total=%d, requested_goal=%d, already_done=%d, resumed=%s)",
            job_id,
            worker_id,
            total_accounts,
            requested_goal,
            len(done_accounts),
            resumed,
        )

        while target_idx < len(parsed_targets):
            username, profile_url = parsed_targets[target_idx]
            target_idx += 1
            index = target_idx

            if stop_event.is_set():
                logger.info(
                    "[Job #%d] [Worker %s] Graceful stop requested; pausing before @%s",
                    job_id,
                    worker_id,
                    username,
                )
                return "interrupted"

            current_record = await self.store.get_job(job_id)
            if current_record is None or current_record.status == "cancelled":
                logger.info(
                    "[Job #%d] [Worker %s] Job was cancelled or deleted; stopping.",
                    job_id,
                    worker_id,
                )
                return "cancelled"

            if username.lower() in done_accounts:
                continue

            logger.info(
                "[Job #%d] [Worker %s] [%d/%d] Crawling @%s (%s)...",
                job_id,
                worker_id,
                index,
                max(total_accounts, requested_goal),
                username,
                profile_url,
            )

            outcome = await self._crawl_with_timeout(
                job_id=job_id,
                worker_id=worker_id,
                username=username,
                profile_url=profile_url,
                max_videos=job.max_videos_per_account,
            )

            if outcome.status == "success" and outcome.account is not None:
                acc = outcome.account
                avatar_info = "yes" if outcome.avatar and outcome.avatar.content_base64 else "no"
                logger.info(
                    "[Job #%d] [Worker %s] [%d/%d] SUCCESS @%s | followers=%d | following=%d | likes=%d | videos=%d | avatar=%s | status=%s",
                    job_id,
                    worker_id,
                    index,
                    max(total_accounts, requested_goal),
                    acc.username,
                    acc.followers,
                    acc.following,
                    acc.likes,
                    len(outcome.videos),
                    avatar_info,
                    acc.status,
                )
            else:
                logger.warning(
                    "[Job #%d] [Worker %s] [%d/%d] FAILED @%s | error_code=%s | message=%s",
                    job_id,
                    worker_id,
                    index,
                    max(total_accounts, requested_goal),
                    username,
                    outcome.error_code or "UNKNOWN",
                    outcome.error_message or "Unknown error",
                )

            await self._deliver_account_outcome(job, outcome)

            await self.store.mark_account_done(job_id, username)
            done_accounts.add(username.lower())

            if outcome.status == "success":
                success_count += 1
            else:
                failed_count += 1

            # Dynamic Continuous Top-up check (Solution 1)
            # If we reached the end of currently parsed targets but haven't reached requested_goal:
            if target_idx >= len(parsed_targets) and self.candidate_repo and len(parsed_targets) < requested_goal:
                needed = requested_goal - len(parsed_targets)
                already_known = {u.lower() for u, _ in parsed_targets}.union(done_accounts)
                new_batch = self.candidate_repo.sample_targets_balanced(
                    count=needed,
                    exclude=list(already_known),
                    allow_fallback=True,
                )
                if new_batch:
                    refill_attempts = 0
                    logger.info(
                        "[Job #%d] [Worker %s] Dynamic Top-up: Discovered +%d new targets to reach goal %d (%d/%d)",
                        job_id,
                        worker_id,
                        len(new_batch),
                        requested_goal,
                        len(parsed_targets) + len(new_batch),
                        requested_goal,
                    )
                    await self.store.append_job_targets(job_id, new_batch)
                    for nb in new_batch:
                        parsed_entry = parse_target_entry(nb)
                        if parsed_entry[0]:
                            parsed_targets.append(parsed_entry)
                    total_accounts = len(parsed_targets)
                elif refill_attempts < 3 and not stop_event.is_set():
                    refill_attempts += 1
                    logger.info(
                        "[Job #%d] [Worker %s] Waiting for Discovery Worker refill (attempt %d/3, current: %d/%d)...",
                        job_id,
                        worker_id,
                        refill_attempts,
                        len(parsed_targets),
                        requested_goal,
                    )
                    await asyncio.sleep(5.0)

        final_total = max(len(parsed_targets), requested_goal)
        await self.laravel_client.send_completed(
            job_id=job_id,
            status="completed",
            total_accounts=final_total,
            success_count=success_count,
            failed_count=failed_count,
            callback_url=job.callback_url,
            callback_token=job.callback_token,
        )
        await self.store.mark_finished(job_id, status="completed")

        logger.info(
            "[Job #%d] [Worker %s] Completed (total=%d, success=%d, failed=%d)",
            job_id,
            worker_id,
            final_total,
            success_count,
            failed_count,
        )
        return "completed"

    async def _crawl_with_timeout(
        self,
        job_id: int,
        worker_id: str,
        username: str,
        profile_url: str,
        max_videos: int = 20,
    ) -> AccountCrawlOutcome:
        try:
            breaker = getattr(self.tiktok_client, "circuit_breaker", None)
            if breaker is not None and hasattr(breaker, "wait_if_open"):
                await breaker.wait_if_open()

            import inspect
            sig = inspect.signature(self.tiktok_client.crawl_account)
            kwargs: dict = {"username": username, "profile_url": profile_url}
            if "max_videos" in sig.parameters:
                kwargs["max_videos"] = max_videos

            return await asyncio.wait_for(
                self.tiktok_client.crawl_account(**kwargs),
                timeout=self.account_timeout,
            )
        except asyncio.TimeoutError:
            logger.warning(
                "[Job #%d] [Worker %s] [@%s] Exceeded account timeout (%.1fs)",
                job_id,
                worker_id,
                username,
                self.account_timeout,
            )
            return AccountCrawlOutcome(
                username=username,
                profile_url=profile_url,
                status="failed",
                error_code="TIMEOUT",
                error_message=f"Account crawl exceeded timeout of {self.account_timeout}s",
            )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception(
                "[Job #%d] [Worker %s] [@%s] Unexpected error during account crawl: %s",
                job_id,
                worker_id,
                username,
                exc,
            )
            return AccountCrawlOutcome(
                username=username,
                profile_url=profile_url,
                status="failed",
                error_code="INTERNAL_ERROR",
                error_message=f"Unexpected crawler error: {exc}",
            )

    async def _deliver_account_outcome(
        self,
        job: CrawlJobRecord,
        outcome: AccountCrawlOutcome,
    ) -> None:
        try:
            await self.laravel_client.send_account_outcome(
                job_id=job.job_id,
                outcome=outcome,
                callback_url=job.callback_url,
                callback_token=job.callback_token,
            )
        except LaravelDeliveryError:
            raise
