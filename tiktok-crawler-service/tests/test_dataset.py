from pathlib import Path
import sys
import tempfile
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from services.dataset import DatasetInsufficientError, DatasetLoader


class TestDatasetLoader(unittest.TestCase):
    def test_loads_multiple_csv_schemas_and_txt_deduplicating_usernames(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)

            # CSV 1: comma-separated with UTF-8 BOM and `username` column
            (tmp_dir / "a.csv").write_bytes(
                "\ufeffusername,followers_count\n@alice_01,1000\nbob_02,2000\n".encode("utf-8")
            )
            # CSV 2: semicolon-separated with `unique_id` and duplicate alice_01
            (tmp_dir / "b.csv").write_text(
                "unique_id;region\nALICE_01;VN\ncharlie.03;US\n",
                encoding="utf-8",
            )
            # CSV 3: tab-separated with only `profile_url` column
            (tmp_dir / "c.csv").write_text(
                "id\tprofile_url\n6794435137251820550\thttps://www.tiktok.com/@delta_04?lang=en\n",
                encoding="utf-8",
            )
            # TXT file: one username per line
            (tmp_dir / "d.txt").write_text(
                "# comment\n@echo_05\nbob_02\n",
                encoding="utf-8",
            )

            loader = DatasetLoader(datasets_dir=tmp_dir)
            pool = loader.get_pool()

            self.assertEqual(len(pool), 5)
            self.assertEqual(
                [u.lower() for u in pool],
                ["alice_01", "bob_02", "charlie.03", "delta_04", "echo_05"],
            )

            sampled = loader.sample_usernames(3)
            self.assertEqual(len(sampled), 3)
            self.assertEqual(len(set(u.lower() for u in sampled)), 3)

            with self.assertRaises(DatasetInsufficientError) as ctx:
                loader.sample_usernames(10)
            self.assertEqual(ctx.exception.requested, 10)
            self.assertEqual(ctx.exception.available, 5)

    def test_prefers_primary_files_and_falls_back_to_example_csv(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            (tmp_dir / "example.csv").write_text("username\nexample_user\n", encoding="utf-8")

            loader = DatasetLoader(datasets_dir=tmp_dir)
            self.assertEqual(loader.get_pool(), ["example_user"])

            # Once a real dataset file is added, primary files are used instead of example.csv
            (tmp_dir / "dataset-1.csv").write_text("username\nreal_user_1\n", encoding="utf-8")
            self.assertEqual(loader.get_pool(), ["real_user_1"])


if __name__ == "__main__":
    unittest.main()
