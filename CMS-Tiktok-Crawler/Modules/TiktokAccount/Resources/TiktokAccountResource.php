<?php

namespace Modules\TiktokAccount\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class TiktokAccountResource extends JsonResource
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
			'username' => $this->username,
			'followers_count' => $this->followers_count,
			'following_count' => $this->following_count,
			'likes_count' => $this->likes_count,
			'profile_picture_url' => $this->avatar_url,
			'avatar_url' => $this->avatar_url,
			'avatar_path' => $this->avatar_path,
			'status' => $this->status,
			'crawled_at' => $this->crawled_at,
			'last_crawled_at' => $this->last_crawled_at,
			'created_at' => $this->created_at,
			'updated_at' => $this->updated_at,
		];
    }
}
