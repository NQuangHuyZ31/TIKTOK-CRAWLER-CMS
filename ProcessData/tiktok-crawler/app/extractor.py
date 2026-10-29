from datetime import datetime
from html import unescape
import json
import logging
import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from models import TikTokAccount

logger = logging.getLogger(__name__)

# Known signatures indicating anti-bot challenge or verification
CHALLENGE_PATTERNS = (
    "slardar_us_waf",
    "verify-center",
    "captcha_verify_container",
    "secsdk-captcha",
    "verify-bar-close",
    "captcha-verify-image",
    "tiktok-verify-page",
)

# Signatures indicating deleted or non-existent TikTok account
NOT_FOUND_PATTERNS = (
    "user-not-found",
    "couldn't find this account",
    "account not found",
    "user not found",
    "cannot find this account",
)


def check_page_type(soup: BeautifulSoup, html: str) -> str:
    """
    Classify the TikTok page content.

    Returns one of:
      - 'challenge': Page is an anti-bot WAF or CAPTCHA challenge.
      - 'not_found': Account does not exist or was deleted.
      - 'private': Account is marked private.
      - 'profile': Valid profile page.
      - 'unknown': Unrecognized structure.
    """
    html_lower = html.lower()

    if any(pattern in html_lower for pattern in CHALLENGE_PATTERNS):
        return "challenge"

    if any(pattern in html_lower for pattern in NOT_FOUND_PATTERNS):
        return "not_found"

    if "this account is private" in html_lower:
        return "private"

    # Check for presence of profile identifiers either in DOM or SSR scripts
    if (
        soup.find("strong", {"data-e2e": "followers-count"})
        or soup.find("h1", {"data-e2e": "user-title"})
        or soup.find("h2", {"data-e2e": "user-subtitle"})
        or soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
        or soup.find("script", id="SIGI_STATE")
    ):
        return "profile"

    return "unknown"


def parse_count_text(text: str) -> int:
    """Normalize count abbreviations like 1.2K, 3M, 4B into integers."""
    if not text:
        return 0

    text = (
        text.strip()
        .replace(",", "")
        .replace(" ", "")
        .upper()
    )

    try:
        if text.endswith("K"):
            return int(float(text[:-1]) * 1_000)
        if text.endswith("M"):
            return int(float(text[:-1]) * 1_000_000)
        if text.endswith("B"):
            return int(float(text[:-1]) * 1_000_000_000)
        return int(float(text))
    except (ValueError, TypeError):
        return 0


def parse_stat_value(val) -> int:
    """Parse stat value from int, float, or string representations."""
    if val is None:
        return 0
    if isinstance(val, (int, float)):
        return int(val)
    if isinstance(val, str):
        val_clean = val.strip().replace(",", "")
        if val_clean.isdigit():
            return int(val_clean)
        return parse_count_text(val_clean)
    return 0


def normalize_avatar_url(value: str | None) -> str | None:
    """Normalize an image URL or srcset candidate from TikTok HTML."""
    if not value:
        return None

    candidate = unescape(value).strip().split(",")[0].split(" ")[0]
    candidate = candidate.replace("\\/", "/").replace("\\u002F", "/")
    parsed = urlparse(candidate)

    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return candidate

    return None


def find_profile_data_in_json(value) -> dict:
    """Recursively search for user stats and metadata in embedded TikTok JSON."""
    if isinstance(value, dict):
        # 1. Direct userInfo match (standard in __UNIVERSAL_DATA_FOR_REHYDRATION__)
        if "userInfo" in value and isinstance(value["userInfo"], dict):
            user_info = value["userInfo"]
            stats = user_info.get("stats") or user_info.get("statsV2") or {}
            user = user_info.get("user") or {}

            followers = parse_stat_value(stats.get("followerCount"))
            following = parse_stat_value(stats.get("followingCount"))
            likes = parse_stat_value(
                stats.get("heartCount") or stats.get("heart") or stats.get("likesCount")
            )
            username = user.get("uniqueId") or user.get("unique_id")
            avatar_url = (
                user.get("avatarLarger")
                or user.get("avatarMedium")
                or user.get("avatarThumb")
                or user.get("avatar_url")
            )
            return {
                "username": username,
                "followers": followers,
                "following": following,
                "likes": likes,
                "avatar_url": normalize_avatar_url(avatar_url),
            }

        # 2. Stats container match
        if "followerCount" in value and (
            "followingCount" in value or "heartCount" in value or "heart" in value
        ):
            followers = parse_stat_value(value.get("followerCount"))
            following = parse_stat_value(value.get("followingCount"))
            likes = parse_stat_value(
                value.get("heartCount") or value.get("heart") or value.get("likesCount")
            )
            return {
                "followers": followers,
                "following": following,
                "likes": likes,
            }

        # 3. SIGI_STATE UserModule pattern
        if "UserModule" in value and isinstance(value["UserModule"], dict):
            user_module = value["UserModule"]
            stats_dict = user_module.get("stats", {})
            users_dict = user_module.get("users", {})

            for uname, u_stats in stats_dict.items():
                if isinstance(u_stats, dict):
                    followers = parse_stat_value(u_stats.get("followerCount"))
                    following = parse_stat_value(u_stats.get("followingCount"))
                    likes = parse_stat_value(
                        u_stats.get("heartCount") or u_stats.get("heart")
                    )
                    u_info = users_dict.get(uname, {})
                    avatar_url = (
                        u_info.get("avatarLarger")
                        or u_info.get("avatarMedium")
                        or u_info.get("avatarThumb")
                    ) if isinstance(u_info, dict) else None
                    return {
                        "username": uname,
                        "followers": followers,
                        "following": following,
                        "likes": likes,
                        "avatar_url": normalize_avatar_url(avatar_url),
                    }

        # Traverse nested dict values
        for nested_val in value.values():
            res = find_profile_data_in_json(nested_val)
            if res and (
                res.get("followers", 0) > 0
                or res.get("following", 0) > 0
                or res.get("likes", 0) > 0
                or res.get("username")
            ):
                return res

    elif isinstance(value, list):
        for item in value:
            res = find_profile_data_in_json(item)
            if res and (
                res.get("followers", 0) > 0
                or res.get("following", 0) > 0
                or res.get("likes", 0) > 0
                or res.get("username")
            ):
                return res

    return {}


def extract_profile_from_scripts(soup: BeautifulSoup) -> dict:
    """Extract profile data from embedded JSON script tags (SSR rehydration payload)."""
    priority_ids = (
        "__UNIVERSAL_DATA_FOR_REHYDRATION__",
        "SIGI_STATE",
        "__NEXT_DATA__",
    )
    for script_id in priority_ids:
        script = soup.find("script", id=script_id)
        if script:
            script_text = script.string or script.get_text()
            if script_text:
                try:
                    data = json.loads(script_text)
                    profile_data = find_profile_data_in_json(data)
                    if profile_data:
                        return profile_data
                except (TypeError, json.JSONDecodeError):
                    pass

    # Fallback to any script containing followerCount
    for script in soup.select("script"):
        if script.get("id") in priority_ids:
            continue
        script_text = script.string or script.get_text()
        if not script_text or "followerCount" not in script_text:
            continue
        try:
            data = json.loads(script_text)
            profile_data = find_profile_data_in_json(data)
            if profile_data:
                return profile_data
        except (TypeError, json.JSONDecodeError):
            continue

    return {}


def extract_avatar_url(soup: BeautifulSoup) -> str | None:
    """Extract avatar URL from HTML DOM elements or embedded JSON scripts."""
    selectors = (
        'img[data-e2e="user-avatar"]',
        'img[data-e2e*="avatar"]',
        'img[alt*="profile photo" i]',
        'meta[property="og:image"]',
    )

    for selector in selectors:
        element = soup.select_one(selector)
        if not element:
            continue

        for attribute in ("content", "src", "data-src", "data-lazy-src"):
            avatar_url = normalize_avatar_url(element.get(attribute))
            if avatar_url:
                return avatar_url

        avatar_url = normalize_avatar_url(element.get("srcset"))
        if avatar_url:
            return avatar_url

    # Check script tags for avatar keys if DOM elements yielded none
    avatar_keys = (
        "avatarLarger",
        "avatarMedium",
        "avatarThumb",
        "avatar_url",
        "avatarUrl",
    )
    for script in soup.select("script"):
        script_text = script.string or script.get_text()
        if not script_text or not any(k in script_text for k in avatar_keys):
            continue
        try:
            data = json.loads(script_text)
            avatar_url = _find_avatar_in_dict(data, avatar_keys)
            if avatar_url:
                return avatar_url
        except (TypeError, json.JSONDecodeError):
            continue

    return None


def _find_avatar_in_dict(value, avatar_keys: tuple[str, ...]) -> str | None:
    """Recursively search for avatar URL in a JSON object."""
    if isinstance(value, dict):
        for key in avatar_keys:
            candidate = normalize_avatar_url(value.get(key))
            if candidate:
                return candidate
        for nested in value.values():
            found = _find_avatar_in_dict(nested, avatar_keys)
            if found:
                return found
    elif isinstance(value, list):
        for item in value:
            found = _find_avatar_in_dict(item, avatar_keys)
            if found:
                return found
    return None


def extract_profile_from_dom(soup: BeautifulSoup) -> dict:
    """Extract profile metadata and stats from DOM elements."""
    username_tag = soup.find(
        "h2",
        {"data-e2e": "user-subtitle"},
    ) or soup.find(
        "h1",
        {"data-e2e": "user-title"},
    )
    username = username_tag.get_text(strip=True) if username_tag else None

    followers_tag = soup.find(
        "strong",
        {"data-e2e": "followers-count"},
    ) or soup.find(
        "strong",
        {"title": "Followers"},
    )
    followers = parse_count_text(followers_tag.get_text(strip=True)) if followers_tag else 0

    following_tag = soup.find(
        "strong",
        {"data-e2e": "following-count"},
    ) or soup.find(
        "strong",
        {"title": "Following"},
    )
    following = parse_count_text(following_tag.get_text(strip=True)) if following_tag else 0

    likes_tag = soup.find(
        "strong",
        {"data-e2e": "likes-count"},
    ) or soup.find(
        "strong",
        {"title": "Likes"},
    )
    likes = parse_count_text(likes_tag.get_text(strip=True)) if likes_tag else 0

    avatar_url = extract_avatar_url(soup)

    return {
        "username": username,
        "followers": followers,
        "following": following,
        "likes": likes,
        "avatar_url": avatar_url,
    }


def extract_profile(
    html: str,
    profile_url: str,
) -> tuple[TikTokAccount, list[str]]:
    """
    Extract TikTok profile information from HTML.

    Combines both SSR embedded JSON scripts (for exact raw integers)
    and DOM elements (as fallback).

    Returns:
        tuple[TikTokAccount, list[str]]: The extracted account and a list of missing field names.
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1. Extract from SSR JSON scripts
    json_data = extract_profile_from_scripts(soup)

    # 2. Extract from DOM elements
    dom_data = extract_profile_from_dom(soup)

    # Prefer SSR JSON data (exact integer accuracy & bypasses client hydration lag)
    # Fallback to DOM data when JSON is empty or missing
    username = json_data.get("username") or dom_data.get("username")

    followers = (
        json_data["followers"]
        if "followers" in json_data and json_data["followers"] > 0
        else dom_data.get("followers", 0)
    )
    following = (
        json_data["following"]
        if "following" in json_data and json_data["following"] > 0
        else dom_data.get("following", 0)
    )
    likes = (
        json_data["likes"]
        if "likes" in json_data and json_data["likes"] > 0
        else dom_data.get("likes", 0)
    )

    avatar_url = json_data.get("avatar_url") or dom_data.get("avatar_url")

    # Check for missing fields
    missing_fields: list[str] = []
    if not username:
        missing_fields.append("username")
    if followers == 0 and dom_data.get("followers", 0) == 0:
        missing_fields.append("followers")
    if following == 0 and dom_data.get("following", 0) == 0:
        missing_fields.append("following")
    if likes == 0 and dom_data.get("likes", 0) == 0:
        missing_fields.append("likes")
    if not avatar_url:
        missing_fields.append("avatar_url")

    now = datetime.now()
    account = TikTokAccount(
        username=username,
        followers=followers,
        following=following,
        likes=likes,
        profile_url=profile_url,
        avatar_url=avatar_url,
        crawled_at=now,
        status="active" if username else "inactive",
        last_crawled_at=now,
    )

    return account, missing_fields
