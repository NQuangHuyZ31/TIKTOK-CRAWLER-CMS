<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Modules\User\Models\User;
use Tests\TestCase;

class ModuleManagerTest extends TestCase
{
    use RefreshDatabase;

    private array $cleanupDirs = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    protected function tearDown(): void
    {
        foreach ($this->cleanupDirs as $dir) {
            if (File::isDirectory($dir)) {
                File::deleteDirectory($dir);
            }
        }
        parent::tearDown();
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    public function test_get_and_update_module_visibility_via_module_manager_controller(): void
    {
        $admin = User::where('email', 'admin@cms.com')->firstOrFail();

        // 1. Initial visibility
        $res = $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('module-manager/visibility'));

        $res->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // 2. Update visibility (hide crawler, protect core/system)
        $updateRes = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('module-manager/update-visibility'), [
                'hidden_modules' => ['crawler', 'core', 'system', 'module_manager'],
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.hidden_modules', ['crawler']);
    }

    public function test_scaffold_module_generates_files_and_permissions(): void
    {
        $admin = User::where('email', 'admin@cms.com')->firstOrFail();
        $moduleDir = base_path('modules/TestScaffoldMgr');
        $this->cleanupDirs[] = $moduleDir;

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('module-manager/scaffold'), [
                'module' => 'test_scaffold_mgr',
                'name' => 'Test Scaffold Manager',
                'route_path' => '/test-scaffold-mgr',
                'icon' => 'FolderOutlined',
                'order' => 60,
                'menu_placement' => 'top',
                'create_permissions' => true,
                'permissions' => ['view', 'create', 'delete'],
                'submenus' => [
                    [
                        'label' => 'Sub Page A',
                        'path' => '/test-scaffold-mgr/sub-a',
                        'icon' => 'FileTextOutlined',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module_name', 'TestScaffoldMgr')
            ->assertJsonPath('data.created_permissions_count', 3);

        $this->assertDatabaseHas('permissions', ['slug' => 'test_scaffold_mgr.view']);
        $this->assertDatabaseHas('permissions', ['slug' => 'test_scaffold_mgr.create']);
        $this->assertDatabaseHas('permissions', ['slug' => 'test_scaffold_mgr.delete']);

        $this->assertFileExists("{$moduleDir}/composer.json");
        $this->assertFileExists("{$moduleDir}/routes/api.php");
        $this->assertFileExists("{$moduleDir}/src/Providers/TestScaffoldMgrServiceProvider.php");
        $this->assertFileExists("{$moduleDir}/src/Http/Controllers/TestScaffoldMgrController.php");
        $this->assertFileExists("{$moduleDir}/resources/js/index.ts");
        $this->assertFileExists("{$moduleDir}/resources/js/pages/TestScaffoldMgrPage.tsx");
        $this->assertFileExists("{$moduleDir}/resources/js/pages/TestScaffoldMgrSubPageAPage.tsx");

        $routeContent = File::get("{$moduleDir}/resources/js/routes/route.ts");
        $this->assertStringContainsString("path: '/test-scaffold-mgr'", $routeContent);
        $this->assertStringContainsString('icon: FolderOutlined', $routeContent);
        $this->assertStringContainsString("path: '/test-scaffold-mgr/sub-a'", $routeContent);
        $this->assertStringContainsString('icon: FileTextOutlined', $routeContent);
    }
}
