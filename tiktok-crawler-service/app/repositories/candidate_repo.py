"""
Candidate Repository (SQLite WAL)
Encapsulates all raw SQL queries, transactions, and concurrency locks for:
- candidate_pool
- candidate_aliases
- candidate_sources
- candidate_assignments
- bootstrap_seeds
"""

import logging
from pathlib import Path
import re
import sqlite3
from typing import Any, Dict, List, Optional, Set
import uuid

try:
    from repositories.base import BaseRepository
except ImportError:
    from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class CandidateRepository(BaseRepository):
    def __init__(self, db_path: Path | str):
        super().__init__(db_path)

    # --------------------------------------------------------------------------
    # 1. Identity Resolution & Upsert Queries
    # --------------------------------------------------------------------------
    def upsert_candidate_identity(
        self,
        norm_user: str,
        sec_uid: Optional[str] = None,
        allocation_class: str = "fresh_discovery",
        source_type: Optional[str] = None,
        source_reference: Optional[str] = None,
        conn: Optional[sqlite3.Connection] = None,
    ) -> Dict[str, Any]:
        """
        Executes atomic candidate identity upsert within an IMMEDIATE transaction.
        Handles canonical sec_uid resolution, alias demotion/promotion, and source attribution.
        """
        owns_conn = conn is None
        if owns_conn:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")
        else:
            cursor = conn.cursor()

        try:
            now = self.now_ms()

            # Check privacy suppression gate
            cursor.execute(
                """
                SELECT 1 FROM privacy_suppression
                WHERE (entity_type IN ('username', 'account') AND entity_key = ?)
                   OR (? IS NOT NULL AND entity_type IN ('sec_uid', 'account') AND entity_key = ?);
                """,
                (norm_user, sec_uid, sec_uid or "")
            )
            if cursor.fetchone() is not None:
                logger.info(f"Refusing to upsert candidate {norm_user} (entity is suppressed under privacy rules).")
                if owns_conn:
                    conn.commit()
                return {"candidate_id": None, "suppressed": True, "username": norm_user}

            candidate_id = None
            identity_state = "unresolved"
            is_new = False

            if sec_uid:
                # 1. Try finding by canonical sec_uid
                cursor.execute(
                    "SELECT candidate_id, identity_state, allocation_class FROM candidate_pool WHERE sec_uid = ?;",
                    (sec_uid,)
                )
                row = cursor.fetchone()

                if row:
                    candidate_id, identity_state, alloc_class = row
                    cursor.execute(
                        "UPDATE candidate_pool SET updated_at_ms = ? WHERE candidate_id = ?;",
                        (now, candidate_id)
                    )

                    # Check current alias
                    cursor.execute(
                        """
                        SELECT alias_id, username_normalized
                        FROM candidate_aliases
                        WHERE candidate_id = ? AND is_current = 1;
                        """,
                        (candidate_id,)
                    )
                    alias_row = cursor.fetchone()

                    if alias_row:
                        curr_alias_id, curr_norm_user = alias_row
                        if curr_norm_user == norm_user:
                            cursor.execute(
                                "UPDATE candidate_aliases SET last_seen_at_ms = ? WHERE alias_id = ?;",
                                (now, curr_alias_id)
                            )
                        else:
                            # Creator changed username (T12)
                            cursor.execute(
                                "UPDATE candidate_aliases SET is_current = 0, last_seen_at_ms = ? WHERE alias_id = ?;",
                                (now, curr_alias_id)
                            )
                            new_alias_id = f"als_{uuid.uuid4().hex[:16]}"
                            cursor.execute(
                                """
                                INSERT INTO candidate_aliases (
                                    alias_id, candidate_id, username_normalized,
                                    first_seen_at_ms, last_seen_at_ms, is_current
                                ) VALUES (?, ?, ?, ?, ?, 1);
                                """,
                                (new_alias_id, candidate_id, norm_user, now, now)
                            )
                            logger.info(
                                "Creator changed username: candidate %s alias changed from @%s to @%s",
                                candidate_id, curr_norm_user, norm_user
                            )
                    else:
                        new_alias_id = f"als_{uuid.uuid4().hex[:16]}"
                        cursor.execute(
                            """
                            INSERT INTO candidate_aliases (
                                alias_id, candidate_id, username_normalized,
                                first_seen_at_ms, last_seen_at_ms, is_current
                            ) VALUES (?, ?, ?, ?, ?, 1);
                            """,
                            (new_alias_id, candidate_id, norm_user, now, now)
                        )

                else:
                    # sec_uid not found in candidate_pool. Check if username exists in aliases
                    cursor.execute(
                        """
                        SELECT c.candidate_id, c.sec_uid, c.identity_state
                        FROM candidate_aliases a
                        JOIN candidate_pool c ON a.candidate_id = c.candidate_id
                        WHERE a.username_normalized = ? AND a.is_current = 1;
                        """,
                        (norm_user,)
                    )
                    existing_by_name = cursor.fetchone()

                    if existing_by_name:
                        candidate_id, existing_sec_uid, curr_state = existing_by_name
                        if not existing_sec_uid:
                            cursor.execute(
                                """
                                UPDATE candidate_pool
                                SET sec_uid = ?,
                                    identity_state = 'verified',
                                    updated_at_ms = ?
                                WHERE candidate_id = ?;
                                """,
                                (sec_uid, now, candidate_id)
                            )
                            identity_state = "verified"
                        cursor.execute(
                            """
                            UPDATE candidate_aliases
                            SET last_seen_at_ms = ?
                            WHERE candidate_id = ? AND is_current = 1;
                            """,
                            (now, candidate_id)
                        )
                    else:
                        # Completely new verified candidate
                        candidate_id = f"cand_{uuid.uuid4().hex[:16]}"
                        identity_state = "verified"
                        is_new = True
                        cursor.execute(
                            """
                            INSERT INTO candidate_pool (
                                candidate_id, sec_uid, identity_state, allocation_class,
                                priority_score, crawl_count, last_crawled_at_ms,
                                cooldown_until_ms, lifecycle_status, created_at_ms, updated_at_ms
                            ) VALUES (?, ?, 'verified', ?, 1.0, 0, NULL, NULL, 'valid', ?, ?);
                            """,
                            (candidate_id, sec_uid, allocation_class, now, now)
                        )
                        new_alias_id = f"als_{uuid.uuid4().hex[:16]}"
                        cursor.execute(
                            """
                            INSERT INTO candidate_aliases (
                                alias_id, candidate_id, username_normalized,
                                first_seen_at_ms, last_seen_at_ms, is_current
                            ) VALUES (?, ?, ?, ?, ?, 1);
                            """,
                            (new_alias_id, candidate_id, norm_user, now, now)
                        )

            else:
                # No sec_uid provided (unresolved mention)
                cursor.execute(
                    """
                    SELECT a.candidate_id, a.alias_id, c.identity_state
                    FROM candidate_aliases a
                    JOIN candidate_pool c ON a.candidate_id = c.candidate_id
                    WHERE a.username_normalized = ? AND a.is_current = 1;
                    """,
                    (norm_user,)
                )
                row = cursor.fetchone()

                if row:
                    candidate_id, alias_id, identity_state = row
                    cursor.execute(
                        "UPDATE candidate_aliases SET last_seen_at_ms = ? WHERE alias_id = ?;",
                        (now, alias_id)
                    )
                    cursor.execute(
                        "UPDATE candidate_pool SET updated_at_ms = ? WHERE candidate_id = ?;",
                        (now, candidate_id)
                    )
                else:
                    candidate_id = f"cand_{uuid.uuid4().hex[:16]}"
                    identity_state = "unresolved"
                    is_new = True
                    cursor.execute(
                        """
                        INSERT INTO candidate_pool (
                            candidate_id, sec_uid, identity_state, allocation_class,
                            priority_score, crawl_count, last_crawled_at_ms,
                            cooldown_until_ms, lifecycle_status, created_at_ms, updated_at_ms
                        ) VALUES (?, NULL, 'unresolved', ?, 1.0, 0, NULL, NULL, 'valid', ?, ?);
                        """,
                        (candidate_id, allocation_class, now, now)
                    )
                    new_alias_id = f"als_{uuid.uuid4().hex[:16]}"
                    cursor.execute(
                        """
                        INSERT INTO candidate_aliases (
                            alias_id, candidate_id, username_normalized,
                            first_seen_at_ms, last_seen_at_ms, is_current
                        ) VALUES (?, ?, ?, ?, ?, 1);
                        """,
                        (new_alias_id, candidate_id, norm_user, now, now)
                    )

            # Record source attribution (T13)
            if source_type and source_reference:
                src_id = f"src_{uuid.uuid4().hex[:16]}"
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO candidate_sources (
                        source_id, candidate_id, source_type, source_reference, discovered_at_ms
                    ) VALUES (?, ?, ?, ?, ?);
                    """,
                    (src_id, candidate_id, source_type, source_reference, now)
                )

            if owns_conn:
                cursor.execute("COMMIT;")

            return {
                "candidate_id": candidate_id,
                "sec_uid": sec_uid,
                "identity_state": identity_state,
                "username_normalized": norm_user,
                "allocation_class": allocation_class,
                "created": is_new,
            }
        except Exception:
            if owns_conn:
                try:
                    conn.execute("ROLLBACK;")
                except Exception:
                    pass
            raise
        finally:
            if owns_conn:
                conn.close()

    # --------------------------------------------------------------------------
    # 2. Candidate Reservation & Assignment Queries
    # --------------------------------------------------------------------------
    def reserve_candidate(
        self,
        candidate_id: str,
        crawl_job_id: str,
        crawl_run_id: str,
        target_type: str = "new_candidate",
    ) -> Optional[str]:
        """Reserve candidate with single active assignment via SQLite partial unique index."""
        conn = self._get_connection()
        try:
            assignment_id = f"asg_{uuid.uuid4().hex[:16]}"
            now = self.now_ms()
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE;")

            cursor.execute(
                "SELECT lifecycle_status FROM candidate_pool WHERE candidate_id = ?;",
                (candidate_id,)
            )
            c_row = cursor.fetchone()
            if not c_row or c_row[0] != "valid":
                cursor.execute("ROLLBACK;")
                return None

            try:
                cursor.execute(
                    """
                    INSERT INTO candidate_assignments (
                        assignment_id, candidate_id, crawl_job_id, crawl_run_id,
                        target_type, status, assigned_at_ms, released_at_ms
                    ) VALUES (?, ?, ?, ?, ?, 'active', ?, NULL);
                    """,
                    (assignment_id, candidate_id, crawl_job_id, crawl_run_id, target_type, now)
                )
                cursor.execute("COMMIT;")
                return assignment_id
            except sqlite3.IntegrityError:
                cursor.execute("ROLLBACK;")
                return None
        except Exception:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    def release_candidate(
        self,
        assignment_id: str,
        new_status: str = "completed",
    ) -> bool:
        """Release active candidate assignment."""
        conn = self._get_connection()
        try:
            with conn:
                now = self.now_ms()
                cursor = conn.execute(
                    """
                    UPDATE candidate_assignments
                    SET status = ?,
                        released_at_ms = ?
                    WHERE assignment_id = ? AND status = 'active';
                    """,
                    (new_status, now, assignment_id)
                )
                return cursor.rowcount == 1
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 3. Read Queries
    # --------------------------------------------------------------------------
    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                """
                SELECT c.candidate_id, c.sec_uid, c.identity_state, c.allocation_class,
                       c.priority_score, c.crawl_count, c.lifecycle_status,
                       a.username_normalized
                FROM candidate_pool c
                LEFT JOIN candidate_aliases a ON c.candidate_id = a.candidate_id AND a.is_current = 1
                WHERE c.candidate_id = ?;
                """,
                (candidate_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "candidate_id": row[0],
                "sec_uid": row[1],
                "identity_state": row[2],
                "allocation_class": row[3],
                "priority_score": row[4],
                "crawl_count": row[5],
                "lifecycle_status": row[6],
                "current_username": row[7],
            }
        finally:
            conn.close()

    def get_aliases(self, candidate_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                """
                SELECT alias_id, username_normalized, first_seen_at_ms, last_seen_at_ms, is_current
                FROM candidate_aliases
                WHERE candidate_id = ?
                ORDER BY first_seen_at_ms ASC;
                """,
                (candidate_id,)
            )
            return [
                {
                    "alias_id": row[0],
                    "username_normalized": row[1],
                    "first_seen_at_ms": row[2],
                    "last_seen_at_ms": row[3],
                    "is_current": bool(row[4]),
                }
                for row in cursor.fetchall()
            ]
        finally:
            conn.close()

    def get_sources(self, candidate_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                """
                SELECT source_id, source_type, source_reference, discovered_at_ms
                FROM candidate_sources
                WHERE candidate_id = ?
                ORDER BY discovered_at_ms ASC;
                """,
                (candidate_id,)
            )
            return [
                {
                    "source_id": row[0],
                    "source_type": row[1],
                    "source_reference": row[2],
                    "discovered_at_ms": row[3],
                }
                for row in cursor.fetchall()
            ]
        finally:
            conn.close()

    def get_valid_count(self) -> int:
        """Count valid candidates currently in the candidate pool."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM candidate_pool WHERE lifecycle_status = 'valid';"
            )
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def sample_targets_balanced(
        self,
        count: int,
        exclude: Optional[List[str]] = None,
        allow_fallback: bool = True,
    ) -> List[str]:
        """
        Sample target usernames balancing 50% Historical and 50% Fresh Discovery (Specification 6.3 & 7.1).
        - Historical: candidates where crawl_count > 0 or allocation_class = 'historical'
        - Fresh Discovery: candidates where allocation_class = 'fresh_discovery' and crawl_count = 0
        - Fallback: if one partition is deficient and allow_fallback is True, the other partition fulfills the shortage.
        """
        if count <= 0:
            return []

        exclude_set = {u.strip().lstrip("@").lower() for u in (exclude or []) if u}
        target_hist = count // 2
        target_fresh = count - target_hist

        conn = self._get_connection()
        try:
            cursor = conn.cursor()

            # 1. Fetch eligible historical candidates
            cursor.execute(
                """
                SELECT a.username_normalized
                FROM candidate_aliases a
                JOIN candidate_pool p ON a.candidate_id = p.candidate_id
                WHERE a.is_current = 1
                  AND p.lifecycle_status = 'valid'
                  AND (p.crawl_count > 0 OR p.allocation_class = 'historical')
                ORDER BY COALESCE(p.last_crawled_at_ms, 0) ASC, p.priority_score DESC;
                """
            )
            hist_candidates = [
                row[0]
                for row in cursor.fetchall()
                if row[0] not in exclude_set and bool(re.match(r"^[a-zA-Z0-9_.]{2,24}$", row[0]))
            ]

            # 2. Fetch eligible fresh discovery candidates
            cursor.execute(
                """
                SELECT a.username_normalized
                FROM candidate_aliases a
                JOIN candidate_pool p ON a.candidate_id = p.candidate_id
                WHERE a.is_current = 1
                  AND p.lifecycle_status = 'valid'
                  AND p.allocation_class = 'fresh_discovery'
                  AND p.crawl_count = 0
                ORDER BY p.priority_score DESC, p.created_at_ms ASC;
                """
            )
            fresh_candidates = [
                row[0]
                for row in cursor.fetchall()
                if row[0] not in exclude_set and bool(re.match(r"^[a-zA-Z0-9_.]{2,24}$", row[0]))
            ]

            selected_hist = hist_candidates[:target_hist]
            selected_fresh = fresh_candidates[:target_fresh]

            # 3. Fallback balancing if one partition is deficient
            if allow_fallback:
                if len(selected_fresh) < target_fresh:
                    shortage = target_fresh - len(selected_fresh)
                    extra_hist = hist_candidates[len(selected_hist) : len(selected_hist) + shortage]
                    selected_hist.extend(extra_hist)

                if len(selected_hist) < target_hist:
                    shortage = target_hist - len(selected_hist)
                    extra_fresh = fresh_candidates[len(selected_fresh) : len(selected_fresh) + shortage]
                    selected_fresh.extend(extra_fresh)

            total_selected = selected_hist + selected_fresh

            # 4. If pool is still completely empty (cold start before discovery), check bootstrap_seeds
            if not total_selected:
                cursor.execute(
                    """
                    SELECT username FROM bootstrap_seeds
                    WHERE is_exhausted = 0
                    ORDER BY priority DESC, created_at_ms ASC;
                    """
                )
                bootstrap = [row[0] for row in cursor.fetchall() if row[0] not in exclude_set]
                total_selected = bootstrap[:count]

            seen: set[str] = set()
            result: list[str] = []
            for u in total_selected:
                if u not in seen:
                    seen.add(u)
                    result.append(u)
                    if len(result) >= count:
                        break

            return result
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 4. Atomic Seed Leasing & Management Queries
    # --------------------------------------------------------------------------
    def claim_unexhausted_seed(self) -> Optional[str]:
        """
        Atomically lease an unexhausted seed from bootstrap_seeds or candidate_pool.
        Uses BEGIN IMMEDIATE transaction to guarantee zero concurrent collision between workers.
        """
        conn = self._get_connection()
        now = self.now_ms()
        cooldown_ms = now + (3 * 60 * 1000)  # 3 minutes lease
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("BEGIN IMMEDIATE;")

                # 1. Try unexhausted bootstrap_seeds
                cursor.execute(
                    """
                    SELECT seed_id, username FROM bootstrap_seeds
                    WHERE is_exhausted = 0
                    ORDER BY priority DESC, created_at_ms ASC
                    LIMIT 1;
                    """
                )
                row = cursor.fetchone()
                if row:
                    seed_id, seed_username = row
                    cursor.execute(
                        "UPDATE bootstrap_seeds SET is_exhausted = 1 WHERE seed_id = ?;",
                        (seed_id,)
                    )
                    return seed_username

                # 2. Try candidate_pool valid accounts not in active cooldown/lease
                cursor.execute(
                    """
                    SELECT a.candidate_id, a.username_normalized
                    FROM candidate_aliases a
                    JOIN candidate_pool p ON a.candidate_id = p.candidate_id
                    WHERE a.is_current = 1 
                      AND p.lifecycle_status = 'valid'
                      AND a.username_normalized NOT LIKE '#%'
                      AND length(a.username_normalized) >= 2
                      AND (p.cooldown_until_ms IS NULL OR p.cooldown_until_ms < ?)
                    ORDER BY p.crawl_count ASC, p.priority_score DESC
                    LIMIT 1;
                    """,
                    (now,)
                )
                row = cursor.fetchone()
                if row:
                    cand_id, cand_username = row
                    cursor.execute(
                        """
                        UPDATE candidate_pool
                        SET crawl_count = crawl_count + 1,
                            last_crawled_at_ms = ?,
                            cooldown_until_ms = ?
                        WHERE candidate_id = ?;
                        """,
                        (now, cooldown_ms, cand_id)
                    )
                    return cand_username

                # 3. If all seeds are exhausted and candidate pool accounts are in cooldown, recycle bootstrap seeds
                cursor.execute("UPDATE bootstrap_seeds SET is_exhausted = 0;")
                cursor.execute(
                    """
                    SELECT seed_id, username FROM bootstrap_seeds
                    ORDER BY priority DESC, created_at_ms ASC
                    LIMIT 1;
                    """
                )
                row = cursor.fetchone()
                if row:
                    seed_id, seed_username = row
                    cursor.execute(
                        "UPDATE bootstrap_seeds SET is_exhausted = 1 WHERE seed_id = ?;",
                        (seed_id,)
                    )
                    return seed_username

                return None
        finally:
            conn.close()

    def mark_seed_exhausted(self, norm_user: str) -> None:
        """Mark a seed as completed in bootstrap_seeds and touch last_crawled_at_ms in candidate_pool."""
        now = self.now_ms()
        conn = self._get_connection()
        try:
            with conn:
                conn.execute(
                    "UPDATE bootstrap_seeds SET is_exhausted = 1 WHERE username = ?;",
                    (norm_user,)
                )
                conn.execute(
                    """
                    UPDATE candidate_pool
                    SET last_crawled_at_ms = ?
                    WHERE candidate_id = (
                        SELECT candidate_id FROM candidate_aliases
                        WHERE username_normalized = ? AND is_current = 1
                        LIMIT 1
                    );
                    """,
                    (now, norm_user)
                )
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 5. Data Hygiene & Purge Queries
    # --------------------------------------------------------------------------
    def purge_invalid_candidates(self, email_domains: Set[str]) -> int:
        """
        Clean up corrupted or invalid candidate records.
        Cascades deletions in proper foreign-key order.
        """
        conn = self._get_connection()
        purged = 0
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT candidate_id, username_normalized 
                    FROM candidate_aliases 
                    WHERE username_normalized LIKE '#%' 
                       OR username_normalized LIKE '% %'
                       OR length(username_normalized) < 2
                       OR length(username_normalized) > 24;
                    """
                )
                bad_aliases = cursor.fetchall()
                for cid, uname in bad_aliases:
                    cursor.execute(
                        """
                        DELETE FROM discovery_frontier_sources 
                        WHERE frontier_id IN (SELECT frontier_id FROM discovery_frontier WHERE candidate_id = ?);
                        """,
                        (cid,)
                    )
                    cursor.execute("DELETE FROM discovery_frontier WHERE candidate_id = ?;", (cid,))
                    cursor.execute("DELETE FROM candidate_assignments WHERE candidate_id = ?;", (cid,))
                    cursor.execute("DELETE FROM candidate_sources WHERE candidate_id = ?;", (cid,))
                    cursor.execute("DELETE FROM candidate_aliases WHERE candidate_id = ?;", (cid,))
                    cursor.execute("DELETE FROM candidate_pool WHERE candidate_id = ?;", (cid,))

                    cursor.execute(
                        """
                        DELETE FROM discovery_frontier_sources 
                        WHERE frontier_id IN (SELECT frontier_id FROM discovery_frontier WHERE username_normalized = ?);
                        """,
                        (uname,)
                    )
                    cursor.execute("DELETE FROM discovery_frontier WHERE username_normalized = ?;", (uname,))
                    cursor.execute("DELETE FROM bootstrap_seeds WHERE username = ?;", (uname,))
                    purged += 1

                # Clean lingering bad entries in discovery_frontier
                cursor.execute(
                    """
                    DELETE FROM discovery_frontier_sources 
                    WHERE frontier_id IN (
                        SELECT frontier_id FROM discovery_frontier 
                        WHERE username_normalized LIKE '#%' 
                           OR username_normalized LIKE '% %'
                           OR length(username_normalized) < 2
                           OR length(username_normalized) > 24
                    );
                    """
                )
                cursor.execute(
                    """
                    DELETE FROM discovery_frontier 
                    WHERE username_normalized LIKE '#%' 
                       OR username_normalized LIKE '% %'
                       OR length(username_normalized) < 2
                       OR length(username_normalized) > 24;
                    """
                )

                # Clean email domains
                for email_dom in email_domains:
                    cursor.execute(
                        """
                        SELECT candidate_id, username_normalized 
                        FROM candidate_aliases 
                        WHERE username_normalized = ?;
                        """,
                        (email_dom,)
                    )
                    for cid, uname in cursor.fetchall():
                        cursor.execute(
                            "DELETE FROM discovery_frontier_sources WHERE frontier_id IN (SELECT frontier_id FROM discovery_frontier WHERE candidate_id = ?);",
                            (cid,)
                        )
                        cursor.execute("DELETE FROM discovery_frontier WHERE candidate_id = ?;", (cid,))
                        cursor.execute("DELETE FROM candidate_assignments WHERE candidate_id = ?;", (cid,))
                        cursor.execute("DELETE FROM candidate_sources WHERE candidate_id = ?;", (cid,))
                        cursor.execute("DELETE FROM candidate_aliases WHERE candidate_id = ?;", (cid,))
                        cursor.execute("DELETE FROM candidate_pool WHERE candidate_id = ?;", (cid,))
                        purged += 1

                # Clean duplicate discovery_frontier rows
                cursor.execute(
                    """
                    DELETE FROM discovery_frontier_sources
                    WHERE frontier_id IN (
                        SELECT frontier_id FROM discovery_frontier
                        WHERE rowid NOT IN (
                            SELECT MIN(rowid) FROM discovery_frontier GROUP BY username_normalized
                        )
                    );
                    """
                )
                cursor.execute(
                    """
                    DELETE FROM discovery_frontier
                    WHERE rowid NOT IN (
                        SELECT MIN(rowid) FROM discovery_frontier GROUP BY username_normalized
                    );
                    """
                )

                if purged > 0:
                    logger.info(f"[CandidateRepo] Purged {purged} invalid candidate entries from database.")
            return purged
        finally:
            conn.close()
