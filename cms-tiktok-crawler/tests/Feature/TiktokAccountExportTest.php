<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Role\Models\Role;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\User\Models\User;
use Tests\TestCase;

class TiktokAccountExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'Administrator']
        );
        $this->admin = User::firstOrCreate(
            ['email' => 'admin@cms.com'],
            ['name' => 'Admin', 'password' => bcrypt('password'), 'status' => 'active', 'is_admin' => true]
        );
        $this->admin->roles()->syncWithoutDetaching([$adminRole->id]);
    }

    public function test_authenticated_user_can_export_tiktok_accounts_csv(): void
    {
        TiktokAccount::create([
            'username' => 'creator_alpha',
            'nickname' => 'Alpha Creator',
            'followers_count' => 50000,
            'status' => 'active',
        ]);

        TiktokAccount::create([
            'username' => 'creator_beta',
            'nickname' => 'Beta Creator',
            'followers_count' => 12000,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/api/tiktok-account/export?export_format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename=', (string) $response->headers->get('Content-Disposition'));

        $content = $response->streamedContent();
        // Check for UTF-8 BOM
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        // Check for headers
        $this->assertStringContainsString('Username,Nickname,Followers', $content);
        // Check for creator records
        $this->assertStringContainsString('creator_alpha', $content);
        $this->assertStringContainsString('creator_beta', $content);
    }

    public function test_authenticated_user_can_export_tiktok_accounts_xlsx(): void
    {
        TiktokAccount::create([
            'username' => 'creator_emoji',
            'nickname' => 'Bilal ❤️🥀',
            'bio' => '👑 King of TikTok',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/api/tiktok-account/export?export_format=xlsx');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml.sheet', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.xlsx', (string) $response->headers->get('Content-Disposition'));

        $binary = $response->streamedContent();
        // Check for ZIP/OpenXML magic bytes
        $this->assertStringStartsWith("PK\x03\x04", $binary);
    }

    public function test_export_applies_search_filter(): void
    {
        TiktokAccount::create([
            'username' => 'unique_target_xyz',
            'nickname' => 'Target XYZ',
        ]);

        TiktokAccount::create([
            'username' => 'other_creator_123',
            'nickname' => 'Other 123',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/api/tiktok-account/export?export_format=csv&search=unique_target_xyz');

        $response->assertStatus(200);
        $content = $response->streamedContent();
        $this->assertStringContainsString('unique_target_xyz', $content);
        $this->assertStringNotContainsString('other_creator_123', $content);
    }

    public function test_export_applies_date_range_filter(): void
    {
        TiktokAccount::create([
            'username' => 'creator_in_range',
            'nickname' => 'In Range',
            'crawled_at' => '2026-06-15 10:00:00',
        ]);

        TiktokAccount::create([
            'username' => 'creator_out_of_range',
            'nickname' => 'Out Range',
            'crawled_at' => '2026-04-10 10:00:00',
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/api/tiktok-account/export?export_format=csv&export_date_from=2026-06-01&export_date_to=2026-06-30');

        $response->assertStatus(200);
        $content = $response->streamedContent();
        $this->assertStringContainsString('creator_in_range', $content);
        $this->assertStringNotContainsString('creator_out_of_range', $content);
    }

    public function test_export_applies_custom_row_limit(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            TiktokAccount::create([
                'username' => "creator_limit_{$i}",
                'nickname' => "Limit {$i}",
            ]);
        }

        $response = $this->actingAs($this->admin)->get('/admin/api/tiktok-account/export?export_format=csv&export_limit_type=custom&export_limit=2');

        $response->assertStatus(200);
        $content = trim($response->streamedContent());
        $lines = explode("\n", $content);
        // Header line + 2 data rows = 3 lines
        $this->assertCount(3, $lines);
    }
}
