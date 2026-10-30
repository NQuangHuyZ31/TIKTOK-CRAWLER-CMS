import re
from urllib.parse import urlparse


def normalize_username(username: str | None) -> str:
    """Normalize a TikTok username by stripping whitespace, '@' prefix, and query params."""
    if not username:
        return ""
    cleaned = str(username).strip()
    if not cleaned or cleaned.lower() in {"na", "null", "none", "nan"}:
        return ""
    if "tiktok.com/" in cleaned.lower():
        return extract_username_from_url(cleaned)
    cleaned = cleaned.split("?")[0].split("/")[0].lstrip("@").strip()
    if not cleaned:
        return ""
    return cleaned


def extract_username_from_url(url: str | None) -> str:
    """Extract normalized TikTok username from a profile or video URL."""
    if not url:
        return ""
    text = str(url).strip()
    match = re.search(r"tiktok\.com/@([A-Za-z0-9._-]+)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    parsed = urlparse(text)
    path = parsed.path.rstrip("/")
    if "/@" in path:
        candidate = path.split("/@")[-1].split("/")[0]
        return candidate.lstrip("@").strip()
    return ""


def build_profile_url(username: str) -> str:
    """Build canonical TikTok profile URL for a username."""
    clean = normalize_username(username)
    if not clean:
        raise ValueError("Username cannot be empty")
    return f"https://www.tiktok.com/@{clean}"


def parse_stat_value(raw_value: str | int | float | None) -> int | None:
    """Parse TikTok counter values (e.g. '1.2M', '45.3K', '1,234', 500) into integers."""
    if raw_value is None:
        return None
    if isinstance(raw_value, bool):
        return None
    if isinstance(raw_value, int):
        return raw_value
    if isinstance(raw_value, float):
        return int(raw_value)

    text = str(raw_value).strip().replace(",", "")
    if not text or text in {"-", "N/A", "null", "None"}:
        return None

    multipliers = {
        "K": 1_000,
        "M": 1_000_000,
        "B": 1_000_000_000,
    }
    upper = text.upper()
    for suffix, factor in multipliers.items():
        if upper.endswith(suffix):
            try:
                return int(float(upper[:-1]) * factor)
            except ValueError:
                return None

    try:
        return int(float(text))
    except ValueError:
        return None
