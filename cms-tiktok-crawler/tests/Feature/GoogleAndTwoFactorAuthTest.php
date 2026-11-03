<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Auth\Services\Google2FAService;
use Modules\User\Models\User;
use Tests\TestCase;

class GoogleAndTwoFactorAuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        config(['auth.email_otp.enabled' => false]);
        $this->seed(DatabaseSeeder::class);
        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    protected function performGoogleLogin(string $email, string $name = 'Google User', ?string $googleId = 'google-123'): array
    {
        /** @var \Modules\Auth\Services\AuthService $authService */
        $authService = app(\Modules\Auth\Services\AuthService::class);
        return $authService->loginWithGoogle([
            'email' => $email,
            'name' => $name,
            'google_id' => $googleId,
        ]);
    }

    protected function mockSocialiteGoogle(string $email, string $name = 'Google User', string $id = 'google-id-123'): void
    {
        $abstractUser = \Mockery::mock(\Laravel\Socialite\Two\User::class);
        $abstractUser->shouldReceive('getId')->andReturn($id);
        $abstractUser->shouldReceive('getEmail')->andReturn($email);
        $abstractUser->shouldReceive('getName')->andReturn($name);
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://avatar.url');

        $provider = \Mockery::mock(\Laravel\Socialite\Two\GoogleProvider::class);
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    /**
     * 1. Email login succeeds without 2FA when ENV is false.
     */
    public function test_email_login_succeeds_without_2fa_when_env_false(): void
    {
        config(['auth.two_factor.enabled' => false]);

        $response = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.require_2fa', false);
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * 2. Email login succeeds without 2FA when ENV is true.
     */
    public function test_email_login_succeeds_without_2fa_when_env_true(): void
    {
        config(['auth.two_factor.enabled' => true]);

        $response = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.require_2fa', false);
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * 3. Google login fails if account was not pre-created by Super Admin.
     */
    public function test_google_login_fails_if_account_not_precreated_by_admin(): void
    {
        $this->mockSocialiteGoogle('unregistered_google_user@example.com');
        $response = $this->get($this->apiUri('auth/google/callback?code=mock_code'));

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/login?error=', $response->headers->get('Location'));
    }

    /**
     * 4. Google login succeeds directly when ENV is false (pre-created user).
     */
    public function test_google_login_succeeds_directly_when_env_false(): void
    {
        config(['auth.two_factor.enabled' => false]);

        $googleEmail = 'direct_google_user@example.com';
        User::factory()->create([
            'email' => $googleEmail,
            'name' => 'Direct Google User',
            'status' => 'active',
        ]);

        $this->mockSocialiteGoogle($googleEmail);
        $response = $this->get($this->apiUri('auth/google/callback?code=mock_code'));

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/login?token=', $response->headers->get('Location'));
    }

    /**
     * 5. Google login requires 2FA when ENV is true (pre-created unenrolled user).
     */
    public function test_google_login_requires_2fa_when_env_true(): void
    {
        config(['auth.two_factor.enabled' => true]);

        User::factory()->create([
            'email' => 'unenrolled_user@example.com',
            'name' => 'Unenrolled User',
            'status' => 'active',
        ]);

        $this->mockSocialiteGoogle('unenrolled_user@example.com');
        $response = $this->get($this->apiUri('auth/google/callback?code=mock_code'));

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/login?step=2fa&temp_token=', $response->headers->get('Location'));
    }

    /**
     * 6. Google login with an enrolled user requires a valid OTP (challenge mode without re-exposing QR).
     */
    public function test_google_login_with_enrolled_user_requires_valid_otp(): void
    {
        config(['auth.two_factor.enabled' => true]);

        /** @var Google2FAService $g2fa */
        $g2fa = app(Google2FAService::class);
        $secret = $g2fa->generateSecretKey();

        $enrolledUser = User::factory()->create([
            'email' => 'enrolled_user@example.com',
            'status' => 'active',
            'google2fa_secret' => $secret,
            'google2fa_enabled' => true,
        ]);

        $loginResult = $this->performGoogleLogin($enrolledUser->email);
        $this->assertTrue($loginResult['require_2fa']);
        $this->assertTrue($loginResult['enrolled']);
        $this->assertArrayNotHasKey('qr_code_url', $loginResult);

        $tempToken = $loginResult['temp_token'];
        $validCode = $g2fa->calculateCode($secret);

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonPath('data.require_2fa', false);
        $this->assertNotEmpty($verifyRes->json('data.token'));
    }

    /**
     * 7. Google login with an unenrolled user requires enrollment (returns QR and secret).
     */
    public function test_google_login_with_unenrolled_user_requires_enrollment(): void
    {
        config(['auth.two_factor.enabled' => true]);

        User::factory()->create([
            'email' => 'fresh_signup@example.com',
            'name' => 'Fresh Signup',
            'status' => 'active',
        ]);

        $loginResult = $this->performGoogleLogin('fresh_signup@example.com', 'Fresh Signup');
        $this->assertTrue($loginResult['require_2fa']);
        $this->assertFalse($loginResult['enrolled']);
        $this->assertNotEmpty($loginResult['qr_code_url']);
        $this->assertNotEmpty($loginResult['secret_key']);
        $this->assertStringContainsString('otpauth://totp/', $loginResult['qr_code_url']);

        $tempToken = $loginResult['temp_token'];
        $secretKey = $loginResult['secret_key'];

        /** @var Google2FAService $g2fa */
        $g2fa = app(Google2FAService::class);
        $validOtp = $g2fa->calculateCode($secretKey);

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validOtp,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonPath('data.require_2fa', false);
        $this->assertNotEmpty($verifyRes->json('data.token'));

        // Check user is now enrolled and secret is persisted (encrypted at rest)
        $user = User::where('email', 'fresh_signup@example.com')->firstOrFail();
        $this->assertTrue((bool) $user->google2fa_enabled);
        $this->assertEquals($secretKey, $user->google2fa_secret);
    }

    /**
     * 8. Invalid, expired, and reused 2FA challenges are rejected.
     */
    public function test_invalid_expired_and_reused_2fa_challenges_are_rejected(): void
    {
        config(['auth.two_factor.enabled' => true]);

        User::factory()->create([
            'email' => 'security_test@example.com',
            'status' => 'active',
        ]);

        $loginResult = $this->performGoogleLogin('security_test@example.com');
        $tempToken = $loginResult['temp_token'];
        $secretKey = $loginResult['secret_key'];

        // a. Invalid code is rejected
        $wrongRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => '000000',
        ]);
        $wrongRes->assertStatus(422);
        $wrongRes->assertJsonValidationErrors(['code']);

        // b. Expired / non-existent token is rejected
        $expiredRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => 'non_existent_token_12345',
            'code' => '123456',
        ]);
        $expiredRes->assertStatus(422);

        // c. Valid verification succeeds
        /** @var Google2FAService $g2fa */
        $g2fa = app(Google2FAService::class);
        $validCode = $g2fa->calculateCode($secretKey);

        $validRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);
        $validRes->assertStatus(200);

        // d. Reused challenge is rejected (prevent replay)
        $replayRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);
        $replayRes->assertStatus(422);
    }

    /**
     * 9. Pending Google 2FA temporary token cannot access protected APIs.
     */
    public function test_pending_google_2fa_cannot_access_protected_apis(): void
    {
        config(['auth.two_factor.enabled' => true]);

        User::factory()->create([
            'email' => 'pending_2fa_user@example.com',
            'status' => 'active',
        ]);

        $loginResult = $this->performGoogleLogin('pending_2fa_user@example.com');
        $tempToken = $loginResult['temp_token'];
        $this->assertNotEmpty($tempToken);

        // Attempt to call protected /me endpoint using temp_token
        $protectedRes = $this->withHeader('Authorization', "Bearer {$tempToken}")
            ->getJson($this->apiUri('auth/auth/me'));

        $protectedRes->assertStatus(401);
    }

    /**
     * 10. Successful Google 2FA grants normal authenticated access.
     */
    public function test_successful_google_2fa_grants_normal_authenticated_access(): void
    {
        config(['auth.two_factor.enabled' => true]);

        User::factory()->create([
            'email' => 'full_access_user@example.com',
            'name' => 'Full Access User',
            'status' => 'active',
        ]);

        $loginResult = $this->performGoogleLogin('full_access_user@example.com', 'Full Access User');
        $tempToken = $loginResult['temp_token'];
        $secretKey = $loginResult['secret_key'];

        /** @var Google2FAService $g2fa */
        $g2fa = app(Google2FAService::class);
        $validCode = $g2fa->calculateCode($secretKey);

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);

        $verifyRes->assertStatus(200);
        $authToken = $verifyRes->json('data.token');
        $this->assertNotEmpty($authToken);

        // Access protected endpoint using authenticated Sanctum Bearer token
        $meRes = $this->withHeader('Authorization', "Bearer {$authToken}")
            ->getJson($this->apiUri('auth/auth/me'));

        $meRes->assertStatus(200);
        $meRes->assertJsonPath('data.email', 'full_access_user@example.com');
    }

    /**
     * 11. Google OAuth redirect endpoint initiates Socialite redirect to Google.
     */
    public function test_google_redirect_endpoint_initiates_oauth(): void
    {
        config(['services.google.client_id' => 'test-google-client-id']);
        config(['services.google.redirect_uri' => 'http://localhost:8000/admin/api/auth/google/callback']);

        $response = $this->get($this->apiUri('auth/google/redirect'));

        $response->assertStatus(302);
        $this->assertStringContainsString('accounts.google.com/o/oauth2/auth', $response->headers->get('Location'));
    }

    /**
     * 12. Google callback redirects with error parameter when OAuth is cancelled or denied.
     */
    public function test_google_callback_redirects_with_error_when_oauth_cancelled(): void
    {
        $response = $this->get($this->apiUri('auth/google/callback') . '?error=access_denied&error_description=User+cancelled');

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/login?error=User+cancelled', $response->headers->get('Location'));
    }

    /**
     * 13. Google callback redirects with default error when code is missing.
     */
    public function test_google_callback_redirects_with_error_when_code_missing(): void
    {
        $response = $this->get($this->apiUri('auth/google/callback'));

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/login?error=Google+authentication+was+cancelled.', $response->headers->get('Location'));
    }
}
