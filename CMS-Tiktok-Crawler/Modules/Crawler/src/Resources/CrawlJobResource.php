<?php

namespace Modules\Crawler\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class CrawlJobResource extends JsonResource
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
			'started_at' => $this->started_at,
			'finished_at' => $this->finished_at,
			'duration' => $this->started_at && $this->finished_at ? Carbon::parse($this->started_at)->diffInSeconds($this->finished_at) : null,
			'status' => $this->status,
			'source_type' => $this->source_type,
			'data_crawl' => $this->data_crawls
				? json_decode($this->data_crawls, true)
				: [],
			'total_account' => $this->total_accounts,
			'success_count' => $this->success_count,
			'failed_count' => $this->failed_count,
			'error_message' => $this->error_message,
		];
    }
}
