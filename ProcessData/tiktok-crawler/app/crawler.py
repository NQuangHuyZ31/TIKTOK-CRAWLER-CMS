from playwright.async_api import async_playwright

from extractor import extract_profile

from services.crawl_job_service import CrawlJobService
from services.tiktok_account_service import TiktokAccountService
from services.crawl_result_service import CrawlResultService

from utils.browser_utils import (
    open_url,
    go_back,
    scroll_page,
)

from utils.tiktok_utils import (
    extract_username_from_video,
    build_profile_url,
)


class TikTokCrawler:

    TIKTOK_HOME_URL = "https://www.tiktok.com/"

	# Initialize the TikTokCrawler with services for managing crawl jobs, accounts, and results
    def __init__(self):
        self.job_service = CrawlJobService()
        self.account_service = TiktokAccountService()
        self.result_service = CrawlResultService()

	# funtion to run crawler with a specified maximun count of accounts to crawl
    async def run(self, max_count: int):

		# check if max_count is lower than or equal to 0, raise a ValueError
        if max_count <= 0:
            raise ValueError(
                "max_count must be greater than 0"
            )

		# create a new crawl job and get the job_id
        job_id = self.job_service.create_job()

		# initialize counters for total accounts, successful crawls, failed crawls, and scroll attempts
        total_accounts = 0
        total_success = 0
        total_failed = 0
        scroll_attempts = 0

        crawled_usernames = set()

        try:

            async with async_playwright() as playwright:

				# launch a new Chromium browser instance in non-headless mode
                browser = await playwright.chromium.launch(
                    headless=False
                )

                context = await browser.new_context(
                    viewport={
                        "width": 1280,
                        "height": 720,
                    }
                )

				# create a new page in the browser context and navigate to the TikTok home page
                page = await context.new_page()

				# open the TikTok home page and wait for it to load
                await open_url(
                    page,
                    self.TIKTOK_HOME_URL,
                    wait_time=3000,
                )

                while (
                    len(crawled_usernames) < max_count
                ):

                    scroll_attempts += 1

					# collection username from the video page
                    username = (
                        await extract_username_from_video(
                            page
                        )
                    )

					# check if username is found, continue scrolling next video
                    if not username:

                        print(
                            "Could not find username."
                        )

                        await scroll_page(page)
                        continue

                    print(
                        f"Found @{username}"
                    )

					# check duplicate username, if found skip and continue scrolling next video
                    if username in crawled_usernames:

                        print(
                            f"Skip @{username}"
                        )

                        await scroll_page(page)
                        continue

                    crawled_usernames.add(username)

                    total_accounts += 1

                    profile_url = (
                        build_profile_url(username)
                    )

                    try:
						# crawl the profile page and found nessary information
                        await self.crawl_profile(
                            page=page,
                            job_id=job_id,
                            username=username,
                            profile_url=profile_url,
                        )

                        total_success += 1

                    except Exception as error:

                        total_failed += 1

						# save the failed result with the error message
                        self.save_failed_result(
                            job_id=job_id,
                            username=username,
                            profile_url=profile_url,
                            error=error,
                        )

                    await go_back(page)

                    if (
                        len(crawled_usernames)
                        >= max_count
                    ):
                        break

                    await scroll_page(page)

                await browser.close()

            self.job_service.update_job(
                job_id=job_id,
                status="completed",
                total_accounts=total_accounts,
                success_count=total_success,
                failed_count=total_failed,
            )

        except Exception as error:

            self.job_service.update_job(
                job_id=job_id,
                status="failed",
                total_accounts=total_accounts,
                success_count=total_success,
                failed_count=total_failed,
                error_message=str(error),
            )

            raise

	# save to database with success status
    async def crawl_profile(
        self,
        page,
        job_id,
        username,
        profile_url,
    ):

        print(
            f"Opening profile @{username}"
        )

        await open_url(
            page,
            profile_url,
            wait_time=3000,
        )

        html = await page.content()

        profile = extract_profile(
            html=html,
            profile_url=profile_url,
        )

        if not profile.username:
            raise Exception(
                "Could not extract profile username"
            )

        account_id = (
            self.account_service.save_account(
                profile
            )
        )

        self.result_service.save_result(
            crawl_job_id=job_id,
            username=username,
            tiktok_account_id=account_id,
            followers=profile.followers,
            following=profile.following,
            likes=profile.likes,
            profile_url=profile.profile_url,
            status="success",
            crawled_at=profile.crawled_at,
        )

        print(
            f"Success @{username} | "
            f"Followers: {profile.followers} | "
            f"Following: {profile.following} | "
            f"Likes: {profile.likes}"
        )

	# save to database with failed status and error message
    def save_failed_result(
        self,
        job_id,
        username,
        profile_url,
        error,
    ):

        print(
            f"Failed @{username}: {error}"
        )

        try:

            self.result_service.save_result(
                crawl_job_id=job_id,
                username=username,
                tiktok_account_id=None,
                followers=0,
                following=0,
                likes=0,
                profile_url=profile_url,
                status="failed",
                error_message=str(error),
            )

        except Exception as result_error:

            print(
                f"Failed to save result: "
                f"{result_error}"
            )