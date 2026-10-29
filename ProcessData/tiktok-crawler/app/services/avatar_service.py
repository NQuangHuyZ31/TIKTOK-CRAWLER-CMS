import logging
import os
from pathlib import Path
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class AvatarService:

    def __init__(self):
        self.project_root = self._find_project_root()

        configured_public_storage = os.getenv("PUBLIC_STORAGE_DIR")
        if configured_public_storage:
            self.public_storage_dir = Path(configured_public_storage).resolve()
        elif self.project_root:
            self.public_storage_dir = (
                self.project_root
                / "cms-tiktok-crawler"
                / "storage"
                / "app"
                / "public"
            ).resolve()
        else:
            self.public_storage_dir = None

        configured_avatar_dir = os.getenv("AVATAR_DIR")
        if configured_avatar_dir:
            self.avatar_dir = Path(configured_avatar_dir).resolve()
        elif self.public_storage_dir:
            self.avatar_dir = (
                self.public_storage_dir
                / "tiktok-accounts"
                / "avatars"
            ).resolve()
        else:
            self.avatar_dir = None

        if self.avatar_dir:
            try:
                self.avatar_dir.mkdir(
                    parents=True,
                    exist_ok=True,
                )
            except OSError as error:
                logger.warning(
                    "Could not create avatar directory %s: %s",
                    self.avatar_dir,
                    error,
                )
                self.avatar_dir = None

    @staticmethod
    def _find_project_root(start_path: Path | None = None) -> Path | None:
        """Search upwards for the project root containing 'cms-tiktok-crawler'."""
        current = (start_path or Path(__file__)).resolve()
        for parent in current.parents:
            if (parent / "cms-tiktok-crawler").is_dir():
                return parent
        return None

    async def download(
        self,
        page,
        username: str,
        avatar_url: str,
    ) -> str | None:
        if not self.avatar_dir:
            return None

        response = await page.request.get(
            avatar_url
        )

        if not response.ok:
            raise RuntimeError(
                f"Could not download avatar "
                f"(HTTP {response.status})"
            )

        content_type = (
            response.headers.get("content-type")
            or ""
        ).lower()

        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(
            content_type.split(";")[0],
            "",
        )

        if not extension:
            extension = Path(
                urlparse(avatar_url).path
            ).suffix.lower()

        if extension not in {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
        }:
            extension = ".jpg"

        safe_username = "".join(
            c if c.isalnum() or c in "._-" else "_"
            for c in username
        )

        path = self.avatar_dir / (
            f"{safe_username}{extension}"
        )

        path.write_bytes(
            await response.body()
        )

        try:
            if self.public_storage_dir:
                relative_path = path.relative_to(self.public_storage_dir)
            else:
                relative_path = path
        except ValueError:
            relative_path = path

        return str(relative_path).replace("\\", "/")
