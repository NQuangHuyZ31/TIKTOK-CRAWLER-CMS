from pathlib import Path
import sys
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from crawler.extractor import ExtractorError, extract_profile
from crawler.video_extractor import extract_videos_from_body

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class TestExtractor(unittest.TestCase):
    def test_extract_profile_ok_from_rehydration_json(self):
        html = (FIXTURES_DIR / "profile_ok.html").read_text(encoding="utf-8")
        account = extract_profile(
            body=html,
            profile_url="https://www.tiktok.com/@khaby.lame",
            target_username="khaby.lame",
        )
        self.assertEqual(account.username, "khaby.lame")
        self.assertEqual(account.followers, 162_500_000)
        self.assertEqual(account.following, 80)
        self.assertEqual(account.likes, 2_400_000_000)
        self.assertEqual(account.avatar_url, "https://p16-sign.tiktokcdn.com/avatar-khaby.jpeg")
        self.assertEqual(account.status, "active")

    def test_extract_profile_from_sigi_state_and_fix_int32_overflow(self):
        html = (FIXTURES_DIR / "profile_sigi.html").read_text(encoding="utf-8")
        account = extract_profile(
            body=html,
            profile_url="https://www.tiktok.com/@sigi_creator",
            target_username="sigi_creator",
        )
        self.assertEqual(account.username, "sigi_creator")
        self.assertEqual(account.followers, 45_000)
        self.assertEqual(account.following, 120)
        # -1894967296 + 2^32 == 2400000000
        self.assertEqual(account.likes, 2_400_000_000)

    def test_extract_private_profile_succeeds(self):
        html = (FIXTURES_DIR / "profile_private.html").read_text(encoding="utf-8")
        account = extract_profile(
            body=html,
            profile_url="https://www.tiktok.com/@secret_user",
            target_username="secret_user",
        )
        self.assertEqual(account.username, "secret_user")
        self.assertEqual(account.followers, 12)
        self.assertEqual(account.following, 34)
        self.assertEqual(account.likes, 0)
        self.assertEqual(account.status, "active")

    def test_extract_not_found_raises_non_retryable_error(self):
        html = (FIXTURES_DIR / "profile_not_found.html").read_text(encoding="utf-8")
        with self.assertRaises(ExtractorError) as ctx:
            extract_profile(
                body=html,
                profile_url="https://www.tiktok.com/@ghost_user",
                target_username="ghost_user",
            )
        self.assertEqual(ctx.exception.error_code, "NOT_FOUND")
        self.assertFalse(ctx.exception.is_retryable)

    def test_extract_challenge_raises_challenge_error(self):
        html = (FIXTURES_DIR / "profile_challenge.html").read_text(encoding="utf-8")
        with self.assertRaises(ExtractorError) as ctx:
            extract_profile(
                body=html,
                profile_url="https://www.tiktok.com/@blocked_user",
                target_username="blocked_user",
            )
        self.assertEqual(ctx.exception.error_code, "CHALLENGE")
        self.assertFalse(ctx.exception.is_retryable)

    def test_extract_profile_from_opengraph_meta_tags(self):
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>jacobalanherrman on TikTok</title>
            <meta property="og:image" content="https://p16-common-sign.tiktokcdn.com/tos-maliva-avt-0068/avatar.jpeg?x=1&amp;y=2"/>
            <meta property="og:description" content="@jacobalanherrman 1237 Followers, 3365 Following, 418 Likes - Watch awesome short videos created by jacobalanherrman"/>
        </head>
        <body></body>
        </html>
        """
        account = extract_profile(
            body=html,
            profile_url="https://www.tiktok.com/@jacobalanherrman",
            target_username="jacobalanherrman",
        )
        self.assertEqual(account.username, "jacobalanherrman")
        self.assertEqual(account.followers, 1237)
        self.assertEqual(account.following, 3365)
        self.assertEqual(account.likes, 418)
        self.assertEqual(
            account.avatar_url,
            "https://p16-common-sign.tiktokcdn.com/tos-maliva-avt-0068/avatar.jpeg?x=1&y=2",
        )

    def test_extract_videos_from_rehydration_and_sigi_json(self):
        html = """
        <!DOCTYPE html>
        <html>
        <body>
            <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
            {
                "__DEFAULT_SCOPE__": {
                    "webapp.user-detail": {
                        "itemList": [
                            {
                                "id": "735000111222333444",
                                "desc": "Testing video extraction #fyp #tiktok",
                                "createTime": "1711800000",
                                "isPinnedItem": true,
                                "author": {"uniqueId": "khaby.lame"},
                                "video": {
                                    "duration": 24,
                                    "width": 576,
                                    "height": 1024,
                                    "definition": "540p",
                                    "cover": "https://p16-sign.tiktokcdn.com/cover1.jpg"
                                },
                                "music": {
                                    "id": "999888777",
                                    "title": "Original Sound",
                                    "authorName": "Khaby Lame",
                                    "original": true
                                },
                                "stats": {
                                    "playCount": 1250000,
                                    "diggCount": 89000,
                                    "commentCount": 1200,
                                    "shareCount": 450,
                                    "collectCount": 3100
                                }
                            }
                        ]
                    }
                }
            }
            </script>
        </body>
        </html>
        """
        videos = extract_videos_from_body(body=html, target_username="khaby.lame", max_videos=10)
        self.assertEqual(len(videos), 1)
        v = videos[0]
        self.assertEqual(v.video_id, "735000111222333444")
        self.assertEqual(v.username, "khaby.lame")
        self.assertEqual(v.play_count, 1_250_000)
        self.assertEqual(v.digg_count, 89_000)
        self.assertEqual(v.comment_count, 1_200)
        self.assertEqual(v.share_count, 450)
        self.assertEqual(v.collect_count, 3_100)
        self.assertEqual(v.duration, 24)
        self.assertTrue(v.is_pinned)
        self.assertTrue(v.is_original_sound)
        self.assertEqual(v.hashtags, ["fyp", "tiktok"])

    def test_extract_videos_from_embed_frontity_state(self):
        # 7420108849767795999 >> 32 = 1727630798
        html = """
        <!DOCTYPE html>
        <html>
        <body>
            <script id="__FRONTITY_CONNECT_STATE__" type="application/json">
            {
                "source": {
                    "data": {
                        "/embed/@khaby.lame": {
                            "videoList": [
                                {
                                    "id": "7420108849767795999",
                                    "desc": "Check out this embed trick #lifehack",
                                    "coverUrl": "https://p16-sign.tiktokcdn.com/embed_cover.jpg",
                                    "dynamicCoverUrl": "https://p16-sign.tiktokcdn.com/embed_dyn.webp",
                                    "playCount": 5400000,
                                    "diggCount": 210000,
                                    "authorUniqueId": "khaby.lame",
                                    "ratio": "720p",
                                    "width": 720,
                                    "height": 1280
                                }
                            ]
                        }
                    }
                }
            }
            </script>
        </body>
        </html>
        """
        videos = extract_videos_from_body(body=html, target_username="khaby.lame", max_videos=5)
        self.assertEqual(len(videos), 1)
        v = videos[0]
        self.assertEqual(v.video_id, "7420108849767795999")
        self.assertEqual(v.username, "khaby.lame")
        self.assertEqual(v.play_count, 5_400_000)
        self.assertEqual(v.digg_count, 210_000)
        self.assertEqual(v.cover_url, "https://p16-sign.tiktokcdn.com/embed_cover.jpg")
        self.assertEqual(v.dynamic_cover_url, "https://p16-sign.tiktokcdn.com/embed_dyn.webp")
        self.assertEqual(v.definition, "720p")
        self.assertEqual(v.width, 720)
        self.assertEqual(v.height, 1280)
        self.assertIsNotNone(v.published_at)
        self.assertEqual(v.published_at.year, 2024)
        self.assertEqual(v.hashtags, ["lifehack"])

    def test_fetch_creator_videos_paginated_multipage(self):
        import asyncio
        import httpx
        from unittest.mock import AsyncMock, MagicMock
        from crawler.video_api import fetch_creator_videos_paginated

        # Mock page 1 and page 2 responses
        page1_data = {
            "status_code": 0,
            "hasMorePrevious": True,
            "itemList": [
                {
                    "id": f"740000000000000000{i}",
                    "desc": f"Video #{i} from page 1",
                    "createTime": 1720000000 - i * 100,
                    "stats": {"playCount": 1000 * i, "diggCount": 100 * i, "commentCount": i},
                }
                for i in range(1, 16)
            ],
        }
        page2_data = {
            "status_code": 0,
            "hasMorePrevious": False,
            "itemList": [
                {
                    "id": f"74000000000000000{i}",
                    "desc": f"Video #{i} from page 2",
                    "createTime": 1719000000 - i * 100,
                    "stats": {"playCount": 2000 * i, "diggCount": 200 * i, "commentCount": i * 2},
                }
                for i in range(16, 26)
            ],
        }

        mock_client = MagicMock(spec=httpx.AsyncClient)
        resp1 = MagicMock(spec=httpx.Response, status_code=200)
        resp1.json.return_value = page1_data
        resp2 = MagicMock(spec=httpx.Response, status_code=200)
        resp2.json.return_value = page2_data

        mock_client.get = AsyncMock(side_effect=[resp1, resp2])

        videos = asyncio.run(
            fetch_creator_videos_paginated(
                client=mock_client,
                username="test_creator",
                sec_uid="MS4wLjABAAAA_test_sec_uid",
                max_videos=20,
            )
        )

        self.assertEqual(len(videos), 20)
        self.assertEqual(mock_client.get.call_count, 2)
        self.assertEqual(videos[0].video_id, "7400000000000000001")
        self.assertEqual(videos[0].play_count, 1000)
        self.assertEqual(videos[0].digg_count, 100)
        self.assertEqual(videos[15].video_id, "7400000000000000016")
        self.assertEqual(videos[15].play_count, 32000)
        self.assertEqual(videos[15].digg_count, 3200)


if __name__ == "__main__":
    unittest.main()
