<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;
use Tests\TestCase;

class DashboardOverviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $dashboardOnlyUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();

        // Ensure core.view permission exists
        $coreViewPerm = Permission::firstOrCreate(
            ['slug' => 'core.view'],
            ['module' => 'core', 'action' => 'view', 'name' => 'View Dashboard']
        );

        // Create a restricted role with ONLY core.view permission
        $dashboardRole = Role::firstOrCreate(
            ['slug' => 'dashboard_viewer'],
            ['name' => 'Dashboard Viewer', 'description' => 'Can only view aggregated dashboard']
        );
        $dashboardRole->permissions()->sync([$coreViewPerm->id]);

        // Create a user assigned only to this restricted role
        $this->dashboardOnlyUser = User::create([
            'name' => 'Dashboard Viewer User',
            'email' => 'dashboard_only@cms.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
            'is_admin' => false,
        ]);
        $this->dashboardOnlyUser->roles()->attach($dashboardRole->id);
    }

    protected function adminApiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        return '/' . ($adminPath ?: 'admin') . '/api/' . ltrim($path, '/');
    }

    /**
     * Test admin can fetch full aggregated dashboard data from single endpoint.
     */
    public function test_admin_can_retrieve_dashboard_overview_data(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson($this->adminApiUri('core/dashboard'));

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'crawler_statistics' => [
                        'total_jobs',
                        'total_accounts',
                        'total_success_accounts',
                        'total_failed_accounts',
                        'total_completed_jobs',
                        'total_failed_jobs',
                    ],
                    'tiktok_statistics' => [
                        'total_accounts',
                        'total_followers',
                        'total_following',
                        'total_likes',
                        'total_active_accounts',
                        'total_inactive_accounts',
                    ],
                    'recent_jobs',
                ],
            ]);
    }

    /**
     * Test user with ONLY core.view permission CAN access dashboard overview endpoint.
     */
    public function test_user_with_only_dashboard_view_can_retrieve_aggregated_metrics(): void
    {
        $response = $this->actingAs($this->dashboardOnlyUser)
            ->getJson($this->adminApiUri('core/dashboard'));

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'crawler_statistics',
                    'tiktok_statistics',
                    'recent_jobs',
                ],
            ]);
    }

    /**
     * Test that user with ONLY core.view permission is STILL forbidden from accessing individual crawler endpoints.
     */
    public function test_user_with_only_dashboard_view_cannot_access_individual_module_endpoints(): void
    {
        $response = $this->actingAs($this->dashboardOnlyUser)
            ->getJson($this->adminApiUri('crawler/crawl-job/statistics-summary'));

        $response->assertForbidden();
    }

    /**
     * Test dashboard overview returns growth trends containing followers and likes metrics.
     */
    public function test_dashboard_overview_includes_growth_trends_structure(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson($this->adminApiUri('core/dashboard'));

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'growth_trends' => [
                        'period_days',
                        'followers_growth' => [
                            'title',
                            'metric',
                            'current_value',
                            'previous_value',
                            'net_change',
                            'growth_rate',
                            'period_days',
                            'points',
                        ],
                        'likes_growth' => [
                            'title',
                            'metric',
                            'current_value',
                            'previous_value',
                            'net_change',
                            'growth_rate',
                            'period_days',
                            'points',
                        ],
                    ],
                ],
            ]);
    }
}
