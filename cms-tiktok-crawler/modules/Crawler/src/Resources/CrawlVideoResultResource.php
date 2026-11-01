<?php

namespace Modules\Crawler\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CrawlVideoResultResource extends JsonResource
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
            'crawl_job_id' => $this->crawl_job_id,
            'crawl_result_id' => $this->crawl_result_id,
            'tiktok_account_id' => $this->tiktok_account_id,
            'tiktok_video_id' => $this->tiktok_video_id,
            'video_id' => $this->video_id,
            'username' => $this->username,
            'video_url' => $this->video_url,
            'description' => $this->description,
            'hashtags' => is_array($hashtags) ? $hashtags : [],
            'cover_url' => $this->cover_url,
            'duration' => (int) ($this->duration ?? 0),
            'play_count' => (int) ($this->play_count ?? 0),
            'digg_count' => (int) ($this->digg_count ?? 0),
            'comment_count' => (int) ($this->comment_count ?? 0),
            'share_count' => (int) ($this->share_count ?? 0),
            'collect_count' => (int) ($this->collect_count ?? 0),
            'play_count_delta' => (int) ($this->play_count_delta ?? 0),
            'digg_count_delta' => (int) ($this->digg_count_delta ?? 0),
            'comment_count_delta' => (int) ($this->comment_count_delta ?? 0),
            'share_count_delta' => (int) ($this->share_count_delta ?? 0),
            'collect_count_delta' => (int) ($this->collect_count_delta ?? 0),
            'published_at' => $this->published_at,
            'status' => $this->status,
            'error_code' => $this->error_code,
            'error_message' => $this->error_message,
            'crawled_at' => $this->crawled_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
