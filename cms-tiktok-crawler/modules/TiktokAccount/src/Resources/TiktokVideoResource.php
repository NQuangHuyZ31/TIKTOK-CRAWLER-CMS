<?php

namespace Modules\TiktokAccount\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TiktokVideoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hashtags = $this->hashtags;
        if (is_string($hashtags)) {
            $hashtags = json_decode($hashtags, true) ?? [];
        }

        return [
            'id' => $this->id,
            'tiktok_account_id' => $this->tiktok_account_id,
            'video_id' => $this->video_id,
            'username' => $this->username,
            'video_url' => $this->video_url,
            'description' => $this->description,
            'hashtags' => is_array($hashtags) ? $hashtags : [],
            'duration' => (int) ($this->duration ?? 0),
            'width' => (int) ($this->width ?? 0),
            'height' => (int) ($this->height ?? 0),
            'definition' => $this->definition,
            'cover_url' => $this->cover_url,
            'dynamic_cover_url' => $this->dynamic_cover_url,
            'music_id' => $this->music_id,
            'music_title' => $this->music_title,
            'music_author' => $this->music_author,
            'is_original_sound' => (bool) ($this->is_original_sound ?? false),
            'is_pinned' => (bool) ($this->is_pinned ?? false),
            'is_ad' => (bool) ($this->is_ad ?? false),
            'play_count' => (int) ($this->play_count ?? 0),
            'digg_count' => (int) ($this->digg_count ?? 0),
            'comment_count' => (int) ($this->comment_count ?? 0),
            'share_count' => (int) ($this->share_count ?? 0),
            'collect_count' => (int) ($this->collect_count ?? 0),
            'status' => $this->status ?? 'active',
            'published_at' => $this->published_at,
            'crawled_at' => $this->crawled_at,
            'last_crawled_at' => $this->last_crawled_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
