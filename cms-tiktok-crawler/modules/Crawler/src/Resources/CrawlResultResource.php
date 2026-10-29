<?php

namespace Modules\Crawler\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
			'avatar_path' => $this->resolveAvatarUrl(),
			'status' => $this->status,
			'error_message' => $this->error_message,
			'crawled_at' => $this->crawled_at,
			'created_at' => $this->created_at,
			'updated_at' => $this->updated_at,
		];
    }

    private function resolveAvatarUrl(): ?string
    {
        if (!$this->avatar_path) {
            return $this->avatar_url;
        }

        if (str_starts_with($this->avatar_path, 'http://') || str_starts_with($this->avatar_path, 'https://')) {
            return $this->avatar_path;
        }

        if (file_exists(public_path($this->avatar_path))) {
            return asset($this->avatar_path);
        }

        if (Storage::disk('public')->exists($this->avatar_path)) {
            return Storage::disk('public')->url($this->avatar_path);
        }

        return asset($this->avatar_path);
    }
}
