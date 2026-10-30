import base64
import logging
import os
from pathlib import Path

import httpx

from core.config import AVATAR_MAX_BYTES, DEFAULT_USER_AGENT
from schemas.models import AvatarPayload

logger = logging.getLogger(__name__)

IMAGE_SIGNATURES: tuple[tuple[bytes, str, str], ...] = (
    (b"\xff\xd8\xff", "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", ".png"),
    (b"GIF87a", "image/gif", ".gif"),
    (b"GIF89a", "image/gif", ".gif"),
)


def detect_image_mime(data: bytes) -> tuple[str, str] | None:
    """Validate image magic bytes and return (mime_type, extension) or None if invalid."""
    if not data or len(data) < 12:
        return None
    for magic, mime, ext in IMAGE_SIGNATURES:
        if data.startswith(magic):
            return mime, ext
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp", ".webp"
    return None


class AvatarDownloader:
    """
    Downloads TikTok profile avatar image, validates its binary signature and size,
    returns Base64 payload for Laravel, and writes to local public folder when shared disk exists.
    """

    def __init__(self, max_bytes: int = AVATAR_MAX_BYTES):
        self.max_bytes = max_bytes
        self.public_dir = self._resolve_public_dir()
        self.avatar_dir = (
            (self.public_dir / "tiktok-accounts" / "avatars").resolve()
            if self.public_dir
            else None
        )
        if self.avatar_dir:
            try:
                self.avatar_dir.mkdir(parents=True, exist_ok=True)
            except OSError:
                self.avatar_dir = None

    @staticmethod
    def _resolve_public_dir() -> Path | None:
        configured = (
            os.getenv("PUBLIC_DIR")
            or os.getenv("PUBLIC_PATH")
            or os.getenv("PUBLIC_STORAGE_DIR")
        )
        if configured:
            return Path(configured).resolve()
        current = Path(__file__).resolve()
        for parent in current.parents:
            candidate = parent / "cms-tiktok-crawler" / "public"
            if candidate.is_dir():
                return candidate.resolve()
        return None

    async def fetch(
        self,
        client: httpx.AsyncClient,
        username: str,
        avatar_url: str | None,
    ) -> tuple[AvatarPayload | None, str | None]:
        """
        Download avatar from `avatar_url`.
        Returns (AvatarPayload, local_relative_avatar_path).
        Never raises on network/format error so avatar failures do not fail the account crawl.
        """
        if not avatar_url:
            return None, None

        try:
            response = await client.get(
                avatar_url,
                headers={"User-Agent": DEFAULT_USER_AGENT, "Referer": "https://www.tiktok.com/"},
                timeout=15.0,
                follow_redirects=True,
            )
            if response.status_code != 200:
                logger.warning(
                    "[@%s] Avatar download returned HTTP %d",
                    username,
                    response.status_code,
                )
                return None, None

            content = response.content
            if len(content) > self.max_bytes:
                logger.warning(
                    "[@%s] Avatar exceeds max size (%d > %d bytes)",
                    username,
                    len(content),
                    self.max_bytes,
                )
                return None, None

            detected = detect_image_mime(content)
            if not detected:
                logger.warning("[@%s] Downloaded avatar is not a valid image", username)
                return None, None

            mime, ext = detected
            encoded = base64.b64encode(content).decode("ascii")
            payload = AvatarPayload(content_base64=encoded, mime=mime)

            local_rel_path = self._save_local_copy(username, ext, content)
            return payload, local_rel_path
        except Exception as error:
            logger.warning("[@%s] Avatar download failed: %s", username, error)
            return None, None

    def _save_local_copy(self, username: str, ext: str, content: bytes) -> str | None:
        if not self.avatar_dir:
            return None
        safe_username = "".join(c if c.isalnum() or c in "._-" else "_" for c in username)
        if not safe_username:
            return None
        target = self.avatar_dir / f"{safe_username}{ext}"
        try:
            target.write_bytes(content)
            if self.public_dir:
                return str(target.relative_to(self.public_dir)).replace("\\", "/")
            return f"tiktok-accounts/avatars/{safe_username}{ext}"
        except OSError as error:
            logger.warning("Could not write local avatar for @%s: %s", username, error)
            return None
