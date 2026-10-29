import logging
from playwright.async_api import Page

logger = logging.getLogger(__name__)


async def open_url(
    page: Page,
    url: str,
    timeout: int = 15000,
    wait_time: int = 3000,
):
    try:
        await page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=timeout,
        )
    except Exception as error:
        logger.warning("Navigation warning for %s: %s", url, error)

    # Wait for either TikTok profile stats or feed to appear, or timeout gracefully
    try:
        await page.wait_for_selector(
            'strong[data-e2e="followers-count"], [data-e2e="feed-video"]',
            timeout=5000,
        )
    except Exception:
        pass

    await page.wait_for_timeout(wait_time)


async def go_back(
    page: Page,
    timeout: int = 10000,
    wait_time: int = 2500,
):
    """Return from a profile page to the TikTok feed."""
    try:
        await page.go_back(
            wait_until="domcontentloaded",
            timeout=timeout,
        )
    except Exception as error:
        logger.warning("Back navigation warning: %s", error)

    await page.wait_for_timeout(wait_time)


async def scroll_page(
    page: Page,
    distance: int = 700,
    wait_time: int = 2500,
):
    # Đảm bảo sự kiện scroll được gửi vào feed page, không phải profile page.
    await page.bring_to_front()
    await page.mouse.move(640, 360)
    await page.mouse.wheel(0, distance)
    await page.keyboard.press("PageDown")

    # TikTok thường cập nhật video bằng JavaScript sau khi nhận wheel/PageDown.
    await page.wait_for_timeout(wait_time)
