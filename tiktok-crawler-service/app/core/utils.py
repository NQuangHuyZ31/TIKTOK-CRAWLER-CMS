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


def resolve_date_bounds(
    target_date: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    tz_name: str | None = "Asia/Ho_Chi_Minh",
) -> tuple[str | None, str | None]:
    """
    Normalizes target_date ('today', 'yesterday', 'YYYY-MM-DD') or date_from/date_to
    into UTC ISO datetime strings: (start_utc_iso, end_utc_iso).
    """
    from datetime import datetime, time, timedelta, timezone
    from zoneinfo import ZoneInfo

    try:
        tz = ZoneInfo(tz_name or "Asia/Ho_Chi_Minh")
    except Exception:
        tz = timezone(timedelta(hours=7))

    if target_date:
        td = target_date.strip().lower()
        now_local = datetime.now(tz)
        if td == "today":
            t_date = now_local.date()
        elif td == "yesterday":
            t_date = (now_local - timedelta(days=1)).date()
        else:
            t_date = datetime.strptime(td, "%Y-%m-%d").date()

        start_local = datetime.combine(t_date, time.min, tzinfo=tz)
        end_local = datetime.combine(t_date, time.max, tzinfo=tz)
        start_utc = start_local.astimezone(timezone.utc).replace(tzinfo=None)
        end_utc = end_local.astimezone(timezone.utc).replace(tzinfo=None)
        return start_utc.isoformat(), end_utc.isoformat()

    out_from: str | None = None
    out_to: str | None = None

    if date_from:
        df = date_from.strip()
        if len(df) == 10 and "-" in df:
            d = datetime.strptime(df, "%Y-%m-%d").date()
            dt = datetime.combine(d, time.min, tzinfo=tz)
            out_from = dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat()
        else:
            dt = datetime.fromisoformat(df)
            if dt.tzinfo:
                out_from = dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat()
            else:
                out_from = dt.isoformat()

    if date_to:
        dt_val = date_to.strip()
        if len(dt_val) == 10 and "-" in dt_val:
            d = datetime.strptime(dt_val, "%Y-%m-%d").date()
            dt = datetime.combine(d, time.max, tzinfo=tz)
            out_to = dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat()
        else:
            dt = datetime.fromisoformat(dt_val)
            if dt.tzinfo:
                out_to = dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat()
            else:
                out_to = dt.isoformat()

    return out_from, out_to
