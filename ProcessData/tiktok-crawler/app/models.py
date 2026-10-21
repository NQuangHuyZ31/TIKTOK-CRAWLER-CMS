from datetime import datetime

from pydantic import BaseModel


# DTO nội bộ dùng để truyền dữ liệu account từ extractor đến callback.
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
