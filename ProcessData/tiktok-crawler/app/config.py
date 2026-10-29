import os
from urllib.parse import urlparse, urlunparse

# Backend endpoint nhận callback account và trạng thái hoàn tất crawl.
BACKEND_CALLBACK_URL = os.getenv(
    "BACKEND_CALLBACK_URL",
    "http://localhost:8000/admin/api/public/crawler",
).rstrip("/")

# Có thể truyền token qua biến môi trường nếu backend bảo vệ callback endpoint.
CALLBACK_TOKEN = os.getenv("CALLBACK_TOKEN") or None

# Cấu hình địa chỉ service Python.
SERVICE_HOST = os.getenv("CRAWLER_HOST", "0.0.0.0")
SERVICE_PORT = int(os.getenv("CRAWLER_PORT", "8001"))

# Standard desktop User-Agent to avoid TikTok WAF HeadlessChrome detection
DEFAULT_USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
)


def _resolve_headless_mode() -> bool:
    """Resolve headless mode from HEADLESS env var, falling back to True in non-GUI Linux environments."""
    env_headless = os.getenv("HEADLESS")
    if env_headless is not None:
        return env_headless.lower() in ("true", "1", "yes")
    # Default to True when running in Linux environments without a display server (e.g. Docker container)
    if os.name != "nt" and not os.getenv("DISPLAY"):
        return True
    return False


HEADLESS = _resolve_headless_mode()


def normalize_callback_url(callback_url: str | None) -> str:
    """Ensure local Laravel callbacks use the configured backend port."""
    callback_url = (callback_url or BACKEND_CALLBACK_URL).rstrip("/")
    parsed_url = urlparse(callback_url)

    if parsed_url.hostname in {"localhost", "127.0.0.1"} and parsed_url.port is None:
        parsed_url = parsed_url._replace(netloc=f"{parsed_url.hostname}:8000")

    return urlunparse(parsed_url).rstrip("/")
