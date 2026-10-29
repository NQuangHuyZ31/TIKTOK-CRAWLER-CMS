import logging
from playwright.async_api import Error as PlaywrightError, Page, Response

logger = logging.getLogger(__name__)


class NavigationError(Exception):
    """Raised when page navigation fails due to timeout, network drop, or browser error."""

    def __init__(self, url: str, message: str, status_code: int | None = None):
        super().__init__(f"Failed to navigate to {url}: {message}")
        self.url = url
        self.message = message
        self.status_code = status_code


async def open_url(
    page: Page,
    url: str,
    wait_until: str = "domcontentloaded",
    timeout: int = 25000,
) -> Response | None:
    """
    Navigate the browser page to the specified URL.

    Raises:
        NavigationError: When the page cannot be loaded due to timeout,
                         network drop, DNS failure, or closed page.

    Returns:
        Response | None: Playwright HTTP Response object if an HTTP response was generated.
    """
    if page.is_closed():
        raise NavigationError(url, "Browser page is closed")

    try:
        response = await page.goto(
            url,
            wait_until=wait_until,
            timeout=timeout,
        )
        return response
    except PlaywrightError as error:
        logger.warning("Navigation failed for %s: %s", url, error)
        raise NavigationError(url, str(error)) from error
    except Exception as error:
        logger.exception("Unexpected navigation exception for %s: %s", url, error)
        raise NavigationError(url, f"Unexpected error: {error}") from error


async def go_back(
    page: Page,
    wait_until: str = "domcontentloaded",
    timeout: int = 10000,
) -> bool:
    """
    Return from a profile or sub-page to the previous page (e.g. TikTok feed).

    Returns:
        bool: True if back navigation succeeded, False if it failed or had no history.
    """
    if page.is_closed():
        logger.warning("Cannot navigate back: Browser page is closed")
        return False

    try:
        await page.go_back(
            wait_until=wait_until,
            timeout=timeout,
        )
        return True
    except PlaywrightError as error:
        logger.warning("Back navigation failed from %s: %s", page.url, error)
        return False
    except Exception as error:
        logger.warning("Unexpected error during back navigation from %s: %s", page.url, error)
        return False


async def scroll_page(
    page: Page,
    distance: int = 700,
    wait_time: int = 1500,
) -> bool:
    """
    Scroll down the current page (used for feed discovery).

    Returns:
        bool: True if scroll gesture was dispatched successfully, False otherwise.
    """
    if page.is_closed():
        logger.warning("Cannot scroll: Browser page is closed")
        return False

    try:
        await page.bring_to_front()
        await page.mouse.move(640, 360)
        await page.mouse.wheel(0, distance)
        await page.keyboard.press("PageDown")
        if wait_time > 0:
            await page.wait_for_timeout(wait_time)
        return True
    except PlaywrightError as error:
        logger.warning("Scroll failed on %s: %s", page.url, error)
        return False
    except Exception as error:
        logger.warning("Unexpected error during scroll on %s: %s", page.url, error)
        return False


async def safe_wait(
    page: Page,
    milliseconds: int,
) -> None:
    """
    Pause execution for a specific duration in milliseconds.

    Raises:
        RuntimeError: If the browser page is already closed.
    """
    if page.is_closed():
        raise RuntimeError("Cannot wait: Browser page is closed")
    await page.wait_for_timeout(milliseconds)
