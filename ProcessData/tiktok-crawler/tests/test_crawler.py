import asyncio
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from crawler import TikTokCrawler
from extractor import (
    ExtractorPageError,
    check_page_type,
    extract_profile,
    parse_count_text,
    parse_stat_value,
)


class TestExtractor(unittest.TestCase):
    """Test extractor logic across SSR JSON scripts, DOM fallbacks, and page classification."""

    def test_parse_stat_value_and_count_text(self):
        self.assertEqual(parse_stat_value(163000000), 163000000)
        self.assertEqual(parse_stat_value("163000000"), 163000000)
        self.assertEqual(parse_stat_value("163M"), 163000000)
        self.assertEqual(parse_stat_value("2.7B"), 2700000000)
        self.assertEqual(parse_stat_value("15.5K"), 15500)
        self.assertEqual(parse_stat_value(0), 0)
        self.assertEqual(parse_stat_value("0"), 0)
        # 32-bit signed integer overflow recovery: -1603209788 rolls over to 2691757508 (2.69B)
        self.assertEqual(parse_stat_value(-1603209788), 2691757508)
        self.assertEqual(parse_stat_value("-1603209788"), 2691757508)
        self.assertIsNone(parse_stat_value(None))
        self.assertIsNone(parse_stat_value(""))
        self.assertIsNone(parse_stat_value("invalid_stat"))

    def test_extract_from_universal_data_for_rehydration(self):
        """Extractor must extract exact integer counts from SSR JSON even if DOM is empty."""
        rehydration_data = {
            "__DEFAULT_SCOPE__": {
                "webapp.user-detail": {
                    "userInfo": {
                        "user": {
                            "id": "12345",
                            "uniqueId": "khaby.lame",
                            "nickname": "Khabane lame",
                            "avatarLarger": "https://p16-sign.tiktokcdn.com/avatar.jpg",
                        },
                        "stats": {
                            "followerCount": 163000000,
                            "followingCount": 82,
                            "heart": -1603209788,  # Legacy signed 32-bit overflow
                            "heartCount": 2691757508,
                        },
                    }
                }
            }
        }
        html = f"""
        <html>
        <head>
          <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
            {json.dumps(rehydration_data)}
          </script>
        </head>
        <body>
          <!-- DOM is empty, React has not hydrated yet -->
        </body>
        </html>
        """
        account, missing = extract_profile(html, "https://www.tiktok.com/@khaby.lame")
        self.assertEqual(account.username, "khaby.lame")
        self.assertEqual(account.followers, 163000000)
        self.assertEqual(account.following, 82)
        self.assertEqual(account.likes, 2691757508)
        self.assertEqual(account.avatar_url, "https://p16-sign.tiktokcdn.com/avatar.jpg")
        self.assertEqual(missing, [])

    def test_extract_from_sigi_state(self):
        """Extractor should support SIGI_STATE JSON structure."""
        sigi_data = {
            "UserModule": {
                "users": {
                    "test.user": {
                        "uniqueId": "test.user",
                        "avatarLarger": "https://p16-sign.tiktokcdn.com/sigi.jpg",
                    }
                },
                "stats": {
                    "test.user": {
                        "followerCount": 50000,
                        "followingCount": 120,
                        "heartCount": 1000000,
                    }
                },
            }
        }
        html = f"""
        <html>
        <head>
          <script id="SIGI_STATE" type="application/json">
            {json.dumps(sigi_data)}
          </script>
        </head>
        <body></body>
        </html>
        """
        account, missing = extract_profile(html, "https://www.tiktok.com/@test.user")
        self.assertEqual(account.username, "test.user")
        self.assertEqual(account.followers, 50000)
        self.assertEqual(account.following, 120)
        self.assertEqual(account.likes, 1000000)
        self.assertEqual(account.avatar_url, "https://p16-sign.tiktokcdn.com/sigi.jpg")

    def test_extract_with_target_username_filter(self):
        """Extractor should match target username and ignore unrelated accounts in JSON."""
        rehydration_data = {
            "__DEFAULT_SCOPE__": {
                "webapp.user-detail": {
                    "userInfo": {
                        "user": {"uniqueId": "target_user", "avatarLarger": "https://p16.com/target.jpg"},
                        "stats": {"followerCount": 999, "followingCount": 10, "heartCount": 5000},
                    }
                }
            }
        }
        html = f"""
        <html>
        <head>
          <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
            {json.dumps(rehydration_data)}
          </script>
        </head>
        <body></body>
        </html>
        """
        # When target username matches
        account, missing = extract_profile(html, "https://www.tiktok.com/@target_user", target_username="target_user")
        self.assertEqual(account.username, "target_user")
        self.assertEqual(account.followers, 999)

        # When target username does not match
        account_diff, missing_diff = extract_profile(
            html, "https://www.tiktok.com/@different_user", target_username="different_user"
        )
        self.assertNotEqual(account_diff.username, "target_user")

    def test_distinguish_legitimate_zero_from_missing(self):
        """0 count must be preserved as 0, not flagged as missing."""
        rehydration_data = {
            "__DEFAULT_SCOPE__": {
                "webapp.user-detail": {
                    "userInfo": {
                        "user": {"uniqueId": "brand_new_user", "avatarLarger": "https://p16.com/new.jpg"},
                        "stats": {"followerCount": 0, "followingCount": 0, "heartCount": 0},
                    }
                }
            }
        }
        html = f"""
        <html>
        <head>
          <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
            {json.dumps(rehydration_data)}
          </script>
        </head>
        <body></body>
        </html>
        """
        account, missing = extract_profile(html, "https://www.tiktok.com/@brand_new_user")
        self.assertEqual(account.followers, 0)
        self.assertEqual(account.following, 0)
        self.assertEqual(account.likes, 0)
        # Stats are present (with value 0), so they should not be in missing_fields!
        self.assertEqual(missing, [])

    def test_extract_from_dom_fallback(self):
        """When JSON is absent, extractor must fall back to DOM elements."""
        html = """
        <html>
        <body>
          <h1 data-e2e="user-title">charlidamelio</h1>
          <strong data-e2e="followers-count">155M</strong>
          <strong data-e2e="following-count">1.1K</strong>
          <strong data-e2e="likes-count">11.7B</strong>
          <img data-e2e="user-avatar" src="https://p16-sign.tiktokcdn.com/charli.jpg" />
        </body>
        </html>
        """
        account, missing = extract_profile(html, "https://www.tiktok.com/@charlidamelio")
        self.assertEqual(account.username, "charlidamelio")
        self.assertEqual(account.followers, 155000000)
        self.assertEqual(account.following, 1100)
        self.assertEqual(account.likes, 11700000000)
        self.assertEqual(account.avatar_url, "https://p16-sign.tiktokcdn.com/charli.jpg")

    def test_extract_raises_page_error_on_challenge_and_not_found(self):
        """Extractor must reject challenge and not_found HTML before extraction."""
        challenge_html = '<html><body><div class="captcha_verify_container">Please verify</div></body></html>'
        with self.assertRaises(ExtractorPageError) as ctx_challenge:
            extract_profile(challenge_html, "https://www.tiktok.com/@test")
        self.assertEqual(ctx_challenge.exception.page_type, "challenge")

        not_found_html = "<html><body><div data-e2e=\"user-not-found\">Couldn't find this account</div></body></html>"
        with self.assertRaises(ExtractorPageError) as ctx_not_found:
            extract_profile(not_found_html, "https://www.tiktok.com/@test")
        self.assertEqual(ctx_not_found.exception.page_type, "not_found")

    def test_check_page_type_strict(self):
        from bs4 import BeautifulSoup

        # Generic script without userInfo should NOT be classified as profile
        generic_html = '<html><head><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">{"__DEFAULT_SCOPE__":{}}</script></head><body></body></html>'
        self.assertEqual(
            check_page_type(BeautifulSoup(generic_html, "html.parser"), generic_html),
            "unknown",
        )

        private_html = '<html><body><h1 data-e2e="user-title">private_user</h1><div>This account is private</div></body></html>'
        self.assertEqual(
            check_page_type(BeautifulSoup(private_html, "html.parser"), private_html),
            "private",
        )


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
            (
                "script",
                "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/slardar/sdk-pre/browser.js",
            ),
            (
                "script",
                "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.417/webmssdk.js",
            ),
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
