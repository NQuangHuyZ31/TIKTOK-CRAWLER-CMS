<?php

namespace Modules\Core\Support;

use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Modules\Core\Http\Middleware\CheckModulePermission;
use Modules\Core\Support\ModuleRegistry;

/*
|--------------------------------------------------------------------------
| Core Dynamic Module API Routing Engine
|--------------------------------------------------------------------------
|
| Handles all module routing dynamically without requiring explicit route
| registrations outside modules. Supports:
| - Pattern 1: /{module}/{controller}/{id}/{action}/{parameters?}
| - Pattern 2: /{module}/{controller}/{action}/{parameters?}
| - Pattern 3: /{module}/{controller}/{id}  (RESTful Show/Update/Delete)
| - Pattern 4: /{module}/{controller}       (RESTful Index/Store)
*/

class DynamicRouteResovle {
    public function __construct(private ?ModuleRegistry $moduleRegistry = null,private ?Request $request = null) {
        $this->moduleRegistry = $moduleRegistry ?? (app()->bound(ModuleRegistry::class) ? app(ModuleRegistry::class) : null);
        $this->request = $request ?? (app()->bound(Request::class) ? app(Request::class) : null);
    }

    /**
     * Register all dynamic module route patterns.
     */
    public static function routes(): void {
        static::registerRoutes();
    }

    public static function registerRoutes(): void {
        Route::any('/{module}/{controller}/{id}/{action}/{parameters?}', function (Request $request, string $module, string $controller, int | string $id, string $action, ?string $parameters = null) {
            return app(self::class)->handle($request, $module, $controller, $action, $id, $parameters);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'controller' => '[a-zA-Z0-9_-]+', 'id' => '[0-9]+', 'action' => '[a-zA-Z0-9_-]+', 'parameters' => '.*']);

        Route::any('/{module}/{id}/{action}/{parameters?}', function (Request $request, string $module, int | string $id, string $action, ?string $parameters = null) {
            return app(self::class)->handle($request, $module, $module, $action, $id, $parameters);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'id' => '[0-9]+', 'action' => '^(?![0-9]+$)[a-zA-Z0-9_-]+', 'parameters' => '.*']);

        Route::any('/{module}/{controller}/{action}/{parameters?}', function (Request $request, string $module, string $controller, string $action, ?string $parameters = null) {
            return app(self::class)->handle($request, $module, $controller, $action, null, $parameters);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'controller' => '^(?![0-9]+$)[a-zA-Z0-9_-]+', 'action' => '^(?![0-9]+$)[a-zA-Z0-9_-]+', 'parameters' => '.*']);

        Route::any('/{module}/{controller}/{id}', function (Request $request, string $module, string $controller, int | string $id) {
            return app(self::class)->handle($request, $module, $controller, null, $id, null);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'controller' => '^(?![0-9]+$)[a-zA-Z0-9_-]+', 'id' => '[0-9]+']);

        Route::any('/{module}/{controller}', function (Request $request, string $module, string $controller) {
            return app(self::class)->handle($request, $module, $controller, null, null, null);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'controller' => '^(?![0-9]+$)[a-zA-Z0-9_-]+']);

        Route::any('/{module}/{id}', function (Request $request, string $module, int | string $id) {
            return app(self::class)->handle($request, $module, $module, null, $id, null);
        })->where(['module' => '[a-zA-Z0-9_-]+', 'id' => '[0-9]+']);

        Route::any('/{module}', function (Request $request, string $module) {
            return app(self::class)->handle($request, $module, $module, null, null, null);
        })->where(['module' => '[a-zA-Z0-9_-]+']);
    }

    public function handle(Request $request, ?string $module = null, ?string $controller = null, ?string $action = null, mixed $id = null, ?string $parameters = null) {
        $this->request = $request;

        $module = $module ?? $request->route('module');
        $controller = $controller ?? $request->route('controller');
        $action = $action ?? $request->route('action');
        $id = $id ?? $request->route('id');
        $parameters = $parameters ?? $request->route('parameters');

        if (!$module || !$controller) {
            abort(404, 'Module or controller not specified.');
        }

        $controllerClass = $this->resovleController($module, $controller);

        if (!$controllerClass || !class_exists($controllerClass)) {
            // Check if module has a primary {Module}Controller (e.g. AuthController for Auth)
            // and the second segment is actually the action method (e.g. /auth/login, /auth/me)
            $fallbackClass = $this->resovleController($module, $module);
            if ($fallbackClass && class_exists($fallbackClass)) {
                $controllerClass = $fallbackClass;
                $action = $controller;
            } else {
                abort(404, "Module controller [{$controllerClass}] not found.");
            }
        }

        $controllerInstance = app()->make($controllerClass);
        $actionMethod = $this->resovleAction($controllerInstance, $action, $request->method(), $id !== null);

        if (!$actionMethod || !method_exists($controllerInstance, $actionMethod)) {
            abort(404, "Action method not found on [{$controllerClass}].");
        }

        $reflection = new \ReflectionMethod($controllerInstance, $actionMethod);
        if (!$reflection->isPublic() || $reflection->isStatic()) {
            abort(404, "Action [{$actionMethod}] is not publicly accessible.");
        }

        // Resovle action need for permission
        $permissionAction = $this->resolvePermissionAction($actionMethod, $request->method());
        $permissionModule = property_exists($controllerInstance, 'permissionModule') && !empty($controllerInstance->permissionModule)
            ? $controllerInstance->permissionModule
            : str_replace('-', '_', $module);
        $request->attributes->set('module', $permissionModule);
        $request->attributes->set('permission_action', $permissionAction);

        Log::info(''. $module .''. $controller .''. $actionMethod .''. $id .''. $permissionAction);

        // Build parameters for dependency injection generically
        $actionParams = [];

        if ($id !== null) {
            $actionParams['id'] = ctype_digit((string) $id) ? (int) $id : $id;
        }

        // Merge any additional route parameters generically
        if ($request->route()) {
            foreach ($request->route()->parameters() as $key => $val) {
                if (!in_array($key, ['module', 'controller', 'action', 'parameters'], true)) {
                    $actionParams[$key] = ctype_digit((string) $val) ? (int) $val : $val;
                }
            }
        }

        if ($parameters !== null && $parameters !== '') {
            $segments = explode('/', trim($parameters, '/'));
            foreach ($segments as $index => $val) {
                $parsed = ctype_digit($val) ? (int) $val : $val;
                $actionParams['param' . ($index + 1)] = $parsed;
                $actionParams['parameter' . ($index + 1)] = $parsed;
            }
        }

        // Allow router without permission check
        if ($this->shouldSkipPermissionCheck($module, $controllerInstance, $actionMethod)) {
            return app()->call([$controllerInstance, $actionMethod], $actionParams);
        }

        return app(Pipeline::class)
            ->send($request)
            ->through([
                CheckModulePermission::class,
            ])
            ->then(function ($req) use ($controllerInstance, $actionMethod, $actionParams) {
                return app()->call([$controllerInstance, $actionMethod], $actionParams);
            });
    }

    public function resovleController(string $module, string $controller): ?string {
        $registry = $this->moduleRegistry ? $this->moduleRegistry->all() : [];

        $matchedModule = null;
        $lowerModule = strtolower($module);

        // Match module name from registry (case-insensitive and singular/plural fallback)
        foreach (array_keys($registry) as $modName) {
            $lowerMod = strtolower($modName);
            if ($lowerMod === $lowerModule || rtrim($lowerMod, 's') === rtrim($lowerModule, 's')) {
                $matchedModule = $modName;
                break;
            }
        }

        if (!$matchedModule) {
            $matchedModule = $this->toStudly($module);
            if (!class_exists("Modules\\{$matchedModule}\\Http\\Controllers\\" . $this->toStudly($controller) . 'Controller') && !class_exists("Modules\\{$matchedModule}\\Controllers\\" . $this->toStudly($controller) . 'Controller')) {
                $matchedModule = rtrim($matchedModule, 's');
            }
        }

        // Resolve Controller candidates generically
        $controllerStudly = $this->toStudly($controller);
        $controllerSingular = rtrim($controllerStudly, 's');

        $candidates = [
            "Modules\\{$matchedModule}\\Http\\Controllers\\{$controllerStudly}Controller",
            "Modules\\{$matchedModule}\\Http\\Controllers\\{$controllerSingular}Controller",
            "Modules\\{$matchedModule}\\Http\\Controllers\\{$matchedModule}{$controllerStudly}Controller",
            "Modules\\{$matchedModule}\\Http\\Controllers\\{$matchedModule}{$controllerSingular}Controller",
            "Modules\\{$controllerStudly}\\Http\\Controllers\\{$controllerStudly}Controller",
            "Modules\\{$controllerStudly}\\Http\\Controllers\\{$controllerSingular}Controller",
            "Modules\\{$matchedModule}\\Controllers\\{$controllerStudly}Controller",
            "Modules\\{$matchedModule}\\Controllers\\{$controllerSingular}Controller",
            "Modules\\{$matchedModule}\\Controllers\\{$matchedModule}{$controllerStudly}Controller",
            "Modules\\{$matchedModule}\\Controllers\\{$matchedModule}{$controllerSingular}Controller",
            "Modules\\{$controllerStudly}\\Controllers\\{$controllerStudly}Controller",
            "Modules\\{$controllerStudly}\\Controllers\\{$controllerSingular}Controller",
        ];

        foreach ($candidates as $candidate) {
            if (class_exists($candidate)) {
                return $candidate;
            }
        }

        return $candidates[0];
    }

    public function resovleAction(object $controllerInstance, ?string $action, string $httpMethod, bool $hasId = false): ?string {
        if ($action !== null && $action !== '') {
            $camelAction = $this->toCamel($action);

            if (method_exists($controllerInstance, $camelAction)) {
                return $camelAction;
            }

            // Common action aliases
            $aliases = $this->actionAliases();
            $lookupKey = strtolower($action);

            if (isset($aliases[$lookupKey])) {
                foreach ($aliases[$lookupKey] as $candidate) {
                    if (method_exists($controllerInstance, $candidate)) {
                        return $candidate;
                    }
                }
            }

            // Prefix checks: getDetails, updateStatus, etc.
            foreach (['get', 'update', 'post', 'delete', 'store', 'create'] as $prefix) {
                $candidate = $prefix . ucfirst($camelAction);
                if (method_exists($controllerInstance, $candidate)) {
                    return $candidate;
                }
            }

            return $camelAction;
        }

        // Default RESTful actions based on HTTP method
        $restDefaults = [
            'GET' => $hasId ? ['show', 'getDetails', 'get'] : ['index', 'getAll', 'all'],
            'POST' => $hasId ? ['update', 'edit', 'store', 'add', 'create'] : ['store', 'add', 'create'],
            'PUT' => ['update', 'edit'],
            'PATCH' => ['updateStatus', 'update', 'patch'],
            'DELETE' => ['destroy', 'delete', 'remove'],
        ];

        $candidates = $restDefaults[strtoupper($httpMethod)] ?? [];
        foreach ($candidates as $candidate) {
            if (method_exists($controllerInstance, $candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function toStudly(string $value): string {
        return str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $value)));
    }

    private function toCamel(string $value): string {
        return lcfirst($this->toStudly($value));
    }

    private function toSnake(string $value): string {
        return str_replace(' ', '_', $value);
    }

    private function actionAliases(): array {
        return [
            'all' => ['all', 'index', 'getAll'],
            'show' => ['show', 'getShow', 'getDetails', 'details'],
            'details' => ['getDetails', 'show', 'details'],
            'store' => ['add', 'create', 'store'],
            'add' => ['add', 'store', 'create'],
            'create' => ['create', 'add', 'store'],
            'update' => ['update', 'edit'],
            'destroy' => ['delete', 'destroy', 'remove'],
            'delete' => ['delete', 'destroy', 'remove'],
        ];
    }

    private function resolvePermissionAction(string $actionMethod, string $httpMethod): string 
    {
        $map = [
            'index'        => 'view',
            'show'         => 'view',
            'getDetails'   => 'view',
            'store'        => 'create',
            'create'       => 'create',
            'update'       => 'edit',
            'updateStatus' => 'edit',
            'destroy'      => 'delete',
            'delete'       => 'delete',
            'remove'       => 'delete',
            'start'        => 'edit',
        ];

        $actionLower = strtolower($actionMethod);

        if (isset($map[$actionLower])) return $map[$actionLower];

        if (str_starts_with($actionLower, 'get')) return 'view';
        if (str_starts_with($actionLower, 'store') || str_starts_with($actionLower, 'create')) return 'create';
        if (str_starts_with($actionLower, 'update') || str_starts_with($actionLower, 'edit')) return 'edit';
        if (str_starts_with($actionLower, 'delete') || str_starts_with($actionLower, 'destroy')) return 'delete';
        

        return match (strtoupper($httpMethod)) {
            'POST'         => 'create',
            'PUT', 'PATCH' => 'edit',
            'DELETE'       => 'delete',
            default        => 'view', 
        };
    }

    private function shouldSkipPermissionCheck(string $module, object $controllerInstance, string $actionMethod): bool
    {
        $ignoredModules = array_map('strtolower', (array) config('modules.ignore_check_permission', []));
        if (in_array(strtolower($module), $ignoredModules, true)) {
            return true;
        }

        if (property_exists($controllerInstance, 'publicActions') && is_array($controllerInstance->publicActions)) {
            if (in_array($actionMethod, $controllerInstance->publicActions, true)) {
                return true;
            }
        }

        if (in_array(strtolower($actionMethod), ['login', 'logout', 'me', 'register', 'forgotpassword', 'resetpassword'], true)) {
            return true;
        }

        return false;
    }
}