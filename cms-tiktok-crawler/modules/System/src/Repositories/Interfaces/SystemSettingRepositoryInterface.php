<?php

namespace Modules\System\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface SystemSettingRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Retrieve all settings grouped as a key-value dictionary.
     */
    public function getByGroup(string $group): array;

    /**
     * Retrieve a single setting by key.
     */
    public function getByKey(string $key, mixed $default = null): mixed;

    /**
     * Set or update a single setting.
     */
    public function setKey(string $key, mixed $value, string $group = 'worker'): void;

    /**
     * Batch set or update multiple settings for a given group.
     */
    public function setMany(array $settings, string $group = 'worker'): void;
}
