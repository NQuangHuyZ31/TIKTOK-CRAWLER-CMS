import asyncio
from datetime import datetime
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
TESTS_DIR = SERVICE_ROOT / "tests"
for p in (str(APP_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from _async_compat import patch_windows_self_pipe_if_needed

patch_windows_self_pipe_if_needed()

from engine.schema import initialize_database
from repositories.candidate_repo import CandidateRepository
from repositories.queue_store import QueueStore
from schemas.models import AccountCrawlOutcome, TikTokAccount
from workers.job_runner import JobRunner


class _StubTikTokClient:
    def __init__(self):
        self.crawled: list[str] = []

        class _DummyBreaker:
            async def wait_if_open(self):
                return None

        self.circuit_breaker = _DummyBreaker()

    async def crawl_account(self, username: str, profile_url: str | None = None) -> AccountCrawlOutcome:
        self.crawled.append(username)
        now = datetime.now()
        return AccountCrawlOutcome(
            username=username,
            profile_url=profile_url or f"https://www.tiktok.com/@{username}",
            status="success",
            account=TikTokAccount(
                username=username,
                followers=10,
                following=5,
                likes=20,
                profile_url=f"https://www.tiktok.com/@{username}",
                crawled_at=now,
                last_crawled_at=now,
                status="active",
            ),
        )


class _StubLaravelClient:
    def __init__(self):
        self.completed_payloads: list[dict] = []

    async def send_started(self, **kwargs):
        return None

    async def send_account_outcome(self, **kwargs):
        return None

    async def send_completed(self, **kwargs):
        self.completed_payloads.append(kwargs)


class _StubCandidateRepo:
    def __init__(self, batches: list[list[str]]):
        self._batches = list(batches)

    def batch_lock_fresh_candidates(self, usernames, job_id=None):
        return None

    def mark_candidate_crawled_and_released(self, username, job_id=None):
        return None

    def release_unfinished_assignments(self, job_id=None):
        return None

    def sample_targets_balanced(self, count: int, exclude=None, allow_fallback=True, job_id=None):
        if not self._batches:
            return []
        return self._batches.pop(0)


class TestJobRunnerDynamicTopUp(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.db_path = Path(self.tmp_dir.name) / "runner_topup.db"
        initialize_database(self.db_path)
        self.store = QueueStore(self.db_path)

    def tearDown(self):
        self.store.close()
        self.tmp_dir.cleanup()

    def test_topup_reaches_exact_requested_goal_without_stopping_short(self):
        job, _ = self.store.upsert_job_sync(
            job_id=12,
            source_type="usernames",
            targets=["u1", "u2", "u3"],
            requested_total=4,
            callback_url="http://localhost:8000/events",
        )
        client = _StubTikTokClient()
        laravel = _StubLaravelClient()
        cand_repo = _StubCandidateRepo([["u4"]])
        runner = JobRunner(self.store, client, laravel, candidate_repo=cand_repo)

        status = asyncio.run(runner.run(job, "worker-1", asyncio.Event()))

        self.assertEqual(status, "completed")
        self.assertEqual(client.crawled, ["u1", "u2", "u3", "u4"])
        self.assertEqual(laravel.completed_payloads[-1]["total_accounts"], 4)
        self.assertEqual(laravel.completed_payloads[-1]["success_count"], 4)

    def test_topup_skips_invalid_or_duplicate_and_retries_until_goal_met(self):
        job, _ = self.store.upsert_job_sync(
            job_id=13,
            source_type="usernames",
            targets=["u1", "u1", "u2", "u3"],
            requested_total=4,
            callback_url="http://localhost:8000/events",
        )
        client = _StubTikTokClient()
        laravel = _StubLaravelClient()
        # First top-up yields placeholder & duplicate; second retry yields valid u4
        cand_repo = _StubCandidateRepo([["null", "@U1"], ["u4"]])
        runner = JobRunner(self.store, client, laravel, candidate_repo=cand_repo)

        with patch("workers.job_runner.asyncio.sleep", new=AsyncMock()):
            status = asyncio.run(runner.run(job, "worker-1", asyncio.Event()))

        self.assertEqual(status, "completed")
        self.assertEqual(client.crawled, ["u1", "u2", "u3", "u4"])
        self.assertEqual(laravel.completed_payloads[-1]["total_accounts"], 4)
        self.assertEqual(laravel.completed_payloads[-1]["success_count"], 4)

    def test_candidate_repo_filters_placeholders_and_normalizes_bootstrap_exclusions(self):
        repo = CandidateRepository(self.db_path)
        now = repo.now_ms()
        conn = repo._get_connection()
        with conn:
            conn.execute(
                "INSERT INTO bootstrap_seeds (seed_id, username, priority, is_exhausted, created_at_ms) VALUES (?, ?, ?, 0, ?)",
                ("s1", "@U1", 10, now),
            )
            conn.execute(
                "INSERT INTO bootstrap_seeds (seed_id, username, priority, is_exhausted, created_at_ms) VALUES (?, ?, ?, 0, ?)",
                ("s2", "null", 9, now),
            )
            conn.execute(
                "INSERT INTO bootstrap_seeds (seed_id, username, priority, is_exhausted, created_at_ms) VALUES (?, ?, ?, 0, ?)",
                ("s3", "valid_seed", 5, now),
            )
        conn.close()

        sampled = repo.sample_targets_balanced(count=3, exclude=["u1"])
        self.assertEqual(sampled, ["valid_seed"])


if __name__ == "__main__":
    unittest.main()
