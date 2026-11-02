import asyncio
import logging
import random
import time
import httpx

from core.config import (
    CIRCUIT_BREAKER_COOLDOWN,
    CIRCUIT_BREAKER_THRESHOLD,
    DEFAULT_USER_AGENT,
    MAX_HTML_BYTES,
    MAX_RETRIES,
    RATE_LIMIT_PER_SEC,
    REQUEST_DELAY_MAX,
    REQUEST_DELAY_MIN,
    REQUEST_TIMEOUT,
    USER_AGENT_POOL,
)
from core.utils import build_profile_url, normalize_username
from crawler.avatar import AvatarDownloader
from crawler.extractor import ExtractorError, extract_profile
from crawler.resilience import CircuitBreaker, RateLimiter
from crawler.video_extractor import fetch_account_videos
from schemas.models import AccountCrawlOutcome

logger = logging.getLogger(__name__)

__all__ = ["TikTokClient", "RateLimiter", "CircuitBreaker"]


class TikTokClient:
    """
    HTTP JSON crawler client for TikTok profiles using httpx.
    Handles retry with exponential backoff, Retry-After on HTTP 429,
    global rate limiting, circuit breaker cooldown, and avatar downloading.
    """

    def __init__(
        self,
        http_client: httpx.AsyncClient | None = None,
        rate_limiter: RateLimiter | None = None,
        circuit_breaker: CircuitBreaker | None = None,
        avatar_downloader: AvatarDownloader | None = None,
        max_retries: int = MAX_RETRIES,
        request_timeout: float = REQUEST_TIMEOUT,
        backoff_base: float = 2.0,
    ):
        self._external_client = http_client is not None
        self._client = http_client
        self.rate_limiter = rate_limiter or RateLimiter()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()
        self.avatar_downloader = avatar_downloader or AvatarDownloader()
        self.max_retries = max(1, max_retries)
        self.request_timeout = request_timeout
        self.backoff_base = backoff_base

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.request_timeout,
                follow_redirects=True,
                headers=self._default_headers(),
            )
        return self._client

    async def close(self) -> None:
        if self._client is not None and not self._external_client:
            await self._client.aclose()
            self._client = None

    @staticmethod
    def _default_headers(user_agent: str | None = None) -> dict[str, str]:
        return {
            "User-Agent": user_agent or random.choice(USER_AGENT_POOL) or DEFAULT_USER_AGENT,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,"
                "application/json;q=0.8,*/*;q=0.7"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }

    @staticmethod
    def _parse_retry_after(header_value: str | None, default_delay: float) -> float:
        if not header_value:
            return default_delay
        try:
            seconds = float(header_value.strip())
            return max(0.0, min(seconds, 120.0))
        except ValueError:
            return default_delay

    async def crawl_account(
        self,
        username: str,
        profile_url: str | None = None,
        max_videos: int = 20,
    ) -> AccountCrawlOutcome:
        """
        Crawl a single TikTok account via HTTP request, extract embedded JSON,
        download avatar, and return the final AccountCrawlOutcome.
        """
        clean_username = normalize_username(username)
        if not clean_username:
            return AccountCrawlOutcome(
                username="",
                profile_url=profile_url or "",
                status="failed",
                error_code="INVALID_USERNAME",
                error_message="Username is empty or invalid",
            )

        url = profile_url or build_profile_url(clean_username)
        client = await self._get_client()

        last_error_code = "UNKNOWN_ERROR"
        last_error_message = "Profile crawl failed"

        attempt = 1
        while attempt <= self.max_retries:
            await self.circuit_breaker.wait_if_open()
            await self.rate_limiter.wait_turn()

            # Clear accumulated session/WAF cookies and pick a rotated mobile User-Agent
            client.cookies.clear()
            chosen_ua = USER_AGENT_POOL[(attempt - 1 + hash(clean_username)) % len(USER_AGENT_POOL)]

            try:
                response = await client.get(
                    url,
                    headers=self._default_headers(chosen_ua),
                    timeout=self.request_timeout,
                )
            except httpx.TimeoutException as exc:
                last_error_code = "TIMEOUT"
                last_error_message = f"HTTP request timed out for @{clean_username}: {exc}"
                if attempt < self.max_retries:
                    await self._sleep_backoff(attempt)
                    attempt += 1
                    continue
                break
            except httpx.HTTPError as exc:
                last_error_code = "NETWORK_ERROR"
                last_error_message = f"Network error for @{clean_username}: {exc}"
                if attempt < self.max_retries:
                    await self._sleep_backoff(attempt)
                    attempt += 1
                    continue
                break

            status_code = response.status_code

            if status_code == 404:
                await self.circuit_breaker.record_success()
                return AccountCrawlOutcome(
                    username=clean_username,
                    profile_url=url,
                    status="failed",
                    error_code="NOT_FOUND",
                    error_message=f"HTTP 404: TikTok account @{clean_username} not found",
                )

            if status_code == 429:
                last_error_code = "RATE_LIMITED"
                last_error_message = f"HTTP 429: Rate limited by TikTok on @{clean_username}"
                tripped = await self.circuit_breaker.record_block("HTTP_429")
                if tripped:
                    # Wait out the circuit breaker cooldown without counting against this account's final failure
                    await self.circuit_breaker.wait_if_open()
                    continue
                retry_delay = self._parse_retry_after(
                    response.headers.get("Retry-After"),
                    default_delay=self.backoff_base * (2 ** (attempt - 1)),
                )
                if attempt < self.max_retries:
                    if retry_delay > 0:
                        await asyncio.sleep(retry_delay)
                    attempt += 1
                    continue
                break

            if status_code in (401, 403):
                last_error_code = "CHALLENGE"
                last_error_message = f"HTTP {status_code}: Access denied or WAF challenge on @{clean_username}"
                if attempt < self.max_retries:
                    await self._sleep_backoff(attempt)
                    attempt += 1
                    continue
                tripped = await self.circuit_breaker.record_block(f"HTTP_{status_code}")
                if tripped:
                    await self.circuit_breaker.wait_if_open()
                break

            if status_code >= 500:
                last_error_code = "SERVER_ERROR"
                last_error_message = f"HTTP {status_code}: TikTok server error on @{clean_username}"
                if attempt < self.max_retries:
                    await self._sleep_backoff(attempt)
                    attempt += 1
                    continue
                break

            if status_code >= 400:
                return AccountCrawlOutcome(
                    username=clean_username,
                    profile_url=url,
                    status="failed",
                    error_code="HTTP_ERROR",
                    error_message=f"HTTP {status_code}: Client error on @{clean_username}",
                )

            raw_bytes = response.content
            if len(raw_bytes) > MAX_HTML_BYTES:
                return AccountCrawlOutcome(
                    username=clean_username,
                    profile_url=url,
                    status="failed",
                    error_code="RESPONSE_TOO_LARGE",
                    error_message=f"Response size ({len(raw_bytes)} bytes) exceeds max limit",
                )

            text = response.text
            try:
                account = extract_profile(
                    body=text,
                    profile_url=url,
                    target_username=clean_username,
                )
            except ExtractorError as ext_err:
                last_error_code = ext_err.error_code
                last_error_message = ext_err.message

                if ext_err.error_code == "CHALLENGE":
                    if attempt < self.max_retries:
                        await self._sleep_backoff(attempt)
                        attempt += 1
                        continue
                    tripped = await self.circuit_breaker.record_block("CHALLENGE")
                    if tripped:
                        await self.circuit_breaker.wait_if_open()
                    break

                if not ext_err.is_retryable:
                    await self.circuit_breaker.record_success()
                    break

                if attempt < self.max_retries:
                    await self._sleep_backoff(attempt)
                    attempt += 1
                    continue
                break

            # Extraction succeeded!
            await self.circuit_breaker.record_success()
            raw_avatar_url = account.avatar_url
            # Do not store raw CDN avatar_url in DB; download and store local avatar_path instead
            account.avatar_url = None

            avatar_payload = None
            error_code = None
            if raw_avatar_url:
                avatar_payload, local_avatar_path = await self.avatar_downloader.fetch(
                    client=client,
                    username=account.username or clean_username,
                    avatar_url=raw_avatar_url,
                )
                if local_avatar_path:
                    account.avatar_path = local_avatar_path
                if avatar_payload is None and local_avatar_path is None:
                    error_code = "AVATAR_FAILED"

            videos = []
            if max_videos > 0:
                videos = await fetch_account_videos(
                    client=client,
                    username=account.username or clean_username,
                    profile_body=text,
                    sec_uid=account.sec_uid,
                    max_videos=max_videos,
                    headers=self._default_headers(chosen_ua),
                    timeout=min(self.request_timeout, 20.0),
                )
                if videos and account.video_count == 0:
                    account.video_count = len(videos)

            return AccountCrawlOutcome(
                username=account.username or clean_username,
                profile_url=url,
                status="success",
                account=account,
                avatar=avatar_payload,
                videos=videos,
                error_code=error_code,
            )

        return AccountCrawlOutcome(
            username=clean_username,
            profile_url=url,
            status="failed",
            error_code=last_error_code,
            error_message=last_error_message,
        )

    async def _sleep_backoff(self, attempt: int) -> None:
        if self.backoff_base <= 0:
            return
        delay = self.backoff_base * (2 ** (attempt - 1))
        await asyncio.sleep(delay)
