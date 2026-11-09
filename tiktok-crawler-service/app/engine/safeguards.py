"""
Operational Safeguards (TikTok Crawler v2.2)
Disk space monitoring, WAL threshold checkpointing, and graceful pause triggers.
"""

from pathlib import Path
import shutil
import sqlite3
from typing import Union
import logging

try:
    import core.config as config
except ImportError:
    from app.core import config

logger = logging.getLogger(__name__)


class DiskSafeguards:
    @staticmethod
    def get_free_disk_gb(path: Union[str, Path] = ".") -> float:
        """
        Get free disk space in Gigabytes for the specified path or volume.
        """
        try:
            target_path = Path(path).resolve()
            # If target_path does not exist yet, find the existing parent directory
            while not target_path.exists() and target_path != target_path.parent:
                target_path = target_path.parent

            usage = shutil.disk_usage(str(target_path))
            return usage.free / (1024 ** 3)
        except Exception as e:
            logger.warning(f"Error checking disk usage for path {path}: {e}")
            return 999.0  # Fail-safe to avoid false blocking on inspection errors

    @staticmethod
    def is_disk_space_low(
        path: Union[str, Path] = ".",
        min_free_gb: float = config.CRAWLER_MIN_FREE_DISK_GB,
    ) -> bool:
        """
        Returns True if free disk space is less than min_free_gb.
        """
        free_gb = DiskSafeguards.get_free_disk_gb(path)
        return free_gb < min_free_gb

    @staticmethod
    def get_wal_size_bytes(db_path: Union[str, Path]) -> int:
        """
        Get size of the SQLite WAL file in bytes if it exists.
        """
        wal_path = Path(f"{str(db_path)}-wal")
        if wal_path.exists():
            return wal_path.stat().st_size
        return 0

    @staticmethod
    def is_wal_oversized(
        db_path: Union[str, Path],
        max_bytes: int = config.CRAWLER_MAX_WAL_BYTES,
    ) -> bool:
        """
        Returns True if the WAL file size exceeds max_bytes.
        """
        return DiskSafeguards.get_wal_size_bytes(db_path) >= max_bytes

    @staticmethod
    def checkpoint_wal_if_needed(
        conn: sqlite3.Connection,
        db_path: Union[str, Path],
        max_bytes: int = config.CRAWLER_MAX_WAL_BYTES,
        checkpoint_mode: str = "PASSIVE",
    ) -> bool:
        """
        Checkpoints the WAL journal if its size exceeds the threshold.
        Returns True if a checkpoint was executed.
        """
        if DiskSafeguards.is_wal_oversized(db_path, max_bytes):
            logger.warning(
                f"WAL file for {db_path} ({DiskSafeguards.get_wal_size_bytes(db_path)} bytes) "
                f"exceeds {max_bytes} bytes. Running PRAGMA wal_checkpoint({checkpoint_mode})."
            )
            try:
                conn.execute(f"PRAGMA wal_checkpoint({checkpoint_mode});")
                return True
            except Exception as e:
                logger.error(f"Error executing wal_checkpoint: {e}")
                return False
        return False
