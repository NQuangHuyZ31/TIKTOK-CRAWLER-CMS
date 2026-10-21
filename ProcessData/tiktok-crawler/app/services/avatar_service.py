import os
from pathlib import Path
from urllib.parse import urlparse


class AvatarService:

    def __init__(self):
        self.project_root = Path(__file__).resolve().parents[4]
        self.public_storage_dir = (
            self.project_root
            / "cms-tiktok-crawler"
            / "storage"
            / "app"
            / "public"
        )
        default_avatar_dir = (
            self.public_storage_dir
            / "tiktok-accounts"
            / "avatars"
        )
        configured_avatar_dir = os.getenv("AVATAR_DIR")
        self.avatar_dir = Path(
            configured_avatar_dir
            or default_avatar_dir
        ).resolve()

        self.avatar_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    async def download(
        self,
        page,
        username: str,
        avatar_url: str,
    ) -> str:

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
            relative_path = path.relative_to(self.public_storage_dir)
        except ValueError:
            relative_path = path

        return str(relative_path).replace("\\", "/")