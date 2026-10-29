import logging

from extractor import extract_profile
from models import TikTokAccount
from services.avatar_service import AvatarService
from utils.browser_utils import open_url
from utils.tiktok_utils import normalize_username

logger = logging.getLogger(__name__)


class ProfileCrawler:

    def __init__(self):
        self.avatar_service = AvatarService()

    async def crawl(
        self,
        page,
        username: str,
        profile_url: str,
    ) -> TikTokAccount:

        await open_url(
            page,
            profile_url,
            wait_time=3000,
        )

        profile = extract_profile(
            html=await page.content(),
            profile_url=profile_url,
        )

        if profile.username:
            profile.username = normalize_username(profile.username)
        elif username:
            profile.username = normalize_username(username)

        if not profile.username:
            raise RuntimeError(
                f"Could not extract profile username from {profile_url}"
            )

        if profile.avatar_url:
            try:
                profile.avatar_path = (
                    await self.avatar_service.download(
                        page,
                        profile.username,
                        profile.avatar_url,
                    )
                )
            except Exception as error:
                logger.warning(
                    "Could not download avatar for @%s: %s",
                    profile.username,
                    error,
                )
                profile.avatar_path = None

        return profile
