<?php

namespace Modules\Auth\Repositories;

use Modules\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\Core\Repositories\BaseRepository;

class AuthRepository extends BaseRepository implements AuthRepositoryInterface
{
    protected function getModel(): Model
    {
        return new User();
    }
}
