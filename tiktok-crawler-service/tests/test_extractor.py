from pathlib import Path
import sys
import unittest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from crawler.extractor import ExtractorError, extract_profile

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


if __name__ == "__main__":
    unittest.main()
