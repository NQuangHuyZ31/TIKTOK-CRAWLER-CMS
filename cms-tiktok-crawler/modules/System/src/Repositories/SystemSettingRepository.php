<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\SystemSetting;
use Modules\System\Repositories\Interfaces\SystemSettingRepositoryInterface;

class SystemSettingRepository extends BaseRepository implements SystemSettingRepositoryInterface
{
    protected function getModel(): Model
    {
        return new SystemSetting();
    }

    /**
     * Retrieve all settings grouped as a key-value dictionary.
     */
    public function getByGroup(string $group): array
    {
        $items = $this->query()->where('group', $group)->get();
        $result = [];

        foreach ($items as $item) {
            $result[$item->key] = $item->value;
        }

        return $result;
    }

    /**
     * Retrieve a single setting by key.
     */
    public function getByKey(string $key, mixed $default = null): mixed
    {
        /** @var SystemSetting|null $setting */
        $setting = $this->query()->where('key', $key)->first();

        return $setting !== null ? $setting->value : $default;
    }

    /**
     * Set or update a single setting.
     */
    public function setKey(string $key, mixed $value, string $group = 'worker'): void
    {
        /** @var SystemSetting|null $setting */
        $setting = $this->query()->where('key', $key)->first();

        if ($setting) {
            $setting->value = $value;
            $setting->save();
        } else {
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : (is_array($value) ? 'json' : 'string'));
            $this->create([
                'group' => $group,
                'key' => $key,
                'value' => $value,
                'type' => $type,
            ]);
        }
    }

    /**
     * Batch set or update multiple settings for a given group.
     */
    public function setMany(array $settings, string $group = 'worker'): void
    {
        foreach ($settings as $key => $value) {
            $this->setKey((string) $key, $value, $group);
        }
    }
}
