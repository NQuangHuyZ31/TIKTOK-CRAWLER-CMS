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
LARAVEL_BASE_URL = (
    os.getenv("LARAVEL_BASE_URL")
    or os.getenv("LARAVEL_URL")
    or "http://127.0.0.1:8000"
).rstrip("/")

LARAVEL_API_URL = (
    os.getenv("LARAVEL_API_URL")
    or os.getenv("BACKEND_CALLBACK_URL")
    or f"{LARAVEL_BASE_URL}/admin/api/public/crawler"
).rstrip("/")

CRAWLER_TOKEN = (
    os.getenv("CRAWLER_TOKEN")
    or os.getenv("CALLBACK_TOKEN")
    or "2703ac97eb897aacbf1235f5e608bf93d2ca7e0c2fe9d09a35e44f6ad6ab410c"
)

CRAWLER_HMAC_SECRET = (
    os.getenv("CRAWLER_HMAC_SECRET")
    or CRAWLER_TOKEN
)
CRAWLER_KEY_ID = os.getenv("CRAWLER_KEY_ID", "key_v1")

# Outbox Dispatcher
OUTBOX_BATCH_SIZE = int(os.getenv("OUTBOX_BATCH_SIZE", "25"))
OUTBOX_DISPATCH_TIMEOUT = float(os.getenv("OUTBOX_DISPATCH_TIMEOUT", "5.0"))

# Scheduler & Chunk Lease configuration (TikTok Crawler v2.2)
CRAWLER_MAX_ACTIVE_JOBS = int(os.getenv("CRAWLER_MAX_ACTIVE_JOBS", "20"))
CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER = int(os.getenv("CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER", "3"))
CRAWLER_CHUNK_SIZE = int(os.getenv("CRAWLER_CHUNK_SIZE", "25"))
CRAWLER_CHUNK_LEASE_MS = int(os.getenv("CRAWLER_CHUNK_LEASE_MS", "60000"))
CRAWLER_MAX_CHUNK_CRASHES = int(os.getenv("CRAWLER_MAX_CHUNK_CRASHES", "3"))
CRAWLER_MAX_TARGET_ATTEMPTS = int(os.getenv("CRAWLER_MAX_TARGET_ATTEMPTS", "3"))
CRAWLER_GLOBAL_RATE_LIMIT_RPS = float(os.getenv("CRAWLER_GLOBAL_RATE_LIMIT_RPS", "2.0"))

# Discovery & Candidate Pool Watermark (Batch 8)
CRAWLER_DISCOVERY_ENABLED = os.getenv("CRAWLER_DISCOVERY_ENABLED", "true").lower() in ("true", "1", "yes")
DISCOVERY_WORKER_COUNT = int(os.getenv("DISCOVERY_WORKER_COUNT", "2"))
DISCOVERY_INTERVAL_SECONDS = float(os.getenv("DISCOVERY_INTERVAL_SECONDS", "10.0"))
CRAWLER_CANDIDATE_POOL_TARGET_SIZE = int(os.getenv("CRAWLER_CANDIDATE_POOL_TARGET_SIZE", "2000"))
CRAWLER_CANDIDATE_POOL_LOW_WATERMARK = int(os.getenv("CRAWLER_CANDIDATE_POOL_LOW_WATERMARK", "500"))
CRAWLER_DISCOVERY_SCAN_VIDEOS_PER_SEED = int(os.getenv("CRAWLER_DISCOVERY_SCAN_VIDEOS_PER_SEED", "20"))
ALLOW_BOOTSTRAP_FALLBACK = os.getenv("ALLOW_BOOTSTRAP_FALLBACK", "true").lower() in ("true", "1", "yes")
DISCOVERY_RATE_LIMITED = os.getenv("DISCOVERY_RATE_LIMITED", "false").lower() in ("true", "1", "yes")
DISCOVERY_MAX_BATCH_SIZE = int(os.getenv("DISCOVERY_MAX_BATCH_SIZE", "50"))
DISCOVERY_FRONTIER_THRESHOLD = int(os.getenv("DISCOVERY_FRONTIER_THRESHOLD", "100"))
SHARED_RATE_LIMIT_PROFILE_WEIGHT = int(os.getenv("SHARED_RATE_LIMIT_PROFILE_WEIGHT", "4"))

# Operational Safeguards (Batch 8)
CRAWLER_MIN_FREE_DISK_GB = float(os.getenv("CRAWLER_MIN_FREE_DISK_GB", "5.0"))
CRAWLER_MAX_WAL_BYTES = int(os.getenv("CRAWLER_MAX_WAL_BYTES", str(1000 * 1024 * 1024)))

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
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
)

USER_AGENT_POOL = [
    DEFAULT_USER_AGENT,
    (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
    ),
    (
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36"
    ),
    (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    ),
    (
        "Mozilla/5.0 (Linux; Android 14; SM-S928B) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36"
    ),
]


def normalize_callback_url(callback_url: str | None) -> str:
    """Normalize backend callback URL and ensure localhost uses port 8000 by default."""
    url = (callback_url or LARAVEL_API_URL).rstrip("/")
    parsed = urlparse(url)
    if parsed.hostname in {"localhost", "127.0.0.1"} and parsed.port is None:
        parsed = parsed._replace(netloc=f"{parsed.hostname}:8000")
    return urlunparse(parsed).rstrip("/")
