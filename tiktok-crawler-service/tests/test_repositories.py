"""
Unit tests for CandidateRepository and FrontierRepository (Data Access Layer)
"""

from pathlib import Path
import tempfile
import pytest

from engine.schema import initialize_database
from repositories.base import BaseRepository
from repositories.candidate_repo import CandidateRepository
from repositories.frontier_repo import FrontierRepository


@pytest.fixture
def temp_db():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_repo.db"
        conn = initialize_database(db_path)
        conn.close()
        yield db_path


def test_candidate_repository_upsert_and_read(temp_db):
    repo = CandidateRepository(temp_db)
    res = repo.upsert_candidate_identity(
        norm_user="test_creator_1",
        sec_uid="MS4wLjABAAAA_test_uid",
        allocation_class="fresh_discovery",
        source_type="discovery_frontier",
        source_reference="front_123",
    )
    assert res["candidate_id"] is not None
    assert res["created"] is True
    assert res["identity_state"] == "verified"

    cand = repo.get_candidate(res["candidate_id"])
    assert cand is not None
    assert cand["current_username"] == "test_creator_1"
    assert cand["sec_uid"] == "MS4wLjABAAAA_test_uid"

    aliases = repo.get_aliases(res["candidate_id"])
    assert len(aliases) == 1
    assert aliases[0]["username_normalized"] == "test_creator_1"
    assert aliases[0]["is_current"] is True

    sources = repo.get_sources(res["candidate_id"])
    assert len(sources) == 1
    assert sources[0]["source_type"] == "discovery_frontier"


def test_frontier_repository_enqueue_and_mark(temp_db):
    frontier_repo = FrontierRepository(temp_db)
    fid = frontier_repo.enqueue_candidate(
        norm_user="discovered_user_42",
        source_type="seed_mention",
        source_reference="@seed_author",
    )
    assert fid is not None

    # Duplicate enqueue should return None
    fid_dup = frontier_repo.enqueue_candidate(
        norm_user="discovered_user_42",
        source_type="seed_mention",
        source_reference="@another_seed",
    )
    assert fid_dup is None

    assert frontier_repo.get_pending_count() == 1
    pending = frontier_repo.get_pending_candidates(limit=10)
    assert len(pending) == 1
    assert pending[0][1] == "discovered_user_42"

    # In SQLite schema, candidate_id has a foreign key to candidate_pool.
    # Marking invalid has candidate_id=None:
    frontier_repo.mark_status(frontier_id=fid, status="invalid")
    assert frontier_repo.get_pending_count() == 0


def test_candidate_repository_sample_targets_balanced(temp_db):
    repo = CandidateRepository(temp_db)

    # 1. Add 3 historical candidates (crawl_count > 0)
    for i in range(1, 4):
        res = repo.upsert_candidate_identity(
            norm_user=f"historical_user_{i}",
            sec_uid=f"sec_hist_{i}",
            allocation_class="historical",
        )
        # Mark as crawled
        conn = repo._get_connection()
        conn.execute("UPDATE candidate_pool SET crawl_count = 1 WHERE candidate_id = ?;", (res["candidate_id"],))
        conn.commit()
        conn.close()

    # 2. Add 5 fresh discovery candidates (crawl_count = 0)
    for i in range(1, 6):
        repo.upsert_candidate_identity(
            norm_user=f"fresh_user_{i}",
            sec_uid=f"sec_fresh_{i}",
            allocation_class="fresh_discovery",
        )

    # Sample 4 targets -> should be 2 historical + 2 fresh
    sampled_4 = repo.sample_targets_balanced(count=4)
    assert len(sampled_4) == 4
    hist_in_sample = [u for u in sampled_4 if "historical" in u]
    fresh_in_sample = [u for u in sampled_4 if "fresh" in u]
    assert len(hist_in_sample) == 2
    assert len(fresh_in_sample) == 2

    # Sample 8 targets -> 4 historical requested, but only 3 available!
    # Fallback should borrow 1 more from fresh (3 historical + 5 fresh = 8 total)
    sampled_8 = repo.sample_targets_balanced(count=8, allow_fallback=True)
    assert len(sampled_8) == 8
    assert len([u for u in sampled_8 if "historical" in u]) == 3
    assert len([u for u in sampled_8 if "fresh" in u]) == 5

    # Test exclude filtering
    sampled_exclude = repo.sample_targets_balanced(count=4, exclude=["historical_user_1", "fresh_user_1"])
    assert "historical_user_1" not in sampled_exclude
    assert "fresh_user_1" not in sampled_exclude

