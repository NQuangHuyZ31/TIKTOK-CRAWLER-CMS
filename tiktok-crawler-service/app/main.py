from pathlib import Path
import sys

# Ensure `app` and its modular subdirectories are on sys.path
APP_DIR = Path(__file__).resolve().parent
for sub in ("", "core", "schemas", "crawler", "engine", "services", "api"):
    target = str(APP_DIR / sub if sub else APP_DIR)
    if target not in sys.path:
        sys.path.insert(0, target)

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
