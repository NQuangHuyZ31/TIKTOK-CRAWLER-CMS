from datetime import datetime, timezone
import logging
import httpx

from core.utils import normalize_username
from crawler.video.video_api import fetch_creator_videos_paginated
from crawler.video.video_embed import extract_videos_from_body, fetch_embed_videos
from crawler.video.video_enricher import enrich_videos_stats
from crawler.video.video_parser import parse_video_item
from schemas.models import TikTokVideo

logger = logging.getLogger(__name__)

__all__ = [
    "fetch_account_videos",
    "fetch_creator_videos_paginated",
    "fetch_embed_videos",
    "extract_videos_from_body",
    "enrich_videos_stats",
    "parse_video_item",
    "filter_videos_by_date",
]


def filter_videos_by_date(
    videos: list[TikTokVideo],
    date_from: datetime | str | None,
    date_to: datetime | str | None,
) -> list[TikTokVideo]:
    """Filter list of TikTokVideo by publication date range [date_from, date_to] in UTC."""
    if not date_from and not date_to:
        return videos

    def _to_utc(d: datetime | str | None) -> datetime | None:
        if not d:
            return None
        if isinstance(d, str):
            try:
                d = datetime.fromisoformat(d)
            except Exception:
                return None
        if isinstance(d, datetime):
            if d.tzinfo:
                return d.astimezone(timezone.utc).replace(tzinfo=None)
            return d
        return None

    dt_from = _to_utc(date_from)
    dt_to = _to_utc(date_to)

    filtered: list[TikTokVideo] = []
    for vid in videos:
        if not vid.published_at:
            continue
        if dt_to and vid.published_at > dt_to:
            continue
        if dt_from and vid.published_at < dt_from:
            continue
        filtered.append(vid)
    return filtered


async def fetch_account_videos(
    client: httpx.AsyncClient,
    username: str,
    profile_body: str | None = None,
    sec_uid: str | None = None,
    max_videos: int = 20,
    headers: dict[str, str] | None = None,
    timeout: float = 15.0,
    enrich_stats: bool = True,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> list[TikTokVideo]:
    """
    Multi-layer resilient video extractor for a TikTok account:
    1. Tier 1 (Primary API): If `sec_uid` is available, paginates via Creator Item List API
       (https://www.tiktok.com/api/creator/item_list/). Delivers exact count (20, 50, 100...)
       with 100% complete statistics out of the box and date range filtering with early stop.
    2. Tier 2 (Zero-request): Extracts directly from already-fetched profile HTML/JSON if present.
    3. Tier 3 (Embed Fallback): Fetches lightweight Creator Embed page (/embed/@username)
       and enriches interaction statistics for any missing fields.
    Fault-isolated: never raises an exception that would fail the parent account crawl.
    """
    if max_videos <= 0:
        return []

    clean_username = normalize_username(username)
    if not clean_username:
        return []

    has_date_filter = bool(date_from or date_to)

    # Tier 1: Primary Cursor-Paginated Creator API (supports 20, 50, 100+ videos with full stats)
    if sec_uid:
        try:
            api_videos = await fetch_creator_videos_paginated(
                client=client,
                username=clean_username,
                sec_uid=sec_uid,
                max_videos=max_videos,
                headers=headers,
                timeout=min(timeout, 15.0),
                date_from=date_from,
                date_to=date_to,
            )
            if has_date_filter or api_videos:
                return api_videos[:max_videos]
        except Exception as exc:
            logger.debug("Tier 1 API pagination skipped for @%s: %s", clean_username, exc)

    # Tier 2: Extract directly from already-fetched HTML/JSON if present
    videos: list[TikTokVideo] = []
    if profile_body:
        videos = extract_videos_from_body(
            body=profile_body,
            target_username=clean_username,
            max_videos=max_videos,
        )
        if videos and (date_from or date_to):
            videos = filter_videos_by_date(videos, date_from, date_to)

    # Tier 3: Fallback to Creator Embed SSR page (/embed/@username)
    if not videos:
        try:
            videos = await fetch_embed_videos(
                client=client,
                clean_username=clean_username,
                max_videos=max_videos,
                headers=headers,
                timeout=timeout,
            )
            if videos and (date_from or date_to):
                videos = filter_videos_by_date(videos, date_from, date_to)
        except Exception as exc:
            logger.debug("Tier 3 Embed fetch skipped for @%s: %s", clean_username, exc)

    # Tier 3.1: Enrich detailed statistics if extracted from Embed (which lacks likes/comments)
    if videos and enrich_stats:
        try:
            await enrich_videos_stats(
                client=client,
                videos=videos[:max_videos],
                concurrency=5,
                timeout=min(timeout, 8.0),
                headers=headers,
            )
        except Exception as exc:
            logger.debug("Video stats enrichment skipped for @%s: %s", clean_username, exc)

    return videos[:max_videos]
