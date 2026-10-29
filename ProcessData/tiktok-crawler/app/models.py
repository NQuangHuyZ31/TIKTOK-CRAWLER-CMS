from datetime import datetime

from pydantic import BaseModel, field_validator


# DTO nội bộ dùng để truyền dữ liệu account từ extractor đến callback.
# Laravel CrawlerResultStoreRequest và bảng tiktok_accounts chỉ cho phép status in ('active', 'inactive').
class TikTokAccount(BaseModel):
    username: str | None = None
    followers: int = 0
    following: int = 0
    likes: int = 0

    profile_url: str | None = None
    avatar_url: str | None = None
    avatar_path: str | None = None

    crawled_at: datetime | None = None
    last_crawled_at: datetime | None = None

    status: str = "active"

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: str | None) -> str:
        if v in ("active", "inactive"):
            return v
        return "active"
