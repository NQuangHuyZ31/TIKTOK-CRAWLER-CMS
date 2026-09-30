from datetime import datetime

from sqlalchemy import text

from db import get_db


class CrawlResultService:

    def save_result(
        self,
        crawl_job_id,
        username,
        tiktok_account_id=None,
        followers=0,
        following=0,
        likes=0,
        profile_url=None,
        status="success",
        error_message=None,
        crawled_at=None,
    ):
        database = get_db()

        try:
            query = text("""
                INSERT INTO crawl_results (
                    crawl_job_id,
                    tiktok_account_id,
                    username,
                    followers_count,
                    following_count,
                    likes_count,
                    profile_url,
                    status,
                    error_message,
                    crawled_at
                )
                VALUES (
                    :crawl_job_id,
                    :tiktok_account_id,
                    :username,
                    :followers,
                    :following,
                    :likes,
                    :profile_url,
                    :status,
                    :error_message,
                    :crawled_at
                )
            """)

            database.execute(
                query,
                {
                    "crawl_job_id": crawl_job_id,
                    "tiktok_account_id": tiktok_account_id,
                    "username": username,
                    "followers": followers,
                    "following": following,
                    "likes": likes,
                    "profile_url": profile_url,
                    "status": status,
                    "error_message": error_message,
                    "crawled_at": crawled_at or datetime.now(),
                }
            )

            database.commit()

        except Exception:
            database.rollback()
            raise

        finally:
            database.close()