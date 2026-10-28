<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\LoginLog;
use Modules\System\Repositories\Interfaces\LoginLogRepositoryInterface;

class LoginLogRepository extends BaseRepository implements LoginLogRepositoryInterface
{
    protected function getModel(): Model
    {
        return new LoginLog();
    }
}
