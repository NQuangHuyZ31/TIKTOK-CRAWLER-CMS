<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Tests\TestCase;

class ModuleVisibilityTest extends TestCase
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

    public function test_admin_can_update_hidden_modules_and_protected_modules_are_stripped(): void
    {
        $admin = User::where('email', 'admin@cms.com')->firstOrFail();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/update-settings'), [
                'group' => 'modules',
                'settings' => [
                    'hidden_modules' => ['crawler', 'guideline', 'core', 'auth', 'system'],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.group', 'modules')
            ->assertJsonPath('data.settings.hidden_modules', ['crawler', 'guideline']);
    }

    public function test_hidden_module_api_is_blocked_and_restored_when_re_enabled(): void
    {
        $admin = User::where('email', 'admin@cms.com')->firstOrFail();

        // Hide crawler module
        $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/update-settings'), [
                'group' => 'modules',
                'settings' => [
                    'hidden_modules' => ['crawler'],
                ],
            ])
            ->assertStatus(200);

        // Hidden module API returns 404
        $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('crawler/crawl-job'))
            ->assertStatus(404);

        // Other visible modules and system settings remain accessible
        $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('tiktok-account'))
            ->assertStatus(200);

        $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('system/system-setting?group=modules'))
            ->assertStatus(200);

        // Re-enable crawler module
        $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/update-settings'), [
                'group' => 'modules',
                'settings' => [
                    'hidden_modules' => [],
                ],
            ])
            ->assertStatus(200);

        // Crawler API is accessible again
        $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('crawler/crawl-job'))
            ->assertStatus(200);
    }

    public function test_app_shell_injects_hidden_modules_for_initial_boot(): void
    {
        $admin = User::where('email', 'admin@cms.com')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/update-settings'), [
                'group' => 'modules',
                'settings' => [
                    'hidden_modules' => ['tiktok_account'],
                ],
            ])
            ->assertStatus(200);

        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/') ?: 'admin';
        $pageResponse = $this->get('/' . $adminPath . '/dashboard');

        $pageResponse->assertStatus(200);
        $pageResponse->assertSee('window.__CMS_HIDDEN_MODULES__ = ["tiktok_account"];', false);
    }
}
