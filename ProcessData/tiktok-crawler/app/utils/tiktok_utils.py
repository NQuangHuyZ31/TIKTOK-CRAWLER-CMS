import re

from playwright.async_api import Page


def normalize_username(username: str) -> str:
    return (
        username
        .strip()
        .lstrip("@")
        .split("?")[0]
        .split("/")[0]
    )


def extract_username_from_href(href: str | None) -> str | None:
    if not href or "/@" not in href:
        return None

    username = normalize_username(href.split("/@")[-1])

    return username if is_valid_username(username) else None


def is_valid_username(username: str) -> bool:
    placeholders = {
        "profile",
        "user",
        "username",
        "unknown",
        "follow",
    }

    return (
        bool(re.fullmatch(r"[A-Za-z0-9._]{2,24}", username))
        and username.lower() not in placeholders
    )


def build_profile_url(username: str) -> str:
    return f"https://www.tiktok.com/@{username}"


async def extract_username_from_video(
    page: Page,
    excluded_usernames: set[str] | None = None,
) -> str | None:

    excluded_usernames = excluded_usernames or set()

    selectors = [
        'a[data-e2e="video-author-uniqueid"]',
        'a[data-e2e="video-author-avatar"]',
    ]

    for selector in selectors:
        try:
            elements = page.locator(selector)

            count = await elements.count()

            for index in range(count):
                element = elements.nth(index)

                if not await element.is_visible():
                    continue

                href = await element.get_attribute("href")

                username = extract_username_from_href(href)

                if not username:
                    continue

                if username in excluded_usernames:
                    continue

                return username

        except Exception:
            continue

    return None