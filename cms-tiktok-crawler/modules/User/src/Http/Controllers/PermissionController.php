<?php

namespace Modules\User\Http\Controllers;

use Modules\Permission\Http\Controllers\PermissionController as CanonicalPermissionController;

/**
 * Compatibility alias for User module routing (/admin/api/user/permission/*).
 * Extends the canonical PermissionController in the Permission module.
 */
class PermissionController extends CanonicalPermissionController
{
}
