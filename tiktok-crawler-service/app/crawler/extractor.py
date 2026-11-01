from datetime import datetime
import html
import json
import logging
import re
from bs4 import BeautifulSoup

from core.utils import normalize_username, parse_stat_value
from schemas.models import TikTokAccount

logger = logging.getLogger(__name__)

# TikTok status codes in __UNIVERSAL_DATA_FOR_REHYDRATION__ indicating missing/deleted user
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
    """
    Parser v1: Extract from `__UNIVERSAL_DATA_FOR_REHYDRATION__` JSON structure.
    Raises ExtractorError if TikTok explicitly reports NOT_FOUND or CHALLENGE statusCode.
    """
    default_scope = data.get("__DEFAULT_SCOPE__")
    if not isinstance(default_scope, dict):
        return None

    user_detail = default_scope.get("webapp.user-detail")
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
    if not desc_meta or not desc_meta.get("content"):
        return None

    desc_text = html.unescape(str(desc_meta.get("content", ""))).strip()
    if not desc_text:
        return None

    followers_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+Followers", desc_text, re.IGNORECASE
    )
    following_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+Following", desc_text, re.IGNORECASE
    )
    likes_match = re.search(
        r"([0-9][0-9.,]*\s*[KMBkmb]?)\s+Likes", desc_text, re.IGNORECASE
    )

    if not any([followers_match, following_match, likes_match]):
        return None

    handle_match = re.search(r"@([A-Za-z0-9._-]+)", desc_text)
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
    """Parser v3: Fallback DOM element extractor (`data-e2e` selectors + OpenGraph meta tags)."""
    title_tag = soup.find("h1", {"data-e2e": "user-title"}) or soup.find(
        "h2", {"data-e2e": "user-subtitle"}
    )
    followers_tag = soup.find("strong", {"data-e2e": "followers-count"})
    following_tag = soup.find("strong", {"data-e2e": "following-count"})
    likes_tag = soup.find("strong", {"data-e2e": "likes-count"})

    if not any([title_tag, followers_tag, following_tag, likes_tag]):
        return extract_from_opengraph(soup, target_username=target_username)

    dom_username = normalize_username(title_tag.get_text(strip=True)) if title_tag else None
    if target_username and dom_username and dom_username.lower() != target_username.lower():
        return None

    avatar_img = soup.find("img", {"data-e2e": "user-avatar"}) or soup.find(
        "div", {"data-e2e": "user-avatar"}
    )
    avatar_url = None
    if avatar_img:
        if avatar_img.name == "img":
            avatar_url = avatar_img.get("src")
        else:
            nested = avatar_img.find("img")
            if nested:
                avatar_url = nested.get("src")

    is_private = bool(
        soup.find(string=lambda s: s and "this account is private" in s.lower())
    )

    return {
        "username": dom_username or target_username,
        "followers": parse_stat_value(followers_tag.get_text(strip=True)) if followers_tag else None,
        "following": parse_stat_value(following_tag.get_text(strip=True)) if following_tag else None,
        "likes": _fix_int32_overflow(
            parse_stat_value(likes_tag.get_text(strip=True)) if likes_tag else None
        ),
        "avatar_url": avatar_url,
        "is_private": is_private,
    }


def _check_dom_error_markers(soup: BeautifulSoup, profile_url: str) -> None:
    """Check if the HTML DOM indicates a challenge/CAPTCHA or a 404 user-not-found page."""
    if (
        soup.find(
            attrs={
                "class": lambda c: c
                and any(
                    marker in str(c)
                    for marker in (
                        "captcha_verify_container",
                        "secsdk-captcha",
                        "verify-wrap",
                        "_wafchallengeid",
                    )
                )
            }
        )
        or soup.find(id="captcha-verify-image")
        or soup.find(attrs={"data-e2e": "sec-sdk-iframe"})
    ):
        raise ExtractorError(
            "CHALLENGE",
            f"TikTok CAPTCHA or WAF challenge detected on {profile_url}",
            is_retryable=False,
        )

    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True).lower() if title_tag else ""
    desc_meta = soup.find("meta", attrs={"property": "og:description"})
    desc_text = str(desc_meta.get("content", "")).strip().lower() if desc_meta else ""

    if (
        soup.find(attrs={"data-e2e": "user-not-found"})
        or soup.find(string=lambda s: s and "couldn't find this account" in s.lower())
        or "visit tiktok to discover profiles" in title_text
        or desc_text == "watch, follow, and discover more trending content."
    ):
        raise ExtractorError(
            "NOT_FOUND",
            f"TikTok account not found on {profile_url}",
            is_retryable=False,
        )


def extract_profile(
    body: str,
    profile_url: str,
    target_username: str | None = None,
) -> TikTokAccount:
    """
    Extract TikTokAccount from HTTP response body (JSON or SSR HTML).
    Raises ExtractorError with error_code in ('NOT_FOUND', 'CHALLENGE', 'PARSE_ERROR').
    """
    clean_target = normalize_username(target_username)
    if not clean_target and "/@" in profile_url:
        clean_target = normalize_username(profile_url.rstrip("/").split("/@")[-1])

    stripped = (body or "").strip()
    if not stripped:
        raise ExtractorError("PARSE_ERROR", "Empty response body from TikTok", is_retryable=True)

    extracted: dict | None = None
    observed_json_keys: list[str] = []

    # Case 1: Direct JSON response
    if stripped.startswith("{"):
        try:
            payload = json.loads(stripped)
            if isinstance(payload, dict):
                observed_json_keys.extend(list(payload.keys())[:15])
                if "__DEFAULT_SCOPE__" in payload:
                    extracted = extract_from_rehydration_json(payload, target_username=clean_target)
                elif "UserModule" in payload:
                    extracted = extract_from_sigi_state(payload, target_username=clean_target)
                elif "userInfo" in payload and isinstance(payload.get("userInfo"), dict):
                    extracted = _extract_from_user_info_node(
                        payload["userInfo"], target_username=clean_target
                    )
        except ExtractorError:
            raise
        except json.JSONDecodeError:
            pass

    # Case 2: SSR HTML response with embedded scripts
    if extracted is None:
        soup = BeautifulSoup(stripped, "html.parser")

        rehydration_tag = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
        raw_rehydration = (
            (rehydration_tag.string or rehydration_tag.get_text())
            if rehydration_tag
            else None
        )
        if raw_rehydration:
            try:
                rehydration_data = json.loads(raw_rehydration)
                if isinstance(rehydration_data, dict):
                    scope = rehydration_data.get("__DEFAULT_SCOPE__")
                    if isinstance(scope, dict):
                        observed_json_keys.extend(list(scope.keys())[:15])
                    extracted = extract_from_rehydration_json(
                        rehydration_data, target_username=clean_target
                    )
            except ExtractorError:
                raise
            except json.JSONDecodeError as err:
                logger.warning("Failed to parse __UNIVERSAL_DATA_FOR_REHYDRATION__: %s", err)

        if extracted is None:
            sigi_tag = soup.find("script", id="SIGI_STATE")
            raw_sigi = (sigi_tag.string or sigi_tag.get_text()) if sigi_tag else None
            if raw_sigi:
                try:
                    sigi_data = json.loads(raw_sigi)
                    if isinstance(sigi_data, dict):
                        observed_json_keys.extend(list(sigi_data.keys())[:15])
                        extracted = extract_from_sigi_state(
                            sigi_data, target_username=clean_target
                        )
                except ExtractorError:
                    raise
                except json.JSONDecodeError as err:
                    logger.warning("Failed to parse SIGI_STATE: %s", err)

        if extracted is None:
            _check_dom_error_markers(soup, profile_url)
            extracted = extract_from_dom(soup, target_username=clean_target)

    if not extracted:
        logger.warning(
            "Schema drift or unrecognized page structure for @%s (observed_keys=%s)",
            clean_target or "unknown",
            observed_json_keys,
        )
        raise ExtractorError(
            "PARSE_ERROR",
            f"Could not extract profile data for @{clean_target or 'unknown'} "
            f"(observed_keys={observed_json_keys})",
            is_retryable=True,
        )

    followers = extracted.get("followers")
    following = extracted.get("following")
    likes = extracted.get("likes")
    is_private = bool(extracted.get("is_private"))

    if not is_private and followers is None and following is None and likes is None:
        raise ExtractorError(
            "PARSE_ERROR",
            f"All profile stats missing for @{clean_target or extracted.get('username')}",
            is_retryable=True,
        )

    now = datetime.now()
    final_username = normalize_username(extracted.get("username")) or clean_target

    return TikTokAccount(
        username=final_username,
        sec_uid=extracted.get("sec_uid"),
        nickname=extracted.get("nickname"),
        bio=extracted.get("bio"),
        is_verified=bool(extracted.get("is_verified", False)),
        followers=followers if followers is not None else 0,
        following=following if following is not None else 0,
        likes=likes if likes is not None else 0,
        video_count=int(extracted.get("video_count") or 0),
        profile_url=profile_url,
        avatar_url=extracted.get("avatar_url"),
        avatar_path=None,
        crawled_at=now,
        last_crawled_at=now,
        status="active" if final_username else "inactive",
    )
