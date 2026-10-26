<?php

namespace Modules\Core\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckModulePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module = '', string $action = ''): Response
    {
        $module = $module ?: $request->attributes->get('module', (string) $request->route('module'));
        $action = $action ?: $request->attributes->get('permission_action');
        $user = $request->user() ?? auth('sanctum')->user() ?? auth()->user();

        Log::info([
            'module' => $module,
            'action' => $action,
            // 'user'=> $user,
        ]);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($module !== '' && method_exists($user, 'canAccessModule')) {
            if (!$user->canAccessModule($module, $action)) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Forbidden: You do not have '{$action}' permission for '{$module}' module.",
                ], 403);
            }
        }

        return $next($request);
    }
}
