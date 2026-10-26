<?php

namespace Modules\System\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'group' => $this->group,
            'value' => $this->value,
            'formatted_value' => $this->getFormattedValue(),
            'type' => $this->type,
            'description' => $this->description,
            'is_public' => (bool) $this->is_public,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
