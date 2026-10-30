import os
from pathlib import Path
from urllib.parse import urlparse, urlunparse

SERVICE_ROOT = Path(__file__).resolve().parent.parent.parent

try:
    from dotenv import load_dotenv

    load_dotenv(SERVICE_ROOT / ".env", override=True)
except ImportError:
    env_file = SERVICE_ROOT / ".env"
    if env_file.is_file():
        for raw_line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip("'\""))

# Server binding (supports CRAWLER_PORT or Render's PORT)
SERVICE_HOST = os.getenv("CRAWLER_HOST", "0.0.0.0")
SERVICE_PORT = int(os.getenv("CRAWLER_PORT") or os.getenv("PORT") or "8001")

# Fixed Worker Pool configuration
WORKER_COUNT = int(
    os.getenv("WORKER_COUNT")
    or os.getenv("CRAWLER_SERVICE_COUNT")
    or os.getenv("MAX_CONCURRENT_JOBS")
    or "5"
)

# SQLite persistence path
_raw_db_path = os.getenv("QUEUE_DB_PATH", "data/queue.db")
QUEUE_DB_PATH = (
    Path(_raw_db_path)
    if Path(_raw_db_path).is_absolute()
    else (SERVICE_ROOT / _raw_db_path)
)


def _resolve_datasets_dir() -> Path:
    """Resolve datasets directory (defaults to tiktok-crawler-service/datasets)."""
    configured = os.getenv("DATASETS_DIR")
    if configured:
        path = Path(configured)
        return path if path.is_absolute() else (SERVICE_ROOT / path)
    return SERVICE_ROOT / "datasets"


DATASETS_DIR = _resolve_datasets_dir()

# Laravel API & shared secret token
LARAVEL_API_URL = (
    os.getenv("LARAVEL_API_URL")
    or os.getenv("BACKEND_CALLBACK_URL")
    or "http://localhost:8000/admin/api/public/crawler"
).rstrip("/")

CRAWLER_TOKEN = (
    os.getenv("CRAWLER_TOKEN")
    or os.getenv("CALLBACK_TOKEN")
    or None
)

# Timeouts & Retry limits
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "20"))
ACCOUNT_TIMEOUT = float(os.getenv("ACCOUNT_TIMEOUT", "90"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
MAX_JOB_RESUMES = int(os.getenv("MAX_JOB_RESUMES", "3"))
REQUEUE_DELAY_SECONDS = float(os.getenv("REQUEUE_DELAY_SECONDS", "60"))

# Rate Limiting & Circuit Breaker
RATE_LIMIT_PER_SEC = float(os.getenv("RATE_LIMIT_PER_SEC", "1.5"))
REQUEST_DELAY_MIN = float(os.getenv("REQUEST_DELAY_MIN", "0.6"))
REQUEST_DELAY_MAX = float(os.getenv("REQUEST_DELAY_MAX", "1.5"))
CIRCUIT_BREAKER_THRESHOLD = int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "10"))
CIRCUIT_BREAKER_COOLDOWN = float(os.getenv("CIRCUIT_BREAKER_COOLDOWN", "15"))

# Input & Resource bounds
MAX_ACCOUNTS_PER_JOB = int(os.getenv("MAX_ACCOUNTS_PER_JOB", "500"))
QUEUE_MAX_SIZE = int(os.getenv("QUEUE_MAX_SIZE", "5000"))
AVATAR_MAX_BYTES = int(os.getenv("AVATAR_MAX_BYTES", str(2 * 1024 * 1024)))
MAX_HTML_BYTES = int(os.getenv("MAX_HTML_BYTES", str(5 * 1024 * 1024)))

DEFAULT_USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
)

USER_AGENT_POOL = [
    DEFAULT_USER_AGENT,
    (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
    ),
    (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    ),
    (
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Linux; Android 13; SM-S918B) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.99 Mobile Safari/537.36"
    ),
]


def normalize_callback_url(callback_url: str | None) -> str:
    """Normalize backend callback URL and ensure localhost uses port 8000 by default."""
    url = (callback_url or LARAVEL_API_URL).rstrip("/")
    parsed = urlparse(url)
    if parsed.hostname in {"localhost", "127.0.0.1"} and parsed.port is None:
        parsed = parsed._replace(netloc=f"{parsed.hostname}:8000")
    return urlunparse(parsed).rstrip("/")
