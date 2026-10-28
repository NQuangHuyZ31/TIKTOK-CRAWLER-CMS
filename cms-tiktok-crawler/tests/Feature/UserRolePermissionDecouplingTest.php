<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Permission\Models\Permission;
use Modules\Permission\Repositories\PermissionRepositoryInterface;
use Modules\Role\Models\Role;
use Modules\Role\Repositories\RoleRepositoryInterface;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Modules\User\Services\UserService;
use Tests\TestCase;

class UserRolePermissionDecouplingTest extends TestCase
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
     * Test that UserRepository is cleanly decoupled and UserService aggregates Role & Permission queries.
     */
    public function test_user_repository_is_decoupled_from_role_and_permission_queries(): void
    {
        $userRepo = app(UserRepositoryInterface::class);
        $userService = app(UserService::class);
        $roleRepo = app(RoleRepositoryInterface::class);
        $permRepo = app(PermissionRepositoryInterface::class);

        // UserRepository methods do not declare getAllRolesAndPermissions
        $this->assertFalse(method_exists($userRepo, 'getAllRolesAndPermissions'));

        // RoleRepository provides allWithPermissions and slug resolvers
        $this->assertTrue(method_exists($roleRepo, 'allWithPermissions'));
        $this->assertTrue(method_exists($roleRepo, 'resolveIdsBySlugs'));

        // PermissionRepository provides grouped and slug resolvers
        $this->assertTrue(method_exists($permRepo, 'getGroupedByModule'));
        $this->assertTrue(method_exists($permRepo, 'resolveIdsBySlugs'));

        // UserService aggregates catalog via injected repositories
        $catalog = $userService->getRolesAndPermissionsCatalog();
        $this->assertArrayHasKey('roles', $catalog);
        $this->assertArrayHasKey('permissions', $catalog);
        $this->assertArrayHasKey('grouped_permissions', $catalog);
    }

    /**
     * Test UserController endpoints under /admin/api/user
     */
    public function test_user_controller_endpoints_under_user_prefix(): void
    {
        // 1. GET /admin/api/user (List)
        $resList = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user'));
        $resList->assertStatus(200);
        $resList->assertJsonStructure(['status', 'data', 'meta']);

        // 2. GET /admin/api/user/statistics-summary
        $resStats = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/statistics-summary'));
        $resStats->assertStatus(200);
        $resStats->assertJsonStructure(['status', 'data' => ['total_users', 'active_users']]);

        // 3. GET /admin/api/user/roles-and-permissions
        $resCatalog = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/roles-and-permissions'));
        $resCatalog->assertStatus(200);
        $resCatalog->assertJsonStructure(['status', 'data' => ['roles', 'permissions', 'grouped_permissions']]);

        // 4. GET /admin/api/user/{id} (Show)
        $resShow = $this->actingAs($this->adminUser)->getJson($this->adminApiUri("user/{$this->adminUser->id}"));
        $resShow->assertStatus(200);
        $resShow->assertJsonPath('data.id', $this->adminUser->id);

        // 5. POST /admin/api/user (Store)
        $resCreate = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('user'), [
            'name' => 'Decoupled Tester',
            'email' => 'decoupled@cms.com',
            'password' => 'SecurePass123!',
            'status' => 'active',
            'roles' => ['editor'],
        ]);
        $resCreate->assertStatus(201);
        $newUserId = $resCreate->json('data.id');

        // 6. PUT /admin/api/user/{id} (Update)
        $resUpdate = $this->actingAs($this->adminUser)->putJson($this->adminApiUri("user/{$newUserId}"), [
            'name' => 'Decoupled Tester Updated',
            'email' => 'decoupled@cms.com',
            'status' => 'inactive',
        ]);
        $resUpdate->assertStatus(200);
        $resUpdate->assertJsonPath('data.name', 'Decoupled Tester Updated');

        // 7. PATCH /admin/api/user/{id}/status (Toggle Status)
        $resStatus = $this->actingAs($this->adminUser)->patchJson($this->adminApiUri("user/{$newUserId}/status"), [
            'status' => 'active',
        ]);
        $resStatus->assertStatus(200);
        $resStatus->assertJsonPath('data.status', 'active');

        // 8. DELETE /admin/api/user/{id} (Delete)
        $resDelete = $this->actingAs($this->adminUser)->deleteJson($this->adminApiUri("user/{$newUserId}"));
        $resDelete->assertStatus(200);
    }

    /**
     * Test RoleController located in User module under /admin/api/user/role
     */
    public function test_role_controller_inside_user_module_under_user_role_prefix(): void
    {
        // 1. GET /admin/api/user/role (List)
        $resList = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/role'));
        $resList->assertStatus(200);
        $resList->assertJsonStructure(['status', 'data']);

        // 2. GET /admin/api/user/role/permissions (Grouped Permissions)
        $resPerms = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/role/permissions'));
        $resPerms->assertStatus(200);
        $resPerms->assertJsonStructure(['status', 'data']);

        // 3. POST /admin/api/user/role (Create)
        $resCreate = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('user/role'), [
            'name' => 'Quality Assurance',
            'slug' => 'qa-lead',
            'description' => 'Quality assurance specialist',
            'permissions' => ['crawler.view', 'user.view'],
        ]);
        $resCreate->assertStatus(201);
        $roleId = $resCreate->json('data.id');

        // 4. GET /admin/api/user/role/{id} (Show)
        $resShow = $this->actingAs($this->adminUser)->getJson($this->adminApiUri("user/role/{$roleId}"));
        $resShow->assertStatus(200);
        $resShow->assertJsonPath('data.slug', 'qa-lead');

        // 5. PUT /admin/api/user/role/{id} (Update)
        $resUpdate = $this->actingAs($this->adminUser)->putJson($this->adminApiUri("user/role/{$roleId}"), [
            'name' => 'Lead QA Specialist',
            'description' => 'Updated QA role',
        ]);
        $resUpdate->assertStatus(200);
        $resUpdate->assertJsonPath('data.name', 'Lead QA Specialist');

        // 6. DELETE /admin/api/user/role/{id} (Delete)
        $resDelete = $this->actingAs($this->adminUser)->deleteJson($this->adminApiUri("user/role/{$roleId}"));
        $resDelete->assertStatus(200);

        // 7. Backward compatibility: GET /admin/api/role/role also works
        $resLegacy = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('role/role'));
        $resLegacy->assertStatus(200);
    }

    /**
     * Test PermissionController located in User module under /admin/api/user/permission
     */
    public function test_permission_controller_inside_user_module_under_user_permission_prefix(): void
    {
        // 1. GET /admin/api/user/permission (List)
        $resList = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/permission'));
        $resList->assertStatus(200);
        $resList->assertJsonStructure(['status', 'data']);

        // 2. GET /admin/api/user/permission/modules (Grouped by module)
        $resModules = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('user/permission/modules'));
        $resModules->assertStatus(200);
        $resModules->assertJsonStructure(['status', 'data']);

        // 3. Backward compatibility: GET /admin/api/permission/permission also works
        $resLegacy = $this->actingAs($this->adminUser)->getJson($this->adminApiUri('permission/permission'));
        $resLegacy->assertStatus(200);
    }

    /**
     * Test that Models are lightweight without app() service locator calls,
     * and Services orchestrate role/permission resolution via Dependency Injection.
     */
    public function test_models_are_decoupled_from_service_locator_and_services_use_dependency_injection(): void
    {
        $userModelContent = file_get_contents(base_path('modules/User/src/Models/User.php'));
        $roleModelContent = file_get_contents(base_path('modules/Role/src/Models/Role.php'));

        // Models must NOT invoke app() service locator
        $this->assertStringNotContainsString('app(', $userModelContent, 'User model must not contain app() calls.');
        $this->assertStringNotContainsString('app(', $roleModelContent, 'Role model must not contain app() calls.');

        // Test UserService resolves slugs and persists relations purely via injected repositories
        $userService = app(UserService::class);
        $newUser = $userService->createUser([
            'name' => 'DI Test User',
            'email' => 'di_test@cms.com',
            'password' => 'Password123!',
            'roles' => ['editor'],
            'permissions' => ['user.view'],
        ]);

        $this->assertTrue($newUser->roles->contains('slug', 'editor'));
        $this->assertTrue($newUser->permissions->contains('slug', 'user.view'));
    }
}
