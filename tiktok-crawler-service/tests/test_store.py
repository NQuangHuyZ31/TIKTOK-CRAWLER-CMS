from pathlib import Path
import sys
import tempfile
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from repositories.queue_store import QueueStore


class TestQueueStore(unittest.TestCase):
    def test_duplicate_job_id_does_not_create_duplicate_rows_and_recovery_order_is_correct(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "queue.db"
            store = QueueStore(db_path=db_path)
            try:
                rec1, is_new1 = store.upsert_job_sync(
                    job_id=10,
                    source_type="usernames",
                    targets=["u1", "u2"],
                )
                self.assertTrue(is_new1)
                self.assertEqual(rec1.status, "queued")

                # Duplicate submission while queued returns is_new=False
                rec1_dup, is_new_dup = store.upsert_job_sync(
                    job_id=10,
                    source_type="usernames",
                    targets=["u1", "u2"],
                )
                self.assertFalse(is_new_dup)
                self.assertEqual(rec1_dup.job_id, 10)

                # Add job #11 and job #12, mark job #12 as running (simulating mid-run crash)
                store.upsert_job_sync(job_id=11, source_type="usernames", targets=["u3"])
                store.upsert_job_sync(job_id=12, source_type="usernames", targets=["u4", "u5"])
                store.mark_running_sync(12, "worker-1")
                store.mark_account_done_sync(12, "u4")

                recovered = store.list_unfinished_for_recovery_sync()
                # Job #12 (was running) must come FIRST, followed by #10 and #11 in FIFO order
                self.assertEqual([r.job_id for r in recovered], [12, 10, 11])
                self.assertEqual(recovered[0].resume_count, 1)
                self.assertEqual(store.get_done_accounts_sync(12), {"u4"})
            finally:
                store.close()

    def test_delete_job_removes_job_and_done_accounts(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "queue.db"
            store = QueueStore(db_path=db_path)
            try:
                store.upsert_job_sync(job_id=99, source_type="usernames", targets=["user_a", "user_b"])
                store.mark_account_done_sync(99, "user_a")

                self.assertIsNotNone(store.get_job_sync(99))
                self.assertEqual(store.get_done_accounts_sync(99), {"user_a"})

                deleted = store.delete_job_sync(99)
                self.assertTrue(deleted)
                self.assertIsNone(store.get_job_sync(99))
                self.assertEqual(store.get_done_accounts_sync(99), set())

                # Deleting again returns False
                self.assertFalse(store.delete_job_sync(99))
            finally:
                store.close()


if __name__ == "__main__":
    unittest.main()
