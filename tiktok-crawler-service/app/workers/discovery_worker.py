"""
Discovery Refill Worker (TikTok Crawler v2.2)
Monitors Candidate Pool watermarks (Target: 2000, Low Watermark: 500),
extracts candidates from Discovery Frontier, comments, or seed video mentions,
and coordinates with SharedHostRateLimiter.

Clean Worker implementation: Pure business and orchestration logic.
All database persistence is delegated to CandidateRepository and FrontierRepository.
"""

import asyncio
import logging
from pathlib import Path
import random
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional

try:
    import core.config as config
    from crawler.tiktok_client import TikTokClient
    from engine.candidate_manager import CandidateManager
    from engine.schema import initialize_database
    from engine.shared_rate_limiter import SharedHostRateLimiter
    from repositories.candidate_repo import CandidateRepository
    from repositories.frontier_repo import FrontierRepository
except ImportError:
    from app.core import config
    try:
        from app.crawler.tiktok_client import TikTokClient
    except ImportError:
        TikTokClient = None
    from app.engine.candidate_manager import CandidateManager
    from app.engine.schema import initialize_database
    from app.engine.shared_rate_limiter import SharedHostRateLimiter
    from app.repositories.candidate_repo import CandidateRepository
    from app.repositories.frontier_repo import FrontierRepository

logger = logging.getLogger(__name__)


class DiscoveryWorker:
    def __init__(
        self,
        db_path: Path | str,
        rate_limiter: Optional[SharedHostRateLimiter] = None,
        candidate_manager: Optional[CandidateManager] = None,
        candidate_repo: Optional[CandidateRepository] = None,
        frontier_repo: Optional[FrontierRepository] = None,
        tiktok_client: Optional[Any] = None,
        target_size: Optional[int] = None,
        low_watermark: Optional[int] = None,
        scan_videos_per_seed: Optional[int] = None,
        allow_bootstrap_fallback: Optional[bool] = None,
    ):
        self.db_path = Path(db_path)
        try:
            init_conn = initialize_database(self.db_path)
            init_conn.close()
        except Exception as e:
            logger.debug(f"Database schema initialization in DiscoveryWorker: {e}")

        self.candidate_repo = candidate_repo or CandidateRepository(self.db_path)
        self.frontier_repo = frontier_repo or FrontierRepository(self.db_path)
        self.candidate_manager = candidate_manager or CandidateManager(self.db_path, repo=self.candidate_repo)
        self.rate_limiter = rate_limiter or SharedHostRateLimiter(self.db_path)
        self.tiktok_client = tiktok_client
        if self.tiktok_client is None and TikTokClient is not None:
            try:
                self.tiktok_client = TikTokClient()
            except Exception as e:
                logger.debug(f"TikTokClient init in DiscoveryWorker: {e}")

        self.target_size = (
            target_size if target_size is not None else config.CRAWLER_CANDIDATE_POOL_TARGET_SIZE
        )
        self.low_watermark = (
            low_watermark if low_watermark is not None else config.CRAWLER_CANDIDATE_POOL_LOW_WATERMARK
        )
        self.scan_videos_per_seed = (
            scan_videos_per_seed
            if scan_videos_per_seed is not None
            else config.CRAWLER_DISCOVERY_SCAN_VIDEOS_PER_SEED
        )
        self.allow_bootstrap_fallback = (
            allow_bootstrap_fallback
            if allow_bootstrap_fallback is not None
            else getattr(config, "ALLOW_BOOTSTRAP_FALLBACK", True)
        )
        self.rate_limited = getattr(config, "DISCOVERY_RATE_LIMITED", False)
        self.max_batch_size = getattr(config, "DISCOVERY_MAX_BATCH_SIZE", 50)
        self.frontier_threshold = getattr(config, "DISCOVERY_FRONTIER_THRESHOLD", 100)

    def _get_connection(self) -> sqlite3.Connection:
        """Compatibility helper delegating connection retrieval to repository."""
        return self.candidate_repo._get_connection()

    @staticmethod
    def now_ms() -> int:
        return CandidateRepository.now_ms()

    # --------------------------------------------------------------------------
    # 1. Pool Watermark Inspections
    # --------------------------------------------------------------------------
    @property
    def fresh_target_size(self) -> int:
        return getattr(config, "CRAWLER_FRESH_TARGET_SIZE", 5000)

    def get_valid_candidate_count(self) -> int:
        """Count valid candidates currently in the candidate pool."""
        return self.candidate_repo.get_valid_count()

    def get_fresh_candidate_count(self) -> int:
        """Count valid candidates with crawl_count = 0 and allocation_class = 'fresh_discovery'."""
        return self.candidate_repo.get_fresh_count()

    def get_active_locked_candidate_count(self) -> int:
        """Count active locked assignments in candidate_assignments."""
        return self.candidate_repo.get_active_locked_count()

    def get_historical_candidate_count(self) -> int:
        """Count candidates with crawl_count > 0 or allocation_class = 'historical'."""
        return self.candidate_repo.get_historical_count()

    def is_pool_below_watermark(self) -> bool:
        """Returns True if fresh candidates count is below low watermark (unrelated to historical count)."""
        return self.get_fresh_candidate_count() < self.low_watermark

    # --------------------------------------------------------------------------
    # 2. Frontier Enqueue & Seed Extraction
    # --------------------------------------------------------------------------
    def enqueue_frontier_candidate(
        self,
        username: str,
        source_type: str = "mention",
        source_reference: str = "discovery",
        conn: Optional[sqlite3.Connection] = None,
    ) -> Optional[str]:
        """Add a discovered username to the discovery_frontier if not already present."""
        norm_user = CandidateManager.normalize_username(username)
        if not norm_user or not CandidateManager.is_valid_username(norm_user):
            return None

        return self.frontier_repo.enqueue_candidate(
            norm_user=norm_user,
            source_type=source_type,
            source_reference=source_reference,
            conn=conn,
        )

    def seed_from_dataset(self, dataset_path: Optional[Path | str] = None) -> int:
        """Populate discovery frontier or bootstrap seeds from the dataset CSV."""
        path = Path(dataset_path or Path(__file__).resolve().parent.parent.parent / "datasets" / "dataset.csv")
        if not path.exists():
            logger.warning(f"Dataset path {path} does not exist.")
            return 0

        inserted = 0
        conn = self._get_connection()
        try:
            with open(path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]

            with conn:
                for line in lines:
                    parts = [p.strip() for p in line.split(",") if p.strip()]
                    if not parts or parts[0].lower() == "username":
                        continue
                    user = parts[0]
                    norm = CandidateManager.normalize_username(user)
                    if not norm:
                        continue

                    self.frontier_repo.add_bootstrap_seed(username=norm, conn=conn)

                    fid = self.enqueue_frontier_candidate(
                        username=norm,
                        source_type="bootstrap_seed",
                        source_reference="dataset.csv",
                        conn=conn,
                    )
                    if fid:
                        inserted += 1
            return inserted
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 3. Refill Execution
    # --------------------------------------------------------------------------
    def refill_candidate_pool(
        self,
        target_size: Optional[int] = None,
        max_batch: int = 50,
        rate_limited: bool = True,
    ) -> int:
        """
        Refill the candidate pool up to the target_size.
        1. Checks current valid candidate count.
        2. Pulls unvalidated accounts from discovery_frontier via FrontierRepository.
        3. Falls back to bootstrap dataset if frontier is depleted.
        4. Acquires discovery rate limit permit.
        5. Validates and upserts into candidate_pool via CandidateManager.
        """
        target = target_size if target_size is not None else self.fresh_target_size
        current_fresh = self.get_fresh_candidate_count()

        if current_fresh >= target:
            logger.info(
                f"[Discovery] Fresh pool capacity satisfied: ({current_fresh} >= {target}) "
                f"[Low Watermark: {self.low_watermark}]. No refill needed."
            )
            return 0

        needed = min(target - current_fresh, max_batch)
        logger.info(
            f"[Discovery] Refilling Fresh Candidate Pool: ({current_fresh} < {target}) "
            f"[Low Watermark: {self.low_watermark}]. Batch target: +{needed} candidates."
        )

        refilled_count = 0
        frontier_rows = self.frontier_repo.get_pending_candidates(limit=needed)

        if not frontier_rows and self.allow_bootstrap_fallback and current_fresh < self.low_watermark:
            logger.info(
                f"[Discovery] Fresh pool ({current_fresh}) below low watermark ({self.low_watermark}) "
                "with empty frontier. Re-seeding from dataset..."
            )
            self.seed_from_dataset()
            frontier_rows = self.frontier_repo.get_pending_candidates(limit=needed)

        for frontier_id, username in frontier_rows:
            if current_fresh + refilled_count >= target:
                break

            if rate_limited and self.rate_limiter:
                try:
                    self.rate_limiter.acquire_permit_sync(source_class="discovery", timeout_s=5.0)
                except Exception as e:
                    logger.warning(f"Could not acquire discovery rate limit permit: {e}")
                    break

            upsert_res = self.candidate_manager.upsert_candidate_identity(
                username=username,
                allocation_class="fresh_discovery",
                source_type="discovery_frontier",
                source_reference=frontier_id,
            )

            if upsert_res.get("suppressed") or upsert_res.get("invalid"):
                self.frontier_repo.mark_status(frontier_id=frontier_id, status="invalid")
            else:
                candidate_id = upsert_res.get("candidate_id")
                self.frontier_repo.mark_status(
                    frontier_id=frontier_id,
                    status="validated",
                    candidate_id=candidate_id,
                )
                if upsert_res.get("created"):
                    refilled_count += 1

        new_total = self.get_valid_candidate_count()
        logger.info(
            f"[Discovery] Refill batch finished: +{refilled_count} candidates added. "
            f"Current pool: ({new_total}/{target})."
        )
        return refilled_count

    def purge_invalid_candidates(self) -> int:
        """Clean up existing corrupted or non-username candidate records."""
        return self.candidate_repo.purge_invalid_candidates(CandidateManager.EMAIL_DOMAINS)

    def check_and_refill_on_startup(self) -> int:
        """
        Verify candidate pool capacity on crawler service startup.
        If pool is below target_size, pre-warms pool up to target_size.
        """
        self.purge_invalid_candidates()
        count = self.get_valid_candidate_count()
        if count < self.target_size:
            logger.info(
                f"[Discovery] Candidate Pool status: ({count} < {self.target_size}) "
                f"[Low Watermark: {self.low_watermark}, Target: {self.target_size}]. Pre-warming pool..."
            )
            refilled = self.refill_candidate_pool(target_size=self.target_size, max_batch=500, rate_limited=False)
            new_count = self.get_valid_candidate_count()
            logger.info(
                f"[Discovery] Pre-warm completed: +{refilled} candidates added. "
                f"Current pool: ({new_count}/{self.target_size})."
            )
            return refilled
        else:
            logger.info(
                f"[Discovery] Candidate Pool is sufficient: ({count} >= {self.target_size}) "
                f"[Low Watermark: {self.low_watermark}, Target: {self.target_size}]. No refill needed."
            )
            return 0

    def claim_unexhausted_seed(self) -> Optional[str]:
        """Atomically lease an unexhausted seed from bootstrap_seeds or candidate_pool."""
        return self.candidate_repo.claim_unexhausted_seed()

    get_unexhausted_seed = claim_unexhausted_seed

    def mark_seed_exhausted(self, seed_username: str) -> None:
        """Mark a seed as completed in bootstrap_seeds and touch last_crawled_at_ms in candidate_pool."""
        norm_user = CandidateManager.normalize_username(seed_username)
        self.candidate_repo.mark_seed_exhausted(norm_user)

    async def discover_mentions_from_seed(
        self,
        seed_username: str,
        max_videos: int = 20,
    ) -> List[str]:
        """Crawl a seed account using TikTokClient to extract creator mentions from video descriptions and bios."""
        if not self.tiktok_client:
            logger.debug("No TikTokClient available for seed mention discovery.")
            return []

        norm_seed = CandidateManager.normalize_username(seed_username)
        found_mentions: set[str] = set()

        try:
            outcome = await self.tiktok_client.crawl_account(
                username=norm_seed,
                max_videos=max_videos,
            )

            videos = outcome.videos if outcome and outcome.videos else []

            # Multi-tier fallback: if profile crawl yielded no videos, fallback to Embed SSR
            if not videos:
                try:
                    client = await self.tiktok_client._get_client()
                    try:
                        from crawler.video.video_embed import fetch_embed_videos
                    except ImportError:
                        from app.crawler.video.video_embed import fetch_embed_videos
                    embed_videos = await fetch_embed_videos(
                        client=client,
                        clean_username=norm_seed,
                        max_videos=max_videos,
                    )
                    if embed_videos:
                        videos = embed_videos
                        logger.info(
                            f"[Discovery] Embed fallback extracted {len(videos)} videos for seed @{norm_seed}."
                        )
                except Exception as embed_err:
                    logger.debug(f"[Discovery] Embed fallback skipped for @{norm_seed}: {embed_err}")

            # 1. Extract mentions from video descriptions & sound author
            for v in videos:
                desc = getattr(v, "description", None) or ""
                for match in re.findall(r"@([A-Za-z0-9_.]+)", desc):
                    cleaned = CandidateManager.normalize_username(match)
                    if cleaned and cleaned != norm_seed and CandidateManager.is_valid_username(cleaned):
                        found_mentions.add(cleaned)

                # Sound author
                music_author = getattr(v, "music_author", None)
                if music_author:
                    clean_music = CandidateManager.normalize_username(music_author)
                    if (
                        clean_music
                        and clean_music != norm_seed
                        and CandidateManager.is_valid_username(clean_music)
                    ):
                        found_mentions.add(clean_music)

            # 2. Extract mentions from profile bio (if available from outcome)
            if outcome and outcome.account and getattr(outcome.account, "bio", None):
                bio = outcome.account.bio
                for match in re.findall(r"@([A-Za-z0-9_.]+)", bio):
                    cleaned = CandidateManager.normalize_username(match)
                    if cleaned and cleaned != norm_seed and CandidateManager.is_valid_username(cleaned):
                        found_mentions.add(cleaned)

            # 3. Extract active commenters from top 3 videos
            for v in videos[:3]:
                vid_id = getattr(v, "video_id", None)
                if vid_id:
                    commenters = await self.fetch_video_commenters(vid_id, norm_seed, max_comments=20)
                    for c in commenters:
                        found_mentions.add(c)

            return list(found_mentions)
        except Exception as e:
            logger.warning(f"Error crawling seed @{norm_seed} for discovery: {e}")
            return []

    async def fetch_video_commenters(
        self,
        video_id: str,
        creator_username: str,
        max_comments: int = 20,
    ) -> List[str]:
        """Fetch active commenters from TikTok Video Comment API."""
        if not self.tiktok_client or not video_id:
            return []
        url = f"https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id={video_id}&count={max_comments}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Referer": f"https://www.tiktok.com/@{creator_username}/video/{video_id}",
            "Accept": "application/json, text/plain, */*",
        }
        commenters = []
        try:
            client = await self.tiktok_client._get_client()
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200 and resp.text:
                data = resp.json()
                comments = data.get("comments") or []
                for c in comments:
                    u = c.get("user", {}).get("unique_id")
                    if u and CandidateManager.is_valid_username(u) and u.lower() != creator_username.lower():
                        commenters.append(u.lower())
        except Exception as e:
            logger.debug(f"Could not fetch comments for video {video_id}: {e}")
        return commenters

    async def run_discovery_cycle(self, worker_id: int = 1) -> int:
        """
        Single cycle executed by a Discovery worker:
        1. Checks current pool size against target.
        2. If frontier is low, extracts mentions from unexhausted seed accounts.
        3. Enqueues discovered mentions into discovery_frontier.
        4. Refills candidate pool from discovery_frontier under rate limit.
        """
        current_fresh = self.get_fresh_candidate_count()
        if current_fresh >= self.fresh_target_size:
            return 0

        pending_frontier = self.frontier_repo.get_pending_count()

        if pending_frontier < self.frontier_threshold:
            seed_username = self.claim_unexhausted_seed()
            if seed_username:
                logger.info(
                    f"[Discovery-Worker-{worker_id}] Crawling seed @{seed_username} to discover new creator mentions & commenters..."
                )
                mentions = await self.discover_mentions_from_seed(
                    seed_username,
                    max_videos=self.scan_videos_per_seed,
                )

                if mentions:
                    self.mark_seed_exhausted(seed_username)
                    for m in mentions:
                        self.enqueue_frontier_candidate(
                            username=m,
                            source_type="seed_mention",
                            source_reference=f"@{seed_username}",
                        )
                    logger.info(
                        f"[Discovery-Worker-{worker_id}] Seed @{seed_username} yielded {len(mentions)} candidate mentions & commenters."
                    )
                else:
                    logger.info(
                        f"[Discovery-Worker-{worker_id}] Seed @{seed_username} completed (0 new mentions found)."
                    )

        refilled = self.refill_candidate_pool(
            target_size=self.fresh_target_size,
            max_batch=self.max_batch_size,
            rate_limited=self.rate_limited,
        )
        if refilled > 0:
            now_count = self.get_valid_candidate_count()
            logger.info(
                f"[Discovery-Worker-{worker_id}] Refilled +{refilled} candidates. "
                f"Candidate Pool: ({now_count} < {self.target_size}) [Target: {self.target_size}]."
            )
        return refilled


class DiscoveryWorkerPool:
    """
    Manages dedicated background Discovery Workers (default 2 workers per v2.2 specification).
    Continuously monitors candidate pool watermarks and discovers new creators via live HTTP scraping.
    """

    def __init__(
        self,
        db_path: Path | str,
        worker_count: Optional[int] = None,
        interval_seconds: Optional[float] = None,
        discovery_worker: Optional[DiscoveryWorker] = None,
    ):
        self.db_path = Path(db_path)
        self.worker_count = (
            worker_count if worker_count is not None else getattr(config, "DISCOVERY_WORKER_COUNT", 2)
        )
        self.interval_seconds = (
            interval_seconds if interval_seconds is not None else getattr(config, "DISCOVERY_INTERVAL_SECONDS", 10.0)
        )
        self.worker = discovery_worker or DiscoveryWorker(self.db_path)
        self._running = False
        self._refilling_fresh = False
        self._tasks: List[asyncio.Task] = []

    async def start(self) -> None:
        """Start all dedicated background discovery worker coroutines."""
        if self._running:
            return

        self._running = True
        logger.info(
            f"[Discovery Pool] Starting {self.worker_count} dedicated Discovery Workers "
            f"(Target: {self.worker.target_size}, Low Watermark: {self.worker.low_watermark})..."
        )

        for worker_id in range(1, self.worker_count + 1):
            task = asyncio.create_task(
                self._worker_loop(worker_id),
                name=f"discovery-worker-{worker_id}",
            )
            self._tasks.append(task)

    async def stop(self) -> None:
        """Gracefully stop and cancel all background discovery workers."""
        if not self._running:
            return

        self._running = False
        logger.info("[Discovery Pool] Stopping background Discovery Workers...")

        for task in self._tasks:
            task.cancel()

        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks.clear()

        if self.worker.tiktok_client and hasattr(self.worker.tiktok_client, "close"):
            try:
                await self.worker.tiktok_client.close()
            except Exception:
                pass

        logger.info("[Discovery Pool] All background Discovery Workers stopped.")

    async def _worker_loop(self, worker_id: int) -> None:
        """Continuous background execution loop for a single Discovery Worker."""
        logger.info(f"[Discovery-Worker-{worker_id}] Worker loop active.")

        await asyncio.sleep(worker_id * 1.5)

        while self._running:
            try:
                fresh_count = self.worker.get_fresh_candidate_count()

                # Trigger hysteresis: when fresh drops below low watermark (< 1,000)
                if fresh_count < self.worker.low_watermark:
                    if not self._refilling_fresh:
                        logger.info(
                            f"[Discovery-Worker-{worker_id}] Fresh candidates below watermark "
                            f"({fresh_count} < {self.worker.low_watermark}). Waking up to refill fresh pool to target {self.worker.fresh_target_size}..."
                        )
                        self._refilling_fresh = True

                if self._refilling_fresh:
                    # Refill until full: fresh_target_size (5,000 new accounts)
                    if fresh_count >= self.worker.fresh_target_size:
                        self._refilling_fresh = False
                        logger.info(
                            f"[Discovery-Worker-{worker_id}] Fresh pool fully refilled "
                            f"(Fresh: {fresh_count}/{self.worker.fresh_target_size}). Entering standby."
                        )
                        await asyncio.sleep(self.interval_seconds)
                    else:
                        await self.worker.run_discovery_cycle(worker_id)
                        await asyncio.sleep(2.0 + random.uniform(0.5, 1.5))
                else:
                    # Standby mode: fresh count is healthy (>= 1,000), sleeping
                    await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"[Discovery-Worker-{worker_id}] Error in discovery loop: {e}")
                await asyncio.sleep(5.0)

        logger.info(f"[Discovery-Worker-{worker_id}] Worker loop terminated.")
