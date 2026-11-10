"""
Batch 7 Unit & Integration Tests: Candidate Pool, Alias Merging & Seed Synchronizer.
Covers:
- T11: Two Jobs concurrently reserving candidate (Strict single-active assignment).
- T12: Creator renames on TikTok (Alias demotion, current alias activation, canonical sec_uid preservation).
- T13: Multiple sources recorded without overwriting.
- T20: Seed synchronizer change log processing and checkpointing.
- End-to-end HTTP sync against mocked Laravel seed changes API.
"""

from pathlib import Path
import sqlite3
import sys
import tempfile
import time
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

from engine.schema import initialize_database
from engine.candidate_manager import CandidateManager
from engine.sagas.seed_synchronizer import SeedSynchronizer


class TestBatch7CandidateAndSeedSync(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_batch7.db"
        self.conn = initialize_database(self.db_path)
        self.now = int(time.time() * 1000)

        # Base job and run
        self.conn.execute(
            """
            INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, crawl_status, created_at_ms, updated_at_ms)
            VALUES ('job_b7_1', 'admin', 10, 'running', ?, ?);
            """,
            (self.now, self.now)
        )
        self.conn.execute(
            """
            INSERT INTO crawl_jobs (crawl_job_id, owner_id, requested_accounts, crawl_status, created_at_ms, updated_at_ms)
            VALUES ('job_b7_2', 'admin', 10, 'running', ?, ?);
            """,
            (self.now, self.now)
        )
        self.conn.execute(
            """
            INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms)
            VALUES ('run_b7_1', 'job_b7_1', 1, 'running', ?);
            """,
            (self.now,)
        )
        self.conn.execute(
            """
            INSERT INTO crawl_runs (crawl_run_id, crawl_job_id, run_sequence, status, created_at_ms)
            VALUES ('run_b7_2', 'job_b7_2', 1, 'running', ?);
            """,
            (self.now,)
        )
        self.conn.commit()

        self.candidate_manager = CandidateManager(self.db_path)
        self.seed_synchronizer = SeedSynchronizer(self.db_path)

    def tearDown(self):
        self.conn.close()
        self.tmp_dir.cleanup()

    # ==========================================================================
    # T11: Candidate Reservation Single-Winner
    # ==========================================================================
    def test_t11_two_jobs_concurrent_reservation_uniqueness(self):
        """
        Verify T11: Two jobs attempting to reserve the same candidate concurrently:
        - Job 1 succeeds (returns valid assignment_id).
        - Job 2 fails (returns None due to SQLite unique partial index).
        - After Job 1 releases the assignment, Job 2 can successfully reserve.
        """
        cand = self.candidate_manager.upsert_candidate_identity(
            username="popular_creator",
            sec_uid="MS4wLjAB_POPULAR",
            allocation_class="fresh_discovery",
        )
        cand_id = cand["candidate_id"]

        # Job 1 reserves candidate
        asg1 = self.candidate_manager.reserve_candidate(
            candidate_id=cand_id,
            crawl_job_id="job_b7_1",
            crawl_run_id="run_b7_1",
            target_type="new_candidate",
        )
        self.assertIsNotNone(asg1)

        # Job 2 attempts to reserve same candidate while Job 1 is active -> FAILS (None)
        asg2 = self.candidate_manager.reserve_candidate(
            candidate_id=cand_id,
            crawl_job_id="job_b7_2",
            crawl_run_id="run_b7_2",
            target_type="new_candidate",
        )
        self.assertIsNone(asg2)

        # Job 1 completes and releases candidate
        released = self.candidate_manager.release_candidate(asg1, new_status="completed")
        self.assertTrue(released)

        # Job 2 now successfully reserves candidate!
        asg2_retry = self.candidate_manager.reserve_candidate(
            candidate_id=cand_id,
            crawl_job_id="job_b7_2",
            crawl_run_id="run_b7_2",
            target_type="new_candidate",
        )
        self.assertIsNotNone(asg2_retry)

    # ==========================================================================
    # T12: Creator Renames on TikTok (Alias Resolution)
    # ==========================================================================
    def test_t12_creator_renames_on_tiktok_alias_resolution(self):
        """
        Verify T12: When creator changes their username on TikTok:
        - Canonical sec_uid is never duplicated.
        - Old username alias is preserved with is_current = 0.
        - New username alias is registered with is_current = 1.
        """
        sec_uid = "MS4wLjAB_RENAME_CREATOR"

        # 1. First observation: @john_doe
        res1 = self.candidate_manager.upsert_candidate_identity(
            username="@john_doe",
            sec_uid=sec_uid,
            allocation_class="fresh_discovery",
        )
        cand_id = res1["candidate_id"]
        self.assertEqual(res1["identity_state"], "verified")

        aliases_1 = self.candidate_manager.get_aliases(cand_id)
        self.assertEqual(len(aliases_1), 1)
        self.assertEqual(aliases_1[0]["username_normalized"], "john_doe")
        self.assertTrue(aliases_1[0]["is_current"])

        # 2. Creator changes name to @john_the_king on TikTok
        res2 = self.candidate_manager.upsert_candidate_identity(
            username="@john_the_king",
            sec_uid=sec_uid,
            allocation_class="fresh_discovery",
        )

        # Candidate ID remains strictly identical
        self.assertEqual(res2["candidate_id"], cand_id)

        # Inspect aliases
        aliases_2 = self.candidate_manager.get_aliases(cand_id)
        self.assertEqual(len(aliases_2), 2)

        old_alias = [a for a in aliases_2 if a["username_normalized"] == "john_doe"][0]
        new_alias = [a for a in aliases_2 if a["username_normalized"] == "john_the_king"][0]

        self.assertFalse(old_alias["is_current"])  # Old alias demoted
        self.assertTrue(new_alias["is_current"])   # New alias active

        # Candidate info shows new current username
        cand_info = self.candidate_manager.get_candidate(cand_id)
        self.assertEqual(cand_info["current_username"], "john_the_king")

    # ==========================================================================
    # T13: Multiple Sources Recorded Without Overwriting
    # ==========================================================================
    def test_t13_multiple_sources_recorded_without_overwriting(self):
        """
        Verify T13: Multiple discovery sources for the same candidate:
        - All unique sources are appended to candidate_sources.
        - Duplicate source submissions are ignored idempotently without crashing.
        """
        cand = self.candidate_manager.upsert_candidate_identity(
            username="multi_source_star",
            sec_uid="MS4wLjAB_MULTISRC",
            allocation_class="fresh_discovery",
            source_type="mention",
            source_reference="video_999",
        )
        cand_id = cand["candidate_id"]

        # Discovered via another video mention
        self.candidate_manager.upsert_candidate_identity(
            username="multi_source_star",
            sec_uid="MS4wLjAB_MULTISRC",
            source_type="mention",
            source_reference="video_888",
        )

        # Discovered via hashtag
        self.candidate_manager.upsert_candidate_identity(
            username="multi_source_star",
            sec_uid="MS4wLjAB_MULTISRC",
            source_type="hashtag",
            source_reference="#fitness",
        )

        # Duplicate discovery of video_999
        self.candidate_manager.upsert_candidate_identity(
            username="multi_source_star",
            sec_uid="MS4wLjAB_MULTISRC",
            source_type="mention",
            source_reference="video_999",
        )

        sources = self.candidate_manager.get_sources(cand_id)
        self.assertEqual(len(sources), 3)

        source_refs = {s["source_reference"] for s in sources}
        self.assertEqual(source_refs, {"video_999", "video_888", "#fitness"})

    # ==========================================================================
    # T20: Seed Sync Change Log Processing & Checkpointing
    # ==========================================================================
    def test_t20_seed_sync_change_log_and_checkpointing(self):
        """
        Verify T20: Seed changes from Laravel change log:
        - Sequential sequence numbers are checkpointed in crawler_seed_sync_state.
        - 'insert' creates candidate with 'historical' allocation class.
        - 'disable' / 'delete' marks candidate as disabled/tombstone and cancels active assignments.
        """
        # Initial checkpoint is 0
        self.assertEqual(self.seed_synchronizer.get_last_sequence(), 0)

        changes = [
            {
                "sequence_id": 1,
                "account_id": 101,
                "operation": "insert",
                "payload": {"username": "seed_artist", "sec_uid": "MS4wLjAB_ARTIST", "status": "active"},
            },
            {
                "sequence_id": 2,
                "account_id": 102,
                "operation": "insert",
                "payload": {"username": "seed_gamer", "sec_uid": "MS4wLjAB_GAMER", "status": "active"},
            },
        ]

        count = self.seed_synchronizer.process_change_batch(changes)
        self.assertEqual(count, 2)
        self.assertEqual(self.seed_synchronizer.get_last_sequence(), 2)

        # Verify candidate created
        cursor = self.conn.execute(
            "SELECT candidate_id, allocation_class, lifecycle_status FROM candidate_pool WHERE sec_uid = 'MS4wLjAB_GAMER';"
        )
        gamer = cursor.fetchone()
        self.assertIsNotNone(gamer)
        gamer_id, alloc, lifecycle = gamer
        self.assertEqual(alloc, "historical")
        self.assertEqual(lifecycle, "valid")

        # Reserve gamer in a job
        asg = self.candidate_manager.reserve_candidate(gamer_id, "job_b7_1", "run_b7_1")
        self.assertIsNotNone(asg)

        # Next batch: gamer is disabled on Laravel
        changes_2 = [
            {
                "sequence_id": 3,
                "account_id": 102,
                "operation": "disable",
                "payload": {"username": "seed_gamer", "sec_uid": "MS4wLjAB_GAMER", "status": "inactive"},
            }
        ]
        count2 = self.seed_synchronizer.process_change_batch(changes_2)
        self.assertEqual(count2, 1)
        self.assertEqual(self.seed_synchronizer.get_last_sequence(), 3)

        # Gamer candidate is disabled, and its active assignment is cancelled!
        cursor = self.conn.execute(
            "SELECT lifecycle_status FROM candidate_pool WHERE candidate_id = ?;", (gamer_id,)
        )
        self.assertEqual(cursor.fetchone()[0], "disabled")

        cursor = self.conn.execute(
            "SELECT status FROM candidate_assignments WHERE assignment_id = ?;", (asg,)
        )
        self.assertEqual(cursor.fetchone()[0], "cancelled")

    def test_unresolved_candidate_upgrades_to_verified_when_sec_uid_discovered(self):
        """
        Verify that a candidate initially discovered without sec_uid (unresolved)
        is gracefully upgraded to 'verified' when its sec_uid is subsequently discovered.
        """
        # Step 1: Discovered via caption without sec_uid
        c1 = self.candidate_manager.upsert_candidate_identity(
            username="@rising_star",
            sec_uid=None,
            allocation_class="fresh_discovery",
            source_type="caption_mention",
            source_reference="vid_888",
        )
        cand_id = c1["candidate_id"]
        self.assertEqual(c1["identity_state"], "unresolved")

        # Step 2: Profile crawl returns sec_uid
        c2 = self.candidate_manager.upsert_candidate_identity(
            username="@rising_star",
            sec_uid="MS4wLjAB_RISING_STAR",
            allocation_class="fresh_discovery",
        )
        self.assertEqual(c2["candidate_id"], cand_id)
        self.assertEqual(c2["identity_state"], "verified")

        info = self.candidate_manager.get_candidate(cand_id)
        self.assertEqual(info["sec_uid"], "MS4wLjAB_RISING_STAR")
        self.assertEqual(info["identity_state"], "verified")

    def test_cannot_reserve_tombstoned_candidate(self):
        """Verify that candidates with lifecycle_status != 'valid' cannot be reserved."""
        cand = self.candidate_manager.upsert_candidate_identity(
            username="deleted_user",
            sec_uid="MS4wLjAB_DEL",
        )
        cand_id = cand["candidate_id"]

        # Mark tombstone
        self.conn.execute("UPDATE candidate_pool SET lifecycle_status = 'tombstone' WHERE candidate_id = ?;", (cand_id,))
        self.conn.commit()

        asg = self.candidate_manager.reserve_candidate(cand_id, "job_b7_1", "run_b7_1")
        self.assertIsNone(asg)


class TestBatch7AsyncSeedSync(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_batch7_async.db"
        self.conn = initialize_database(self.db_path)
        self.seed_synchronizer = SeedSynchronizer(self.db_path, laravel_url="http://mock-laravel")

    def tearDown(self):
        self.conn.close()
        self.tmp_dir.cleanup()

    async def test_fetch_and_sync_against_mock_laravel(self):
        """Verify fetch_and_sync pulls changes from Laravel API and updates checkpoint."""
        def mock_handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.path, "/admin/api/public/crawler/seeds/changes")
            self.assertIn("since_sequence=0", request.url.query.decode())

            return httpx.Response(
                200,
                json={
                    "status": "success",
                    "data": {
                        "latest_sequence": 15,
                        "since_sequence": 0,
                        "count": 1,
                        "has_more": False,
                        "changes": [
                            {
                                "sequence_id": 15,
                                "account_id": 55,
                                "operation": "insert",
                                "payload": {
                                    "username": "async_synced_user",
                                    "sec_uid": "MS4wLjAB_ASYNC",
                                    "status": "active"
                                }
                            }
                        ]
                    }
                }
            )

        transport = httpx.MockTransport(mock_handler)
        async with httpx.AsyncClient(transport=transport) as client:
            res = await self.seed_synchronizer.fetch_and_sync(client=client, limit=50)

        self.assertEqual(res["synced_count"], 1)
        self.assertEqual(res["current_sequence"], 15)
        self.assertEqual(self.seed_synchronizer.get_last_sequence(), 15)

        # Verify candidate exists in SQLite
        cursor = self.conn.execute("SELECT candidate_id FROM candidate_pool WHERE sec_uid = 'MS4wLjAB_ASYNC';")
        self.assertIsNotNone(cursor.fetchone())


if __name__ == "__main__":
    unittest.main()
