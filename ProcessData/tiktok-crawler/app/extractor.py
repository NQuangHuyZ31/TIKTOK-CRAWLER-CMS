from datetime import datetime
from html import unescape
import json
import logging
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from models import TikTokAccount

logger = logging.getLogger(__name__)


class ExtractorPageError(Exception):
    """Raised when the page content is invalid for extraction (e.g. challenge or 404)."""

    def __init__(self, page_type: str, message: str):
        super().__init__(message)
        self.page_type = page_type


def check_page_type(soup: BeautifulSoup, html: str | None = None) -> str:
    """
    Classify the TikTok page content safely using parsed DOM and SSR scripts.
    Avoids string duplication (html.lower()) to prevent MemoryError and avoids
    matching i18n translation maps in JavaScript bundles.

    Returns one of:
      - 'profile': Valid profile page with verified profile indicators (checked first!).
      - 'private': Account is marked private.
      - 'challenge': Anti-bot CAPTCHA or WAF challenge DOM elements.
      - 'not_found': Account does not exist or was deleted (DOM elements).
      - 'unknown': Unrecognized structure.
    """
    # 1. First priority: Check if valid profile markers exist in DOM
    if (
        soup.find("strong", {"data-e2e": "followers-count"})
        or soup.find("h1", {"data-e2e": "user-title"})
        or soup.find("h2", {"data-e2e": "user-subtitle"})
    ):
        if soup.find(string=lambda s: s and "this account is private" in s.lower()):
            return "private"
        return "profile"

    # 2. Check if valid SSR rehydration JSON has user profile data
    rehydration_script = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
    if rehydration_script:
        text = rehydration_script.string or rehydration_script.get_text() or ""
        if '"userInfo"' in text or '"webapp.user-detail"' in text:
            # Check if TikTok explicit error code indicates user not found (code 10221)
            if '"statusCode":10221' in text or '"statusCode": 10221' in text:
                return "not_found"
            return "profile"

    # 3. Check SIGI_STATE for UserModule
    sigi_script = soup.find("script", id="SIGI_STATE")
    if sigi_script:
        text = sigi_script.string or sigi_script.get_text() or ""
        if '"UserModule"' in text:
            return "profile"

    # 4. Check for explicit not-found DOM elements (NEVER match in <script> i18n maps)
    if (
        soup.find(attrs={"data-e2e": "user-not-found"})
        or soup.find(class_=lambda c: c and "user-not-found" in c)
        or soup.find("p", string=lambda s: s and "couldn't find this account" in s.lower())
    ):
        return "not_found"

    # 5. Check for explicit challenge/CAPTCHA DOM elements
    if (
        soup.find(
            class_=lambda c: c
            and any(p in c for p in ("captcha_verify_container", "verify-center", "secsdk-captcha"))
        )
        or soup.find(id=lambda i: i and ("captcha-verify" in i or "verify-ele" in i))
        or soup.find(attrs={"data-e2e": "sec-sdk-iframe"})
    ):
        return "challenge"

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


def parse_stat_value(val) -> int | None:
    """
    Parse stat value from int, float, or string representations.
    Returns None if the value is missing or unparseable.
    Preserves 0 when value is legitimately zero.
    Handles signed 32-bit integer overflow (e.g. TikTok heart exceeding 2.14B).
    """
    if val is None:
        return None

    parsed: int | None = None
    if isinstance(val, (int, float)):
        parsed = int(val)
    elif isinstance(val, str):
        val_clean = val.strip().replace(",", "")
        if not val_clean:
            return None
        if val_clean.startswith("-") and val_clean[1:].isdigit():
            parsed = int(val_clean)
        elif val_clean.isdigit():
            parsed = int(val_clean)
        else:
            res = parse_count_text(val_clean)
            # Verify if 0 was parsed from a legitimate '0' or unparseable string
            if res == 0 and not val_clean.startswith("0"):
                return None
            parsed = res

    if parsed is not None:
        # Check for signed 32-bit integer overflow:
        # When likes exceed 2,147,483,647 (2^31 - 1), TikTok legacy 32-bit integer rolls over into negative.
        # Adding 2^32 (4,294,967,296) reconstructs the true unsigned count.
        if parsed < 0:
            overflow_adjusted = parsed + (1 << 32)
            if overflow_adjusted > 0:
                parsed = overflow_adjusted
            else:
                parsed = 0
        return parsed

    return None


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


def _extract_first_present(data: dict, *keys: str):
    """Return the value of the first key present in data whose value is not None (preserving 0)."""
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def _is_matching_user(candidate: str | None, target: str | None) -> bool:
    """Check if candidate username matches target username (case-insensitive, clean)."""
    if not target or not candidate:
        return True
    return candidate.strip().lstrip("@").lower() == target.strip().lstrip("@").lower()


def find_profile_data_in_json(value, target_username: str | None = None) -> dict:
    """
    Recursively search for user stats and metadata in embedded TikTok JSON.
    If target_username is provided, verifies that candidate username matches.
    Prioritizes statsV2 to avoid 32-bit integer overflow.
    """
    target_clean = target_username.strip().lstrip("@").lower() if target_username else None

    if isinstance(value, dict):
        # 1. Direct userInfo match (standard in __UNIVERSAL_DATA_FOR_REHYDRATION__)
        if "userInfo" in value and isinstance(value["userInfo"], dict):
            user_info = value["userInfo"]
            user = user_info.get("user") or {}
            cand_user = user.get("uniqueId") or user.get("unique_id")

            if _is_matching_user(cand_user, target_clean):
                stats_v1 = user_info.get("stats") or {}
                stats_v2 = user_info.get("statsV2") or {}
                # Merge statsV2 over stats_v1 to prioritize 64-bit counts
                stats = {**stats_v1, **stats_v2}

                followers = parse_stat_value(_extract_first_present(stats, "followerCount", "follower_count"))
                following = parse_stat_value(_extract_first_present(stats, "followingCount", "following_count"))
                likes = parse_stat_value(
                    _extract_first_present(stats, "heartCount", "likesCount", "heart", "likes_count")
                )
                avatar_url = (
                    user.get("avatarLarger")
                    or user.get("avatarMedium")
                    or user.get("avatarThumb")
                    or user.get("avatar_url")
                )
                return {
                    "username": cand_user,
                    "followers": followers,
                    "following": following,
                    "likes": likes,
                    "avatar_url": normalize_avatar_url(avatar_url),
                }

        # 2. SIGI_STATE UserModule pattern
        if "UserModule" in value and isinstance(value["UserModule"], dict):
            user_module = value["UserModule"]
            stats_dict = user_module.get("stats", {})
            users_dict = user_module.get("users", {})

            matched_uname = None
            if target_clean:
                for k in stats_dict:
                    if k.strip().lstrip("@").lower() == target_clean:
                        matched_uname = k
                        break
            elif stats_dict:
                matched_uname = next(iter(stats_dict.keys()))

            if matched_uname:
                u_stats = stats_dict[matched_uname]
                u_info = users_dict.get(matched_uname, {})
                followers = parse_stat_value(_extract_first_present(u_stats, "followerCount", "follower_count"))
                following = parse_stat_value(_extract_first_present(u_stats, "followingCount", "following_count"))
                likes = parse_stat_value(
                    _extract_first_present(u_stats, "heartCount", "likesCount", "heart", "likes_count")
                )
                avatar_url = (
                    u_info.get("avatarLarger")
                    or u_info.get("avatarMedium")
                    or u_info.get("avatarThumb")
                ) if isinstance(u_info, dict) else None
                return {
                    "username": matched_uname,
                    "followers": followers,
                    "following": following,
                    "likes": likes,
                    "avatar_url": normalize_avatar_url(avatar_url),
                }

        # 3. Stats container match (only if no target username filter or target matches)
        if "followerCount" in value and (
            "followingCount" in value or "heartCount" in value or "heart" in value
        ):
            followers = parse_stat_value(_extract_first_present(value, "followerCount", "follower_count"))
            following = parse_stat_value(_extract_first_present(value, "followingCount", "following_count"))
            likes = parse_stat_value(
                _extract_first_present(value, "heartCount", "likesCount", "heart", "likes_count")
            )
            return {
                "followers": followers,
                "following": following,
                "likes": likes,
            }

        # Traverse nested dict values
        for nested_val in value.values():
            res = find_profile_data_in_json(nested_val, target_username=target_username)
            if res:
                return res

    elif isinstance(value, list):
        for item in value:
            res = find_profile_data_in_json(item, target_username=target_username)
            if res:
                return res

    return {}


def extract_profile_from_scripts(soup: BeautifulSoup, target_username: str | None = None) -> dict:
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
                    profile_data = find_profile_data_in_json(data, target_username=target_username)
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
            profile_data = find_profile_data_in_json(data, target_username=target_username)
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
    """Extract profile metadata and stats from DOM elements, distinguishing 0 from missing."""
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
    followers = parse_stat_value(followers_tag.get_text(strip=True)) if followers_tag else None

    following_tag = soup.find(
        "strong",
        {"data-e2e": "following-count"},
    ) or soup.find(
        "strong",
        {"title": "Following"},
    )
    following = parse_stat_value(following_tag.get_text(strip=True)) if following_tag else None

    likes_tag = soup.find(
        "strong",
        {"data-e2e": "likes-count"},
    ) or soup.find(
        "strong",
        {"title": "Likes"},
    )
    likes = parse_stat_value(likes_tag.get_text(strip=True)) if likes_tag else None

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
    target_username: str | None = None,
) -> tuple[TikTokAccount, list[str]]:
    """
    Extract TikTok profile information from HTML.

    1. Classifies page type before extraction, rejecting challenges and not-found pages.
    2. Verifies candidate username against target_username to prevent cross-account contamination.
    3. Accurately distinguishes between legitimate 0 counts and missing fields.
    4. Automatically recovers from signed 32-bit integer overflows in likes count.

    Raises:
        ExtractorPageError: If page is a challenge or non-existent account.

    Returns:
        tuple[TikTokAccount, list[str]]: The extracted account and a list of missing field names.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Step 1: Classify page before extraction
    page_type = check_page_type(soup, html)
    if page_type == "challenge":
        raise ExtractorPageError(page_type, "TikTok anti-bot WAF or CAPTCHA challenge encountered")
    if page_type == "not_found":
        raise ExtractorPageError(page_type, f"TikTok account not found or deleted on {profile_url}")

    # Derive target username from URL if not explicitly provided
    if not target_username and "/@" in profile_url:
        target_username = profile_url.rstrip("/").split("/@")[-1].split("?")[0]

    # Step 2: Extract from SSR JSON scripts
    json_data = extract_profile_from_scripts(soup, target_username=target_username)

    # Step 3: Extract from DOM elements
    dom_data = extract_profile_from_dom(soup)

    # Prefer SSR JSON data (exact integer accuracy & bypasses client hydration lag)
    # Fallback to DOM data when JSON is empty or missing
    username = json_data.get("username") or dom_data.get("username")

    followers_val = json_data.get("followers")
    if followers_val is None:
        followers_val = dom_data.get("followers")

    following_val = json_data.get("following")
    if following_val is None:
        following_val = dom_data.get("following")

    likes_val = json_data.get("likes")
    if likes_val is None:
        likes_val = dom_data.get("likes")

    avatar_url = json_data.get("avatar_url") or dom_data.get("avatar_url")

    # Check for truly missing fields (distinguished from 0)
    missing_fields: list[str] = []
    if not username:
        missing_fields.append("username")
    if followers_val is None:
        missing_fields.append("followers")
    if following_val is None:
        missing_fields.append("following")
    if likes_val is None:
        missing_fields.append("likes")
    if not avatar_url:
        missing_fields.append("avatar_url")

    # Map to final integers (default to 0 when missing)
    followers = followers_val if followers_val is not None else 0
    following = following_val if following_val is not None else 0
    likes = likes_val if likes_val is not None else 0

    # Account status rule
    if not username:
        account_status = "inactive"
    elif page_type == "private":
        account_status = "private"
    else:
        account_status = "active"

    now = datetime.now()
    account = TikTokAccount(
        username=username,
        followers=followers,
        following=following,
        likes=likes,
        profile_url=profile_url,
        avatar_url=avatar_url,
        crawled_at=now,
        status=account_status,
        last_crawled_at=now,
    )

    return account, missing_fields
