import html
import logging
import re
from bs4 import BeautifulSoup

from core.utils import normalize_username, parse_stat_value

logger = logging.getLogger(__name__)

NOT_FOUND_STATUS_CODES = {10202, 10221, 10222, 10223, 10204}
CHALLENGE_STATUS_CODES = {10000, 10101, 10102}


class ExtractorError(Exception):
    """Structured error raised when profile extraction cannot produce a valid account."""

    def __init__(self, error_code: str, message: str, is_retryable: bool = False):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.is_retryable = is_retryable


def _fix_int32_overflow(value: int | None) -> int | None:
    """Recover from TikTok's signed 32-bit integer overflow on large heart/likes counts."""
    if value is None:
        return None
    if value < 0:
        return value + (1 << 32)
    return value


def _extract_from_user_info_node(
    user_info: dict,
    target_username: str | None = None,
) -> dict | None:
    """Extract normalized profile fields from a `userInfo` dictionary (`user` + `stats`/`statsV2`)."""
    if not isinstance(user_info, dict):
        return None

    user = user_info.get("user") if isinstance(user_info.get("user"), dict) else {}
    stats = user_info.get("statsV2") if isinstance(user_info.get("statsV2"), dict) else {}
    if not stats:
        stats = user_info.get("stats") if isinstance(user_info.get("stats"), dict) else {}

    # Support flattened user_info structures
    if not user and (user_info.get("uniqueId") or user_info.get("secUid") or user_info.get("unique_id")):
        user = user_info
    if not stats and (user_info.get("followerCount") or user_info.get("followers") or user_info.get("heartCount")):
        stats = user_info

    unique_id = normalize_username(
        user.get("uniqueId") or user.get("unique_id") or user.get("username")
    )
    if not unique_id and not stats:
        return None

    followers = parse_stat_value(
        stats.get("followerCount") if "followerCount" in stats else stats.get("followers")
    )
    following = parse_stat_value(
        stats.get("followingCount") if "followingCount" in stats else stats.get("following")
    )
    raw_likes = stats.get("heartCount")
    if raw_likes is None:
        raw_likes = stats.get("heart")
    if raw_likes is None:
        raw_likes = stats.get("likes")
    likes = _fix_int32_overflow(parse_stat_value(raw_likes))
    video_count = parse_stat_value(
        stats.get("videoCount") if "videoCount" in stats else stats.get("video_count")
    )

    avatar_url = (
        user.get("avatarLarger")
        or user.get("avatarMedium")
        or user.get("avatarThumb")
        or user.get("avatar_url")
    )
    is_private = bool(user.get("privateAccount") or user.get("secret"))

    return {
        "username": unique_id or target_username,
        "sec_uid": user.get("secUid") or user.get("sec_uid"),
        "nickname": user.get("nickname"),
        "bio": user.get("signature") or user.get("bio"),
        "is_verified": bool(user.get("verified") or user.get("is_verified")),
        "followers": followers,
        "following": following,
        "likes": likes,
        "video_count": video_count if video_count is not None else 0,
        "avatar_url": avatar_url,
        "is_private": is_private,
    }


def extract_from_rehydration_json(
    data: dict,
    target_username: str | None = None,
) -> dict | None:
    """Parser v1: Extract from `__UNIVERSAL_DATA_FOR_REHYDRATION__` JSON structure."""
    default_scope = data.get("__DEFAULT_SCOPE__")
    if not isinstance(default_scope, dict):
        return None

    user_detail = default_scope.get("webapp.user-detail")
    if not isinstance(user_detail, dict):
        # Scan for alternate user-page keys in default_scope
        for k, v in default_scope.items():
            if isinstance(v, dict) and ("user-detail" in k or "user-page" in k or "userInfo" in v):
                user_detail = v
                break

    # If user_detail is still not found, check if userInfo exists at root of default_scope or data
    if not isinstance(user_detail, dict):
        if "userInfo" in default_scope and isinstance(default_scope["userInfo"], dict):
            user_detail = default_scope
        elif "userInfo" in data and isinstance(data["userInfo"], dict):
            user_detail = data

    if not isinstance(user_detail, dict):
        return None

    status_code = parse_stat_value(user_detail.get("statusCode"))
    status_msg = str(user_detail.get("statusMsg") or "")

    if status_code in NOT_FOUND_STATUS_CODES:
        raise ExtractorError(
            "NOT_FOUND",
            f"TikTok account @{target_username or 'unknown'} not found (statusCode={status_code})",
            is_retryable=False,
        )

    if status_code in CHALLENGE_STATUS_CODES:
        raise ExtractorError(
            "CHALLENGE",
            f"TikTok security challenge encountered (statusCode={status_code}, msg={status_msg})",
            is_retryable=False,
        )

    user_info = user_detail.get("userInfo")
    if isinstance(user_info, dict) and (user_info.get("user") or user_info.get("stats")):
        extracted = _extract_from_user_info_node(user_info, target_username=target_username)
        if extracted:
            return extracted

    if status_code and status_code != 0:
        raise ExtractorError(
            "NOT_FOUND",
            f"TikTok profile unavailable (statusCode={status_code}, msg={status_msg})",
            is_retryable=False,
        )

    if isinstance(user_info, dict) and not user_info.get("user") and not user_info.get("stats"):
        raise ExtractorError(
            "NOT_FOUND",
            f"TikTok account @{target_username or 'unknown'} not found (empty userInfo)",
            is_retryable=False,
        )

    return None


def extract_from_sigi_state(
    data: dict,
    target_username: str | None = None,
) -> dict | None:
    """Parser v2: Fallback extractor for `SIGI_STATE` JSON structure."""
    user_module = data.get("UserModule")
    if not isinstance(user_module, dict):
        return None

    users = user_module.get("users")
    stats_map = user_module.get("stats")
    if not isinstance(users, dict) or not users:
        return None

    selected_key = None
    if target_username:
        for key, user_obj in users.items():
            uid = normalize_username(
                user_obj.get("uniqueId") if isinstance(user_obj, dict) else key
            )
            if uid.lower() == target_username.lower():
                selected_key = key
                break
    if selected_key is None and not target_username:
        selected_key = next(iter(users.keys()))

    if selected_key is None:
        return None

    user_obj = users.get(selected_key) or {}
    stats_obj = (stats_map.get(selected_key) if isinstance(stats_map, dict) else None) or {}
    return _extract_from_user_info_node(
        {"user": user_obj, "stats": stats_obj},
        target_username=target_username,
    )


def extract_from_opengraph(
    soup: BeautifulSoup,
    target_username: str | None = None,
) -> dict | None:
    """Parser v4: Extract profile stats and avatar from OpenGraph / Twitter meta tags."""
    desc_meta = soup.find("meta", attrs={"property": "og:description"}) or soup.find(
        "meta", attrs={"name": "twitter:description"}
    )
    title_meta = soup.find("meta", attrs={"property": "og:title"}) or soup.find(
        "meta", attrs={"name": "twitter:title"}
    )

    desc_text = html.unescape(str(desc_meta.get("content", ""))).strip() if desc_meta and desc_meta.get("content") else ""
    title_text = html.unescape(str(title_meta.get("content", ""))).strip() if title_meta and title_meta.get("content") else ""

    if not desc_text and not title_text:
        return None

    # Multilingual followers / following / likes patterns (English, Vietnamese, Spanish, French, Indonesian)
    followers_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+(?:Followers|Follower|Fans|Người theo dõi|Seguidores|Abonnés|Pengikut)",
        desc_text,
        re.IGNORECASE,
    )
    following_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+(?:Following|Đang theo dõi|Seguindo|Abonnements|Mengikuti)",
        desc_text,
        re.IGNORECASE,
    )
    likes_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+(?:Likes|Like|Thích|Lượt thích|Curtidas|J'aime|Suka)",
        desc_text,
        re.IGNORECASE,
    )

    # Extract username handle from description or title
    handle_match = re.search(r"@([A-Za-z0-9._-]+)", desc_text)
    if not handle_match:
        handle_match = re.search(r"@([A-Za-z0-9._-]+)", title_text)
    og_username = normalize_username(handle_match.group(1)) if handle_match else None

    if target_username and og_username and og_username.lower() != target_username.lower():
        return None

    img_meta = soup.find("meta", attrs={"property": "og:image"}) or soup.find(
        "meta", attrs={"name": "twitter:image"}
    )
    avatar_url = None
    if img_meta and img_meta.get("content"):
        candidate_img = html.unescape(str(img_meta.get("content", ""))).strip()
        if candidate_img.startswith("http") and "tiktok-logo" not in candidate_img:
            avatar_url = candidate_img

    has_stats = any([followers_match, following_match, likes_match])
    # Profile is accepted if stats match OR if title/handle clearly identifies user on TikTok
    if not has_stats:
        is_tiktok_profile = (
            (og_username and "tiktok" in title_text.lower())
            or (target_username and avatar_url)
            or ("watch" in desc_text.lower() and og_username)
        )
        if not is_tiktok_profile:
            return None

    return {
        "username": og_username or target_username,
        "followers": parse_stat_value(followers_match.group(1)) if followers_match else 0,
        "following": parse_stat_value(following_match.group(1)) if following_match else 0,
        "likes": _fix_int32_overflow(
            parse_stat_value(likes_match.group(1)) if likes_match else 0
        ),
        "avatar_url": avatar_url,
        "is_private": False,
    }


def extract_from_dom(soup: BeautifulSoup, target_username: str | None = None) -> dict | None:
    """Parser v3: Fallback DOM element extractor (`data-e2e` selectors)."""
    followers_tag = soup.find("strong", {"data-e2e": "followers-count"})
    following_tag = soup.find("strong", {"data-e2e": "following-count"})
    likes_tag = soup.find("strong", {"data-e2e": "likes-count"})

    title_tag = soup.find("h1", {"data-e2e": "user-title"}) or soup.find(
        "h2", {"data-e2e": "user-subtitle"}
    )
    dom_username = normalize_username(title_tag.get_text()) if title_tag else None

    has_counts = bool(followers_tag or following_tag or likes_tag)
    if not has_counts and not dom_username:
        return None

    avatar_tag = soup.find("img", {"data-e2e": "user-avatar"}) or soup.find(
        "div", {"data-e2e": "user-avatar"}
    )
    avatar_url = None
    if avatar_tag:
        if avatar_tag.name == "img" and avatar_tag.get("src"):
            avatar_url = avatar_tag["src"]
        else:
            inner_img = avatar_tag.find("img")
            if inner_img and inner_img.get("src"):
                avatar_url = inner_img["src"]

    bio_tag = soup.find("h2", {"data-e2e": "user-bio"})
    bio = bio_tag.get_text().strip() if bio_tag else None

    return {
        "username": dom_username or target_username,
        "bio": bio,
        "followers": parse_stat_value(followers_tag.get_text()) if followers_tag else 0,
        "following": parse_stat_value(following_tag.get_text()) if following_tag else 0,
        "likes": _fix_int32_overflow(
            parse_stat_value(likes_tag.get_text()) if likes_tag else 0
        ),
        "avatar_url": avatar_url,
        "is_private": False,
    }
