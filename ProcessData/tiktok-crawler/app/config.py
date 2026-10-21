import os
from urllib.parse import urlparse, urlunparse


# Backend endpoint nhận callback account và trạng thái hoàn tất crawl.
BACKEND_CALLBACK_URL = os.getenv(
    "BACKEND_CALLBACK_URL",
    "http://localhost:8000/api/public/crawler",
).rstrip("/")

# Có thể truyền token qua biến môi trường nếu backend bảo vệ callback endpoint.
CALLBACK_TOKEN = os.getenv("CALLBACK_TOKEN") or None

# Cấu hình địa chỉ service Python.
SERVICE_HOST = os.getenv("CRAWLER_HOST", "0.0.0.0")
SERVICE_PORT = int(os.getenv("CRAWLER_PORT", "8001"))


def normalize_callback_url(callback_url: str | None) -> str:
    """Ensure local Laravel callbacks use the configured backend port."""
    callback_url = (callback_url or BACKEND_CALLBACK_URL).rstrip("/")
    parsed_url = urlparse(callback_url)

    if parsed_url.hostname in {"localhost", "127.0.0.1"} and parsed_url.port is None:
        parsed_url = parsed_url._replace(netloc=f"{parsed_url.hostname}:8000")

    return urlunparse(parsed_url).rstrip("/")
