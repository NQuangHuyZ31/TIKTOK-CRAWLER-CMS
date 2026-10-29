import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from crawler import TikTokCrawler


class TestTikTokCrawlerSmartBlocking(unittest.TestCase):

    def setUp(self):
        self.crawler = TikTokCrawler(callback_url="http://localhost:8000")

    def test_smart_blocking_blocks_media(self):
        """Media (video/audio streams) must be aborted."""
        route = MagicMock()
        route.request = MagicMock()
        route.request.resource_type = "media"
        route.request.url = "https://v16-webapp-prime.tiktok.com/video/mp4/test.mp4"
        route.abort = AsyncMock()
        route.continue_ = AsyncMock()

        asyncio.run(self.crawler._smart_block_route(route))

        route.abort.assert_called_once()
        route.continue_.assert_not_called()
        self.assertEqual(self.crawler.blocked_requests_count, 1)

    def test_smart_blocking_blocks_3rd_party_trackers(self):
        """External tracker domains must be aborted."""
        tracker_urls = [
            "https://analytics.tiktok.com/api/v2/track",
            "https://www.google-analytics.com/g/collect",
            "https://www.googletagmanager.com/gtag/js",
            "https://connect.facebook.net/en_US/fbevents.js",
            "https://ad.doubleclick.net/ddm/track",
        ]

        for url in tracker_urls:
            route = MagicMock()
            route.request = MagicMock()
            route.request.resource_type = "script"
            route.request.url = url
            route.abort = AsyncMock()
            route.continue_ = AsyncMock()

            asyncio.run(self.crawler._smart_block_route(route))

            route.abort.assert_called_once()
            route.continue_.assert_not_called()

        self.assertEqual(self.crawler.blocked_requests_count, len(tracker_urls))

    def test_smart_blocking_allows_necessary_resources_and_internal_scripts(self):
        """Documents, scripts, avatars/images, and TikTok internal scripts must be allowed."""
        allowed_requests = [
            ("document", "https://www.tiktok.com/@tiktok"),
            ("script", "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/slardar/sdk-pre/browser.js"),
            ("script", "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.417/webmssdk.js"),
            ("xhr", "https://mon.tiktokv.com/monitor_web/settings/browser-settings?bid=webmssdk"),
            ("xhr", "https://www.tiktok.com/api/user/detail/?uniqueId=tiktok"),
            ("fetch", "https://www.tiktok.com/api/post/item_list/"),
            ("image", "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/avatar.jpeg"),
        ]

        initial_blocked_count = self.crawler.blocked_requests_count

        for res_type, url in allowed_requests:
            route = MagicMock()
            route.request = MagicMock()
            route.request.resource_type = res_type
            route.request.url = url
            route.abort = AsyncMock()
            route.continue_ = AsyncMock()

            asyncio.run(self.crawler._smart_block_route(route))

            route.continue_.assert_called_once()
            route.abort.assert_not_called()

        self.assertEqual(self.crawler.blocked_requests_count, initial_blocked_count)


if __name__ == "__main__":
    unittest.main()
