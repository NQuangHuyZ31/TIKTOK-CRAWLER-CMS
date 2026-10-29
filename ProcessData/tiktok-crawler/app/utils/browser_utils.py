import logging
from playwright.async_api import Page, Response

logger = logging.getLogger(__name__)


async def open_url(
    page: Page,
    url: str,
    wait_until: str = "domcontentloaded",
    timeout: int = 25000,
) -> Response | None:
    """
    Navigate the browser page to the specified URL.

    Returns the Playwright HTTP Response object so callers can inspect
    the status code (e.g. 200, 404, 403, 500) and redirect chain.
    """
    try:
        response = await page.goto(
            url,
            wait_until=wait_until,
            timeout=timeout,
        )
        return response
    except Exception as error:
        logger.warning("Navigation failed or timed out for %s: %s", url, error)
        return None


async def go_back(
    page: Page,
    wait_until: str = "domcontentloaded",
    timeout: int = 10000,
) -> None:
    """Return from a profile or sub-page to the previous page (e.g. TikTok feed)."""
    try:
        await page.go_back(
            wait_until=wait_until,
            timeout=timeout,
        )
    except Exception as error:
        logger.warning("Back navigation warning: %s", error)


async def scroll_page(
    page: Page,
    distance: int = 700,
    wait_time: int = 1500,
) -> None:
    """Scroll down the current page (used for feed discovery)."""
    try:
        await page.bring_to_front()
        await page.mouse.move(640, 360)
        await page.mouse.wheel(0, distance)
        await page.keyboard.press("PageDown")
        if wait_time > 0:
            await page.wait_for_timeout(wait_time)
    except Exception as error:
        logger.debug("Scroll page warning: %s", error)


async def safe_wait(
    page: Page,
    milliseconds: int,
) -> None:
    """Pause execution for a specific duration in milliseconds."""
    try:
        await page.wait_for_timeout(milliseconds)
    except Exception:
        pass
