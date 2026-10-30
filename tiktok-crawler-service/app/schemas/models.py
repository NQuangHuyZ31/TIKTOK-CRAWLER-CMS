from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator


class TikTokAccount(BaseModel):
    """Normalized TikTok account data sent to Laravel CMS."""

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
    def normalize_status(cls, value: str | None) -> str:
        if value in ("active", "inactive"):
            return value
        return "active"


class AvatarPayload(BaseModel):
    """Downloaded avatar binary encoded as base64 for safe cross-container transport."""

    content_base64: str
    mime: str = "image/jpeg"


class AccountCrawlOutcome(BaseModel):
    """Final outcome of crawling a single TikTok account."""

    username: str
    profile_url: str
    status: Literal["success", "failed"]
    account: TikTokAccount | None = None
    avatar: AvatarPayload | None = None
    error_code: str | None = None
    error_message: str | None = None


class CrawlJobRecord(BaseModel):
    """Persistent representation of a crawl job in SQLite queue."""

    job_id: int = Field(gt=0)
    source_type: str = "usernames"
    targets: list[str] = Field(default_factory=list)
    status: Literal["queued", "running", "completed", "failed", "cancelled"] = "queued"
    worker_id: str | None = None
    resume_count: int = 0
    error_message: str | None = None
    queued_at: str
    available_at: str
    updated_at: str
    callback_url: str | None = None
    callback_token: str | None = None
