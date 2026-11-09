"""
Live Discovery Test Script
Tests discovery of new TikTok creators via:
1. Public Profile Rehydration Data (Suggested / Recommended Creators)
2. Creator Graph (Extracting creator mentions, music authors, and duets from video feeds)
3. Direct Web Explore / Recommendation endpoints
"""

import asyncio
import json
import logging
from pathlib import Path
import re
import sys
import httpx
from bs4 import BeautifulSoup

# Ensure app is importable
SERVICE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVICE_ROOT / "app"))

from core.utils import normalize_username
from crawler.tiktok_client import TikTokClient
from crawler.video_api import fetch_creator_videos_paginated

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("LiveDiscoveryTest")


async def discover_from_profile_page(client: httpx.AsyncClient, seed_username: str) -> tuple[list[dict], str | None]:
    """
    Scrape a profile page and extract both the seed account metadata
    and any suggested/recommended creators found in the rehydration JSON.
    """
    url = f"https://www.tiktok.com/@{seed_username}"
    logger.info(f"Probing profile page for seed @{seed_username} ({url})...")
    discovered = []
    sec_uid = None

    try:
        resp = await client.get(url, timeout=15.0)
        logger.info(f"Profile page response: HTTP {resp.status_code} (length: {len(resp.text)} bytes)")
        if resp.status_code != 200:
            return discovered, sec_uid, None

        soup = BeautifulSoup(resp.text, "html.parser")
        tag = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
        if not tag:
            logger.warning("No __UNIVERSAL_DATA_FOR_REHYDRATION__ tag found in HTML.")
            return discovered, sec_uid, None

        raw_json = tag.string or tag.get_text()
        data = json.loads(raw_json)
        default_scope = data.get("__DEFAULT_SCOPE__", {})

        # Check for user detail & secUid
        user_detail = default_scope.get("webapp.user-detail", {})
        user_info = user_detail.get("userInfo", {}).get("user", {})
        sec_uid = user_info.get("secUid")
        if sec_uid:
            logger.info(f"Seed creator secUid: {sec_uid[:20]}...")

        # Record the seed account itself as verified candidate
        if user_info and user_info.get("uniqueId"):
            seed_clean = normalize_username(user_info.get("uniqueId"))
            if seed_clean:
                discovered.append({
                    "username": seed_clean,
                    "nickname": user_info.get("nickname") or seed_clean,
                    "sec_uid": user_info.get("secUid"),
                    "source": f"seed_verified:@{seed_username}",
                })

        # Search for any user list or recommend lists across the entire payload
        def recursive_find_users(obj, path=""):
            if isinstance(obj, dict):
                # Check if object looks like a TikTok user
                uid = obj.get("uniqueId") or obj.get("unique_id")
                nick = obj.get("nickname")
                if uid and isinstance(uid, str) and uid.lower() != seed_username.lower():
                    clean = normalize_username(uid)
                    if clean and not any(d["username"].lower() == clean.lower() for d in discovered):
                        discovered.append({
                            "username": clean,
                            "nickname": nick or clean,
                            "sec_uid": obj.get("secUid"),
                            "source": f"profile_rehydration:{seed_username}",
                        })
                for k, v in obj.items():
                    recursive_find_users(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for item in obj:
                    recursive_find_users(item, path)

        recursive_find_users(default_scope)

        # Check for HTML mentions in bio or links
        bio = user_info.get("signature") or ""
        for mention in re.findall(r"@([a-zA-Z0-9_\.]+)", bio):
            clean = normalize_username(mention)
            if clean and clean.lower() != seed_username.lower():
                if not any(d["username"].lower() == clean.lower() for d in discovered):
                    discovered.append({
                        "username": clean,
                        "nickname": clean,
                        "sec_uid": None,
                        "source": f"bio_mention:@{seed_username}",
                    })

    except Exception as e:
        logger.error(f"Error extracting from profile @{seed_username}: {e}")

    return discovered, sec_uid


async def discover_from_tag_page(client: httpx.AsyncClient, tag_name: str) -> list[dict]:
    """
    Scrape a TikTok hashtag page (e.g. https://www.tiktok.com/tag/tintuc)
    and extract creators from the embedded hydration state and HTML.
    """
    url = f"https://www.tiktok.com/tag/{tag_name}"
    logger.info(f"Probing hashtag page #{tag_name} ({url})...")
    discovered = []
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        resp = await client.get(url, headers=headers, timeout=12.0)
        logger.info(f"Tag #{tag_name} response: HTTP {resp.status_code} ({len(resp.text)} bytes)")
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            script_tag = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
            if script_tag and script_tag.string:
                data = json.loads(script_tag.string)
                # Find all uniqueId and secUid occurrences in the json
                def scan_dict(obj):
                    if isinstance(obj, dict):
                        uid = obj.get("uniqueId") or obj.get("authorUniqueId")
                        nick = obj.get("nickname")
                        sec = obj.get("secUid")
                        if uid and isinstance(uid, str):
                            clean = normalize_username(uid)
                            if clean and not any(d["username"].lower() == clean.lower() for d in discovered):
                                discovered.append({
                                    "username": clean,
                                    "nickname": nick or clean,
                                    "sec_uid": sec,
                                    "source": f"hashtag_page:#{tag_name}"
                                })
                        for k, v in obj.items():
                            scan_dict(v)
                    elif isinstance(obj, list):
                        for el in obj:
                            scan_dict(el)
                scan_dict(data)

            # Fallback regex in raw HTML for creator link patterns /@username
            for match in re.findall(r'href=["\']/@([a-zA-Z0-9_\.]+)["\']', resp.text):
                clean = normalize_username(match)
                if clean and not any(d["username"].lower() == clean.lower() for d in discovered):
                    discovered.append({
                        "username": clean,
                        "nickname": clean,
                        "sec_uid": None,
                        "source": f"tag_html_link:#{tag_name}"
                    })
    except Exception as e:
        logger.warning(f"Error scraping hashtag #{tag_name}: {e}")

    return discovered


async def discover_from_creator_videos(client: httpx.AsyncClient, seed_username: str, sec_uid: str) -> list[dict]:
    """
    Fetch creator videos and extract creator mentions from raw item textExtra,
    music authors, and duets.
    """
    logger.info(f"Fetching creator videos for @{seed_username} to build Creator Graph...")
    discovered = []
    try:
        import time
        import random
        import string

        device_id = str(random.randint(7250000000000000000, 7325099899999994577))
        cursor = int(time.time() * 1000)
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
            "count": "15",
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
            "type": "1",
            "tz_name": "UTC",
            "verifyFp": verify_fp,
            "webcast_language": "en",
        }
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/128.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": f"https://www.tiktok.com/@{seed_username}",
        }
        resp = await client.get(
            "https://www.tiktok.com/api/creator/item_list/",
            params=params,
            headers=headers,
            timeout=12.0
        )
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("itemList") or []
            logger.info(f"Retrieved {len(items)} raw video items for @{seed_username}.")
            for item in items:
                # 1. textExtra tagged users
                text_extra = item.get("textExtra") or []
                for te in text_extra:
                    u_uid = te.get("userUniqueId") or te.get("userId")
                    u_sec = te.get("secUid")
                    if u_uid:
                        clean = normalize_username(u_uid)
                        if clean and clean.lower() != seed_username.lower():
                            if not any(d["username"].lower() == clean.lower() for d in discovered):
                                discovered.append({
                                    "username": clean,
                                    "nickname": clean,
                                    "sec_uid": u_sec,
                                    "source": f"caption_tag:{item.get('id')}"
                                })

                # 2. Caption regex fallback
                desc = item.get("desc") or ""
                for mention in re.findall(r"@([a-zA-Z0-9_\.]+)", desc):
                    clean = normalize_username(mention)
                    if clean and clean.lower() != seed_username.lower():
                        if not any(d["username"].lower() == clean.lower() for d in discovered):
                            discovered.append({
                                "username": clean,
                                "nickname": clean,
                                "sec_uid": None,
                                "source": f"caption_mention:{item.get('id')}"
                            })

                # 3. Music Author
                music = item.get("music") or {}
                m_author = music.get("authorName")
                if m_author:
                    clean_music = normalize_username(m_author)
                    if clean_music and len(clean_music) > 3 and clean_music.lower() != seed_username.lower():
                        if not any(d["username"].lower() == clean_music.lower() for d in discovered):
                            discovered.append({
                                "username": clean_music,
                                "nickname": m_author,
                                "sec_uid": None,
                                "source": f"music_author:{music.get('id')}"
                            })
    except Exception as e:
        logger.error(f"Error fetching creator videos: {e}")

    return discovered


async def test_explore_endpoint(client: httpx.AsyncClient) -> list[dict]:
    """Test public explore / item list API."""
    url = "https://www.tiktok.com/api/explore/item_list/?aid=1988&count=15&device_platform=web_pc"
    logger.info("Testing TikTok Explore API directly...")
    discovered = []
    try:
        resp = await client.get(url, timeout=10.0)
        logger.info(f"Explore API response: HTTP {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("itemList") or data.get("items") or []
            for it in items:
                author = it.get("author", {})
                uid = author.get("uniqueId")
                if uid:
                    clean = normalize_username(uid)
                    if clean and not any(d["username"].lower() == clean.lower() for d in discovered):
                        discovered.append({
                            "username": clean,
                            "nickname": author.get("nickname") or clean,
                            "sec_uid": author.get("secUid"),
                            "source": "tiktok_explore_api"
                        })
    except Exception as e:
        logger.warning(f"Explore API probe notice: {e}")
    return discovered


async def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    seeds = ["vtv24news"]
    if len(sys.argv) > 1:
        seeds = [s.strip().lstrip("@") for s in sys.argv[1:] if s.strip()]

    print("=" * 70)
    print(f"LIVE TIKTOK DISCOVERY TEST - SEEDS: {', '.join('@' + s for s in seeds)}")
    print("=" * 70)

    tiktok_client = TikTokClient()
    http_client = await tiktok_client._get_client()

    all_discovered = []

    for seed in seeds:
        print(f"\n--- DISCOVERING FROM SEED: @{seed} ---")
        # 1. Test Profile Rehydration
        print(f"[Step 1] Scraping Profile & Extracting Seed: @{seed}...")
        from_profile, sec_uid = await discover_from_profile_page(http_client, seed)
        all_discovered.extend(from_profile)
        print(f"  -> Discovered {len(from_profile)} accounts from profile verification.")

        # 2. Test Creator Videos & Creator Graph (Mentions, Duets, Music)
        if sec_uid:
            print(f"[Step 2] Crawling Creator Graph from @{seed} Videos (secUid={sec_uid[:15]}...)...")
            from_videos = await discover_from_creator_videos(http_client, seed, sec_uid)
            all_discovered.extend(from_videos)
            print(f"  -> Discovered {len(from_videos)} accounts from Creator Graph.")
        else:
            print(f"[Step 2] Skipped Creator Graph (no secUid extracted for @{seed})")

    # 3. Test Explore API
    print(f"\n[Step 3] Probing TikTok Explore API...")
    from_explore = await test_explore_endpoint(http_client)
    all_discovered.extend(from_explore)
    print(f"  -> Discovered {len(from_explore)} accounts from Explore API.")

    await tiktok_client.close()

    # Deduplicate
    unique_candidates = {}
    for d in all_discovered:
        u = d["username"].lower()
        if u not in unique_candidates:
            unique_candidates[u] = d

    print("\n" + "=" * 70)
    print(f"DISCOVERY SUMMARY: {len(unique_candidates)} UNIQUE ACCOUNTS FOUND LIVE")
    print("=" * 70)
    for idx, (u, c) in enumerate(unique_candidates.items(), 1):
        sec = f" (secUid: {c['sec_uid'][:15]}...)" if c.get('sec_uid') else ""
        print(f"  {idx:2d}. @{c['username']} - '{c['nickname']}' [{c['source']}]{sec}")

    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
