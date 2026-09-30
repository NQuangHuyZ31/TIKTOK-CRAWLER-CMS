<?php

namespace Modules\Crawler\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
			'status' => $this->status,
			'total_account' => $this->total_account,
			'success_count' => $this->success_count,
			'failed_count' => $this->failed_count,
			'error_message' => $this->error_message,
		];
    }
}
