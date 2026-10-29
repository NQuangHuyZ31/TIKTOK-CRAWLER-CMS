import logging
from bs4 import BeautifulSoup
from playwright.async_api import Error as PlaywrightError, Page, TimeoutError as PlaywrightTimeoutError

from extractor import ExtractorPageError, check_page_type, extract_profile
from models import TikTokAccount
from services.avatar_service import AvatarService
from utils.browser_utils import NavigationError, open_url
from utils.tiktok_utils import normalize_username

logger = logging.getLogger(__name__)

# Configurable timeouts
NAVIGATION_TIMEOUT_MS = 25000
RENDER_WAIT_TIMEOUT_MS = 10000
HYDRATION_RETRY_TIMEOUT_MS = 3000


class ProfileCrawler:
    """
    Crawls an individual TikTok profile following steps 3 through 7:
      Step 3: Navigate to profile URL & verify HTTP status / redirect.
      Step 4: Conditionally wait for SSR data or DOM render.
      Step 5: Verify page validity (normal profile vs challenge vs 404 vs private).
      Step 6: Extract profile metadata & statistics.
      Step 7: Validate extracted data, verify username match, and download avatar.
    """

    def __init__(self):
        self.avatar_service = AvatarService()

    async def crawl(
        self,
        page: Page,
        username: str,
        profile_url: str,
    ) -> tuple[TikTokAccount | None, str, str | None]:
        """
        Crawl a single TikTok profile with strict evidence validation.

        Returns:
            tuple[TikTokAccount | None, str, str | None]:
              (account, status, error_message)
              where status is one of: 'success', 'private', 'challenge', 'not_found', 'failed'.
        """
        clean_username = normalize_username(username)

        # ----------------------------------------------------------------------
        # Step 3: Navigation & Comprehensive HTTP Status Handling
        # ----------------------------------------------------------------------
        try:
            response = await open_url(
                page,
                profile_url,
                wait_until="domcontentloaded",
                timeout=NAVIGATION_TIMEOUT_MS,
            )
        except NavigationError as nav_error:
            logger.warning("[@%s] Navigation error: %s", clean_username, nav_error)
            return None, "failed", f"Navigation failed for @{clean_username}: {nav_error.message}"

        if response is not None:
            status_code = response.status
            if status_code == 404:
                return None, "not_found", f"HTTP 404: TikTok account @{clean_username} not found or deleted"
            if status_code in (401, 403, 429):
                return None, "challenge", f"HTTP {status_code}: Access denied or rate-limited by TikTok"
            if status_code >= 500:
                return None, "failed", f"HTTP {status_code}: TikTok server error"
            if status_code >= 400:
                return None, "failed", f"HTTP {status_code}: Client error on TikTok profile request"

        current_url = page.url.lower()
        if "/login" in current_url or "/verify" in current_url or "challenge" in current_url:
            return None, "challenge", f"Redirected to verification/login page: {page.url}"

        # ----------------------------------------------------------------------
        # Step 4: Conditional Wait for Profile Render
        # ----------------------------------------------------------------------
        await self._wait_for_profile_ready(page, timeout=RENDER_WAIT_TIMEOUT_MS)

        # ----------------------------------------------------------------------
        # Step 5: Check Page Validity
        # ----------------------------------------------------------------------
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        page_type = check_page_type(soup, html)

        if page_type == "challenge":
            page_title = await self._safe_title(page)
            return None, "challenge", f"TikTok challenge/captcha encountered (Page title: '{page_title}', URL: {page.url})"

        if page_type == "not_found":
            return None, "not_found", f"TikTok account @{clean_username} does not exist or was deleted (URL: {page.url})"

        # ----------------------------------------------------------------------
        # Step 6: Extract Profile Data (SSR JSON first, DOM fallback)
        # ----------------------------------------------------------------------
        try:
            account, missing_fields = extract_profile(
                html=html,
                profile_url=profile_url,
                target_username=clean_username,
            )
        except ExtractorPageError as page_error:
            page_title = await self._safe_title(page)
            status_kind = page_error.page_type if page_error.page_type in ("challenge", "not_found") else "failed"
            return None, status_kind, f"{page_error} (Page title: '{page_title}', URL: {page.url})"

        # ----------------------------------------------------------------------
        # Step 7: Verify Username & Evidence Validation (P0 Issues)
        # ----------------------------------------------------------------------
        raw_username = account.username
        clean_extracted = normalize_username(raw_username) if raw_username else None

        # P0-3: Strict check for username mismatch (prevent cross-account contamination)
        if clean_extracted and clean_extracted != clean_username:
            logger.warning(
                "[@%s] Username mismatch: target @%s, but extracted @%s from page",
                clean_username,
                clean_username,
                clean_extracted,
            )
            return (
                None,
                "failed",
                f"Username mismatch: target was @{clean_username}, but page contains @{clean_extracted}",
            )

        has_verified_username = clean_extracted == clean_username
        has_verified_stats = account.followers > 0 or account.following > 0 or account.likes > 0

        # P1-4: Secondary wait for DOM hydration with explicit timeout handling
        if not has_verified_stats and page_type != "private":
            if not page.is_closed():
                try:
                    await page.wait_for_selector(
                        'strong[data-e2e="followers-count"]',
                        timeout=HYDRATION_RETRY_TIMEOUT_MS,
                    )
                    rehydrated_html = await page.content()
                    account, missing_fields = extract_profile(
                        html=rehydrated_html,
                        profile_url=profile_url,
                        target_username=clean_username,
                    )
                    raw_username = account.username
                    clean_extracted = normalize_username(raw_username) if raw_username else None
                    has_verified_username = clean_extracted == clean_username
                    has_verified_stats = account.followers > 0 or account.following > 0 or account.likes > 0
                except PlaywrightTimeoutError:
                    logger.debug("[@%s] Secondary DOM hydration wait timed out", clean_username)
                except Exception as err:
                    logger.debug("[@%s] Secondary DOM hydration wait error: %s", clean_username, err)

        # P0-2: Explicit handling for private accounts
        if page_type == "private":
            account.username = clean_username
            account.status = "private"
            logger.info("[@%s] Confirmed private profile (followers: %d, missing: %s)", clean_username, account.followers, missing_fields)
            if account.avatar_url:
                account.avatar_path = await self._safe_download_avatar(page, account.username, account.avatar_url)
            return account, "success", None

        # P0-1: Reject success when there is NO EVIDENCE of profile data on the page
        if not has_verified_username and not has_verified_stats:
            page_title = await self._safe_title(page)
            return (
                None,
                "failed",
                f"Profile extraction failed for @{clean_username}: no verified data found on page (Title: '{page_title}', URL: {page.url}, missing: {missing_fields})",
            )

        # If username was verified on page, but all stats are in missing_fields
        if has_verified_username and not has_verified_stats:
            if "followers" in missing_fields and "following" in missing_fields and "likes" in missing_fields:
                page_title = await self._safe_title(page)
                return (
                    None,
                    "failed",
                    f"Extraction failed for @{clean_username}: verified username on page but all statistics missing (Title: '{page_title}', URL: {page.url})",
                )

        # Set verified username
        account.username = clean_username

        # Download avatar if available
        if account.avatar_url:
            account.avatar_path = await self._safe_download_avatar(page, account.username, account.avatar_url)

        logger.info(
            "[@%s] Extracted profile successfully: %d followers, %d following, %d likes (missing: %s)",
            account.username,
            account.followers,
            account.following,
            account.likes,
            missing_fields or "none",
        )

        return account, "success", None

    async def _safe_download_avatar(self, page: Page, username: str, avatar_url: str) -> str | None:
        """Safely download profile avatar without aborting the crawl on failure."""
        try:
            return await self.avatar_service.download(page, username, avatar_url)
        except Exception as error:
            logger.warning("Could not download avatar for @%s: %s", username, error)
            return None

    @staticmethod
    async def _wait_for_profile_ready(page: Page, timeout: int = RENDER_WAIT_TIMEOUT_MS) -> None:
        """
        Wait conditionally until either:
          1. Verified challenge / captcha indicators appear.
          2. SSR rehydration script containing verified userInfo is mounted.
          3. SIGI_STATE script containing UserModule is mounted.
          4. Specific profile DOM elements are rendered.
          5. Specific not-found element appears.
        """
        if page.is_closed():
            return

        try:
            await page.wait_for_function(
                """
                () => {
                    // 1. Specific Challenge / Captcha
                    if (document.querySelector('.captcha_verify_container, #captcha-verify-image, .verify-center, .secsdk-captcha-drag-icon, [data-e2e="sec-sdk-iframe"]')) return true;
                    // 2. SSR Data Script with verified userInfo key
                    const rehydration = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    if (rehydration && rehydration.textContent && (rehydration.textContent.includes('"userInfo"') || rehydration.textContent.includes('"webapp.user-detail"'))) return true;
                    const sigi = document.getElementById('SIGI_STATE');
                    if (sigi && sigi.textContent && sigi.textContent.includes('"UserModule"')) return true;
                    // 3. Specific Profile DOM elements
                    if (document.querySelector('strong[data-e2e="followers-count"], h1[data-e2e="user-title"], h2[data-e2e="user-subtitle"]')) return true;
                    // 4. Specific not-found element
                    if (document.querySelector('[data-e2e="user-not-found"]')) return true;
                    return false;
                }
                """,
                timeout=timeout,
            )
        except Exception as err:
            logger.debug("Conditional render wait finished or timed out: %s", err)

    @staticmethod
    async def _safe_title(page: Page) -> str:
        """Safely retrieve the page title without throwing."""
        try:
            return await page.title()
        except Exception:
            return ""
