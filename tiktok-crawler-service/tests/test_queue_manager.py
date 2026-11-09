import asyncio
from datetime import datetime
from pathlib import Path
import sys
import tempfile
import unittest
import httpx

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
TESTS_DIR = SERVICE_ROOT / "tests"
for p in (str(APP_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from _async_compat import patch_windows_self_pipe_if_needed

patch_windows_self_pipe_if_needed()

from engine.queue_manager import QueueManager
from engine.store import QueueStore
from schemas.models import AccountCrawlOutcome, TikTokAccount
from services.laravel_client import LaravelClient, LaravelDeliveryError, LaravelJobNotFoundError


class FakeTikTokClient:
    def __init__(self, delay: float = 0.002, slow_accounts: set[str] | None = None):
        self.delay = delay
        self.slow_accounts = slow_accounts or set()
        self.crawled_calls: list[str] = []

        class _DummyBreaker:
            def status_dict(self):
                return {"state": "closed", "consecutive_blocks": 0}

        self.circuit_breaker = _DummyBreaker()

    async def crawl_account(self, username: str, profile_url: str | None = None) -> AccountCrawlOutcome:
        if username in self.slow_accounts:
            await asyncio.sleep(5.0)
        elif self.delay > 0:
            await asyncio.sleep(self.delay)
        self.crawled_calls.append(username)
        now = datetime.now()
        return AccountCrawlOutcome(
            username=username,
            profile_url=profile_url or f"https://www.tiktok.com/@{username}",
            status="success",
            account=TikTokAccount(
                username=username,
                followers=100,
                following=10,
                likes=500,
                profile_url=f"https://www.tiktok.com/@{username}",
                crawled_at=now,
                last_crawled_at=now,
                status="active",
            ),
        )

    async def close(self) -> None:
        pass


class FakeLaravelClient:
    def __init__(
        self,
        unfinished_jobs: list[dict] | None = None,
        fail_account_delivery: bool = False,
        fail_with_not_found: bool = False,
    ):
        self.events: list[tuple[str, int, dict]] = []
        self.unfinished_jobs = unfinished_jobs or []
        self.fail_account_delivery = fail_account_delivery
        self.fail_with_not_found = fail_with_not_found

    async def send_started(self, job_id: int, worker_id: str, resumed: bool = False, **kwargs) -> dict:
        if self.fail_with_not_found:
            raise LaravelJobNotFoundError(f"Job #{job_id} does not exist in Laravel CMS (HTTP 422: The selected job id is invalid.)")
        self.events.append(("started", job_id, {"worker_id": worker_id, "resumed": resumed}))
        return {"status": "ok"}

    async def send_account_outcome(self, job_id: int, outcome: AccountCrawlOutcome, **kwargs) -> dict:
        if self.fail_account_delivery:
            raise LaravelDeliveryError("Simulated Laravel 503 outage")
        self.events.append(("account", job_id, {"username": outcome.username, "status": outcome.status}))
        return {"status": "ok"}

    async def send_completed(self, job_id: int, status: str, total_accounts: int, success_count: int, failed_count: int, error_message: str | None = None, **kwargs) -> dict:
        self.events.append(
            (
                "completed",
                job_id,
                {
                    "status": status,
                    "total_accounts": total_accounts,
                    "success_count": success_count,
                    "failed_count": failed_count,
                    "error_message": error_message,
                },
            )
        )
        return {"status": "ok"}

    async def fetch_unfinished_jobs(self) -> list[dict]:
        return list(self.unfinished_jobs)

    async def close(self) -> None:
        pass


class TestQueueManager(unittest.IsolatedAsyncioTestCase):
    async def test_200_concurrent_jobs_with_5_workers_never_exceeds_5_active_jobs(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QueueStore(db_path=Path(tmp) / "queue.db")
            tiktok = FakeTikTokClient(delay=0.002)
            laravel = FakeLaravelClient()
            qm = QueueManager(
                store=store,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=5,
            )
            await qm.start()
            try:
                # Submit 200 jobs concurrently
                responses = await asyncio.gather(
                    *[
                        qm.enqueue_job(
                            job_id=i,
                            source_type="usernames",
                            targets=[f"user_{i}_a", f"user_{i}_b"],
                        )
                        for i in range(1, 201)
                    ]
                )
                self.assertEqual(len(responses), 200)
                await asyncio.wait_for(qm.queue.join(), timeout=30.0)

                self.assertLessEqual(qm.max_observed_concurrent_jobs, 5)
                self.assertGreaterEqual(qm.max_observed_concurrent_jobs, 1)

                completed_events = [e for e in laravel.events if e[0] == "completed"]
                self.assertEqual(len(completed_events), 200)
                self.assertEqual(len(tiktok.crawled_calls), 400)
            finally:
                await qm.stop()
                store.close()

    async def test_crash_recovery_resumes_interrupted_job_and_skips_done_accounts(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "queue.db"
            store1 = QueueStore(db_path=db_path)
            # Pre-seed job #1 as if it crashed mid-way after completing u1 and u2 out of [u1, u2, u3, u4]
            store1.upsert_job_sync(1, "usernames", ["u1", "u2", "u3", "u4"])
            store1.mark_running_sync(1, "worker-1")
            store1.mark_account_done_sync(1, "u1")
            store1.mark_account_done_sync(1, "u2")
            store1.close()

            # Restart a new QueueManager on the same SQLite database
            store2 = QueueStore(db_path=db_path)
            tiktok = FakeTikTokClient(delay=0.001)
            laravel = FakeLaravelClient()
            qm = QueueManager(
                store=store2,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=2,
            )
            await qm.start()
            try:
                await asyncio.wait_for(qm.queue.join(), timeout=10.0)
                # Only u3 and u4 should have been crawled on resume!
                self.assertEqual(tiktok.crawled_calls, ["u3", "u4"])
                started_events = [e for e in laravel.events if e[0] == "started"]
                self.assertTrue(started_events[0][2]["resumed"])
            finally:
                await qm.stop()
                store2.close()

    async def test_fallback_recovery_from_laravel_unfinished_when_sqlite_wiped(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QueueStore(db_path=Path(tmp) / "fresh_queue.db")
            tiktok = FakeTikTokClient(delay=0.001)
            laravel = FakeLaravelClient(
                unfinished_jobs=[
                    {
                        "job_id": 77,
                        "source_type": "usernames",
                        "status": "running",
                        "targets": ["acc_1", "acc_2", "acc_3"],
                        "done_usernames": ["acc_1"],
                    }
                ]
            )
            qm = QueueManager(
                store=store,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=2,
            )
            await qm.start()
            try:
                await asyncio.wait_for(qm.queue.join(), timeout=10.0)
                self.assertEqual(tiktok.crawled_calls, ["acc_2", "acc_3"])
            finally:
                await qm.stop()
                store.close()

    async def test_account_timeout_records_timeout_and_worker_continues(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QueueStore(db_path=Path(tmp) / "queue.db")
            tiktok = FakeTikTokClient(delay=0.001, slow_accounts={"slow_user"})
            laravel = FakeLaravelClient()
            qm = QueueManager(
                store=store,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=1,
                account_timeout=0.05,
            )
            await qm.start()
            try:
                await qm.enqueue_job(1, "usernames", ["slow_user", "fast_user"])
                await asyncio.wait_for(qm.queue.join(), timeout=10.0)
                account_events = [e[2] for e in laravel.events if e[0] == "account"]
                self.assertEqual(
                    account_events,
                    [
                        {"username": "slow_user", "status": "failed"},
                        {"username": "fast_user", "status": "success"},
                    ],
                )
            finally:
                await qm.stop()
                store.close()

    async def test_laravel_delivery_error_requeues_job_without_marking_account_done(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QueueStore(db_path=Path(tmp) / "queue.db")
            tiktok = FakeTikTokClient(delay=0.001)
            laravel = FakeLaravelClient(fail_account_delivery=True)
            qm = QueueManager(
                store=store,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=1,
                requeue_delay_seconds=60.0,
            )
            await qm.start()
            try:
                await qm.enqueue_job(55, "usernames", ["u_retry"])
                await asyncio.wait_for(qm.queue.join(), timeout=5.0)
                # Account must NOT be marked done since Laravel did not ACK
                done = await store.get_done_accounts(55)
                self.assertEqual(done, set())
                rec = await store.get_job(55)
                self.assertEqual(rec.status, "queued")
                # Resume count is not incremented for Laravel connectivity pauses
                self.assertEqual(rec.resume_count, 0)
            finally:
                await qm.stop()
                store.close()

    async def test_laravel_job_not_found_terminates_job_and_deletes_from_queue(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QueueStore(db_path=Path(tmp) / "queue.db")
            tiktok = FakeTikTokClient(delay=0.001)
            laravel = FakeLaravelClient(fail_with_not_found=True)
            qm = QueueManager(
                store=store,
                tiktok_client=tiktok,  # type: ignore[arg-type]
                laravel_client=laravel,  # type: ignore[arg-type]
                worker_count=1,
                requeue_delay_seconds=60.0,
            )
            await qm.start()
            try:
                await qm.enqueue_job(88, "usernames", ["u_deleted"])
                await asyncio.wait_for(qm.queue.join(), timeout=5.0)
                # Job must be deleted from SQLite store
                rec = await store.get_job(88)
                self.assertIsNone(rec)
                # Job must be removed from enqueued ids
                self.assertNotIn(88, qm._enqueued_ids)
                # No delayed requeue tasks
                self.assertEqual(len(qm._delayed_tasks), 0)
            finally:
                await qm.stop()
                store.close()

    async def test_laravel_client_422_job_invalid_raises_not_found_without_retrying(self):
        call_count = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal call_count
            call_count += 1
            return httpx.Response(
                422,
                json={"message": "The selected job id is invalid.", "errors": {"job_id": ["The selected job id is invalid."]}},
            )

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            lc = LaravelClient(base_url="http://mock-laravel", token="tok", http_client=client, backoff_base=0.01)
            with self.assertRaises(LaravelJobNotFoundError):
                await lc.send_started(job_id=999, worker_id="w-1")
            # Must fail immediately on first attempt without retrying 5 times!
            self.assertEqual(call_count, 1)


if __name__ == "__main__":
    unittest.main()
