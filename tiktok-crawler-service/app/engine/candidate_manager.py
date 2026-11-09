"""
Candidate Pool & Identity Manager (TikTok Crawler v2.2)
Implements:
1. Canonical identity resolution with sec_uid as primary truth.
2. Historical alias management (candidate_aliases) supporting creator username changes (T12).
3. Multi-source attribution tracking (candidate_sources) without overwriting (T13).
4. Strict single-active assignment reservation using SQLite partial unique index (T11).

Delegates storage and raw SQL persistence to CandidateRepository.
"""

import logging
from pathlib import Path
import re
import sqlite3
from typing import Any, Dict, List, Optional

try:
    from repositories.candidate_repo import CandidateRepository
except ImportError:
    from app.repositories.candidate_repo import CandidateRepository

logger = logging.getLogger(__name__)


class CandidateManager:
    def __init__(self, db_path: Path | str, repo: Optional[CandidateRepository] = None):
        self.db_path = Path(db_path)
        self.repo = repo or CandidateRepository(self.db_path)

    def _get_connection(self) -> sqlite3.Connection:
        """Compatibility helper delegating connection retrieval to repository."""
        return self.repo._get_connection()

    @staticmethod
    def now_ms() -> int:
        return CandidateRepository.now_ms()

    @staticmethod
    def normalize_username(username: str) -> str:
        """Strip whitespace, remove leading '@', and convert to lowercase."""
        return username.strip().lstrip("@").lower()

    EMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
        "mail.com", "protonmail.com", "zoho.com", "yandex.com"
    }

    @classmethod
    def is_valid_username(cls, username: str) -> bool:
        """
        Validate whether a string conforms to TikTok username rules:
        - 2 to 24 characters
        - Letters (a-z, A-Z), numbers (0-9), underscores (_), and periods (.)
        - No hashes, spaces, emojis, slashes, or unicode characters outside ASCII alphanumeric.
        - Excludes email domains and common TLD endings (.com, .vn, .net, etc.).
        """
        if not username or not isinstance(username, str):
            return False
        clean = username.strip().lstrip("@").lower()
        if not bool(re.match(r"^[a-zA-Z0-9_.]{2,24}$", clean)):
            return False
        if clean in cls.EMAIL_DOMAINS:
            return False
        if any(clean.endswith("." + ext) for ext in ("com", "vn", "net", "org", "io", "edu", "gov", "info")):
            return False
        return True

    # --------------------------------------------------------------------------
    # 1. Identity Resolution & Upsert (T12 & T13)
    # --------------------------------------------------------------------------
    def upsert_candidate_identity(
        self,
        username: str,
        sec_uid: Optional[str] = None,
        allocation_class: str = "fresh_discovery",
        source_type: Optional[str] = None,
        source_reference: Optional[str] = None,
        conn: Optional[sqlite3.Connection] = None,
    ) -> Dict[str, Any]:
        """
        Upsert a candidate with canonical identity handling and validation.
        Delegates persistence to CandidateRepository.
        """
        norm_user = self.normalize_username(username)
        if not norm_user:
            raise ValueError("Username cannot be empty")

        if not self.is_valid_username(norm_user):
            logger.warning(f"Candidate username '{username}' rejected: invalid TikTok username format.")
            return {"candidate_id": None, "invalid": True, "reason": "invalid_username"}

        if allocation_class not in ("historical", "fresh_discovery", "bootstrap"):
            raise ValueError(f"Invalid allocation_class: {allocation_class}")

        return self.repo.upsert_candidate_identity(
            norm_user=norm_user,
            sec_uid=sec_uid,
            allocation_class=allocation_class,
            source_type=source_type,
            source_reference=source_reference,
            conn=conn,
        )

    # --------------------------------------------------------------------------
    # 2. Candidate Reservation & Assignment (T11)
    # --------------------------------------------------------------------------
    def reserve_candidate(
        self,
        candidate_id: str,
        crawl_job_id: str,
        crawl_run_id: str,
        target_type: str = "new_candidate",
    ) -> Optional[str]:
        """Attempt to reserve candidate for a crawl job run with 'active' status."""
        if target_type not in ("historical", "new_candidate", "bootstrap"):
            raise ValueError(f"Invalid target_type: {target_type}")

        return self.repo.reserve_candidate(
            candidate_id=candidate_id,
            crawl_job_id=crawl_job_id,
            crawl_run_id=crawl_run_id,
            target_type=target_type,
        )

    def release_candidate(
        self,
        assignment_id: str,
        new_status: str = "completed",
    ) -> bool:
        """Release candidate assignment from 'active' status."""
        if new_status not in ("completed", "released", "cancelled"):
            raise ValueError(f"Invalid new_status: {new_status}")

        return self.repo.release_candidate(
            assignment_id=assignment_id,
            new_status=new_status,
        )

    # --------------------------------------------------------------------------
    # 3. Read Queries
    # --------------------------------------------------------------------------
    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_candidate(candidate_id)

    def get_aliases(self, candidate_id: str) -> List[Dict[str, Any]]:
        return self.repo.get_aliases(candidate_id)

    def get_sources(self, candidate_id: str) -> List[Dict[str, Any]]:
        return self.repo.get_sources(candidate_id)

    def sample_targets_balanced(
        self,
        count: int,
        exclude: Optional[List[str]] = None,
        allow_fallback: bool = True,
    ) -> List[str]:
        return self.repo.sample_targets_balanced(
            count=count,
            exclude=exclude,
            allow_fallback=allow_fallback,
        )
