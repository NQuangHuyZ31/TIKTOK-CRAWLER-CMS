<?php

namespace Modules\Permission\Controllers;

use Modules\User\Controllers\PermissionController as BasePermissionController;

/**
 * PermissionController within Permission module, extending the centralized PermissionController in User module.
 * Preserves backward compatibility for /admin/api/permission/permission endpoints.
 */
class PermissionController extends BasePermissionController
{
}
