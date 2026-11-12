<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\DatabaseSeeder;
use Modules\Core\Models\Role;
use Tests\TestCase;

class UserModuleTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $managerUser;
    protected User $viewerUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
        $this->managerUser = User::where('email', 'manager@cms.com')->firstOrFail();
        $this->viewerUser = User::where('email', 'viewer@cms.com')->firstOrFail();
    }

    protected function apiUri(string $path = ''): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/user/users' . ($path !== '' ? '/' . ltrim($path, '/') : '');
    }

    /**
     * Test API: GET /admin/api/user/users without credentials returns 401.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson($this->apiUri());
        $response->assertStatus(401);
    }

    /**
     * Test API: GET /admin/api/user/users as Admin returns 200 and user listing.
     */
    public function test_admin_can_list_users(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data',
            'meta' => ['total', 'current_page', 'per_page', 'last_page'],
        ]);
        $response->assertJsonPath('status', 'success');
    }

    /**
     * Test API: GET /admin/api/user/users/{id} as Admin returns user details.
     */
    public function test_admin_can_view_user_details(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri((string) $this->managerUser->id));

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $this->managerUser->id);
        $response->assertJsonPath('data.email', 'manager@cms.com');
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email',
                'phone',
                'status',
                'roles',
                'role_slugs',
                'all_permissions',
                'permissions_matrix',
            ],
        ]);
    }

    /**
     * Test API: POST /admin/api/user/users as Admin creates a user.
     */
    public function test_admin_can_create_user(): void
    {
        $payload = [
            'name' => 'Alice Test',
            'email' => 'alice@test.com',
            'password' => 'secret123',
            'phone' => '0919998888',
            'status' => 'active',
            'roles' => ['editor'],
        ];

        $response = $this->actingAs($this->adminUser)->postJson($this->apiUri(), $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Alice Test');
        $response->assertJsonPath('data.email', 'alice@test.com');
        $this->assertDatabaseHas('users', ['email' => 'alice@test.com']);
    }

    /**
     * Test API: PUT /admin/api/user/users/{id} as Admin updates a user.
     */
    public function test_admin_can_update_user(): void
    {
        $payload = [
            'name' => 'Manager Updated',
            'phone' => '0999999999',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->adminUser)->putJson(
            $this->apiUri((string) $this->managerUser->id),
            $payload
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.name', 'Manager Updated');
        $response->assertJsonPath('data.phone', '0999999999');
        $this->assertDatabaseHas('users', [
            'id' => $this->managerUser->id,
            'name' => 'Manager Updated',
        ]);
    }

    /**
     * Test API: PATCH /admin/api/user/users/{id}/status as Admin changes user status.
     */
    public function test_admin_can_update_user_status(): void
    {
        $response = $this->actingAs($this->adminUser)->patchJson(
            $this->apiUri($this->managerUser->id . '/status'),
            ['status' => 'inactive']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'inactive');
        $this->assertDatabaseHas('users', [
            'id' => $this->managerUser->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test API: DELETE /admin/api/user/users/{id} as Admin deletes user.
     */
    public function test_admin_can_delete_user(): void
    {
        $userToDelete = User::create([
            'name' => 'Temp User',
            'email' => 'temp@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser)->deleteJson($this->apiUri((string) $userToDelete->id));

        $response->assertStatus(200);
        $this->assertSoftDeleted('users', ['id' => $userToDelete->id]);
    }

    /**
     * Test that a user cannot delete their own account.
     */
    public function test_user_cannot_delete_self(): void
    {
        $response = $this->actingAs($this->adminUser)->deleteJson($this->apiUri((string) $this->adminUser->id));

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'You cannot delete your own account.');
    }

    /**
     * Test manager with user.view permission can view user list and detail.
     */
    public function test_manager_with_user_view_can_list_and_view_users(): void
    {
        // Manager has user.view permission
        $this->assertTrue($this->managerUser->canAccessModule('user', 'view'));

        $listResponse = $this->actingAs($this->managerUser)->getJson($this->apiUri());
        $listResponse->assertStatus(200);

        $detailResponse = $this->actingAs($this->managerUser)->getJson($this->apiUri((string) $this->adminUser->id));
        $detailResponse->assertStatus(200);
    }

    /**
     * Test manager without user.edit permission is forbidden from creating user (403).
     */
    public function test_manager_cannot_create_user_forbidden(): void
    {
        $this->assertFalse($this->managerUser->canAccessModule('user', 'edit'));

        $response = $this->actingAs($this->managerUser)->postJson($this->apiUri(), [
            'name' => 'Forbidden User',
            'email' => 'forbidden@test.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test manager without user.edit permission is forbidden from updating user (403).
     */
    public function test_manager_cannot_update_user_forbidden(): void
    {
        $response = $this->actingAs($this->managerUser)->putJson(
            $this->apiUri((string) $this->viewerUser->id),
            ['name' => 'Hacked Name']
        );

        $response->assertStatus(403);
    }

    /**
     * Test manager without user.edit permission is forbidden from deleting user (403).
     */
    public function test_manager_cannot_delete_user_forbidden(): void
    {
        $response = $this->actingAs($this->managerUser)->deleteJson(
            $this->apiUri((string) $this->viewerUser->id)
        );

        $response->assertStatus(403);
    }

    /**
     * Test viewer without user.view permission is forbidden from viewing user list (403).
     */
    public function test_viewer_without_user_view_is_forbidden_from_listing(): void
    {
        $this->assertFalse($this->viewerUser->canAccessModule('user', 'view'));

        $response = $this->actingAs($this->viewerUser)->getJson($this->apiUri());
        $response->assertStatus(403);
    }

    /**
     * Test API: GET /admin/api/user/users/statistics-summary returns user stats.
     */
    public function test_statistics_summary_returns_kpis(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('statistics-summary'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'total_users',
                'active_users',
                'inactive_users',
                'blocked_users',
                'admin_users',
                'manager_users',
                'editor_users',
                'viewer_users',
            ],
        ]);
    }

    /**
     * Test API: GET /admin/api/user/users/roles-and-permissions returns roles catalog.
     */
    public function test_roles_and_permissions_returns_catalog(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('roles-and-permissions'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'roles',
                'permissions',
                'grouped_permissions',
            ],
        ]);
    }

    /**
     * Test API: Creating a Google OAuth user marks auth_type as google and blocks password reset.
     */
    public function test_google_user_blocks_reset_password_and_password_login(): void
    {
        $createResponse = $this->actingAs($this->adminUser)->postJson($this->apiUri(), [
            'name' => 'Google User',
            'email' => 'google_only@test.com',
            'auth_type' => 'google',
            'status' => 'active',
            'roles' => ['editor'],
        ]);

        $createResponse->assertStatus(201);
        $createResponse->assertJsonPath('data.auth_type', 'google');
        $googleUserId = $createResponse->json('data.id');

        $resetResponse = $this->actingAs($this->adminUser)->postJson(
            $this->apiUri("{$googleUserId}/reset-password")
        );
        $resetResponse->assertStatus(422);
        $resetResponse->assertJsonPath('status', 'error');

        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/') ?: 'admin';
        $loginResponse = $this->postJson("/{$adminPath}/api/auth/login", [
            'email' => 'google_only@test.com',
            'password' => 'anything123',
        ]);
        $loginResponse->assertStatus(401);
        $loginResponse->assertJsonPath('status', 'error');
    }

    /**
     * Test API: Password-based user can trigger reset password email.
     */
    public function test_password_user_allows_reset_password(): void
    {
        \Illuminate\Support\Facades\Queue::fake();

        $createResponse = $this->actingAs($this->adminUser)->postJson($this->apiUri(), [
            'name' => 'Password User',
            'email' => 'password_user@test.com',
            'auth_type' => 'password',
            'password' => 'secret123',
            'status' => 'active',
            'roles' => ['editor'],
        ]);

        $createResponse->assertStatus(201);
        $createResponse->assertJsonPath('data.auth_type', 'password');
        $passwordUserId = $createResponse->json('data.id');

        $resetResponse = $this->actingAs($this->adminUser)->postJson(
            $this->apiUri("{$passwordUserId}/reset-password")
        );
        $resetResponse->assertStatus(200);
        $resetResponse->assertJsonPath('status', 'success');
    }

    /**
     * Test API: Soft-deleted user's email can be reused, while active user's email stays unique.
     */
    public function test_deleted_user_email_can_be_reused_while_active_email_remains_unique(): void
    {
        $email = 'reusable@test.com';

        // 1. Create initial user
        $firstRes = $this->actingAs($this->adminUser)->postJson($this->apiUri(), [
            'name' => 'First User',
            'email' => $email,
            'auth_type' => 'google',
            'status' => 'active',
            'roles' => ['editor'],
        ]);
        $firstRes->assertStatus(201);
        $firstId = $firstRes->json('data.id');

        // 2. Duplicate while active is rejected (422)
        $dupRes = $this->actingAs($this->adminUser)->postJson($this->apiUri(), [
            'name' => 'Duplicate Active',
            'email' => $email,
            'auth_type' => 'google',
            'status' => 'active',
            'roles' => ['editor'],
        ]);
        $dupRes->assertStatus(422);

        // 3. Soft-delete first user
        $delRes = $this->actingAs($this->adminUser)->deleteJson($this->apiUri((string) $firstId));
        $delRes->assertStatus(200);
        $this->assertSoftDeleted('users', ['id' => $firstId]);

        // 4. Recreate with the exact same email succeeds (201)
        $recreateRes = $this->actingAs($this->adminUser)->postJson($this->apiUri(), [
            'name' => 'Recreated User',
            'email' => $email,
            'auth_type' => 'google',
            'status' => 'active',
            'roles' => ['editor'],
        ]);
        $recreateRes->assertStatus(201);
        $recreateRes->assertJsonPath('data.email', $email);
        $this->assertNotEquals($firstId, $recreateRes->json('data.id'));
    }
}
