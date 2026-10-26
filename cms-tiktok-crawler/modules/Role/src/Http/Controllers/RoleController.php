<?php

namespace Modules\Role\Controllers;

use Modules\User\Controllers\RoleController as BaseRoleController;

/**
 * RoleController within Role module, extending the centralized RoleController in User module.
 * Preserves backward compatibility for /admin/api/role/role endpoints.
 */
class RoleController extends BaseRoleController
{
}
