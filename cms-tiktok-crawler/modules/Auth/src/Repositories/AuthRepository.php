<?php

namespace Modules\Auth\Repositories;

use Illuminate\Database\Eloquent\Model;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\User;

/**
 * @extends BaseRepository<User>
 * @implements AuthRepositoryInterface
 */
class AuthRepository extends BaseRepository implements AuthRepositoryInterface
{
    protected function getModel(): Model
    {
        return new User();
    }
}
