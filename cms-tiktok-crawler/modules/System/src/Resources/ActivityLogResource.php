<?php

namespace Modules\System\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
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
            'user_id' => $this->user_id,
            'user_email' => $this->user_email,
            'user_role' => $this->user_role,
            'action' => $this->action,
            'module' => $this->module,
            'record_id' => $this->record_id,
            'record_type' => $this->record_type,
            'old_data' => $this->old_data,
            'new_data' => $this->new_data,
            'metadata' => $this->metadata,
            'status' => $this->status,
            'error_message' => $this->error_message,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
