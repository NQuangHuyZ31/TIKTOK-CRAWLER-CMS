from playwright.async_api import Page


# util funtions for normalizing username
def normalize_username(username: str) -> str:
    return (
        username
        .strip()
        .lstrip("@")
        .split("?")[0]
        .split("/")[0]
    )


# util function for extracting username from video
async def extract_username_from_video(
    page: Page,
):
    selectors = [
        'a[data-e2e="video-author-avatar"]',
        'a[data-e2e="video-author-uniqueid"]',
        'a[href^="/@"]',
    ]

    for selector in selectors:

        try:
            element = page.locator(
                selector
            ).first

            if await element.count() == 0:
                continue

            href = await element.get_attribute(
                "href"
            )

            if href and "/@" in href:

                username = (
                    href
                    .split("/@")[-1]
                    .split("?")[0]
                    .strip("/")
                )

                if username:
                    return normalize_username(
                        username
                    )

            text = await element.inner_text()

            if text:

                text = normalize_username(text)

                if text:
                    return text

        except Exception:
            continue

    return None


# util function for building profile url
def build_profile_url(username: str) -> str:
    return f"https://www.tiktok.com/@{username}"