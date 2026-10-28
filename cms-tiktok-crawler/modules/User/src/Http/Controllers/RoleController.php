<?php

namespace Modules\User\Http\Controllers;

use Modules\Role\Http\Controllers\RoleController as CanonicalRoleController;

/**
 * Compatibility alias for User module routing (/admin/api/user/role/*).
 * Extends the canonical RoleController in the Role module.
 */
class RoleController extends CanonicalRoleController
{
}
