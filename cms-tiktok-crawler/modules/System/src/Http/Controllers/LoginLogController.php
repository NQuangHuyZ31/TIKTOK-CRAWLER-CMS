<?php

namespace Modules\System\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Modules\System\Models\LoginLog;
use Modules\System\Resources\LoginLogResource;
use Modules\System\Services\LoginLogService;

class LoginLogController extends BaseController
{
    protected string $modelClass = LoginLog::class;
    protected ?string $resourceClass = LoginLogResource::class;
    protected array $searchableColumns = ['email', 'ip_address', 'device', 'status', 'failure_reason'];
    protected array $filterableColumns = ['status', 'device', 'user_id'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected LoginLogService $loginLogService
    ) {}
}
