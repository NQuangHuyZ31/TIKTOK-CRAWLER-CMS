from datetime import datetime

from sqlalchemy import text

from db import get_db


class CrawlJobService:

    def create_job(self):
        database = get_db()

        try:
            query = text("""
                INSERT INTO crawl_jobs (
                    status,
                    started_at
                )
                VALUES (
                    :status,
                    :started_at
                )
            """)

            result = database.execute(
                query,
                {
                    "status": "running",
                    "started_at": datetime.now(),
                }
            )

            database.commit()

            return result.lastrowid

        except Exception:
            database.rollback()
            raise

        finally:
            database.close()

    def update_job(
        self,
        job_id,
        status,
        total_accounts=0,
        success_count=0,
        failed_count=0,
        error_message=None,
    ):
        database = get_db()

        try:
            query = text("""
                UPDATE crawl_jobs
                SET
                    status = :status,
                    finished_at = :finished_at,
                    total_accounts = :total_accounts,
                    success_count = :success_count,
                    failed_count = :failed_count,
                    error_message = :error_message
                WHERE id = :job_id
            """)

            database.execute(
                query,
                {
                    "job_id": job_id,
                    "status": status,
                    "finished_at": datetime.now(),
                    "total_accounts": total_accounts,
                    "success_count": success_count,
                    "failed_count": failed_count,
                    "error_message": error_message,
                }
            )

            database.commit()

        except Exception:
            database.rollback()
            raise

        finally:
            database.close()