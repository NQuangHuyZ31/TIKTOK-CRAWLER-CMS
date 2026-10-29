<?php

namespace Modules\TiktokAccount\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'nickname' => $this->nickname,
            'bio' => $this->bio,
            'sec_uid' => $this->sec_uid,
            'followers_count' => (int) ($this->followers_count ?? 0),
            'following_count' => (int) ($this->following_count ?? 0),
            'likes_count' => (int) ($this->likes_count ?? 0),
            'video_count' => (int) ($this->video_count ?? 0),
            'is_verified' => (bool) $this->is_verified,
            'profile_url' => $this->profile_url,
            'avatar_url' => $this->avatar_url,
            'avatar_path' => $this->resolveAvatarUrl(),
            'status' => $this->status,
            'error_message' => $this->error_message ? $this->error_message : null,
            'crawled_at' => $this->crawled_at,
            'last_crawled_at' => $this->last_crawled_at,
            'created_at' => $this->created_at?->toIso8601String() ?? $this->created_at,
            'updated_at' => $this->updated_at?->toIso8601String() ?? $this->updated_at,
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

        // Direct file in public/ directory (e.g. public/tiktok-accounts/avatars/...)
        if (file_exists(public_path($this->avatar_path))) {
            return asset($this->avatar_path);
        }

        // Legacy / uploaded storage/app/public/ disk file
        if (Storage::disk('public')->exists($this->avatar_path)) {
            return Storage::disk('public')->url($this->avatar_path);
        }

        return asset($this->avatar_path);
    }
}
