<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Permission\Models\Permission;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\Permission\Services\PermissionService;
use Tests\TestCase;

class PermissionManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
    }

    protected function adminApiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        return '/' . ($adminPath ?: 'admin') . '/api/' . ltrim($path, '/');
    }

    /**
     * Test distinct modules endpoint.
     */
    public function test_distinct_modules_endpoint_returns_unique_module_keys(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson($this->adminApiUri('user/permission/distinct-modules'));

        $response->assertOk()
            ->assertJsonPath('status', 'success');

        $modules = $response->json('data');
        $this->assertIsArray($modules);
        $this->assertContains('user', $modules);
        $this->assertContains('role', $modules);
    }

    /**
     * Test single permission creation via API.
     */
    public function test_admin_can_create_single_permission(): void
    {
        $payload = [
            'module' => 'billing',
            'action' => 'export',
            'name' => 'Export Invoices',
            'slug' => 'billing.export',
            'description' => 'Allows exporting customer billing invoices',
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->adminApiUri('user/permission'), $payload);

        $response->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.slug', 'billing.export')
            ->assertJsonPath('data.module', 'billing')
            ->assertJsonPath('data.action', 'export');

        $this->assertDatabaseHas('permissions', [
            'slug' => 'billing.export',
            'module' => 'billing',
            'action' => 'export',
        ]);
    }

    /**
     * Test create module with 4 basic permissions via API.
     */
    public function test_admin_can_create_module_with_standard_permissions(): void
    {
        $payload = [
            'module' => 'analytics',
            'name' => 'Analytics & Insights',
            'actions' => ['view', 'create', 'edit', 'delete'],
            'description' => 'Analytics module with standard CRUD permissions',
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->adminApiUri('user/permission/create-module'), $payload);

        $response->assertCreated()
            ->assertJsonPath('status', 'success');

        $created = $response->json('data');
        $this->assertCount(4, $created);

        $this->assertDatabaseHas('permissions', ['slug' => 'analytics.view']);
        $this->assertDatabaseHas('permissions', ['slug' => 'analytics.create']);
        $this->assertDatabaseHas('permissions', ['slug' => 'analytics.edit']);
        $this->assertDatabaseHas('permissions', ['slug' => 'analytics.delete']);
    }

    /**
     * Test permission deletion.
     */
    public function test_admin_can_delete_permission(): void
    {
        $permission = Permission::create([
            'name' => 'Temporary Permission',
            'slug' => 'temp.action',
            'module' => 'temp',
            'action' => 'action',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson($this->adminApiUri("user/permission/{$permission->id}"));

        $response->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('permissions', [
            'id' => $permission->id,
        ]);
    }

    /**
     * Test repository querying follows $this->model rule.
     */
    public function test_permission_repository_is_bound_in_container(): void
    {
        $repo = app(PermissionRepositoryInterface::class);
        $this->assertInstanceOf(PermissionRepositoryInterface::class, $repo);

        $modules = $repo->getDistinctModules();
        $this->assertIsArray($modules);
    }
}
