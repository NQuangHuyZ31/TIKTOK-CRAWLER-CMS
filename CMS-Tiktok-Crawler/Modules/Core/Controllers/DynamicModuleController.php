<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DynamicModuleController extends Controller
{
    public function dispatch(
        Request $request,
        string $module,
        string $controller,
        string $action,
        ?string $parameters = null,
    ) {
        $controllerClass = $this->resolveController($module, $controller);

        if (!class_exists($controllerClass)) {
            abort(404, 'Module controller not found.');
        }

        $controllerInstance = app()->make($controllerClass);
        $actionMethod = $this->toCamelCase($action);
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
            $this->buildActionParameters($request, $parameters)
        );
    }

    private function resolveController(string $module, string $controller): string
    {
        return sprintf(
            'Modules\\%s\\Controllers\\%sController',
            $this->toStudlyCase($module),
            $this->toStudlyCase($controller)
        );
    }

    private function toStudlyCase(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace('-', ' ', $value)));
    }

    private function toCamelCase(string $value): string
    {
        return lcfirst($this->toStudlyCase($value));
    }

    private function buildActionParameters(
        Request $request,
        ?string $parameters
    ): array {
        $actionParameters = ['request' => $request];
        $segments = $parameters === null || $parameters === ''
            ? []
            : explode('/', trim($parameters, '/'));

        foreach ($segments as $index => $value) {
            $actionParameters[$index === 0 ? 'id' : 'parameter'.($index + 1)] = $value;
        }

        return $actionParameters;
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

        return !isset($methodMap[$action])
            || in_array($method, $methodMap[$action], true);
    }
}
