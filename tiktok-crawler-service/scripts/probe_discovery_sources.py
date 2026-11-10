"""
Discovery Sources Probe & Benchmark Script
Tests real-world TikTok endpoints for candidate discovery:
1. Video Mentions & Bio & Music Author (Current method)
2. Video Comments API (/api/comment/list/)
3. Followers / Following List API (/api/user/list/)
4. Hashtag Web Discovery (/tag/{tag})
"""

import asyncio
import json
import re
import sys
import time
from typing import Any, Dict, List
import httpx

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
}

EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "mail.com", "protonmail.com", "zoho.com", "yandex.com"
}


def is_valid_username(username: str) -> bool:
    if not username or not isinstance(username, str):
        return False
    clean = username.strip().lstrip("@").lower()
    if not bool(re.match(r"^[a-zA-Z0-9_.]{2,24}$", clean)):
        return False
    if clean in EMAIL_DOMAINS:
        return False
    if any(clean.endswith("." + ext) for ext in ("com", "vn", "net", "org", "io", "edu", "gov", "info")):
        return False
    return True


async def test_comments_api(client: httpx.AsyncClient, video_id: str, creator_username: str) -> Dict[str, Any]:
    url = f"https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id={video_id}&count=20"
    headers = {
        **DEFAULT_HEADERS,
        "Referer": f"https://www.tiktok.com/@{creator_username}/video/{video_id}",
    }
    start = time.time()
    try:
        resp = await client.get(url, headers=headers, timeout=12.0)
        elapsed = round(time.time() - start, 2)
        if resp.status_code == 200 and resp.text:
            data = resp.json()
            comments = data.get("comments") or []
            accounts = set()
            for c in comments:
                u = c.get("user", {}).get("unique_id")
                if u and is_valid_username(u):
                    accounts.add(u.lower())
            return {
                "source": "1. Video Comments API",
                "status": f"HTTP 200 (OK)",
                "count": len(accounts),
                "accounts": list(accounts),
                "time": elapsed,
                "notes": f"Tìm được {len(accounts)} accounts từ 1 video đơn lẻ!",
            }
        return {
            "source": "1. Video Comments API",
            "status": f"HTTP {resp.status_code}",
            "count": 0,
            "accounts": [],
            "time": elapsed,
            "notes": "Empty response",
        }
    except Exception as e:
        return {
            "source": "1. Video Comments API",
            "status": "ERROR",
            "count": 0,
            "accounts": [],
            "time": round(time.time() - start, 2),
            "notes": str(e),
        }


async def test_follower_list_api(client: httpx.AsyncClient, sec_uid: str, username: str) -> Dict[str, Any]:
    url = f"https://www.tiktok.com/api/user/list/?count=20&minCursor=0&maxCursor=0&secUid={sec_uid}&scene=21&aid=1988"
    headers = {
        **DEFAULT_HEADERS,
        "Referer": f"https://www.tiktok.com/@{username}",
    }
    start = time.time()
    try:
        resp = await client.get(url, headers=headers, timeout=12.0)
        elapsed = round(time.time() - start, 2)
        if resp.status_code == 200 and len(resp.text) == 0:
            return {
                "source": "2. Follower List API",
                "status": "HTTP 200 (Locked)",
                "count": 0,
                "accounts": [],
                "time": elapsed,
                "notes": "TikTok chặn: Yêu cầu đăng nhập (Login Wall/Session cookie)",
            }
        return {
            "source": "2. Follower List API",
            "status": f"HTTP {resp.status_code}",
            "count": 0,
            "accounts": [],
            "time": elapsed,
            "notes": "Blocked / Anti-bot",
        }
    except Exception as e:
        return {
            "source": "2. Follower List API",
            "status": "ERROR",
            "count": 0,
            "accounts": [],
            "time": round(time.time() - start, 2),
            "notes": str(e),
        }


async def test_hashtag_web(client: httpx.AsyncClient, hashtag: str) -> Dict[str, Any]:
    url = f"https://www.tiktok.com/tag/{hashtag}"
    headers = {
        **DEFAULT_HEADERS,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    start = time.time()
    try:
        resp = await client.get(url, headers=headers, timeout=12.0)
        elapsed = round(time.time() - start, 2)
        # Check if video authors exist in HTML
        match_users = set(re.findall(r"/@([a-zA-Z0-9_.]{2,24})[\"/?]", resp.text))
        valid_users = [u.lower() for u in match_users if is_valid_username(u)]
        return {
            "source": f"3. Hashtag Web (#{hashtag})",
            "status": f"HTTP {resp.status_code}",
            "count": len(valid_users),
            "accounts": valid_users,
            "time": elapsed,
            "notes": f"Lấy được {len(valid_users)} tác giả từ trang hashtag" if valid_users else "TikTok chỉ render video bằng JavaScript phía client",
        }
    except Exception as e:
        return {
            "source": f"3. Hashtag Web (#{hashtag})",
            "status": "ERROR",
            "count": 0,
            "accounts": [],
            "time": round(time.time() - start, 2),
            "notes": str(e),
        }


async def main():
    print("=" * 70)
    print(" BÁO CÁO THỰC NGHIỆM: ĐO LƯỜNG TỪNG NGUỒN TÌM KIẾM CREATOR TIKTOK")
    print("=" * 70)

    # Known verified creator for testing
    creator = "linhbarbie"
    sec_uid = "MS4wLjABAAAAjrgKh3NdHlneqvbue8sRgo80nR_8nR_PyyaWPSQC_Do"
    real_video_id = "7704652968267631893"

    results = []
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Test 1: Comments API
        print("[1/3] Đang test Nguồn 1: Video Comments API...")
        res1 = await test_comments_api(client, real_video_id, creator)
        results.append(res1)
        await asyncio.sleep(1.0)

        # Test 2: Follower List API
        print("[2/3] Đang test Nguồn 2: Follower List API...")
        res2 = await test_follower_list_api(client, sec_uid, creator)
        results.append(res2)
        await asyncio.sleep(1.0)

        # Test 3: Hashtag Web
        print("[3/3] Đang test Nguồn 3: Hashtag Web (#reviewanngon)...")
        res3 = await test_hashtag_web(client, "reviewanngon")
        results.append(res3)

    print("\n" + "=" * 70)
    print(f"{'Nguồn dữ liệu':<25} | {'Trạng thái':<18} | {'Số Acc':<8} | {'Ghi chú thực tế'}")
    print("-" * 70)
    for r in results:
        sample = f" (Ví dụ: {', '.join(r['accounts'][:3])})" if r["accounts"] else ""
        print(f"{r['source']:<25} | {r['status']:<18} | {r.get('count', 0):<8} | {r['notes']}{sample}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
