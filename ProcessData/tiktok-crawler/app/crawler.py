import logging

from playwright.async_api import async_playwright

from config import (
    BACKEND_CALLBACK_URL,
    DEFAULT_USER_AGENT,
    HEADLESS,
    normalize_callback_url,
)
from services.callback_service import CallbackService
from services.profile_crawler import ProfileCrawler
from utils.browser_utils import go_back, open_url, scroll_page
from utils.tiktok_utils import (
    build_profile_url,
    extract_username_from_video,
    normalize_username,
)

logger = logging.getLogger(__name__)

# Resource types and 3rd-party tracker domains to block.
# Video/audio media streams are aborted to eliminate memory and bandwidth usage.
# TikTok's internal scripts (such as webmssdk, slardar) are preserved so that React can hydrate profile data.
BLOCKED_RESOURCE_TYPES = {"media"}
BLOCKED_URL_PATTERNS = (
    "google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "facebook.net",
    "analytics.tiktok.com",
)


class TikTokCrawler:
    """
    Coordinates feed discovery, profile crawling, and backend callbacks.
    Orchestrates Steps 1, 2, and 8 of the crawl process.
    """

    HOME_URL = "https://www.tiktok.com/"
    MAX_FEED_DISCOVERY_ATTEMPTS = 30

    def __init__(
        self,
        callback_url: str = BACKEND_CALLBACK_URL,
        callback_token: str | None = None,
    ):
        self.profile_crawler = ProfileCrawler()
        self.callback_service = CallbackService(
            callback_url=normalize_callback_url(callback_url),
            callback_token=callback_token,
        )
        self.blocked_requests_count = 0

    async def _smart_block_route(self, route) -> None:
        """Smart Blocking: Abort video/audio media streams and 3rd-party trackers to save RAM and bandwidth."""
        request = route.request
        url_lower = request.url.lower()

        if request.resource_type in BLOCKED_RESOURCE_TYPES:
            self.blocked_requests_count += 1
            try:
                await route.abort()
            except Exception:
                pass
            return

        if any(pattern in url_lower for pattern in BLOCKED_URL_PATTERNS):
            self.blocked_requests_count += 1
            try:
                await route.abort()
            except Exception:
                pass
            return

        try:
            await route.continue_()
        except Exception:
            pass

    async def run(
        self,
        job_id: int,
        usernames: list[str] | None = None,
        urls: list[str] | None = None,
        target_count: int | None = None,
    ) -> None:
        """
        Step 1 & 2: Validate job targets, launch browser with anti-bot evasion,
        and process accounts through profile crawling and CMS callbacks.
        """
        # Step 1: Nhận Crawl Job & Validate Target
        targets = self._build_targets(usernames, urls)
        crawl_from_feed = not targets
        expected_count = target_count or len(targets)

        if expected_count <= 0:
            raise ValueError(
                "At least one username, URL, or positive count is required"
            )

        logger.info("[Job #%d] Crawl started: %d target(s)", job_id, expected_count)

        success_count = 0
        failed_count = 0
        crawled_usernames: set[str] = set()

        # Step 2: Khởi tạo Browser với Anti-bot & Context
        try:
            async with async_playwright() as playwright:
                launch_args = [
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-blink-features=AutomationControlled",
                ]
                browser = await playwright.chromium.launch(
                    headless=HEADLESS,
                    args=launch_args,
                )
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    user_agent=DEFAULT_USER_AGENT,
                    locale="en-US",
                )
                # Anti-bot: mask navigator.webdriver
                await context.add_init_script(
                    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                )

                # Attach smart blocking route handler to context
                await context.route("**/*", self._smart_block_route)

                page = await context.new_page()

                try:
                    if crawl_from_feed:
                        await open_url(page, self.HOME_URL, wait_until="domcontentloaded", timeout=20000)

                    target_index = 0
                    while len(crawled_usernames) < expected_count:
                        target = await self._next_target(
                            targets=targets,
                            target_index=target_index,
                            feed_page=page,
                            excluded_usernames=crawled_usernames,
                        )

                        if targets:
                            username, profile_url = target
                            target_index += 1
                        else:
                            username = target
                            profile_url = build_profile_url(username)

                        if username in crawled_usernames:
                            if crawl_from_feed:
                                await scroll_page(page)
                            continue

                        crawled_usernames.add(username)

                        # Crawl profile (Steps 3, 4, 5, 6, 7 in ProfileCrawler)
                        account, status, crawl_error = await self._crawl_account(
                            profile_page=page,
                            username=username,
                            profile_url=profile_url,
                        )

                        if status == "success" and account:
                            logger.info(
                                "[Job #%d] [@%s] Profile crawled successfully: %d followers, %d following, %d likes",
                                job_id,
                                account.username,
                                account.followers,
                                account.following,
                                account.likes,
                            )
                        else:
                            logger.warning(
                                "[Job #%d] [@%s] Profile crawl unsuccessful: %s",
                                job_id,
                                username,
                                crawl_error or "Unknown extraction failure",
                            )

                        # Step 8: Lưu kết quả và cập nhật CMS (Callback)
                        callback_succeeded, callback_response = (
                            await self._publish_account_result(
                                job_id=job_id,
                                username=username,
                                profile_url=profile_url,
                                account=account,
                                status=status,
                                error_message=crawl_error,
                            )
                        )

                        if callback_succeeded and status == "success":
                            logger.info(
                                "[Job #%d] [@%s] Callback response: %s",
                                job_id,
                                username,
                                callback_response,
                            )
                            success_count += 1
                        else:
                            logger.error(
                                "[Job #%d] [@%s] Account marked failed: %s (callback: %s)",
                                job_id,
                                username,
                                crawl_error,
                                callback_response,
                            )
                            failed_count += 1

                        if crawl_from_feed:
                            # Return to the feed before discovering the next video
                            back_ok = await go_back(page)
                            if not back_ok:
                                logger.info(
                                    "[Job #%d] Back navigation failed or has no history; reloading feed",
                                    job_id,
                                )
                                try:
                                    await open_url(
                                        page,
                                        self.HOME_URL,
                                        wait_until="domcontentloaded",
                                        timeout=20000,
                                    )
                                except Exception as err:
                                    logger.warning(
                                        "[Job #%d] Could not reload feed: %s",
                                        job_id,
                                        err,
                                    )
                            await scroll_page(page)

                        # Clean up memory between crawl targets
                        import gc
                        gc.collect()
                finally:
                    await context.close()

            # Finalize Job Status
            await self._publish_completed(
                job_id=job_id,
                status="completed",
                total_accounts=success_count + failed_count,
                success_count=success_count,
                failed_count=failed_count,
            )
            logger.info(
                "[Job #%d] Crawl completed: %d succeeded, %d failed",
                job_id,
                success_count,
                failed_count,
            )
        except Exception as error:
            logger.exception("[Job #%d] Crawl job failed: %s", job_id, error)
            await self._publish_completed(
                job_id=job_id,
                status="failed",
                total_accounts=success_count + failed_count,
                success_count=success_count,
                failed_count=failed_count,
                error_message=str(error),
            )
            raise

    async def _crawl_account(
        self,
        profile_page,
        username: str,
        profile_url: str,
    ) -> tuple:
        """Delegate individual profile crawling to ProfileCrawler."""
        try:
            await profile_page.bring_to_front()
            account, status, crawl_error = await self.profile_crawler.crawl(
                page=profile_page,
                username=username,
                profile_url=profile_url,
            )
            return account, status, crawl_error
        except Exception as error:
            logger.exception("Could not crawl @%s", username)
            return None, "failed", str(error)

    async def _publish_account_result(
        self,
        job_id: int,
        username: str,
        profile_url: str,
        account,
        status: str,
        error_message: str | None,
    ) -> tuple[bool, dict]:
        """Send crawled account result to Laravel CMS webhook."""
        if account is not None and status == "success":
            data = {
                "status": "success",
                "account": account.model_dump(mode="json"),
            }
        else:
            data = {
                "status": "failed",
                "username": username,
                "profile_url": profile_url,
                "error_message": error_message or "Profile crawl failed",
            }
            if account is not None:
                data["account"] = account.model_dump(mode="json")

        try:
            response_data = await self.callback_service.send("account", job_id, data)
            return True, response_data
        except Exception as error:
            logger.exception(
                "[Job #%d] Could not deliver result for @%s to backend", job_id, username
            )
            return False, {"error": str(error)}

    async def _publish_completed(
        self,
        job_id: int,
        status: str,
        total_accounts: int,
        success_count: int,
        failed_count: int,
        error_message: str | None = None,
    ) -> None:
        """Publish overall job completion status to Laravel CMS."""
        data = {
            "status": status,
            "total_accounts": total_accounts,
            "success_count": success_count,
            "failed_count": failed_count,
        }
        if error_message:
            data["error_message"] = error_message

        try:
            response_data = await self.callback_service.send("completed", job_id, data)
            logger.info(
                "[Job #%d] Completion callback response: %s", job_id, response_data
            )
        except Exception as error:
            logger.error("[Job #%d] Completion callback failed: %s", job_id, error)

    @staticmethod
    def _build_targets(
        usernames: list[str] | None,
        urls: list[str] | None,
    ) -> list[tuple[str, str]]:
        if usernames:
            normalized_usernames = [
                normalize_username(value)
                for value in usernames
                if normalize_username(value)
            ]
            return list(
                dict.fromkeys(
                    (username, build_profile_url(username))
                    for username in normalized_usernames
                )
            )

        if urls:
            targets = []
            for url in dict.fromkeys(value.strip() for value in urls if value.strip()):
                username = normalize_username(url.rstrip("/").split("/@")[-1])
                if username:
                    targets.append((username, url))
            return targets

        return []

    @staticmethod
    async def _next_target(
        targets: list[tuple[str, str]],
        target_index: int,
        feed_page,
        excluded_usernames: set[str],
    ):
        if targets:
            if target_index >= len(targets):
                raise StopAsyncIteration
            return targets[target_index]

        for attempt in range(1, TikTokCrawler.MAX_FEED_DISCOVERY_ATTEMPTS + 1):
            await feed_page.bring_to_front()
            username = await extract_username_from_video(
                feed_page,
                excluded_usernames=excluded_usernames,
            )
            if username:
                return username

            await scroll_page(feed_page)

        raise RuntimeError(
            "Could not find a new TikTok account in the feed after "
            f"{TikTokCrawler.MAX_FEED_DISCOVERY_ATTEMPTS} scroll attempts."
        )
