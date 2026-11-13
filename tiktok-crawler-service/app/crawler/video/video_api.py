import asyncio
from datetime import datetime, timezone
import logging
import random
import string
import time
import httpx

from crawler.video.video_parser import parse_video_item
from schemas.models import TikTokVideo

logger = logging.getLogger(__name__)

API_CREATOR_ITEM_LIST_URL = "https://www.tiktok.com/api/creator/item_list/"
PAGE_BATCH_SIZE = 15


def _to_utc_naive_datetime(d: datetime | str | None) -> datetime | None:
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


async def fetch_creator_videos_paginated(
    client: httpx.AsyncClient,
    username: str,
    sec_uid: str,
    max_videos: int = 20,
    headers: dict[str, str] | None = None,
    timeout: float = 12.0,
    date_from: datetime | str | None = None,
    date_to: datetime | str | None = None,
) -> list[TikTokVideo]:
    """
    Fetch up to `max_videos` from TikTok Creator Item List API using cursor-based pagination.
    Requires creator's `sec_uid`. Each batch delivers up to 15 videos with complete statistics.
    Optionally filters by publication date [date_from, date_to] and exits early when videos
    are older than date_from.
    """
    if max_videos <= 0 or not sec_uid:
        return []

    videos: dict[str, TikTokVideo] = {}
    device_id = str(random.randint(7250000000000000000, 7325099899999994577))
    cursor = int(time.time() * 1000)
    dt_from = _to_utc_naive_datetime(date_from)
    dt_to = _to_utc_naive_datetime(date_to)

    req_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": f"https://www.tiktok.com/@{username}",
    }
    if headers:
        for k, v in headers.items():
            if k.lower() == "user-agent":
                if "iphone" not in v.lower() and "mobile" not in v.lower() and "android" not in v.lower():
                    req_headers[k] = v
            else:
                req_headers[k] = v

    while len(videos) < max_videos:
        batch_count = min(PAGE_BATCH_SIZE, max_videos - len(videos))
        if batch_count <= 0:
            break

        verify_fp = f'verify_{"".join(random.choices(string.hexdigits, k=7))}'
        params = {
            "aid": "1988",
            "app_language": "en",
            "app_name": "tiktok_web",
            "browser_language": "en-US",
            "browser_name": "Mozilla",
            "browser_online": "true",
            "browser_platform": "Win32",
            "browser_version": "5.0 (Windows)",
            "channel": "tiktok_web",
            "cookie_enabled": "true",
            "count": str(PAGE_BATCH_SIZE),
            "cursor": str(cursor),
            "device_id": device_id,
            "device_platform": "web_pc",
            "focus_state": "true",
            "from_page": "user",
            "history_len": "2",
            "is_fullscreen": "false",
            "is_page_visible": "true",
            "language": "en",
            "os": "windows",
            "priority_region": "",
            "referer": "",
            "region": "US",
            "screen_height": "1080",
            "screen_width": "1920",
            "secUid": sec_uid,
            "type": "1",  # 1 = newest-to-oldest
            "tz_name": "UTC",
            "verifyFp": verify_fp,
            "webcast_language": "en",
        }

        try:
            response = await client.get(
                API_CREATOR_ITEM_LIST_URL,
                params=params,
                headers=req_headers,
                timeout=timeout,
            )
            if response.status_code != 200:
                logger.debug(
                    "Creator item_list HTTP %d for @%s (secUid=%s)",
                    response.status_code,
                    username,
                    sec_uid[:15],
                )
                break

            data = response.json()
            if data.get("status_code") != 0:
                logger.debug(
                    "Creator item_list returned status_code=%s (%s) for @%s",
                    data.get("status_code"),
                    data.get("status_msg"),
                    username,
                )
                break

            raw_items = data.get("itemList") or []
            if not raw_items:
                break

            new_in_batch = 0
            last_create_time = None
            early_stop = False
            for item in raw_items:
                vid = parse_video_item(item, fallback_username=username)
                if not vid:
                    continue

                is_in_range = True
                if dt_from or dt_to:
                    if not vid.published_at:
                        is_in_range = False
                    else:
                        if dt_to and vid.published_at > dt_to:
                            is_in_range = False
                        if dt_from and vid.published_at < dt_from:
                            is_in_range = False
                            if not vid.is_pinned:
                                early_stop = True

                if is_in_range and vid.video_id not in videos:
                    videos[vid.video_id] = vid
                    new_in_batch += 1

                if item.get("createTime"):
                    last_create_time = item["createTime"]
                if len(videos) >= max_videos or early_stop:
                    break

            if early_stop:
                logger.debug(
                    "Creator item_list early break for @%s: encountered video published before date_from (%s)",
                    username,
                    dt_from,
                )
                break

            if new_in_batch == 0 or not last_create_time:
                break

            cursor = int(last_create_time) * 1000
            if data.get("hasMorePrevious") is False:
                break

            # Politeness delay between pagination calls
            await asyncio.sleep(0.1)
        except Exception as exc:
            logger.debug("Creator item_list pagination stopped for @%s: %s", username, exc)
            break

    return list(videos.values())[:max_videos]
