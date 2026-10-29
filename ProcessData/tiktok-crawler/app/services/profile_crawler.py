from html import unescape
import logging
from bs4 import BeautifulSoup
from playwright.async_api import Page

from extractor import ExtractorPageError, check_page_type, extract_profile
from models import TikTokAccount
from services.avatar_service import AvatarService
from utils.browser_utils import NavigationError, open_url
from utils.tiktok_utils import normalize_username

logger = logging.getLogger(__name__)


class ProfileCrawler:
    """
    Crawls an individual TikTok profile following steps 3 through 7:
      Step 3: Navigate to profile URL & verify HTTP status / redirect.
      Step 4: Conditionally wait for SSR data or DOM render.
      Step 5: Verify page validity (normal profile vs challenge vs 404).
      Step 6: Extract profile metadata & statistics.
      Step 7: Validate extracted data and download avatar.
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
        Crawl a single TikTok profile.

        Returns:
            tuple[TikTokAccount | None, str, str | None]:
              (account, status, error_message)
              where status is 'success' or 'failed'.
        """
        clean_username = normalize_username(username)

        # ----------------------------------------------------------------------
        # Step 3: Navigation & HTTP Response Verification
        # ----------------------------------------------------------------------
        try:
            response = await open_url(page, profile_url, wait_until="domcontentloaded", timeout=25000)
        except NavigationError as nav_error:
            logger.warning("[@%s] Navigation error: %s", clean_username, nav_error)
            return None, "failed", f"Navigation failed for @{clean_username}: {nav_error.message}"

        if response is not None:
            status_code = response.status
            if status_code == 404:
                return None, "failed", f"HTTP 404: TikTok account @{clean_username} not found or deleted"
            if status_code in (403, 429):
                return None, "failed", f"HTTP {status_code}: Access forbidden or rate-limited by TikTok"
            if status_code >= 500:
                return None, "failed", f"HTTP {status_code}: TikTok server error"

        current_url = page.url.lower()
        if "/login" in current_url or "/verify" in current_url or "challenge" in current_url:
            return None, "failed", f"Redirected to verification/login page: {page.url}"

        # ----------------------------------------------------------------------
        # Step 4: Conditional Wait for Profile Render
        # ----------------------------------------------------------------------
        await self._wait_for_profile_ready(page, timeout=10000)

        # ----------------------------------------------------------------------
        # Step 5 & 6: Validate Page & Extract Profile Data (SSR JSON first, DOM fallback)
        # ----------------------------------------------------------------------
        try:
            account, missing_fields = extract_profile(
                html=html,
                profile_url=profile_url,
                target_username=clean_username,
            )
        except ExtractorPageError as page_error:
            page_title = await self._safe_title(page)
            return None, "failed", f"{page_error} (Page title: '{page_title}')"

        if account.username:
            account.username = normalize_username(account.username)
        elif clean_username:
            account.username = clean_username

        # ----------------------------------------------------------------------
        # Step 7: Validate Results
        # ----------------------------------------------------------------------
        # If all counts are 0 and not private, check if DOM hydration was delayed on slow containers
        if account.followers == 0 and account.following == 0 and account.likes == 0:
            if page_type != "private":
                # Brief secondary wait for DOM hydration in case React was lagging
                try:
                    await page.wait_for_selector('strong[data-e2e="followers-count"]', timeout=3000)
                    rehydrated_html = await page.content()
                    account, missing_fields = extract_profile(
                        html=rehydrated_html,
                        profile_url=profile_url,
                        target_username=clean_username,
                    )
                    if account.username:
                        account.username = normalize_username(account.username)
                    elif clean_username:
                        account.username = clean_username
                except Exception:
                    pass

        # Validation evidence check
        if not account.username:
            page_title = await self._safe_title(page)
            return (
                None,
                "failed",
                f"Could not extract username for @{clean_username} (title: '{page_title}', missing: {missing_fields})",
            )

        # Avatar download
        if account.avatar_url:
            try:
                account.avatar_path = await self.avatar_service.download(
                    page,
                    account.username,
                    account.avatar_url,
                )
            except Exception as error:
                logger.warning("Could not download avatar for @%s: %s", account.username, error)
                account.avatar_path = None

        logger.info(
            "[@%s] Extracted profile: %d followers, %d following, %d likes (missing: %s)",
            account.username,
            account.followers,
            account.following,
            account.likes,
            missing_fields or "none",
        )

        return account, "success", None

    @staticmethod
    async def _wait_for_profile_ready(page: Page, timeout: int = 10000) -> None:
        """
        Wait conditionally until either:
          1. SSR rehydration JSON script is populated with userInfo.
          2. Profile DOM stats/title elements are mounted.
          3. Challenge / Captcha / Not-found elements appear.
        """
        try:
            await page.wait_for_function(
                """
                () => {
                    // 1. Challenge or Captcha
                    if (document.querySelector('.captcha_verify_container, #captcha-verify-image, .verify-center, [id*="verify"]')) return true;
                    // 2. SSR Data Script with content
                    const rehydration = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    if (rehydration && rehydration.textContent && rehydration.textContent.includes('userInfo')) return true;
                    const sigi = document.getElementById('SIGI_STATE');
                    if (sigi && sigi.textContent && sigi.textContent.includes('UserModule')) return true;
                    // 3. Profile DOM elements
                    if (document.querySelector('strong[data-e2e="followers-count"], h1[data-e2e="user-title"], h2[data-e2e="user-subtitle"]')) return true;
                    // 4. Not found
                    if (document.querySelector('[data-e2e="user-not-found"]')) return true;
                    return false;
                }
                """,
                timeout=timeout,
            )
        except Exception:
            # If wait_for_function times out, proceed to extraction anyway
            pass

    @staticmethod
    async def _safe_title(page: Page) -> str:
        """Safely retrieve the page title without throwing."""
        try:
            return await page.title()
        except Exception:
            return ""
