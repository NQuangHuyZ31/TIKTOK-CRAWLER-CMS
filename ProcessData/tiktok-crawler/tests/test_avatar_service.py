import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from services.avatar_service import AvatarService


class TestAvatarService(unittest.TestCase):

    def test_find_project_root_local(self):
        """Locally in this repository, _find_project_root should find the repo root."""
        root = AvatarService._find_project_root()
        self.assertIsNotNone(root)
        self.assertTrue((root / "cms-tiktok-crawler").is_dir())

    def test_find_project_root_shallow_path_no_index_error(self):
        """In a container at /app/app/services/avatar_service.py, it should not raise IndexError."""
        root = AvatarService._find_project_root(Path("/app/app/services/avatar_service.py"))
        self.assertIsNone(root)

    def test_init_in_container_environment_without_shared_storage(self):
        """When deployed in an isolated container without project root or env vars, it initializes safely without crash."""
        with (
            patch.object(AvatarService, "_find_project_root", return_value=None),
            patch.dict(os.environ, {"AVATAR_DIR": "", "PUBLIC_STORAGE_DIR": ""}),
        ):
            service = AvatarService()
            self.assertIsNone(service.project_root)
            self.assertIsNone(service.public_storage_dir)
            self.assertIsNone(service.avatar_dir)

    def test_init_with_env_override(self):
        """When AVATAR_DIR and PUBLIC_STORAGE_DIR are provided via environment variables."""
        with tempfile.TemporaryDirectory() as tmpdir:
            avatar_path = Path(tmpdir) / "avatars"
            public_storage = Path(tmpdir) / "public"

            with patch.dict(
                os.environ,
                {
                    "AVATAR_DIR": str(avatar_path),
                    "PUBLIC_STORAGE_DIR": str(public_storage),
                },
            ):
                service = AvatarService()
                self.assertEqual(service.avatar_dir, avatar_path.resolve())
                self.assertEqual(service.public_storage_dir, public_storage.resolve())
                self.assertTrue(avatar_path.exists())


if __name__ == "__main__":
    unittest.main()
