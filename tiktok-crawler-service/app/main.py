from pathlib import Path
import sys

# Ensure project root, `app` and its modular subdirectories are on sys.path
APP_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = APP_DIR.parent

for target_path in (SERVICE_ROOT, APP_DIR, *(APP_DIR / sub for sub in ("core", "schemas", "crawler", "engine", "services", "api"))):
    target_str = str(target_path)
    if target_str not in sys.path:
        sys.path.insert(0, target_str)

import uvicorn
from core.config import SERVICE_HOST, SERVICE_PORT


if __name__ == "__main__":
    # Enforce single process (workers=1) because the job queue resides in this process
    uvicorn.run(
        "api.routes:app",
        host=SERVICE_HOST,
        port=SERVICE_PORT,
        workers=1,
    )
