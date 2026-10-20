<?php

namespace Modules\Core\Support;

/**
 * Discovers and manages registered modules in the system.
 * Inspired by Ureka's ModuleRegistry pattern.
 */
class ModuleRegistry {
    /** @var array<string, string>|null */
    private ?array $modules = null;

    /**
     * @param string|null $basePath
     * @param string[] $disabled
     */
    public function __construct(
        private readonly ?string $basePath = null,
        private readonly array $disabled = [],
    ) {}

    /**
     * Get all detected modules: module name => absolute module path.
     *
     * @return array<string, string>
     */
    public function all(): array {
        if ($this->modules !== null) {
            return $this->modules;
        }

        $basePath = $this->basePath ?? $this->resolveBasePath();
        $modules = [];

        foreach (glob($basePath . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
            $name = basename($dir);

            // Valid module must have src or routes directory
            if (!is_dir($dir . '/src') && !is_dir($dir . '/routes')) {
                continue;
            }

            if ($name !== 'Core' && in_array($name, $this->disabled, true)) {
                continue;
            }

            $modules[$name] = $dir;
        }

        ksort($modules);

        return $this->modules = $modules;
    }

    /**
     * Check if a module exists.
     */
    public function has(string $name): bool {
        return isset($this->all()[$name]);
    }

    /**
     * Get the absolute path to a module or sub-path within it.
     */
    public function path(string $name, string $sub = ''): string {
        $path = $this->all()[$name] ?? ($this->resolveBasePath() . '/' . $name);

        return $sub === '' ? $path : $path . '/' . ltrim($sub, '/');
    }

    /**
     * Get all ServiceProvider classes for a module.
     *
     * @return string[]
     */
    public function providerClasses(string $name): array {
        $providers = [];
        $providerDir = $this->path($name, 'src/Providers');

        if (is_dir($providerDir)) {
            foreach (glob($providerDir . '/*Provider.php') ?: [] as $file) {
                $className = basename($file, '.php');
                $fullClass = "Modules\\{$name}\\Providers\\{$className}";
                if (class_exists($fullClass)) {
                    $providers[] = $fullClass;
                }
            }
        }

        $default = "Modules\\{$name}\\Providers\\{$name}ServiceProvider";
        if (class_exists($default) && !in_array($default, $providers, true)) {
            $providers[] = $default;
        }

        return $providers;
    }

    /**
     * Get the default expected ServiceProvider class for a module.
     */
    public function providerClass(string $name): string {
        $classes = $this->providerClasses($name);
        return $classes[0] ?? "Modules\\{$name}\\Providers\\{$name}ServiceProvider";
    }

    /**
     * Resolve the base modules directory with fallback for case-sensitivity.
     */
    private function resolveBasePath(): string {
        if (is_dir(base_path('Modules'))) {
            return base_path('Modules');
        }

        if (is_dir(base_path('modules'))) {
            return base_path('modules');
        }

        return base_path('Modules');
    }
}
