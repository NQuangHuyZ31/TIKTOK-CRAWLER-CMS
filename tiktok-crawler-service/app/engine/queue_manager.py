import asyncio
import logging

from core.config import (
    ACCOUNT_TIMEOUT,
    MAX_JOB_RESUMES,
    QUEUE_MAX_SIZE,
    REQUEUE_DELAY_SECONDS,
    WORKER_COUNT,
)
from core.utils import normalize_username
from crawler.tiktok_client import TikTokClient
from engine.job_runner import JobRunner
from engine.store import QueueStore
from schemas.models import CrawlJobRecord
from services.laravel_client import LaravelClient, LaravelDeliveryError

logger = logging.getLogger(__name__)


class QueueFullError(RuntimeError):
    """Raised when the job queue has reached QUEUE_MAX_SIZE."""


class QueueManager:
    """
    Manages the Python-side job queue (`asyncio.Queue`), SQLite durability (`QueueStore`),
    fixed worker pool (`WORKER_COUNT` workers created once at startup), worker supervision,
    crash recovery, and graceful shutdown.
    """

    def __init__(
        self,
        store: QueueStore | None = None,
        tiktok_client: TikTokClient | None = None,
        laravel_client: LaravelClient | None = None,
        worker_count: int = WORKER_COUNT,
        queue_max_size: int = QUEUE_MAX_SIZE,
        account_timeout: float = ACCOUNT_TIMEOUT,
        max_job_resumes: int = MAX_JOB_RESUMES,
        requeue_delay_seconds: float = REQUEUE_DELAY_SECONDS,
    ):
        self.store = store or QueueStore()
        self.tiktok_client = tiktok_client or TikTokClient()
        self.laravel_client = laravel_client or LaravelClient()
        self.worker_count = max(1, worker_count)
        self.queue_max_size = max(1, queue_max_size)
        self.account_timeout = account_timeout
        self.max_job_resumes = max(1, max_job_resumes)
        self.requeue_delay_seconds = max(0.0, requeue_delay_seconds)

        self.runner = JobRunner(
            store=self.store,
            tiktok_client=self.tiktok_client,
            laravel_client=self.laravel_client,
            account_timeout=self.account_timeout,
        )

        self.queue: asyncio.Queue[int] = asyncio.Queue(maxsize=self.queue_max_size)
        self._lock = asyncio.Lock()
        self._enqueued_ids: set[int] = set()
        self._running_jobs: dict[int, str] = {}  # job_id -> worker_id
        self._worker_tasks: dict[str, asyncio.Task] = {}
        self._delayed_tasks: set[asyncio.Task] = set()
        self._supervisor_task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()
        self._started = False

        # Telemetry for tests and /api/queue observability
        self.max_observed_concurrent_jobs = 0

    @property
    def active_workers_count(self) -> int:
        return len(self._running_jobs)

    @property
    def queued_jobs_count(self) -> int:
        return len(self._enqueued_ids)

    async def start(self) -> None:
        if self._started:
            return
        self._stop_event.clear()
        self._started = True

        # Clean up completed jobs older than 7 days
        await self.store.cleanup_old_jobs(older_than_days=7)

        # Recover unfinished jobs from SQLite (or fallback to Laravel if SQLite is empty)
        await self._recover_unfinished_jobs()

        # Spawn fixed worker pool (created once at startup, never per-request)
        for idx in range(1, self.worker_count + 1):
            worker_id = f"worker-{idx}"
            self._worker_tasks[worker_id] = asyncio.create_task(
                self._worker_loop(worker_id),
                name=f"crawler-{worker_id}",
            )

        # Spawn supervisor to respawn any worker that crashes unexpectedly
        self._supervisor_task = asyncio.create_task(
            self._supervisor_loop(),
            name="crawler-worker-supervisor",
        )

        logger.info(
            "QueueManager started with %d fixed worker(s) and %d recovered job(s)",
            self.worker_count,
            self.queue.qsize(),
        )

    async def stop(self, timeout: float = 30.0) -> None:
        if not self._started:
            return
        self._stop_event.set()
        interrupted_job_ids = list(dict.fromkeys(
            list(self._running_jobs.keys()) + list(self._enqueued_ids)
        ))

        if self._supervisor_task:
            self._supervisor_task.cancel()
            try:
                await self._supervisor_task
            except asyncio.CancelledError:
                pass
            self._supervisor_task = None

        for delayed in list(self._delayed_tasks):
            delayed.cancel()
        self._delayed_tasks.clear()

        workers = list(self._worker_tasks.values())
        if workers:
            done, pending = await asyncio.wait(workers, timeout=min(timeout, 5.0))
            for task in pending:
                task.cancel()
            if pending:
                await asyncio.gather(*pending, return_exceptions=True)

        self._worker_tasks.clear()

        # Notify Laravel that service shut down while preserving 'running'/'queued' status in SQLite & DB for Crash Recovery
        for jid in interrupted_job_ids:
            try:
                rec = await self.store.get_job(jid)
                if rec and rec.status in ("running", "queued"):
                    msg = "Crawler service has shut down — waiting for service to restart and resume."
                    if hasattr(self.laravel_client, "send_paused"):
                        await self.laravel_client.send_paused(
                            job_id=jid,
                            status=rec.status,
                            error_message=msg,
                            callback_url=rec.callback_url,
                            callback_token=rec.callback_token,
                        )
            except Exception as exc:
                logger.warning("Could not notify Laravel on shutdown for job #%d: %s", jid, exc)

        await self.tiktok_client.close()
        await self.laravel_client.close()
        self._started = False
        logger.info("QueueManager stopped cleanly.")

    async def enqueue_job(
        self,
        job_id: int,
        source_type: str,
        targets: list[str],
        callback_url: str | None = None,
        callback_token: str | None = None,
        done_usernames: list[str] | None = None,
        crawl_mode: str = "account_with_videos",
        max_videos_per_account: int = 20,
    ) -> dict:
        """
        Persist job to SQLite first, then enqueue into `asyncio.Queue`.
        Idempotent if `job_id` is already queued or running.
        """
        async with self._lock:
            if (
                job_id not in self._enqueued_ids
                and job_id not in self._running_jobs
                and self.queue.qsize() >= self.queue_max_size
            ):
                raise QueueFullError(
                    f"Crawler queue is full (max={self.queue_max_size}). Please retry later."
                )

            # 1. Persist to SQLite BEFORE putting into memory queue or returning 202
            record, is_new = await self.store.upsert_job(
                job_id=job_id,
                source_type=source_type,
                targets=targets,
                callback_url=callback_url,
                callback_token=callback_token,
                done_usernames=done_usernames,
                crawl_mode=crawl_mode,
                max_videos_per_account=max_videos_per_account,
            )

            if is_new and job_id not in self._enqueued_ids and job_id not in self._running_jobs:
                self._enqueued_ids.add(job_id)
                self.queue.put_nowait(job_id)

            position = self._estimate_position(job_id)
            return {
                "job_id": job_id,
                "status": record.status,
                "position": position,
                "targets": record.targets,
                "total_accounts": len(record.targets),
            }

    async def cancel_job(self, job_id: int) -> bool:
        async with self._lock:
            cancelled = await self.store.cancel_job(job_id)
            self._enqueued_ids.discard(job_id)
            return cancelled

    async def get_job_status(self, job_id: int) -> dict | None:
        record = await self.store.get_job(job_id)
        if not record:
            return None
        done = await self.store.get_done_accounts(job_id)
        return {
            "job_id": record.job_id,
            "status": record.status,
            "worker_id": record.worker_id,
            "source_type": record.source_type,
            "total_accounts": len(record.targets),
            "done_accounts_count": len(done),
            "resume_count": record.resume_count,
            "position": self._estimate_position(job_id),
            "queued_at": record.queued_at,
            "updated_at": record.updated_at,
        }

    def get_queue_overview(self) -> dict:
        return {
            "status": "ok",
            "worker_count": self.worker_count,
            "active_workers": self.active_workers_count,
            "running_jobs": dict(self._running_jobs),
            "queued_jobs_count": self.queued_jobs_count,
            "queue_max_size": self.queue_max_size,
            "max_observed_concurrent_jobs": self.max_observed_concurrent_jobs,
            "circuit_breaker": self.tiktok_client.circuit_breaker.status_dict(),
        }

    def _estimate_position(self, job_id: int) -> int:
        if job_id in self._running_jobs:
            return 0
        items = list(self.queue._queue)  # type: ignore[attr-defined]
        if job_id in items:
            return items.index(job_id) + 1
        return 0

    async def _recover_unfinished_jobs(self) -> None:
        records = await self.store.list_unfinished_for_recovery()

        # Fallback: If SQLite had no unfinished jobs, query Laravel `/jobs/unfinished`
        if not records:
            remote_jobs = await self.laravel_client.fetch_unfinished_jobs()
            for item in remote_jobs:
                try:
                    jid = int(item["job_id"])
                    stype = str(item.get("source_type") or "usernames")
                    raw_targets = item.get("targets") or item.get("usernames") or item.get("urls") or []
                    targets = [str(t) for t in raw_targets if str(t).strip()]
                    done_list = [
                        normalize_username(u)
                        for u in (item.get("done_usernames") or [])
                        if normalize_username(u)
                    ]
                    if not targets:
                        continue
                    rec, _ = await self.store.upsert_job(
                        job_id=jid,
                        source_type=stype,
                        targets=targets,
                        done_usernames=done_list,
                    )
                    if item.get("status") == "running":
                        rec = await self.store.requeue_job(
                            jid, delay_seconds=0.0, increment_resume=True
                        ) or rec
                    records.append(rec)
                except Exception as exc:
                    logger.warning("Skipping invalid remote unfinished job %s: %s", item, exc)

        async with self._lock:
            for rec in records:
                if rec.job_id not in self._enqueued_ids and rec.job_id not in self._running_jobs:
                    self._enqueued_ids.add(rec.job_id)
                    self.queue.put_nowait(rec.job_id)

    async def _worker_loop(self, worker_id: str) -> None:
        while not self._stop_event.is_set():
            try:
                job_id = await asyncio.wait_for(self.queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

            try:
                async with self._lock:
                    self._enqueued_ids.discard(job_id)
                    record = await self.store.mark_running(job_id, worker_id)
                    if record is None:
                        continue
                    self._running_jobs[job_id] = worker_id
                    if len(self._running_jobs) > self.max_observed_concurrent_jobs:
                        self.max_observed_concurrent_jobs = len(self._running_jobs)

                await self._execute_job_with_recovery(record, worker_id)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.exception(
                    "[Worker %s] Unhandled error around job #%d: %s",
                    worker_id,
                    job_id,
                    exc,
                )
            finally:
                async with self._lock:
                    self._running_jobs.pop(job_id, None)
                self.queue.task_done()

    async def _execute_job_with_recovery(
        self,
        record: CrawlJobRecord,
        worker_id: str,
    ) -> None:
        job_id = record.job_id
        try:
            await self.runner.run(record, worker_id=worker_id, stop_event=self._stop_event)
        except LaravelDeliveryError as delivery_err:
            # Mechanism #9: Laravel unreachable -> pause & requeue after 60s WITHOUT counting against MAX_JOB_RESUMES
            logger.warning(
                "[Job #%d] [Worker %s] Laravel unreachable (%s); requeuing in %.1fs",
                job_id,
                worker_id,
                delivery_err,
                self.requeue_delay_seconds,
            )
            await self.store.requeue_job(
                job_id=job_id,
                delay_seconds=self.requeue_delay_seconds,
                increment_resume=False,
                error_message=str(delivery_err),
            )
            self._schedule_delayed_enqueue(job_id, self.requeue_delay_seconds)
        except asyncio.CancelledError:
            raise
        except Exception as unexpected_err:
            # Mechanism #8: Limit unexpected job resumes to MAX_JOB_RESUMES (3)
            next_resume_count = record.resume_count + 1
            if next_resume_count >= self.max_job_resumes:
                error_msg = (
                    f"Job failed after {next_resume_count} attempts: {unexpected_err}"
                )
                logger.error("[Job #%d] %s", job_id, error_msg)
                await self.store.mark_finished(job_id, status="failed", error_message=error_msg)
                done = await self.store.get_done_accounts(job_id)
                try:
                    await self.laravel_client.send_completed(
                        job_id=job_id,
                        status="failed",
                        total_accounts=len(record.targets),
                        success_count=len(done),
                        failed_count=max(0, len(record.targets) - len(done)),
                        error_message=error_msg,
                        callback_url=record.callback_url,
                        callback_token=record.callback_token,
                    )
                except Exception:
                    pass
            else:
                logger.warning(
                    "[Job #%d] Unexpected error (%s); scheduling retry %d/%d in %.1fs",
                    job_id,
                    unexpected_err,
                    next_resume_count,
                    self.max_job_resumes,
                    self.requeue_delay_seconds,
                )
                await self.store.requeue_job(
                    job_id=job_id,
                    delay_seconds=self.requeue_delay_seconds,
                    increment_resume=True,
                    error_message=str(unexpected_err),
                )
                self._schedule_delayed_enqueue(job_id, self.requeue_delay_seconds)

    def _schedule_delayed_enqueue(self, job_id: int, delay_seconds: float) -> None:
        async def _delayed():
            try:
                if delay_seconds > 0:
                    await asyncio.sleep(delay_seconds)
                if self._stop_event.is_set():
                    return
                async with self._lock:
                    rec = await self.store.get_job(job_id)
                    if (
                        rec
                        and rec.status == "queued"
                        and job_id not in self._enqueued_ids
                        and job_id not in self._running_jobs
                    ):
                        self._enqueued_ids.add(job_id)
                        self.queue.put_nowait(job_id)
            except asyncio.CancelledError:
                pass

        task = asyncio.create_task(_delayed())
        self._delayed_tasks.add(task)
        task.add_done_callback(self._delayed_tasks.discard)

    async def _supervisor_loop(self) -> None:
        """Mechanism #12: Ensure all WORKER_COUNT fixed workers remain alive."""
        while not self._stop_event.is_set():
            await asyncio.sleep(1.0)
            if self._stop_event.is_set():
                break
            for idx in range(1, self.worker_count + 1):
                worker_id = f"worker-{idx}"
                task = self._worker_tasks.get(worker_id)
                if task is None or task.done():
                    if task is not None and not task.cancelled():
                        exc = task.exception()
                        logger.error(
                            "Worker %s exited unexpectedly (%s); respawning immediately.",
                            worker_id,
                            exc,
                        )
                    self._worker_tasks[worker_id] = asyncio.create_task(
                        self._worker_loop(worker_id),
                        name=f"crawler-{worker_id}",
                    )
