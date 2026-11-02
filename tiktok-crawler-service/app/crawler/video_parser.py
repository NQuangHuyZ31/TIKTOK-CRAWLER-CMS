from datetime import datetime, timezone
import logging
import re

from core.utils import normalize_username, parse_stat_value
from schemas.models import TikTokVideo

logger = logging.getLogger(__name__)


def _fix_int32_overflow(value: int | None) -> int:
    if value is None:
        return 0
    if value < 0:
        return value + (1 << 32)
    return max(0, value)


def _extract_hashtags(item: dict, description: str | None) -> list[str]:
    tags: list[str] = []
    seen: set[str] = set()

    challenges = item.get("challenges")
    if isinstance(challenges, list):
        for ch in challenges:
            if isinstance(ch, dict):
                title = str(ch.get("title") or "").strip().lstrip("#")
                if title and title.lower() not in seen:
                    seen.add(title.lower())
                    tags.append(title)

    text_extra = item.get("textExtra")
    if isinstance(text_extra, list):
        for te in text_extra:
            if isinstance(te, dict):
                h_name = str(te.get("hashtagName") or "").strip().lstrip("#")
                if h_name and h_name.lower() not in seen:
                    seen.add(h_name.lower())
                    tags.append(h_name)

    if description:
        for match in re.findall(r"#([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)", description):
            clean = match.strip()
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                tags.append(clean)

    return tags


def parse_video_item(
    item: dict,
    fallback_username: str | None = None,
) -> TikTokVideo | None:
    """Parse a single TikTok video dictionary (itemStruct, creator API item, embed item) into TikTokVideo."""
    if not isinstance(item, dict):
        return None

    raw_id = item.get("id") or item.get("video_id") or item.get("itemId")
    video_id = str(raw_id or "").strip()
    if not video_id or not video_id.isdigit():
        return None

    author = item.get("author")
    author_username = None
    if isinstance(author, dict):
        author_username = normalize_username(
            author.get("uniqueId") or author.get("unique_id") or author.get("username")
        )
    elif isinstance(author, str):
        author_username = normalize_username(author)
    elif item.get("authorUniqueId"):
        author_username = normalize_username(item.get("authorUniqueId"))
    elif item.get("author_unique_id"):
        author_username = normalize_username(item.get("author_unique_id"))

    username = author_username or normalize_username(fallback_username) or "unknown"

    description = (
        item.get("desc")
        if item.get("desc") is not None
        else (item.get("description") or item.get("title"))
    )
    if description is not None:
        description = str(description).strip()

    hashtags = _extract_hashtags(item, description)

    video_meta = item.get("video") if isinstance(item.get("video"), dict) else {}
    duration = parse_stat_value(video_meta.get("duration") or item.get("duration")) or 0
    width = parse_stat_value(video_meta.get("width") or item.get("width")) or 0
    height = parse_stat_value(video_meta.get("height") or item.get("height")) or 0
    definition = (
        video_meta.get("definition")
        or video_meta.get("ratio")
        or item.get("definition")
        or item.get("ratio")
    )
    cover_url = (
        video_meta.get("cover")
        or video_meta.get("originCover")
        or video_meta.get("defaultCover")
        or item.get("coverUrl")
        or item.get("originCoverUrl")
        or item.get("cover_url")
        or item.get("thumbnail")
    )
    dynamic_cover_url = (
        video_meta.get("dynamicCover")
        or item.get("dynamicCoverUrl")
        or item.get("dynamic_cover_url")
    )

    music_meta = item.get("music") if isinstance(item.get("music"), dict) else {}
    music_id = str(music_meta.get("id")).strip() if music_meta.get("id") else None
    music_title = music_meta.get("title") or item.get("music_title") or item.get("track")
    music_author = music_meta.get("authorName") or item.get("music_author") or item.get("artist")
    is_original_sound = bool(music_meta.get("original") or item.get("is_original_sound"))

    stats = item.get("statsV2") if isinstance(item.get("statsV2"), dict) else {}
    if not stats:
        stats = item.get("stats") if isinstance(item.get("stats"), dict) else {}

    play_raw = (
        stats.get("playCount")
        if "playCount" in stats
        else (stats.get("plays") or item.get("playCount") or item.get("play_count") or item.get("view_count"))
    )
    digg_raw = (
        stats.get("diggCount")
        if "diggCount" in stats
        else (stats.get("likes") or item.get("diggCount") or item.get("digg_count") or item.get("like_count"))
    )
    comment_raw = (
        stats.get("commentCount")
        if "commentCount" in stats
        else (stats.get("comments") or item.get("commentCount") or item.get("comment_count"))
    )
    share_raw = (
        stats.get("shareCount")
        if "shareCount" in stats
        else (stats.get("shares") or item.get("shareCount") or item.get("share_count") or item.get("repost_count"))
    )
    collect_raw = (
        stats.get("collectCount")
        if "collectCount" in stats
        else (stats.get("collects") or item.get("collectCount") or item.get("collect_count") or item.get("save_count"))
    )

    play_count = _fix_int32_overflow(parse_stat_value(play_raw))
    digg_count = _fix_int32_overflow(parse_stat_value(digg_raw))
    comment_count = _fix_int32_overflow(parse_stat_value(comment_raw))
    share_count = _fix_int32_overflow(parse_stat_value(share_raw))
    collect_count = _fix_int32_overflow(parse_stat_value(collect_raw))

    published_at: datetime | None = None
    raw_create_time = item.get("createTime") or item.get("create_time") or item.get("timestamp")
    if raw_create_time is not None:
        ts = parse_stat_value(raw_create_time)
        if ts and ts > 1_000_000_000:
            if ts > 10_000_000_000:
                ts = ts // 1000
            try:
                published_at = datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)
            except (OSError, ValueError):
                published_at = None

    # Fallback to TikTok 64-bit Snowflake ID (top 32 bits = timestamp in seconds)
    if not published_at and video_id.isdigit():
        try:
            vid_int = int(video_id)
            ts = vid_int >> 32
            if 1_450_000_000 < ts < 2_200_000_000:
                published_at = datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)
        except (OSError, ValueError, OverflowError):
            pass

    now = datetime.now()
    video_url = item.get("video_url") or f"https://www.tiktok.com/@{username}/video/{video_id}"

    return TikTokVideo(
        video_id=video_id,
        username=username,
        video_url=video_url,
        description=description,
        hashtags=hashtags,
        duration=max(0, duration),
        width=max(0, width),
        height=max(0, height),
        definition=str(definition) if definition else None,
        cover_url=str(cover_url) if cover_url else None,
        dynamic_cover_url=str(dynamic_cover_url) if dynamic_cover_url else None,
        music_id=music_id,
        music_title=str(music_title) if music_title else None,
        music_author=str(music_author) if music_author else None,
        is_original_sound=is_original_sound,
        is_pinned=bool(item.get("isPinnedItem") or item.get("is_pinned")),
        is_ad=bool(item.get("isAd") or item.get("is_ad")),
        play_count=play_count,
        digg_count=digg_count,
        comment_count=comment_count,
        share_count=share_count,
        collect_count=collect_count,
        status="active",
        published_at=published_at,
        crawled_at=now,
    )
