from sqlalchemy import text

from db import get_db


class TiktokAccountService:

    def save_account(self, account):
        database = get_db()

        try:
            query = text("""
                INSERT INTO tiktok_accounts (
                    username,
                    followers_count,
                    following_count,
                    likes_count,
                    profile_url,
                    crawled_at,
                    status,
                    last_crawled_at
                )
                VALUES (
                    :username,
                    :followers,
                    :following,
                    :likes,
                    :profile_url,
                    :crawled_at,
                    :status,
                    :last_crawled_at
                )
                ON DUPLICATE KEY UPDATE
                    followers_count = VALUES(followers_count),
                    following_count = VALUES(following_count),
                    likes_count = VALUES(likes_count),
                    profile_url = VALUES(profile_url),
                    status = VALUES(status),
                    last_crawled_at = VALUES(last_crawled_at)
            """)

            database.execute(
                query,
                {
                    "username": account.username,
                    "followers": account.followers,
                    "following": account.following,
                    "likes": account.likes,
                    "profile_url": account.profile_url,
                    "crawled_at": account.crawled_at,
                    "status": account.status,
                    "last_crawled_at": account.last_crawled_at,
                }
            )

            result = database.execute(
                text("""
                    SELECT id
                    FROM tiktok_accounts
                    WHERE username = :username
                    LIMIT 1
                """),
                {
                    "username": account.username
                }
            )

            account_id = result.scalar_one()

            database.commit()

            return account_id

        except Exception:
            database.rollback()
            raise

        finally:
            database.close()