<?php

namespace Modules\System\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginLogResource extends JsonResource
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
            'email' => $this->email,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'device' => $this->device,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
