<?php

namespace Modules\Permission\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Permission\Models\Permission;
use Illuminate\Support\Str;

class PermissionSeeder extends Seeder
{
    /**
     * Run the permission seeds for all system modules.
     */
    public function run(): void
    {
        $modules = config('modules.modules') ?? [];
        $actions = config('modules.permission_action') ?? [];
        $ignoreModules = ['auth'];

        foreach ($modules as $module) {
            $modLabel = Str::headline($module);

            if (in_array($module, $ignoreModules)) {
                continue;
            }
            
            foreach ($actions as $action) {
                $actLabel = Str::headline($action);
                $slug = "{$module}.{$action}";
                $name = $module === 'core'? "{$actLabel} {$modLabel} & Dashboard" : "{$actLabel} {$modLabel}";

                Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name'        => $name,
                        'slug'        => $slug,
                        'module'      => $module,
                        'action'      => $action,
                        'description' => "Can {$actLabel} {$modLabel}",
                    ]
                );
            }
        }
    }
}
