from datetime import datetime
import json
from html import unescape
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from models import TikTokAccount


def extract_profile(
    html: str,
    profile_url: str
) -> TikTokAccount:
    """
    Extract TikTok account information from HTML.
    """

    soup = BeautifulSoup(html, "html.parser")

    # Lấy username và các chỉ số thống kê từ profile page.
    username_tag = soup.find(
        "h2",
        {"data-e2e": "user-subtitle"}
    )

    username = (
        username_tag.get_text(strip=True)
        if username_tag
        else None
    )

    followers_tag = soup.find(
        "strong",
        {"data-e2e": "followers-count"}
    )

    followers = parse_count(followers_tag)

    following_tag = soup.find(
        "strong",
        {"data-e2e": "following-count"}
    )

    following = parse_count(following_tag)

    likes_tag = soup.find(
        "strong",
        {"data-e2e": "likes-count"}
    )

    likes = parse_count(likes_tag)

    # Avatar có thể nằm trong img hoặc meta og:image tùy HTML TikTok trả về.
    avatar_url = extract_avatar_url(soup)

    now = datetime.now()

    # Tạo object trung gian để crawler serialize và gửi qua callback.
    account = TikTokAccount(
        username=username,
        followers=followers,
        following=following,
        likes=likes,
        profile_url=profile_url,
        avatar_url=avatar_url,
        crawled_at=now,
        status="active" if username else "inactive",
        last_crawled_at=now
    )

    return account


def extract_avatar_url(soup: BeautifulSoup) -> str | None:
    """Extract the profile avatar URL from the profile page HTML."""
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

    # TikTok frequently stores the rendered profile data in JSON script tags
    # instead of exposing the avatar as a stable DOM attribute.
    avatar_keys = (
        "avatarLarger",
        "avatarMedium",
        "avatarThumb",
        "avatar_url",
        "avatarUrl",
    )
    for script in soup.select("script"):
        script_text = script.string or script.get_text()
        if not script_text:
            continue

        try:
            data = json.loads(script_text)
        except (TypeError, json.JSONDecodeError):
            continue

        avatar_url = find_avatar_in_json(data, avatar_keys)
        if avatar_url:
            return avatar_url

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


def find_avatar_in_json(value, avatar_keys: tuple[str, ...]) -> str | None:
    """Recursively find a profile avatar URL in embedded TikTok JSON."""
    if isinstance(value, dict):
        for key in avatar_keys:
            avatar_url = normalize_avatar_url(value.get(key))
            if avatar_url:
                return avatar_url
        for nested_value in value.values():
            avatar_url = find_avatar_in_json(nested_value, avatar_keys)
            if avatar_url:
                return avatar_url
    elif isinstance(value, list):
        for item in value:
            avatar_url = find_avatar_in_json(item, avatar_keys)
            if avatar_url:
                return avatar_url

    return None


def parse_count(tag) -> int:

    if not tag:
        return 0

    text = tag.get_text(strip=True)

    return parse_count_text(text)


def parse_count_text(text: str) -> int:


    if not text:
        return 0

    # Chuẩn hóa các dạng 1.2K, 3M, 4B trước khi chuyển sang integer.
    text = (
        text
        .strip()
        .replace(",", "")
        .replace(" ", "")
        .upper()
    )

    try:

        # Thousand
        if text.endswith("K"):
            number = float(text[:-1])
            return int(number * 1_000)

        # Million
        if text.endswith("M"):
            number = float(text[:-1])
            return int(number * 1_000_000)

        # Billion
        if text.endswith("B"):
            number = float(text[:-1])
            return int(number * 1_000_000_000)

        # Normal number
        return int(float(text))

    except (ValueError, TypeError):
        return 0