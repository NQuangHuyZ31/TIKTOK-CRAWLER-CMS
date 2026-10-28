<?php

namespace Modules\System\Facades;

use Illuminate\Support\Facades\Facade;
use Modules\System\Services\Auditor;

/**
 * @method static void record(string $action, \Illuminate\Database\Eloquent\Model|string|null $target = null, array $metadata = [], string $status = 'SUCCESS', ?string $errorMessage = null, ?string $module = null, ?string $recordId = null, ?string $recordType = null, ?array $oldData = null, ?array $newData = null, mixed $user = null)
 * @method static mixed track(string $action, \Illuminate\Database\Eloquent\Model|string|null $target, callable $execute, array $metadata = [], ?string $module = null, ?string $recordId = null, ?string $recordType = null)
 * @method static array resolveTargetContext(\Illuminate\Database\Eloquent\Model|string|null $target, ?string $recordId = null, ?string $recordType = null, ?string $module = null)
 *
 * @see \Modules\System\Services\Auditor
 */
class Audit extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return Auditor::class;
    }
}
