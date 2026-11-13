<?php

namespace Modules\ModuleManager\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Modules\Permission\Services\PermissionService;
use Modules\System\Services\SystemSettingService;

class ModuleManagerService
{
    private const ALLOWED_ICONS = [
        'AppstoreOutlined',
        'FileTextOutlined',
        'BarChartOutlined',
        'FolderOutlined',
        'DatabaseOutlined',
        'TeamOutlined',
        'GlobalOutlined',
        'TagOutlined',
        'SettingOutlined',
    ];

    public function __construct(
        protected SystemSettingService $systemSettingService,
        protected PermissionService $permissionService
    ) {}

    /**
     * Get the current list of hidden modules.
     *
     * @return array<string>
     */
    public function getHiddenModules(): array
    {
        $hidden = $this->systemSettingService->getSetting('hidden_modules', []);
        return is_array($hidden) ? array_values($hidden) : [];
    }

    /**
     * Update hidden modules list, ensuring protected modules cannot be hidden.
     *
     * @param  array<string>  $hiddenModules
     * @return array<string>
     */
    public function updateHiddenModules(array $hiddenModules): array
    {
        $protected = config('modules.protected', []);
        $filtered = array_values(array_unique(array_filter(
            array_map(static fn ($m) => strtolower(trim((string) $m)), $hiddenModules),
            static fn ($m) => $m !== '' && !in_array($m, $protected, true)
        )));

        $this->systemSettingService->updateGroupSettings('modules', [
            'hidden_modules' => $filtered,
        ]);

        return $filtered;
    }

    /**
     * Scaffold minimal Ureka-standard backend & frontend files for a module.
     * Existing files are never overwritten.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function scaffold(array $options): array
    {
        $moduleKey = Str::snake(trim((string) $options['module']));
        $studlyName = Str::studly($moduleKey);
        $kebabName = Str::kebab($studlyName);
        $camelName = Str::camel($studlyName);
        $displayName = trim((string) ($options['name'] ?? '')) ?: Str::headline($moduleKey);
        $description = trim((string) ($options['description'] ?? '')) ?: "Manage {$displayName} records and workflows.";

        $routePath = $this->normalizePath((string) ($options['route_path'] ?? ''), "/{$kebabName}");
        $icon = $this->sanitizeIcon((string) ($options['icon'] ?? 'AppstoreOutlined'));
        $order = (int) ($options['order'] ?? 100);
        $placement = ($options['menu_placement'] ?? 'top') === 'submenu' ? 'submenu' : 'top';
        $parentPath = $placement === 'submenu'
            ? $this->normalizePath((string) ($options['parent_path'] ?? ''), '')
            : null;

        $submenus = [];
        if ($placement === 'top' && !empty($options['submenus']) && is_array($options['submenus'])) {
            foreach ($options['submenus'] as $index => $sub) {
                $subLabel = trim((string) ($sub['label'] ?? ''));
                $subPath = $this->normalizePath((string) ($sub['path'] ?? ''), '');
                if ($subLabel === '' || $subPath === '') {
                    continue;
                }
                $subStudly = Str::studly(Str::snake($subLabel)) ?: ('Submenu' . ($index + 1));
                $componentName = "{$studlyName}{$subStudly}Page";
                $submenus[] = [
                    'label' => $subLabel,
                    'path' => $subPath,
                    'icon' => $this->sanitizeIcon((string) ($sub['icon'] ?? 'AppstoreOutlined')),
                    'order' => $order + $index + 1,
                    'component' => $componentName,
                ];
            }
        }

        $basePath = base_path(trim((string) config('modules.path', 'modules'), '/') . "/{$studlyName}");
        $createdFiles = [];
        $skippedFiles = [];

        $files = [
            'composer.json' => $this->buildComposerJson($kebabName, $studlyName, $displayName),
            'routes/api.php' => $this->buildApiRoutes($studlyName, $kebabName),
            "src/Providers/{$studlyName}ServiceProvider.php" => $this->buildServiceProvider($studlyName),
            "src/Http/Controllers/{$studlyName}Controller.php" => $this->buildController($studlyName, $moduleKey),
            "resources/js/pages/{$studlyName}Page.tsx" => $this->buildPageComponent(
                "{$studlyName}Page",
                $displayName,
                $description
            ),
            'resources/js/routes/route.ts' => $this->buildRouteFile(
                $studlyName,
                $camelName,
                $moduleKey,
                $displayName,
                $routePath,
                $icon,
                $order,
                $parentPath,
                $submenus
            ),
            'resources/js/index.ts' => $this->buildIndexFile($studlyName, $camelName),
        ];

        foreach ($submenus as $sub) {
            $files["resources/js/pages/{$sub['component']}.tsx"] = $this->buildPageComponent(
                $sub['component'],
                $sub['label'],
                "{$displayName} — {$sub['label']}"
            );
        }

        foreach ($files as $relativePath => $content) {
            $fullPath = "{$basePath}/{$relativePath}";
            $displayPath = "modules/{$studlyName}/{$relativePath}";
            if (File::exists($fullPath)) {
                $skippedFiles[] = $displayPath;
                continue;
            }
            File::ensureDirectoryExists(dirname($fullPath));
            File::put($fullPath, $content);
            $createdFiles[] = $displayPath;
        }

        // Optionally create basic permissions in database
        $createdPermissions = [];
        if (!empty($options['create_permissions'])) {
            $actions = !empty($options['permissions']) && is_array($options['permissions'])
                ? $options['permissions']
                : ['view', 'create', 'edit', 'delete'];

            $createdPermissions = $this->permissionService->createModulePermissions(
                $moduleKey,
                $actions,
                $displayName,
                $description
            );
        }

        return [
            'module_name' => $studlyName,
            'module_key' => $moduleKey,
            'route_path' => $routePath,
            'created_files' => $createdFiles,
            'skipped_files' => $skippedFiles,
            'created_permissions_count' => count($createdPermissions),
            'build_command' => "node scripts/mix-module.cjs {$studlyName} --dev",
        ];
    }

    private function normalizePath(string $path, string $fallback): string
    {
        $trimmed = trim($path);
        if ($trimmed === '') {
            return $fallback;
        }
        return '/' . ltrim($trimmed, '/');
    }

    private function sanitizeIcon(string $icon): string
    {
        $trimmed = trim($icon);
        return in_array($trimmed, self::ALLOWED_ICONS, true) ? $trimmed : 'AppstoreOutlined';
    }

    private function escapeTsString(string $value): string
    {
        return str_replace(['\\', "'"], ['\\\\', "\\'"], $value);
    }

    private function buildComposerJson(string $kebabName, string $studlyName, string $displayName): string
    {
        return json_encode([
            'name' => "cms-tiktok-crawler/module-{$kebabName}",
            'description' => "{$displayName} module for CMS TikTok Crawler",
            'version' => '1.0.0',
            'type' => 'library',
            'require' => [
                'php' => '^8.3',
                'laravel/framework' => '^13.17',
                'cms-tiktok-crawler/module-core' => '1.0.0',
            ],
            'autoload' => [
                'psr-4' => [
                    "Modules\\{$studlyName}\\" => 'src/',
                ],
            ],
            'extra' => [
                'laravel' => [
                    'providers' => [
                        "Modules\\{$studlyName}\\Providers\\{$studlyName}ServiceProvider",
                    ],
                ],
            ],
            'minimum-stability' => 'stable',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    }

    private function buildApiRoutes(string $studlyName, string $kebabName): string
    {
        return <<<PHP
<?php

/**
 * Module {$studlyName} API Routes
 *
 * Resolved dynamically via Core DynamicRouteResolver under /{admin_path}/api/{$kebabName}/*
 */

PHP;
    }

    private function buildServiceProvider(string $studlyName): string
    {
        return <<<PHP
<?php

namespace Modules\\{$studlyName}\\Providers;

use Modules\\Core\\Providers\\ModuleServiceProvider;

class {$studlyName}ServiceProvider extends ModuleServiceProvider
{
    protected string \$name = '{$studlyName}';
}

PHP;
    }

    private function buildController(string $studlyName, string $moduleKey): string
    {
        return <<<PHP
<?php

namespace Modules\\{$studlyName}\\Http\\Controllers;

use Modules\\Core\\Http\\Controllers\\BaseController;

class {$studlyName}Controller extends BaseController
{
    public string \$permissionModule = '{$moduleKey}';
}

PHP;
    }

    private function buildPageComponent(string $componentName, string $title, string $subtitle): string
    {
        $safeTitle = $this->escapeTsString($title);
        $safeSubtitle = $this->escapeTsString($subtitle);

        return <<<TSX
import React from 'react';
import { Empty } from 'antd';
import ListLayout from '@core/components/ListLayout';

export default function {$componentName}() {
	return (
		<ListLayout
			title="{$safeTitle}"
			subtitle="{$safeSubtitle}"
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: '{$safeTitle}' }]}
		>
			<Empty description="{$safeTitle} module is ready for customization." />
		</ListLayout>
	);
}

TSX;
    }

    /**
     * @param  array<int, array{label: string, path: string, icon: string, order: int, component: string}>  $submenus
     */
    private function buildRouteFile(
        string $studlyName,
        string $camelName,
        string $moduleKey,
        string $displayName,
        string $routePath,
        string $icon,
        int $order,
        ?string $parentPath,
        array $submenus
    ): string {
        $usedIcons = [$icon];
        foreach ($submenus as $sub) {
            $usedIcons[] = $sub['icon'];
        }
        $usedIcons = array_values(array_unique($usedIcons));
        sort($usedIcons);

        $iconImport = implode(', ', $usedIcons);
        $pageImports = ["import {$studlyName}Page from '../pages/{$studlyName}Page';"];
        foreach ($submenus as $sub) {
            $pageImports[] = "import {$sub['component']} from '../pages/{$sub['component']}';";
        }
        $pageImportsBlock = implode("\n", $pageImports);

        $safeDisplayName = $this->escapeTsString($displayName);
        $safeRoutePath = $this->escapeTsString($routePath);
        $parentLine = $parentPath !== null && $parentPath !== ''
            ? "\n\t\tparentPath: '" . $this->escapeTsString($parentPath) . "',"
            : '';

        $routesEntries = [
            "\t{\n\t\tpath: '{$safeRoutePath}',\n\t\tcomponent: {$studlyName}Page,\n\t\tlayout: 'admin',{$parentLine}\n\t\tmodule: '{$moduleKey}',\n\t\taction: 'view',\n\t\ttitle: '{$safeDisplayName}',\n\t\tlabel: '{$safeDisplayName}',\n\t\ticon: {$icon},\n\t\torder: {$order},\n\t},",
        ];

        foreach ($submenus as $sub) {
            $safeSubLabel = $this->escapeTsString($sub['label']);
            $safeSubPath = $this->escapeTsString($sub['path']);
            $routesEntries[] = "\t{\n\t\tpath: '{$safeSubPath}',\n\t\tcomponent: {$sub['component']},\n\t\tlayout: 'admin',\n\t\tparentPath: '{$safeRoutePath}',\n\t\tmodule: '{$moduleKey}',\n\t\taction: 'view',\n\t\ttitle: '{$safeSubLabel}',\n\t\tlabel: '{$safeSubLabel}',\n\t\ticon: {$sub['icon']},\n\t\torder: {$sub['order']},\n\t},";
        }

        $routesBlock = implode("\n", $routesEntries);

        return <<<TS
import { {$iconImport} } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
{$pageImportsBlock}

const {$camelName}Routes: RouteDef[] = [
{$routesBlock}
];

export default {$camelName}Routes;

TS;
    }

    private function buildIndexFile(string $studlyName, string $camelName): string
    {
        return <<<TS
/**
 * Entry point for {$studlyName} module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import {$camelName}Routes from './routes/route';

registerRoutes({$camelName}Routes);

TS;
    }
}
