from datetime import datetime

from pydantic import BaseModel


# TikTokAccount model to represent TikTok account data
class TikTokAccount(BaseModel):
    username: str | None = None
    followers: int = 0
    following: int = 0
    likes: int = 0

    profile_url: str | None = None

    crawled_at: datetime | None = None
    last_crawled_at: datetime | None = None

    status: str = "active"

# Dữ liệu mẫu

# {
# 	"username": "example_user",
# 	"followers": 1000,
# 	"following": 150,
# 	"likes": 5000,
# 	"profile_url": "https://www.tiktok.com/@example_user",
# 	"crawled_at": "2023-10-01T12:00:00Z",
# 	"status": "active",
# 	"last_crawled_at": "2023-10-01T12:00:00Z"
# }
