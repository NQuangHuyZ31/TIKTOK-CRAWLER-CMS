import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from playwright.async_api import Error as PlaywrightError
from utils.browser_utils import NavigationError, go_back, open_url, safe_wait, scroll_page


class TestBrowserUtils(unittest.TestCase):

    def test_open_url_success(self):
        page = MagicMock()
        page.is_closed.return_value = False
        mock_response = MagicMock()
        mock_response.status = 200
        page.goto = AsyncMock(return_value=mock_response)

        res = asyncio.run(open_url(page, "https://www.tiktok.com/@test"))
        self.assertEqual(res, mock_response)
        page.goto.assert_called_once()

    def test_open_url_raises_navigation_error_on_playwright_error(self):
        page = MagicMock()
        page.is_closed.return_value = False
        page.goto = AsyncMock(side_effect=PlaywrightError("Timeout 25000ms exceeded"))

        with self.assertRaises(NavigationError) as ctx:
            asyncio.run(open_url(page, "https://www.tiktok.com/@timeout"))

        self.assertIn("Timeout 25000ms exceeded", str(ctx.exception))
        self.assertEqual(ctx.exception.url, "https://www.tiktok.com/@timeout")

    def test_open_url_raises_navigation_error_when_page_closed(self):
        page = MagicMock()
        page.is_closed.return_value = True

        with self.assertRaises(NavigationError) as ctx:
            asyncio.run(open_url(page, "https://www.tiktok.com/@closed"))

        self.assertIn("Browser page is closed", str(ctx.exception))

    def test_go_back_returns_boolean(self):
        page = MagicMock()
        page.is_closed.return_value = False
        page.go_back = AsyncMock()

        self.assertTrue(asyncio.run(go_back(page)))

        # When Playwright error occurs (e.g. no history)
        page.go_back = AsyncMock(side_effect=PlaywrightError("Cannot go back"))
        self.assertFalse(asyncio.run(go_back(page)))

        # When page is closed
        page.is_closed.return_value = True
        self.assertFalse(asyncio.run(go_back(page)))

    def test_scroll_page_returns_boolean(self):
        page = MagicMock()
        page.is_closed.return_value = False
        page.bring_to_front = AsyncMock()
        page.mouse = MagicMock()
        page.mouse.move = AsyncMock()
        page.mouse.wheel = AsyncMock()
        page.keyboard = MagicMock()
        page.keyboard.press = AsyncMock()
        page.wait_for_timeout = AsyncMock()

        self.assertTrue(asyncio.run(scroll_page(page, wait_time=0)))

        # When page is closed
        page.is_closed.return_value = True
        self.assertFalse(asyncio.run(scroll_page(page)))

    def test_safe_wait_raises_when_page_closed(self):
        page = MagicMock()
        page.is_closed.return_value = True

        with self.assertRaises(RuntimeError):
            asyncio.run(safe_wait(page, 1000))


if __name__ == "__main__":
    unittest.main()
