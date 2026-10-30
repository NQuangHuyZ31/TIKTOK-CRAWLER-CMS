from pathlib import Path
import sys

APP_DIR = Path(__file__).resolve().parent
SUBDIRS = ("core", "schemas", "crawler", "engine", "services", "api")

for folder in (APP_DIR, *(APP_DIR / sub for sub in SUBDIRS)):
    folder_str = str(folder)
    if folder_str not in sys.path:
        sys.path.insert(0, folder_str)
