import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from models import TikTokAccount
from services.profile_crawler import ProfileCrawler
from utils.browser_utils import NavigationError


class TestProfileCrawler(unittest.TestCase):

    def setUp(self):
        self.crawler = ProfileCrawler()

    def test_crawl_rejects_success_when_no_evidence_on_page(self):
        """P0: If no stats and no verified username found on page, it must FAIL, not report success."""
        page = MagicMock()
        page.is_closed.return_value = False
        page.url = "https://www.tiktok.com/@ghost_user"
        page.title = AsyncMock(return_value="TikTok - Empty Page")
        page.content = AsyncMock(return_value="<html><body><div>Empty DOM</div></body></html>")
        page.wait_for_function = AsyncMock()
        page.wait_for_selector = AsyncMock()

        mock_response = MagicMock()
        mock_response.status = 200

        with patch("services.profile_crawler.open_url", new_callable=AsyncMock) as mock_open:
            mock_open.return_value = mock_response

            account, status, error = asyncio.run(
                self.crawler.crawl(page, "ghost_user", "https://www.tiktok.com/@ghost_user")
            )

            self.assertEqual(status, "failed")
            self.assertIsNone(account)
            self.assertIn("no verified data found on page", error)

    def test_crawl_detects_username_mismatch(self):
        """P0: If extracted username does not match target, fail with mismatch error."""
        page = MagicMock()
        page.is_closed.return_value = False
        page.url = "https://www.tiktok.com/@wrong_user"
        page.title = AsyncMock(return_value="Wrong User")
        # Page contains a different user: charlidamelio
        html = """
        <html>
        <body>
          <h1 data-e2e="user-title">charlidamelio</h1>
          <strong data-e2e="followers-count">100M</strong>
          <strong data-e2e="following-count">100</strong>
          <strong data-e2e="likes-count">1B</strong>
        </body>
        </html>
        """
        page.content = AsyncMock(return_value=html)
        page.wait_for_function = AsyncMock()

        mock_response = MagicMock()
        mock_response.status = 200

        with patch("services.profile_crawler.open_url", new_callable=AsyncMock) as mock_open:
            mock_open.return_value = mock_response

            account, status, error = asyncio.run(
                self.crawler.crawl(page, "khaby.lame", "https://www.tiktok.com/@khaby.lame")
            )

            self.assertEqual(status, "failed")
            self.assertIsNone(account)
            self.assertIn("Username mismatch", error)

    def test_crawl_handles_private_account(self):
        """P0: Private account with verified username must be classified with status='private'."""
        page = MagicMock()
        page.is_closed.return_value = False
        page.url = "https://www.tiktok.com/@private_person"
        page.title = AsyncMock(return_value="private_person on TikTok")
        html = """
        <html>
        <body>
          <h1 data-e2e="user-title">private_person</h1>
          <div>This account is private</div>
        </body>
        </html>
        """
        page.content = AsyncMock(return_value=html)
        page.wait_for_function = AsyncMock()

        mock_response = MagicMock()
        mock_response.status = 200

        with patch("services.profile_crawler.open_url", new_callable=AsyncMock) as mock_open:
            mock_open.return_value = mock_response

            account, status, error = asyncio.run(
                self.crawler.crawl(page, "private_person", "https://www.tiktok.com/@private_person")
            )

            self.assertEqual(status, "success")
            self.assertIsNotNone(account)
            self.assertEqual(account.status, "private")
            self.assertEqual(account.username, "private_person")

    def test_crawl_handles_http_errors(self):
        """P1: HTTP 404, 403, and 500 must be classified accurately."""
        page = MagicMock()
        page.is_closed.return_value = False
        page.url = "https://www.tiktok.com/@deleted_user"

        for code, expected_status in [(404, "not_found"), (403, "challenge"), (500, "failed")]:
            mock_resp = MagicMock()
            mock_resp.status = code

            with patch("services.profile_crawler.open_url", new_callable=AsyncMock) as mock_open:
                mock_open.return_value = mock_resp

                account, status, error = asyncio.run(
                    self.crawler.crawl(page, "deleted_user", "https://www.tiktok.com/@deleted_user")
                )

                self.assertEqual(status, expected_status)
                self.assertIsNone(account)
                self.assertIn(f"HTTP {code}", error)

    def test_crawl_catches_navigation_error(self):
        """P1: NavigationError must abort immediately without scraping content."""
        page = MagicMock()
        page.is_closed.return_value = False
        page.content = AsyncMock()

        with patch("services.profile_crawler.open_url", new_callable=AsyncMock) as mock_open:
            mock_open.side_effect = NavigationError("https://tiktok.com/@err", "Connection reset")

            account, status, error = asyncio.run(
                self.crawler.crawl(page, "err", "https://www.tiktok.com/@err")
            )

            self.assertEqual(status, "failed")
            self.assertIsNone(account)
            self.assertIn("Connection reset", error)
            page.content.assert_not_called()


if __name__ == "__main__":
    unittest.main()
