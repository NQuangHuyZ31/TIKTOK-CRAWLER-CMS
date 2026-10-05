from pathlib import Path
from urllib.parse import urlparse

import httpx
from playwright.async_api import async_playwright

from config import BACKEND_CALLBACK_URL, normalize_callback_url
from extractor import extract_profile
from models import TikTokAccount
from utils.browser_utils import open_url, scroll_page
from utils.tiktok_utils import (
    build_profile_url,
    extract_username_from_video,
    normalize_username,
)


class TikTokCrawler:
    TIKTOK_HOME_URL = "https://www.tiktok.com/"

    def __init__(
        self,
        callback_url: str = BACKEND_CALLBACK_URL,
        callback_token: str | None = None,
    ):
        self.callback_url = normalize_callback_url(callback_url)
        self.callback_token = callback_token

    async def run(
        self,
        job_id: int,
        usernames: list[str] | None = None,
        urls: list[str] | None = None,
        target_count: int | None = None,
    ) -> None:
        """Crawl accounts and publish each result to the backend callback."""
        # Chuẩn hóa danh sách đầu vào; nếu không có danh sách thì lấy account từ feed.
        targets = self._build_targets(usernames, urls)
        target_from_feed = not targets
        crawl_target_count = target_count or len(targets)

        if crawl_target_count <= 0:
            raise ValueError("At least one username, URL, or positive count is required")

        success_count = 0
        failed_count = 0

        try:
            async with async_playwright() as playwright:
                # Một browser context dùng xuyên suốt job để giữ session TikTok.
                browser = await playwright.chromium.launch(headless=False)
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 720}
                )
                page = await context.new_page()

                if target_from_feed:
                    # Chế độ count bắt đầu từ trang feed và chuyển video bằng scroll.
                    await open_url(page, self.TIKTOK_HOME_URL, wait_time=3000)

                # Dùng set để bỏ qua username bị lặp, đặc biệt trong chế độ feed.
                crawled_usernames: set[str] = set()
                target_index = 0
                while len(crawled_usernames) < crawl_target_count:
                    if targets:
                        # Với username/URL list, xử lý tuần tự đúng theo danh sách.
                        if target_index >= len(targets):
                            break
                        profile_url = targets[target_index]
                        target_index += 1
                        username = normalize_username(
                            profile_url.rstrip("/").split("/@")[-1]
                        )
                    else:
                        # Với chế độ count, lấy username của video hiện tại.
                        username = await extract_username_from_video(page)
                        if not username:
                            await scroll_page(page)
                            continue
                        profile_url = build_profile_url(username)

                    if username in crawled_usernames:
                        if target_from_feed:
                            await scroll_page(page)
                        continue

                    crawled_usernames.add(username)
                    try:
                        # Chỉ phần crawl được bắt lỗi ở đây; lỗi callback không
                        # được biến thành một callback account thứ hai.
                        account = await self.crawl_profile(
                            page=page,
                            username=username,
                            profile_url=profile_url,
                        )
                    except Exception as error:
                        # Một account lỗi không làm dừng các account còn lại.
                        failed_count += 1
                        account = None
                        account_error = str(error)

                    if account is not None:
                        # Mỗi account thành công chỉ phát một account event.
                        await self._callback(
                            "account",
                            job_id,
                            {
                                "status": "success",
                                "account": account.model_dump(mode="json"),
                            },
                        )
                        success_count += 1
                    else:
                        # Mỗi account crawl lỗi chỉ phát một failed event.
                        await self._callback(
                            "account",
                            job_id,
                            {
                                "status": "failed",
                                "username": username,
                                "profile_url": profile_url,
                                "error_message": account_error,
                            },
                        )

                    if target_from_feed:
                        await scroll_page(page)

                await browser.close()

            await self._callback(
                "completed",
                job_id,
                {
                    "status": "completed",
                    "total_accounts": success_count + failed_count,
                    "success_count": success_count,
                    "failed_count": failed_count,
                },
            )
        except Exception as error:
            # Báo trạng thái failed nếu lỗi làm dừng toàn bộ job.
            await self._callback(
                "completed",
                job_id,
                {
                    "status": "failed",
                    "total_accounts": success_count + failed_count,
                    "success_count": success_count,
                    "failed_count": failed_count,
                    "error_message": str(error),
                },
            )
            raise

    @staticmethod
    def _build_targets(
        usernames: list[str] | None,
        urls: list[str] | None,
    ) -> list[str]:
        # Chuyển username thành profile URL và loại bỏ target trùng nhau.
        if usernames:
            return list(dict.fromkeys(
                build_profile_url(normalize_username(value))
                for value in usernames
                if normalize_username(value)
            ))
        if urls:
            # Giữ nguyên URL người dùng nhập, chỉ loại khoảng trắng và duplicate.
            return list(dict.fromkeys(value.strip() for value in urls if value.strip()))
        return []

    async def crawl_profile(
        self,
        page,
        username: str,
        profile_url: str,
    ) -> TikTokAccount:
        # Mở profile và trích xuất dữ liệu từ HTML đã render bởi Playwright.
        await open_url(page, profile_url, wait_time=3000)
        profile = extract_profile(
            html=await page.content(),
            profile_url=profile_url,
        )
        if not profile.username:
            raise RuntimeError("Could not extract profile username")
        if profile.avatar_url:
            # Avatar được tải local để backend có thể lưu đường dẫn file.
            profile.avatar_path = await self.download_avatar(
                page, profile.username, profile.avatar_url
            )
        return profile

    async def download_avatar(self, page, username: str, avatar_url: str) -> str:
        # Lưu avatar cạnh source service, không ghi trực tiếp vào database.
        avatar_dir = Path(__file__).resolve().parent.parent / "avatars"
        avatar_dir.mkdir(parents=True, exist_ok=True)
        response = await page.request.get(avatar_url)
        if not response.ok:
            raise RuntimeError(
                f"Could not download avatar (HTTP {response.status})"
            )

        content_type = (response.headers.get("content-type") or "").lower()
        # Ưu tiên content-type vì URL CDN TikTok thường không có extension rõ ràng.
        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(content_type.split(";")[0], "")
        if not extension:
            extension = Path(urlparse(avatar_url).path).suffix.lower()
        if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            extension = ".jpg"

        avatar_path = avatar_dir / f"{username}{extension}"
        avatar_path.write_bytes(await response.body())
        return str(
            avatar_path.relative_to(Path(__file__).resolve().parent.parent)
        )

    async def _callback(self, event: str, job_id: int, data: dict) -> None:
        # Callback là nơi duy nhất crawler bàn giao dữ liệu cho backend.
        headers = {}
        if self.callback_token:
            headers["Authorization"] = f"Bearer {self.callback_token}"
        payload = {"event": event, "job_id": job_id, **data}
        callback_endpoint = (
            f"{self.callback_url}/crawl-jobs/{job_id}/events"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                callback_endpoint,
                json=payload,
                headers=headers,
            )
            if response.is_error:
                try:
                    error_body = response.json()
                except ValueError:
                    error_body = response.text
                raise RuntimeError(
                    "Backend callback failed "
                    f"(HTTP {response.status_code}) at {callback_endpoint}: "
                    f"{error_body}"
                )
