"""
Base Repository for SQLite WAL persistence.
Provides standardized connection lifecycle, PRAGMA flags, and timestamp utilities.
"""

from pathlib import Path
import sqlite3
import time
from typing import Optional


class BaseRepository:
    def __init__(self, db_path: Path | str):
        self.db_path = Path(db_path)

    def _get_connection(self, row_factory: Optional[type] = None) -> sqlite3.Connection:
        """Create a standardized SQLite connection with WAL mode and foreign keys enabled."""
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA foreign_keys = ON;")
        if row_factory:
            conn.row_factory = row_factory
        return conn

    @staticmethod
    def now_ms() -> int:
        """Current timestamp in milliseconds."""
        return int(time.time() * 1000)
