<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\SystemSetting;

class SystemSettingRepository extends BaseRepository
{
    protected function getModel(): Model
    {
        return new SystemSetting();
    }

    /**
     * Get settings by group name.
     */
    public function getByGroup(string $group): Collection
    {
        return $this->model->where('group', $group)->get();
    }

    /**
     * Get all settings organized by group key-value dictionary.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getAllGrouped(): array
    {
        $settings = $this->all();
        $grouped = [];

        foreach ($settings as $setting) {
            $grouped[$setting->group][$setting->key] = $setting->getFormattedValue();
        }

        return $grouped;
    }

    /**
     * Find by unique key.
     */
    public function findByKey(string $key): ?SystemSetting
    {
        return $this->model->where('key', $key)->first();
    }

    /**
     * Batch update or insert key-value settings.
     *
     * @param array<string, mixed> $settings
     */
    public function batchUpdate(array $settings, string $defaultGroup = 'general'): bool
    {
        foreach ($settings as $key => $value) {
            $existing = $this->findByKey($key);
            if ($existing) {
                $stringValue = is_array($value) || is_object($value) ? json_encode($value) : (string) $value;
                $existing->update(['value' => $stringValue]);
            } else {
                $type = is_bool($value) ? 'boolean' : (is_numeric($value) ? 'number' : (is_array($value) ? 'json' : 'string'));
                SystemSetting::set($key, $value, $defaultGroup, $type);
            }
        }

        return true;
    }
}
