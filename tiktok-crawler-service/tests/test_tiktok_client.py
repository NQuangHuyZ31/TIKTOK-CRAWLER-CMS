from pathlib import Path
import sys
import unittest
import httpx

SERVICE_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = SERVICE_ROOT / "app"
TESTS_DIR = SERVICE_ROOT / "tests"
for p in (str(APP_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from _async_compat import patch_windows_self_pipe_if_needed

patch_windows_self_pipe_if_needed()

from crawler.tiktok_client import CircuitBreaker, RateLimiter, TikTokClient

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
PROFILE_OK_HTML = (FIXTURES_DIR / "profile_ok.html").read_text(encoding="utf-8")
PROFILE_CHALLENGE_HTML = (FIXTURES_DIR / "profile_challenge.html").read_text(encoding="utf-8")


class TestTikTokClient(unittest.IsolatedAsyncioTestCase):
    async def test_retries_on_5xx_then_succeeds(self):
        attempts = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal attempts
            if "avatar" in str(request.url):
                # Valid JPEG magic bytes
                return httpx.Response(200, content=b"\xff\xd8\xff\xe0" + b"0" * 32)
            if "/embed/" in str(request.url):
                return httpx.Response(200, text="<html></html>")
            attempts += 1
            if attempts < 3:
                return httpx.Response(503, text="Service Unavailable")
            return httpx.Response(200, text=PROFILE_OK_HTML)

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            client = TikTokClient(
                http_client=http_client,
                rate_limiter=RateLimiter(rate_per_sec=0, delay_min=0, delay_max=0),
                max_retries=3,
                backoff_base=0.0,
            )
            outcome = await client.crawl_account("khaby.lame")

        self.assertEqual(attempts, 3)
        self.assertEqual(outcome.status, "success")
        self.assertIsNotNone(outcome.account)
        self.assertIsNone(outcome.account.avatar_url)
        self.assertIsNotNone(outcome.avatar)
        self.assertEqual(outcome.avatar.mime, "image/jpeg")

    async def test_does_not_retry_on_404(self):
        attempts = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal attempts
            attempts += 1
            return httpx.Response(404, text="Not Found")

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            client = TikTokClient(
                http_client=http_client,
                rate_limiter=RateLimiter(rate_per_sec=0, delay_min=0, delay_max=0),
                max_retries=3,
                backoff_base=0.0,
            )
            outcome = await client.crawl_account("missing_user")

        self.assertEqual(attempts, 1)
        self.assertEqual(outcome.status, "failed")
        self.assertEqual(outcome.error_code, "NOT_FOUND")

    async def test_circuit_breaker_opens_after_5_consecutive_blocks(self):
        breaker = CircuitBreaker(threshold=5, cooldown_seconds=0.05)

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=PROFILE_CHALLENGE_HTML)

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            client = TikTokClient(
                http_client=http_client,
                rate_limiter=RateLimiter(rate_per_sec=0, delay_min=0, delay_max=0),
                circuit_breaker=breaker,
                max_retries=1,
                backoff_base=0.0,
            )
            for i in range(4):
                res = await client.crawl_account(f"user_{i}")
                self.assertEqual(res.error_code, "CHALLENGE")
                self.assertEqual(breaker.status_dict()["consecutive_blocks"], i + 1)

            # 5th block trips the circuit breaker and resets consecutive counter after cooldown
            res5 = await client.crawl_account("user_5")
            self.assertEqual(res5.error_code, "CHALLENGE")
            self.assertEqual(breaker.status_dict()["consecutive_blocks"], 0)


if __name__ == "__main__":
    unittest.main()
