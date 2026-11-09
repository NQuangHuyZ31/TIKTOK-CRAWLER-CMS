import asyncio
import logging
import httpx

from crawler.video.video_embed import extract_videos_from_body
from schemas.models import TikTokVideo

logger = logging.getLogger(__name__)


async def _enrich_single_video_stats(
    client: httpx.AsyncClient,
    video: TikTokVideo,
    timeout: float = 8.0,
    headers: dict[str, str] | None = None,
) -> None:
    """Enrich video statistics (digg_count, comment_count, share_count, collect_count) from desktop video detail page."""
    video_url = video.video_url or f"https://www.tiktok.com/@{video.username}/video/{video.video_id}"
    req_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": f"https://www.tiktok.com/@{video.username}",
    }
    if headers:
        for k, v in headers.items():
            if k.lower() != "user-agent" or ("iphone" not in v.lower() and "mobile" not in v.lower()):
                req_headers[k] = v

    try:
        resp = await client.get(video_url, headers=req_headers, timeout=timeout)
        if resp.status_code == 200 and resp.text:
            extracted = extract_videos_from_body(
                body=resp.text,
                target_username=video.username,
                max_videos=1,
            )
            if extracted:
                detail = extracted[0]
                if (
                    detail.digg_count > 0
                    or detail.comment_count > 0
                    or detail.share_count > 0
                    or detail.collect_count > 0
                ):
                    video.digg_count = detail.digg_count
                    video.comment_count = detail.comment_count
                    video.share_count = detail.share_count
                    video.collect_count = detail.collect_count
                if detail.play_count > 0:
                    video.play_count = detail.play_count
                if detail.duration > 0 and video.duration == 0:
                    video.duration = detail.duration
                if detail.width > 0 and video.width == 0:
                    video.width = detail.width
                    video.height = detail.height
                if detail.definition and not video.definition:
                    video.definition = detail.definition
                if detail.music_title and not video.music_title:
                    video.music_id = detail.music_id
                    video.music_title = detail.music_title
                    video.music_author = detail.music_author
                    video.is_original_sound = detail.is_original_sound
                if detail.published_at and not video.published_at:
                    video.published_at = detail.published_at
    except Exception as exc:
        logger.debug("Failed to enrich stats for video %s: %s", video.video_id, exc)


async def enrich_videos_stats(
    client: httpx.AsyncClient,
    videos: list[TikTokVideo],
    concurrency: int = 5,
    timeout: float = 8.0,
    headers: dict[str, str] | None = None,
) -> None:
    """Enrich a list of TikTokVideo items concurrently with full interaction stats."""
    if not videos:
        return
    targets = [
        v for v in videos
        if v.digg_count == 0 and v.comment_count == 0 and v.share_count == 0 and v.collect_count == 0
    ]
    if not targets:
        return

    sem = asyncio.Semaphore(concurrency)

    async def _worker(v: TikTokVideo):
        async with sem:
            await _enrich_single_video_stats(client, v, timeout=timeout, headers=headers)

    await asyncio.gather(*[_worker(v) for v in targets], return_exceptions=True)
