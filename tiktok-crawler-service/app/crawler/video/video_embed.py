import json
import logging
from bs4 import BeautifulSoup
import httpx

from core.utils import normalize_username
from crawler.video.video_parser import parse_video_item
from schemas.models import TikTokVideo

logger = logging.getLogger(__name__)


def _collect_videos_from_dict(
    data: dict,
    target_username: str | None,
    results: dict[str, TikTokVideo],
    max_videos: int,
) -> None:
    if len(results) >= max_videos:
        return

    # 1. Check __DEFAULT_SCOPE__ (Rehydration JSON)
    default_scope = data.get("__DEFAULT_SCOPE__")
    if isinstance(default_scope, dict):
        video_detail = default_scope.get("webapp.video-detail")
        if isinstance(video_detail, dict):
            item_info = video_detail.get("itemInfo")
            if isinstance(item_info, dict) and isinstance(item_info.get("itemStruct"), dict):
                vid = parse_video_item(item_info["itemStruct"], fallback_username=target_username)
                if vid and vid.video_id not in results:
                    results[vid.video_id] = vid

        user_detail = default_scope.get("webapp.user-detail")
        if isinstance(user_detail, dict):
            item_list = user_detail.get("itemList") or user_detail.get("videos")
            if isinstance(item_list, list):
                for raw_item in item_list:
                    if len(results) >= max_videos:
                        break
                    vid = parse_video_item(raw_item, fallback_username=target_username)
                    if vid and vid.video_id not in results:
                        results[vid.video_id] = vid

    # 2. Check SIGI_STATE ItemModule
    item_module = data.get("ItemModule")
    if isinstance(item_module, dict):
        for raw_item in item_module.values():
            if len(results) >= max_videos:
                break
            vid = parse_video_item(raw_item, fallback_username=target_username)
            if vid and vid.video_id not in results:
                results[vid.video_id] = vid

    # 3. Check direct itemList / videoList / videos arrays
    for list_key in ("itemList", "videoList", "videos", "items"):
        raw_list = data.get(list_key)
        if isinstance(raw_list, list):
            for raw_item in raw_list:
                if len(results) >= max_videos:
                    break
                vid = parse_video_item(raw_item, fallback_username=target_username)
                if vid and vid.video_id not in results:
                    results[vid.video_id] = vid

    # 4. Check __FRONTITY_CONNECT_STATE__ (TikTok /embed/@username SSR payload)
    source = data.get("source")
    if isinstance(source, dict) and isinstance(source.get("data"), dict):
        for route_val in source["data"].values():
            if not isinstance(route_val, dict):
                continue
            video_list = route_val.get("videoList") or route_val.get("itemList")
            if isinstance(video_list, list):
                for raw_item in video_list:
                    if len(results) >= max_videos:
                        break
                    vid = parse_video_item(raw_item, fallback_username=target_username)
                    if vid and vid.video_id not in results:
                        results[vid.video_id] = vid


def extract_videos_from_body(
    body: str,
    target_username: str | None = None,
    max_videos: int = 20,
) -> list[TikTokVideo]:
    """Extract up to `max_videos` TikTokVideo items from JSON or SSR HTML body."""
    if not body or max_videos <= 0:
        return []

    clean_user = normalize_username(target_username)
    stripped = body.strip()
    results: dict[str, TikTokVideo] = {}

    if stripped.startswith("{"):
        try:
            payload = json.loads(stripped)
            if isinstance(payload, dict):
                _collect_videos_from_dict(payload, clean_user, results, max_videos)
        except json.JSONDecodeError:
            pass
        return list(results.values())[:max_videos]

    soup = BeautifulSoup(stripped, "html.parser")
    for script_id in (
        "__UNIVERSAL_DATA_FOR_REHYDRATION__",
        "SIGI_STATE",
        "__FRONTITY_CONNECT_STATE__",
        "__NEXT_DATA__",
    ):
        tag = soup.find("script", id=script_id)
        raw_json = (tag.string or tag.get_text()) if tag else None
        if not raw_json:
            continue
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict):
                _collect_videos_from_dict(parsed, clean_user, results, max_videos)
        except json.JSONDecodeError:
            continue
        if len(results) >= max_videos:
            break

    return list(results.values())[:max_videos]


async def fetch_embed_videos(
    client: httpx.AsyncClient,
    clean_username: str,
    max_videos: int = 20,
    headers: dict[str, str] | None = None,
    timeout: float = 15.0,
) -> list[TikTokVideo]:
    """Fetch creator videos from TikTok public Creator Embed SSR page (/embed/@username)."""
    embed_url = f"https://www.tiktok.com/embed/@{clean_username}"
    embed_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.tiktok.com/",
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
    }
    if headers:
        for k, v in headers.items():
            if k.lower() == "user-agent":
                if "iphone" not in v.lower() and "mobile" not in v.lower() and "android" not in v.lower():
                    embed_headers[k] = v
            else:
                embed_headers[k] = v

    try:
        response = await client.get(
            embed_url,
            headers=embed_headers,
            timeout=timeout,
        )
        if response.status_code == 200 and response.text:
            return extract_videos_from_body(
                body=response.text,
                target_username=clean_username,
                max_videos=max_videos,
            )
        logger.debug("Embed video fetch returned HTTP %d for @%s", response.status_code, clean_username)
    except Exception as exc:
        logger.debug("Embed video fetch skipped/failed for @%s: %s", clean_username, exc)

    return []
