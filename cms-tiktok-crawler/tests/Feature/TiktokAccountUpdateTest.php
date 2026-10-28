<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TiktokAccount\Models\TiktokAccount;
use Tests\TestCase;

class TiktokAccountUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected TiktokAccount $khabyAccount;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
        $this->khabyAccount = TiktokAccount::where('username', 'khaby.lame')->firstOrFail();
    }

    protected function apiUri(string $path = ''): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/tiktok-account/tiktok-account' . ($path !== '' ? '/' . ltrim($path, '/') : '');
    }

    public function test_update_khaby_lame_via_json_put(): void
    {
        $response = $this->actingAs($this->adminUser)->putJson(
            $this->apiUri((string) $this->khabyAccount->id),
            [
                'username' => 'khaby.lame',
                'nickname' => 'Khaby Lame Updated JSON',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.username', 'khaby.lame');
        $response->assertJsonPath('data.nickname', 'Khaby Lame Updated JSON');
    }

    public function test_update_khaby_lame_via_post_with_method_put(): void
    {
        // Simulates browser sending FormData with _method = PUT via POST
        $response = $this->actingAs($this->adminUser)->post(
            $this->apiUri((string) $this->khabyAccount->id),
            [
                '_method' => 'PUT',
                'username' => 'khaby.lame',
                'nickname' => 'Khaby Lame Updated Multipart',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.username', 'khaby.lame');
        $response->assertJsonPath('data.nickname', 'Khaby Lame Updated Multipart');
    }

    public function test_update_khaby_lame_via_direct_post_to_id(): void
    {
        // DynamicRouteResolve allows POST /{module}/{controller}/{id} directly to update
        $response = $this->actingAs($this->adminUser)->post(
            $this->apiUri((string) $this->khabyAccount->id),
            [
                'username' => 'khaby.lame',
                'nickname' => 'Khaby Lame Updated Direct POST',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.username', 'khaby.lame');
        $response->assertJsonPath('data.nickname', 'Khaby Lame Updated Direct POST');
    }

    public function test_partial_update_without_username_succeeds(): void
    {
        // Since 'username' has 'sometimes|required', updating only nickname without username succeeds
        $response = $this->actingAs($this->adminUser)->putJson(
            $this->apiUri((string) $this->khabyAccount->id),
            [
                'nickname' => 'Only Nickname Updated',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.nickname', 'Only Nickname Updated');
        $response->assertJsonPath('data.username', 'khaby.lame');
    }

    public function test_update_fails_when_username_collides_with_other_account(): void
    {
        // In seeder, 'urekamedia' also exists
        $response = $this->actingAs($this->adminUser)->putJson(
            $this->apiUri((string) $this->khabyAccount->id),
            [
                'username' => 'urekamedia', // Belongs to account #1
            ]
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['username']);
    }
}
