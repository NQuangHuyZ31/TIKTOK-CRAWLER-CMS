<?php

namespace Modules\Crawler\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CrawlResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
			'id' => $this->id,
			'crawl_job_id' => $this->crawl_job_id,
			'tiktok_account_id' => $this->tiktok_account_id,
			'username' => $this->username,
			'followers_count' => $this->followers_count,
			'following_count' => $this->following_count,
			'success_count' => $this->success_count,
			'likes_count' => $this->likes_count,
			'profile_url' => $this->profile_url,
			'avatar_url' => $this->avatar_url,
			'avatar_path' => $this->avatar_path,
			'status' => $this->status,
			'error_message' => $this->error_message,
			'crawled_at' => $this->crawled_at,
			'created_at' => $this->created_at,
			'updated_at' => $this->updated_at,
		];
    }
}
