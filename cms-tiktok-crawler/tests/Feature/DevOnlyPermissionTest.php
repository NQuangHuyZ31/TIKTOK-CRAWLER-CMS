<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Tests\TestCase;

class DevOnlyPermissionTest extends TestCase
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
        $prefix = $adminPath !== '' ? $adminPath : 'admin';
        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    public function test_when_enable_dev_is_false_dev_only_action_is_blocked_even_for_admin(): void
    {
        config([
            'modules.enable_dev' => false,
            'modules.dev_only_actions' => [
                '*' => ['create'],
            ],
        ]);

        // 1. canAccessModule returns false for create, but true for view
        $this->assertFalse($this->adminUser->canAccessModule('user', 'create'));
        $this->assertFalse($this->adminUser->canAccessModule('role', 'create'));
        $this->assertTrue($this->adminUser->canAccessModule('user', 'view'));

        // 2. getModulePermissionsMatrix has false for create
        $matrix = $this->adminUser->getModulePermissionsMatrix();
        $this->assertFalse($matrix['user']['create']);
        $this->assertTrue($matrix['user']['view']);

        // 3. getAllPermissionsSlugs does not contain create slugs
        $slugs = $this->adminUser->getAllPermissionsSlugs();
        $this->assertNotContains('user.create', $slugs);
        $this->assertNotContains('role.create', $slugs);
        $this->assertContains('user.view', $slugs);

        // 4. API request for create action returns 403 Forbidden
        $response = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('role/role'), [
            'name' => 'Test Role',
            'slug' => 'test-role',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('status', 'error');
        $this->assertStringContainsString("You do not have 'create' permission", $response->json('message'));
    }

    public function test_when_enable_dev_is_true_dev_only_actions_are_allowed(): void
    {
        config([
            'modules.enable_dev' => true,
            'modules.dev_only_actions' => [
                '*' => ['create'],
            ],
        ]);

        // 1. canAccessModule returns true for create
        $this->assertTrue($this->adminUser->canAccessModule('user', 'create'));
        $this->assertTrue($this->adminUser->canAccessModule('role', 'create'));

        // 2. Matrix contains true for create
        $matrix = $this->adminUser->getModulePermissionsMatrix();
        $this->assertTrue($matrix['user']['create']);

        // 3. Slugs contain user.create
        $slugs = $this->adminUser->getAllPermissionsSlugs();
        $this->assertContains('user.create', $slugs);

        // 4. API request passes permission check
        $response = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('role/role'), [
            'name' => 'Dev Test Role',
            'slug' => 'dev-test-role',
            'permissions' => ['user.view'],
        ]);

        $response->assertStatus(201);
    }

    public function test_per_module_dev_only_action_restriction(): void
    {
        config([
            'modules.enable_dev' => false,
            'modules.dev_only_actions' => [
                'role' => ['create'],
            ],
        ]);

        // Role create is blocked
        $this->assertFalse($this->adminUser->canAccessModule('role', 'create'));

        // User create is allowed
        $this->assertTrue($this->adminUser->canAccessModule('user', 'create'));

        // Role API returns 403
        $response = $this->actingAs($this->adminUser)->postJson($this->adminApiUri('role/role'), [
            'name' => 'Blocked Role',
            'slug' => 'blocked-role',
        ]);
        $response->assertStatus(403);
    }
}
