<?php

namespace Modules\Core\Support;

/**
 * Discovers and manages registered modules in the system.
 * Inspired by Ureka's ModuleRegistry pattern.
 */
class ModuleRegistry {
    /** @var array<string, string>|null */
    private ?array $modules = null;

    /** @var array<string, mixed>|null Memory cache for parsed entrypoints.json */
    private ?array $entrypointsCache = null;

    /** @var array<string, bool> Tracks rendered CSS file URLs to avoid duplicate DOM tags */
    private array $dommedCss = [];

    /** @var array<string, bool> Tracks rendered JS file URLs to avoid duplicate DOM tags */
    private array $dommedJs = [];

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
     * Get and cache the entrypoints manifest content.
     *
     * @return array<string, array{name: string, route_prefix: string, js: string[], css: string[]}>
     */
    public function getEntrypoints(): array
    {
        if ($this->entrypointsCache !== null) {
            return $this->entrypointsCache;
        }

        $manifestPath = public_path('entrypoints.json');
        if (!file_exists($manifestPath)) {
            $manifestPath = public_path('entrypoint.json');
        }

        if (!file_exists($manifestPath)) {
            return $this->entrypointsCache = [];
        }

        $content = (string) file_get_contents($manifestPath);
        $decoded = json_decode($content, true);

        return $this->entrypointsCache = (is_array($decoded) ? $decoded : []);
    }

    /**
     * Render HTML <link rel="stylesheet"> tags for the specified module.
     * Core CSS is always loaded first if not already rendered.
     * Already rendered CSS files are cached in memory to prevent duplicate DOM tags.
     *
     * @param string|null $module Target module passed from blade (defaults to 'Core')
     * @return string
     */
    public function renderCss(?string $module = null): string
    {
        $targetModule = $module ?: 'Core';
        $endpoints = $this->getEntrypoints();

        // Core CSS is always required on every page
        $cssFiles = [];
        if (isset($endpoints['Core']['css'])) {
            foreach ($endpoints['Core']['css'] as $file) {
                if (!in_array($file, $cssFiles, true)) {
                    $cssFiles[] = $file;
                }
            }
        }

        // Module-specific CSS
        if ($targetModule !== 'Core' && isset($endpoints[$targetModule]['css'])) {
            foreach ($endpoints[$targetModule]['css'] as $file) {
                if (!in_array($file, $cssFiles, true)) {
                    $cssFiles[] = $file;
                }
            }
        }

        // Filter out already DOM-ed files via cache
        $html = [];
        foreach ($cssFiles as $file) {
            $url = asset(ltrim($file, '/'));
            if (isset($this->dommedCss[$url])) {
                continue; // Skip already rendered file
            }

            $this->dommedCss[$url] = true;
            $html[] = sprintf('<link rel="stylesheet" href="%s">', e($url));
        }

        return implode("\n    ", $html);
    }

    /**
     * Render HTML <script src="..."> tags for the specified module.
     * Core JS (vendor.js, index.js) is always loaded first if not already rendered.
     * Already rendered JS files are cached in memory to prevent duplicate DOM tags.
     *
     * @param string|null $module Target module passed from blade (defaults to 'Core')
     * @return string
     */
    public function renderJs(?string $module = null): string
    {
        $targetModule = $module ?: 'Core';
        $endpoints = $this->getEntrypoints();

        // Core JS is shared across all pages (vendor.js must load before index.js)
        $jsFiles = [];
        if (isset($endpoints['Core']['js'])) {
            foreach ($endpoints['Core']['js'] as $file) {
                if (!in_array($file, $jsFiles, true)) {
                    $jsFiles[] = $file;
                }
            }
        }

        // Module-specific JS
        if ($targetModule !== 'Core' && isset($endpoints[$targetModule]['js'])) {
            foreach ($endpoints[$targetModule]['js'] as $file) {
                if (!in_array($file, $jsFiles, true)) {
                    $jsFiles[] = $file;
                }
            }
        }

        // Filter out already DOM-ed files via cache
        $html = [];
        foreach ($jsFiles as $file) {
            $url = asset(ltrim($file, '/'));
            if (isset($this->dommedJs[$url])) {
                continue; // Skip already rendered file
            }

            $this->dommedJs[$url] = true;
            $html[] = sprintf('<script src="%s"></script>', e($url));
        }

        return implode("\n    ", $html);
    }

    /**
     * Render both CSS and JS tags for the module.
     */
    public function renderAssets(?string $module = null): string
    {
        $css = $this->renderCss($module);
        $js = $this->renderJs($module);

        return trim($css . ($css && $js ? "\n    " : '') . $js);
    }

    /**
     * Check if a specific asset file URL has already been DOM-ed.
     */
    public function isDommed(string $url): bool
    {
        $fullUrl = str_starts_with($url, 'http') ? $url : asset(ltrim($url, '/'));
        return isset($this->dommedCss[$fullUrl]) || isset($this->dommedJs[$fullUrl]);
    }

    /**
     * Get the list of all DOM-ed files in the current request.
     *
     * @return array{css: string[], js: string[]}
     */
    public function getDommedFiles(): array
    {
        return [
            'css' => array_keys($this->dommedCss),
            'js' => array_keys($this->dommedJs),
        ];
    }

    /**
     * Reset the DOM cache (useful for tests or Octane request recycling).
     */
    public function resetDomCache(): void
    {
        $this->dommedCss = [];
        $this->dommedJs = [];
        $this->entrypointsCache = null;
    }

    /**
     * Get raw asset files (JS & CSS) for the current request using entrypoints.json.
     *
     * @param string|null $explicitModule Optional explicit module name (e.g. 'Crawler')
     * @return array{js: string[], css: string[], activeModule: string|null}
     */
    public function getAssetsForCurrentRequest(?string $explicitModule = null): array
    {
        $endpoints = $this->getEntrypoints();
        if (empty($endpoints)) {
            return ['js' => [], 'css' => [], 'activeModule' => null];
        }

        $core = $endpoints['Core'] ?? [];
        $js = $core['js'] ?? [];
        $css = $core['css'] ?? [];

        $targetModule = $explicitModule ?: 'Core';

        if ($targetModule !== 'Core' && isset($endpoints[$targetModule])) {
            $mod = $endpoints[$targetModule];
            foreach ($mod['css'] ?? [] as $c) {
                if (!in_array($c, $css, true)) {
                    $css[] = $c;
                }
            }
            foreach ($mod['js'] ?? [] as $j) {
                if (!in_array($j, $js, true)) {
                    $js[] = $j;
                }
            }
        }

        return [
            'js' => $js,
            'css' => $css,
            'activeModule' => $targetModule,
        ];
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
