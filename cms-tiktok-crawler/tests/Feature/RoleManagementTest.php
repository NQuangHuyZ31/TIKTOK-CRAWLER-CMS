<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Role\Models\Role;
use Modules\Role\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\Role\Services\RoleService;
use Modules\User\Models\User;
use Tests\TestCase;

class RoleManagementTest extends TestCase
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
     * Test RoleRepositoryInterface is properly bound in service container.
     */
    public function test_role_repository_is_bound_in_container(): void
    {
        $repo = app(RoleRepositoryInterface::class);
        $this->assertInstanceOf(RoleRepositoryInterface::class, $repo);

        $roles = $repo->allWithPermissions();
        $this->assertNotEmpty($roles);
    }

    /**
     * Test listing roles via canonical endpoint GET /admin/api/role/role.
     */
    public function test_can_list_roles_via_canonical_endpoint(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('role/role'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                '*' => ['id', 'name', 'slug', 'description', 'permissions'],
            ],
            'meta',
        ]);
    }

    /**
     * Test retrieving role permissions matrix via GET /admin/api/role/role/permissions.
     */
    public function test_can_retrieve_permissions_matrix(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('role/role/permissions'));

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data']);
    }

    /**
     * Test full lifecycle of role: create, show, update, and delete.
     */
    public function test_role_crud_lifecycle(): void
    {
        // 1. Create
        $createRes = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('role/role'), [
            'name' => 'Finance Auditor',
            'slug' => 'finance-auditor',
            'description' => 'Reviews financial accounts and billing metrics',
            'permissions' => ['crawler.view', 'user.view'],
        ]);

        $createRes->assertStatus(201);
        $createRes->assertJsonPath('data.slug', 'finance-auditor');
        $roleId = $createRes->json('data.id');

        // 2. Show
        $showRes = $this->actingAs($this->adminUser)->getJson($this->adminApiUri("role/role/{$roleId}"));
        $showRes->assertStatus(200);
        $showRes->assertJsonPath('data.name', 'Finance Auditor');
        $this->assertCount(2, $showRes->json('data.permissions'));

        // 3. Update
        $updateRes = $this->actingAs($this->adminUser)->putJson($this->adminApiUri("role/role/{$roleId}"), [
            'name' => 'Senior Finance Auditor',
            'description' => 'Lead auditor for all financial operations',
            'permissions' => ['crawler.view'],
        ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.name', 'Senior Finance Auditor');
        $this->assertCount(1, $updateRes->json('data.permissions'));

        // 4. Delete
        $deleteRes = $this->actingAs($this->adminUser)->deleteJson($this->adminApiUri("role/role/{$roleId}"));
        $deleteRes->assertStatus(200);

        $this->assertDatabaseMissing('roles', ['id' => $roleId]);
    }

    /**
     * Test protection of the super administrator role.
     */
    public function test_admin_role_cannot_be_deleted(): void
    {
        $adminRole = Role::where('slug', 'admin')->firstOrFail();

        $response = $this->actingAs($this->adminUser)->deleteJson($this->adminApiUri("role/role/{$adminRole->id}"));

        $response->assertStatus(403);
        $this->assertDatabaseHas('roles', ['slug' => 'admin']);
    }
}
