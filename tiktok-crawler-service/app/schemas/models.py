from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator


class TikTokVideo(BaseModel):
    """Normalized TikTok video metadata and statistics sent to Laravel CMS."""

    video_id: str
    username: str | None = None
    video_url: str | None = None
    description: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    duration: int = 0
    width: int = 0
    height: int = 0
    definition: str | None = None
    cover_url: str | None = None
    dynamic_cover_url: str | None = None
    music_id: str | None = None
    music_title: str | None = None
    music_author: str | None = None
    is_original_sound: bool = False
    is_pinned: bool = False
    is_ad: bool = False
    play_count: int = 0
    digg_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    collect_count: int = 0
    status: str = "active"
    published_at: datetime | None = None
    crawled_at: datetime | None = None


class TikTokAccount(BaseModel):
    """Normalized TikTok account data sent to Laravel CMS."""

    username: str | None = None
    sec_uid: str | None = None
    nickname: str | None = None
    bio: str | None = None
    is_verified: bool = False
    followers: int = 0
    following: int = 0
    likes: int = 0
    video_count: int = 0

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
    """Final outcome of crawling a single TikTok account and its videos."""

    username: str
    profile_url: str
    status: Literal["success", "failed"]
    account: TikTokAccount | None = None
    avatar: AvatarPayload | None = None
    videos: list[TikTokVideo] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None


class CrawlJobRecord(BaseModel):
    """Persistent representation of a crawl job in SQLite queue."""

    job_id: int = Field(gt=0)
    source_type: str = "usernames"
    crawl_mode: str = "account_with_videos"
    max_videos_per_account: int = 20
    targets: list[str] = Field(default_factory=list)
    requested_total: int | None = None
    status: Literal["queued", "running", "completed", "failed", "cancelled"] = "queued"
    worker_id: str | None = None
    resume_count: int = 0
    error_message: str | None = None
    queued_at: str
    available_at: str
    updated_at: str
    callback_url: str | None = None
    callback_token: str | None = None
