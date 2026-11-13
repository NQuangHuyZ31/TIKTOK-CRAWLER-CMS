import asyncio
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from unittest.mock import AsyncMock, MagicMock

from tests._async_compat import patch_windows_self_pipe_if_needed
patch_windows_self_pipe_if_needed()

import pytest
from core.utils import resolve_date_bounds
from crawler.video.video_extractor import filter_videos_by_date
from crawler.video.video_api import fetch_creator_videos_paginated
from schemas.models import TikTokVideo


def test_resolve_date_bounds_today():
    """Verify target_date='today' accurately resolves to UTC bounds for Asia/Ho_Chi_Minh."""
    df_utc, dt_utc = resolve_date_bounds(target_date="today", tz_name="Asia/Ho_Chi_Minh")
    assert df_utc is not None
    assert dt_utc is not None

    dt_start = datetime.fromisoformat(df_utc)
    dt_end = datetime.fromisoformat(dt_utc)

    try:
        tz = ZoneInfo("Asia/Ho_Chi_Minh")
    except Exception:
        tz = timezone(timedelta(hours=7))

    now_local = datetime.now(tz)
    assert dt_start.year == now_local.year
    diff = dt_end - dt_start
    assert diff.total_seconds() > 86390 and diff.total_seconds() <= 86400


def test_resolve_date_bounds_specific_date():
    """Verify target_date='2026-11-09' converts correctly from UTC+7 to UTC."""
    df_utc, dt_utc = resolve_date_bounds(target_date="2026-11-09", tz_name="Asia/Ho_Chi_Minh")
    assert df_utc == "2026-11-08T17:00:00"
    assert dt_utc == "2026-11-09T16:59:59.999999"


def test_resolve_date_bounds_custom_range():
    """Verify date_from and date_to convert correctly."""
    df_utc, dt_utc = resolve_date_bounds(
        date_from="2026-11-01",
        date_to="2026-11-05",
        tz_name="Asia/Ho_Chi_Minh",
    )
    assert df_utc == "2026-10-31T17:00:00"
    assert dt_utc == "2026-11-05T16:59:59.999999"


def test_filter_videos_by_date():
    """Verify filter_videos_by_date filters out videos outside bounds."""
    v1 = TikTokVideo(video_id="101", published_at=datetime(2026, 11, 9, 10, 0))
    v2 = TikTokVideo(video_id="102", published_at=datetime(2026, 11, 8, 12, 0))
    v3 = TikTokVideo(video_id="103", published_at=datetime(2026, 11, 9, 15, 30))
    v4 = TikTokVideo(video_id="104", published_at=datetime(2026, 11, 10, 1, 0))
    v5 = TikTokVideo(video_id="105", published_at=None)

    dt_from = datetime(2026, 11, 9, 0, 0)
    dt_to = datetime(2026, 11, 9, 23, 59, 59)

    filtered = filter_videos_by_date([v1, v2, v3, v4, v5], dt_from, dt_to)
    assert [v.video_id for v in filtered] == ["101", "103"]


def test_fetch_creator_videos_paginated_early_break():
    """Verify early exit triggers when encountering a video older than date_from."""
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200

    mock_response.json.return_value = {
        "status_code": 0,
        "itemList": [
            {
                "id": "7001",
                "desc": "Today video",
                "createTime": int(datetime(2026, 11, 9, 10, 0, tzinfo=timezone.utc).timestamp()),
                "stats": {"playCount": 100},
            },
            {
                "id": "7002",
                "desc": "Yesterday video",
                "createTime": int(datetime(2026, 11, 8, 10, 0, tzinfo=timezone.utc).timestamp()),
                "stats": {"playCount": 200},
            },
        ],
        "hasMorePrevious": True,
    }
    mock_client.get = AsyncMock(return_value=mock_response)

    dt_from = datetime(2026, 11, 9, 0, 0)
    dt_to = datetime(2026, 11, 9, 23, 59, 59)

    videos = asyncio.run(fetch_creator_videos_paginated(
        client=mock_client,
        username="testuser",
        sec_uid="MS4wLjABAAAA...",
        max_videos=20,
        date_from=dt_from,
        date_to=dt_to,
    ))

    assert len(videos) == 1
    assert videos[0].video_id == "7001"
    assert mock_client.get.call_count == 1


def test_date_filtering_rejects_missing_published_at_when_date_filter_active():
    """Verify videos with missing published_at are rejected when date filter is active."""
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200

    mock_response.json.return_value = {
        "status_code": 0,
        "itemList": [
            {
                "id": "7001",
                "desc": "No createTime and non-numeric id",
                "stats": {"playCount": 100},
            },
            {
                "id": "7002",
                "desc": "Valid today video",
                "createTime": int(datetime(2026, 11, 9, 10, 0, tzinfo=timezone.utc).timestamp()),
                "stats": {"playCount": 200},
            },
        ],
        "hasMorePrevious": False,
    }
    mock_client.get = AsyncMock(return_value=mock_response)

    dt_from = datetime(2026, 11, 9, 0, 0)
    dt_to = datetime(2026, 11, 9, 23, 59, 59)

    videos = asyncio.run(fetch_creator_videos_paginated(
        client=mock_client,
        username="testuser",
        sec_uid="MS4wLjABAAAA...",
        max_videos=20,
        date_from=dt_from,
        date_to=dt_to,
    ))

    assert len(videos) == 1
    assert videos[0].video_id == "7002"


def test_fetch_account_videos_returns_empty_when_no_videos_in_date_range():
    """Verify fetch_account_videos returns empty list and does not fallback to old videos when Tier 1 succeeds."""
    from crawler.video.video_extractor import fetch_account_videos

    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200

    # Video is from 2 months ago (Sep 2026) while filter is for Nov 9 2026
    mock_response.json.return_value = {
        "status_code": 0,
        "itemList": [
            {
                "id": "6001",
                "desc": "Video from 2 months ago",
                "createTime": int(datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc).timestamp()),
                "stats": {"playCount": 5000},
            },
        ],
        "hasMorePrevious": False,
    }
    mock_client.get = AsyncMock(return_value=mock_response)

    dt_from = datetime(2026, 11, 9, 0, 0)
    dt_to = datetime(2026, 11, 9, 23, 59, 59)

    videos = asyncio.run(fetch_account_videos(
        client=mock_client,
        username="testuser",
        profile_body="<html><script id=\"SIGI_STATE\">{\"ItemModule\":{}}</script></html>",
        sec_uid="MS4wLjABAAAA...",
        max_videos=20,
        date_from=dt_from,
        date_to=dt_to,
    ))

    # Must be strictly empty (0 videos) because no videos match today's date
    assert len(videos) == 0
