<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TiktokAccount\Models\TiktokAccount;
use Tests\TestCase;

class TiktokAccountFilterTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();

        // Seed specific TikTok accounts for testing metric filters
        TiktokAccount::create([
            'username' => 'creator_small',
            'nickname' => 'Small Creator',
            'followers_count' => 500,
            'following_count' => 50,
            'likes_count' => 2000,
            'status' => 'active',
        ]);

        TiktokAccount::create([
            'username' => 'creator_mid',
            'nickname' => 'Mid Creator',
            'followers_count' => 25000,
            'following_count' => 300,
            'likes_count' => 150000,
            'status' => 'active',
        ]);

        TiktokAccount::create([
            'username' => 'creator_large',
            'nickname' => 'Large Creator',
            'followers_count' => 1500000,
            'following_count' => 1200,
            'likes_count' => 8000000,
            'status' => 'active',
        ]);
    }

    protected function apiUri(string $path = ''): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/tiktok-account/tiktok-account' . ($path !== '' ? '/' . ltrim($path, '/') : '');
    }

    public function test_filter_followers_by_range(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?followers_count=1000..50000'));

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $usernames = collect($response->json('data'))->pluck('username')->all();

        $this->assertContains('creator_mid', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_large', $usernames);
    }

    public function test_filter_followers_by_comparison_operators(): void
    {
        // Greater than or equal to 1,000,000
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?followers_count=>=1000000'));
        $response->assertStatus(200);
        $usernames = collect($response->json('data'))->pluck('username')->all();
        $this->assertContains('creator_large', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_mid', $usernames);

        // Less than 1,000
        $responseSmall = $this->actingAs($this->adminUser)->getJson($this->apiUri('?followers_count=<1000'));
        $responseSmall->assertStatus(200);
        $usernamesSmall = collect($responseSmall->json('data'))->pluck('username')->all();
        $this->assertContains('creator_small', $usernamesSmall);
        $this->assertNotContains('creator_large', $usernamesSmall);
    }

    public function test_filter_followers_by_min_and_max_parameters(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?followers_count_min=10000&followers_count_max=50000'));

        $response->assertStatus(200);
        $usernames = collect($response->json('data'))->pluck('username')->all();
        $this->assertContains('creator_mid', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_large', $usernames);
    }

    public function test_filter_following_by_range_and_min_max(): void
    {
        // Following between 100 and 500
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?following_count=100..500'));
        $response->assertStatus(200);
        $usernames = collect($response->json('data'))->pluck('username')->all();
        $this->assertContains('creator_mid', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_large', $usernames);

        // Following >= 1000
        $responseLarge = $this->actingAs($this->adminUser)->getJson($this->apiUri('?following_count_min=1000'));
        $responseLarge->assertStatus(200);
        $usernamesLarge = collect($responseLarge->json('data'))->pluck('username')->all();
        $this->assertContains('creator_large', $usernamesLarge);
        $this->assertNotContains('creator_mid', $usernamesLarge);
    }

    public function test_filter_likes_by_range_and_min_max(): void
    {
        // Likes between 100,000 and 500,000
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?likes_count=100000..500000'));
        $response->assertStatus(200);
        $usernames = collect($response->json('data'))->pluck('username')->all();
        $this->assertContains('creator_mid', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_large', $usernames);

        // Likes >= 5,000,000
        $responseMega = $this->actingAs($this->adminUser)->getJson($this->apiUri('?likes_count=>=5000000'));
        $responseMega->assertStatus(200);
        $usernamesMega = collect($responseMega->json('data'))->pluck('username')->all();
        $this->assertContains('creator_large', $usernamesMega);
        $this->assertNotContains('creator_mid', $usernamesMega);
    }

    public function test_combined_filters_followers_following_and_likes(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson($this->apiUri('?followers_count=>=10000&following_count_max=500&likes_count=>=100000'));

        $response->assertStatus(200);
        $usernames = collect($response->json('data'))->pluck('username')->all();
        $this->assertContains('creator_mid', $usernames);
        $this->assertNotContains('creator_small', $usernames);
        $this->assertNotContains('creator_large', $usernames);
    }
}
