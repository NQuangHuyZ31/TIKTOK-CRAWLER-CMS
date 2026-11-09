from datetime import datetime
import json
import logging
from bs4 import BeautifulSoup

from core.utils import normalize_username
from crawler.profile_parser import (
    CHALLENGE_STATUS_CODES,
    NOT_FOUND_STATUS_CODES,
    ExtractorError,
    extract_from_dom,
    extract_from_opengraph,
    extract_from_rehydration_json,
    extract_from_sigi_state,
)
from schemas.models import TikTokAccount

logger = logging.getLogger(__name__)

__all__ = [
    "ExtractorError",
    "NOT_FOUND_STATUS_CODES",
    "CHALLENGE_STATUS_CODES",
    "extract_profile",
    "extract_from_rehydration_json",
    "extract_from_sigi_state",
    "extract_from_opengraph",
    "extract_from_dom",
]


def extract_profile(
    body: str,
    profile_url: str,
    target_username: str | None = None,
) -> TikTokAccount:
    """
    Main extraction coordinator:
    1. Parse __UNIVERSAL_DATA_FOR_REHYDRATION__ (v1 primary)
    2. Fallback to SIGI_STATE (v2)
    3. Fallback to DOM elements & OpenGraph meta tags (v3 / v4)
    """
    if not body:
        raise ExtractorError("EMPTY_RESPONSE", "Response body is empty", is_retryable=True)

    clean_user = normalize_username(target_username)
    soup = BeautifulSoup(body, "html.parser")

    # Step 1: Rehydration script
    tag_rehydration = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")
    if tag_rehydration:
        raw_json = tag_rehydration.string or tag_rehydration.get_text()
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                extracted = extract_from_rehydration_json(parsed, clean_user)
                if extracted:
                    return _build_account(extracted, profile_url, clean_user)
            except json.JSONDecodeError:
                pass

    # Step 2: SIGI_STATE
    tag_sigi = soup.find("script", id="SIGI_STATE")
    if tag_sigi:
        raw_json = tag_sigi.string or tag_sigi.get_text()
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                extracted = extract_from_sigi_state(parsed, clean_user)
                if extracted:
                    return _build_account(extracted, profile_url, clean_user)
            except json.JSONDecodeError:
                pass

    # Step 3: OpenGraph & DOM Fallback
    extracted_og = extract_from_opengraph(soup, clean_user)
    if extracted_og:
        return _build_account(extracted_og, profile_url, clean_user)

    extracted_dom = extract_from_dom(soup, clean_user)
    if extracted_dom:
        return _build_account(extracted_dom, profile_url, clean_user)

    # If extraction failed, differentiate between genuine Security Challenge / Captcha vs missing account
    title_text = soup.title.string.strip() if soup.title and soup.title.string else ""
    title_lower = title_text.lower()

    is_challenge = False
    challenge_signatures = (
        "security verification",
        "security check",
        "verify to continue",
        "please verify",
        "robot",
        "human verification",
        "captcha",
    )
    if any(sig in title_lower for sig in challenge_signatures):
        is_challenge = True
    elif soup.find(class_=lambda c: c and any(k in str(c).lower() for k in ("captcha", "secsdk-captcha", "captcha_verify_container"))):
        is_challenge = True
    elif soup.find(id=lambda i: i and any(k in str(i).lower() for k in ("captcha", "verify-ele"))):
        is_challenge = True
    elif "secsdk-captcha" in body or "captcha_verify_container" in body or "verify-bar-close" in body:
        is_challenge = True
    elif (
        "_wafchallengeid" in body
        or "waforiginalreid" in body
        or "slardarwaf" in body.lower()
        or "slardar_us_waf" in body.lower()
    ):
        is_challenge = True

    if is_challenge:
        desc = title_text or "ByteDance Slardar WAF / Captcha"
        raise ExtractorError("CHALLENGE", f"TikTok challenge encountered: {desc}", is_retryable=False)

    raise ExtractorError("NOT_FOUND", f"Could not extract TikTok profile for @{clean_user or 'unknown'}", is_retryable=False)


def _build_account(
    data: dict,
    profile_url: str,
    target_username: str | None,
) -> TikTokAccount:
    username = normalize_username(data.get("username")) or target_username or "unknown"
    now = datetime.now()
    return TikTokAccount(
        username=username,
        profile_url=profile_url,
        nickname=data.get("nickname"),
        bio=data.get("bio"),
        is_verified=bool(data.get("is_verified")),
        is_private=bool(data.get("is_private")),
        followers=max(0, data.get("followers") or 0),
        following=max(0, data.get("following") or 0),
        likes=max(0, data.get("likes") or 0),
        video_count=max(0, data.get("video_count") or 0),
        avatar_url=data.get("avatar_url"),
        avatar_path=data.get("avatar_path"),
        sec_uid=data.get("sec_uid"),
        status="active",
        crawled_at=now,
    )
