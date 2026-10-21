<?php

namespace Modules\Core\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CheckModulePermission
 *
 * Middleware to enforce View/Edit permissions partitioned by module.
 * Example route usage: ->middleware('module.permission:crawler,view')
 *                      ->middleware('module.permission:crawler,edit')
 */
class CheckModulePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string   $module  e.g. 'crawler', 'tiktok_account', 'core', 'user'
     * @param  string   $action  'view' or 'edit' (defaults to 'view')
     * @return Response
     */
    public function handle(Request $request, Closure $next, string $module, string $action = 'view'): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated. Please log in to continue.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canAccessModule($module, $action)) {
            return response()->json([
                'status' => 'error',
                'message' => "Forbidden: You do not have '{$action}' permission on module '{$module}'.",
                'required' => [
                    'module' => $module,
                    'action' => $action,
                ],
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
