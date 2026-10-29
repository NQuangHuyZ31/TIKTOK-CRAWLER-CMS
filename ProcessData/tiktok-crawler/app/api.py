import logging
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from config import CALLBACK_TOKEN, normalize_callback_url
from crawler import TikTokCrawler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


class CrawlRequest(BaseModel):
    # Thông tin callback để crawler gửi kết quả về backend sau mỗi account.
    job_id: int = Field(gt=0)
    callback_url: str | None = None
    callback_token: str | None = None
    source_type: Literal["usernames", "urls", "count"] | None = None
    usernames: list[str] | None = None
    urls: list[str] | None = None
    total_accounts: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_source(self):
        # Một job chỉ được chạy một chế độ: username, URL hoặc số lượng.
        values = {
            "usernames": bool(self.usernames),
            "urls": bool(self.urls),
            "count": self.total_accounts is not None,
        }
        selected_sources = [
            source for source, selected in values.items() if selected
        ]
        if len(selected_sources) != 1:
            raise ValueError(
                "Select exactly one crawl mode: usernames, urls, or count"
            )

        if self.source_type and self.source_type != selected_sources[0]:
            raise ValueError(
                f"source_type '{self.source_type}' does not match the supplied data"
            )

        self.source_type = selected_sources[0]
        self.callback_url = normalize_callback_url(self.callback_url)
        self.callback_token = self.callback_token or CALLBACK_TOKEN
        return self


app = FastAPI(title="TikTok Crawler Service")
running_jobs: set[int] = set()


async def execute_crawl(request: CrawlRequest) -> None:
    try:
        # Chạy crawler nền để API có thể trả response 202 ngay cho frontend.
        await TikTokCrawler(
            callback_url=request.callback_url,
            callback_token=request.callback_token,
        ).run(
            job_id=request.job_id,
            usernames=request.usernames,
            urls=request.urls,
            target_count=request.total_accounts,
        )
    except Exception as error:
        logger.exception("Job #%d failed: %s", request.job_id, error)
    finally:
        running_jobs.discard(request.job_id)


@app.get("/health")
async def health():
    return {"status": "ok", "running_jobs": len(running_jobs)}


@app.post("/api/crawl-jobs/start", status_code=202)
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    # Không cho phép chạy đồng thời hai process cho cùng một crawl job.
    if request.job_id in running_jobs:
        raise HTTPException(status_code=409, detail="Crawl job is already running")
    running_jobs.add(request.job_id)
    background_tasks.add_task(execute_crawl, request)
    return {"job_id": request.job_id, "status": "started"}
