<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DynamicModuleController extends Controller {
    public function dispatch(
        Request $request,
        string $module,
        string $controller,
        ?string $parameters = null,
        ?string $action = null,
    ) {
        $controllerClass = $this->resolveController($module, $controller);

        if (!class_exists($controllerClass)) {
            abort(404, 'Module controller not found.');
        }

        if ($action === null && $parameters !== null) {
            $action = $parameters;
            $parameters = null;
        }

        if ($action === null) {
            abort(404, 'Action not specified.');
        }

        $controllerInstance = app()->make($controllerClass);
        $actionMethod = $this->resolveActionMethod($controllerInstance, $action);

        if (!method_exists($controllerInstance, $actionMethod)) {
            abort(404, 'Controller action not found.');
        }

        $reflection = new \ReflectionMethod($controllerInstance, $actionMethod);
        if (!$reflection->isPublic() || $reflection->isStatic()) {
            abort(404, 'Controller action not found.');
        }

        if (!$this->supportsRequestMethod($actionMethod, $request)) {
            throw new HttpException(
                405,
                'HTTP method is not supported by this controller action.'
            );
        }

        return app()->call(
            [$controllerInstance, $actionMethod],
            $this->buildActionParameters($parameters)
        );
    }

    private function resolveController(string $module, string $controller): string {
        $moduleClass = $this->toStudlyCase($module);
        $controllerClass = $this->toStudlyCase($controller);
        $candidates = [
            sprintf('Modules\\%s\\Controllers\\%sController', $moduleClass, $controllerClass),
            sprintf('Modules\\%s\\Controllers\\%s%sController', $moduleClass, $moduleClass, $controllerClass),
        ];

        foreach ($candidates as $candidate) {
            if (class_exists($candidate)) {
                return $candidate;
            }
        }

        return $candidates[0];
    }

    private function toStudlyCase(string $value): string {
        return str_replace(' ', '', ucwords(str_replace('-', ' ', $value)));
    }

    private function resolveActionMethod(object $controller, string $action): string {
        $camelCaseAction = $this->toCamelCase($action);

        if (method_exists($controller, $camelCaseAction)) {
            return $camelCaseAction;
        }

        foreach (['get', 'create', 'store', 'update', 'delete', 'destroy'] as $prefix) {
            $candidate = $prefix . ucfirst($camelCaseAction);

            if (method_exists($controller, $candidate)) {
                return $candidate;
            }
        }

        return $camelCaseAction;
    }

    private function toCamelCase(string $value): string {
        return lcfirst($this->toStudlyCase($value));
    }

    private function buildActionParameters(?string $parameters): array {
        if ($parameters === null || $parameters === '') {
            return [];
        }

        $segments = explode('/', trim($parameters, '/'));

        $result = [];

        foreach ($segments as $index => $value) {
            if ($index === 0) {
                $result['id'] = ctype_digit($value) 
                ? (int) $value
                : $value;

                continue;
            }

            $result['parameter' . ($index + 1)] = $value;
        }

        return $result;
    }

    private function supportsRequestMethod(
        string $action,
        Request $request
    ): bool {
        $method = $request->method();
        $action = strtolower($action);

        $methodMap = [
            'index' => ['GET'],
            'show' => ['GET'],
            'all' => ['GET'],
            'get' => ['GET'],
            'add' => ['POST'],
            'store' => ['POST'],
            'create' => ['POST'],
            'update' => ['PUT', 'PATCH'],
            'edit' => ['PUT', 'PATCH'],
            'destroy' => ['DELETE'],
            'delete' => ['DELETE'],
        ];

        if (isset($methodMap[$action])) {
            return in_array($method, $methodMap[$action], true);
        }

        foreach ($methodMap as $prefix => $methods) {
            if (str_starts_with($action, $prefix)) {
                return in_array($method, $methods, true);
            }
        }

        return true;
    }
}
