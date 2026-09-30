import asyncio

from config import TIKTOK_USERS
from crawler import TikTokCrawler
from services.tiktok_account_service import TiktokAccountService


async def main():

    crawler = TikTokCrawler()
    account_service = TiktokAccountService()

    results = await crawler.run(max_count=50)

if __name__ == "__main__":
    asyncio.run(main())