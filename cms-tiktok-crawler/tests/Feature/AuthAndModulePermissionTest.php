<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Database\Seeders\DatabaseSeeder;
use Modules\Core\Http\Middleware\CheckModulePermission;
use Modules\Core\Models\Permission;
use Modules\Core\Models\Role;
use Tests\TestCase;

class AuthAndModulePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    /**
     * Test API: POST /{admin_path}/api/core/auth/login
     */
    public function test_auth_login_with_valid_credentials_issues_token_and_permissions(): void
    {
        $response = $this->postJson($this->apiUri('core/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'token',
                'token_type',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'permissions',
                    'module_permissions' => [
                        'crawler' => ['view', 'edit'],
                        'tiktok_account' => ['view', 'edit'],
                        'core' => ['view', 'edit'],
                        'user' => ['view', 'edit'],
                    ],
                ],
            ],
        ]);

        $this->assertTrue($response->json('data.user.module_permissions.crawler.view'));
        $this->assertTrue($response->json('data.user.module_permissions.crawler.edit'));
    }

    /**
     * Test API: POST /{admin_path}/api/core/auth/login with invalid credentials
     */
    public function test_auth_login_with_invalid_credentials_returns_401(): void
    {
        $response = $this->postJson($this->apiUri('core/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401);
        $response->assertJsonFragment(['status' => 'error']);
    }

    /**
     * Test API: GET /{admin_path}/api/core/auth/me
     */
    public function test_auth_me_returns_profile_and_module_matrix(): void
    {
        $editor = User::where('email', 'editor@cms.com')->first();
        $token = $editor->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('core/auth/me'));

        $response->assertStatus(200);
        $response->assertJsonPath('data.email', 'editor@cms.com');
        $response->assertJsonPath('data.module_permissions.crawler.view', true);
        $response->assertJsonPath('data.module_permissions.crawler.edit', true);
        $response->assertJsonPath('data.module_permissions.user.edit', false);
    }

    /**
     * Test API: GET /{admin_path}/api/auth/me returns complete permissions and roles in a single unified route.
     */
    public function test_auth_me_is_single_unified_endpoint_for_user_and_permissions(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('unified_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('auth/me'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'id',
                'name',
                'email',
                'roles',
                'permissions',
                'module_permissions',
            ],
        ]);
        $this->assertContains('admin', $response->json('data.roles'));
        $this->assertContains('crawler.view', $response->json('data.permissions'));
    }

    /**
     * Test Role-based Module View and Edit authorization logic.
     */
    public function test_module_permission_partitioning_rules(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $manager = User::where('email', 'manager@cms.com')->first();
        $editor = User::where('email', 'editor@cms.com')->first();
        $viewer = User::where('email', 'viewer@cms.com')->first();

        // Admin: Full access across all modules
        $this->assertTrue($admin->canAccessModule('crawler', 'view'));
        $this->assertTrue($admin->canAccessModule('crawler', 'edit'));
        $this->assertTrue($admin->canAccessModule('user', 'edit'));

        // Manager: Can view & edit crawler and tiktok_account, can view user, but cannot edit user
        $this->assertTrue($manager->canAccessModule('crawler', 'view'));
        $this->assertTrue($manager->canAccessModule('crawler', 'edit'));
        $this->assertTrue($manager->canAccessModule('tiktok_account', 'edit'));
        $this->assertTrue($manager->canAccessModule('user', 'view'));
        $this->assertFalse($manager->canAccessModule('user', 'edit'));

        // Editor: Can view & edit crawler, but cannot access user
        $this->assertTrue($editor->canAccessModule('crawler', 'view'));
        $this->assertTrue($editor->canAccessModule('crawler', 'edit'));
        $this->assertFalse($editor->canAccessModule('user', 'view'));
        $this->assertFalse($editor->canAccessModule('user', 'edit'));

        // Viewer: Read-only access (can view, but CANNOT edit)
        $this->assertTrue($viewer->canAccessModule('crawler', 'view'));
        $this->assertFalse($viewer->canAccessModule('crawler', 'edit'));
        $this->assertTrue($viewer->canAccessModule('tiktok_account', 'view'));
        $this->assertFalse($viewer->canAccessModule('tiktok_account', 'edit'));
        $this->assertFalse($viewer->canAccessModule('user', 'view'));
    }

    /**
     * Test CheckModulePermission middleware behavior.
     */
    public function test_check_module_permission_middleware(): void
    {
        $middleware = new CheckModulePermission();

        // 1. Unauthenticated request -> 401
        $guestRequest = Request::create('/test', 'GET');
        $guestResponse = $middleware->handle($guestRequest, fn() => response('OK'), 'crawler', 'view');
        $this->assertEquals(401, $guestResponse->getStatusCode());

        // 2. Viewer trying to edit crawler -> 403 Forbidden
        $viewer = User::where('email', 'viewer@cms.com')->first();
        $viewerRequest = Request::create('/test', 'POST');
        $viewerRequest->setUserResolver(fn() => $viewer);

        $forbiddenResponse = $middleware->handle($viewerRequest, fn() => response('OK'), 'crawler', 'edit');
        $this->assertEquals(403, $forbiddenResponse->getStatusCode());

        // 3. Viewer viewing crawler -> 200 OK
        $allowedResponse = $middleware->handle($viewerRequest, fn() => response('OK'), 'crawler', 'view');
        $this->assertEquals(200, $allowedResponse->getStatusCode());

        // 4. Editor editing crawler -> 200 OK
        $editor = User::where('email', 'editor@cms.com')->first();
        $editorRequest = Request::create('/test', 'POST');
        $editorRequest->setUserResolver(fn() => $editor);

        $editorAllowed = $middleware->handle($editorRequest, fn() => response('OK'), 'crawler', 'edit');
        $this->assertEquals(200, $editorAllowed->getStatusCode());
    }

    /**
     * Test API: POST /{admin_path}/api/core/auth/logout
     */
    public function test_auth_logout_revokes_token(): void
    {
        $user = User::where('email', 'admin@cms.com')->first();
        $token = $user->createToken('logout_test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson($this->apiUri('core/auth/logout'));

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        // Token should be deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'name' => 'logout_test_token',
        ]);
    }

    /**
     * Test all modular database tables exist and can be populated by module seeders.
     */
    public function test_modular_database_tables_and_seeders(): void
    {
        $this->seed(\Modules\TiktokAccount\Database\Seeders\TiktokAccountSeeder::class);
        $this->seed(\Modules\Crawler\Database\Seeders\CrawlJobSeeder::class);

        // Core tables
        $this->assertDatabaseHas('roles', ['slug' => 'admin']);
        $this->assertDatabaseHas('roles', ['slug' => 'viewer']);
        $this->assertDatabaseHas('permissions', ['slug' => 'crawler.view']);
        $this->assertDatabaseHas('permissions', ['slug' => 'crawler.edit']);
        $this->assertDatabaseHas('permissions', ['slug' => 'tiktok_account.view']);
        $this->assertDatabaseHas('permissions', ['slug' => 'tiktok_account.edit']);
        $this->assertDatabaseHas('users', ['email' => 'admin@cms.com']);

        // TikTok Account tables
        $this->assertDatabaseHas('tiktok_accounts', ['username' => 'tiktok']);
        $this->assertDatabaseHas('tiktok_accounts', ['username' => 'khaby.lame']);

        // Crawler tables
        $this->assertDatabaseHas('crawl_jobs', ['code' => 'JOB-20261021-001', 'status' => 'completed']);
        $this->assertDatabaseHas('crawl_results', ['username' => 'tiktok', 'status' => 'success']);
    }
}

