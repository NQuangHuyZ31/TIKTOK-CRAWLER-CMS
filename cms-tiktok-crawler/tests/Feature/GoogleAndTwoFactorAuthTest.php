<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->seed(DatabaseSeeder::class);
        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    /**
     * 1. Direct login succeeds when 2FA is globally disabled.
     */
    public function test_direct_login_succeeds_when_2fa_disabled(): void
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
     * 2. Login initiates 2FA session when 2FA is globally enabled.
     */
    public function test_login_requires_2fa_when_enabled(): void
    {
        config(['auth.two_factor.enabled' => true]);

        $response = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.require_2fa', true);
        $this->assertNotEmpty($response->json('data.temp_token'));
        $this->assertNotEmpty($response->json('data.qr_code_url'));
        $this->assertStringContainsString('otpauth://totp/', $response->json('data.qr_code_url'));
    }

    /**
     * 3. 2FA verification fails on wrong OTP code.
     */
    public function test_2fa_verification_fails_on_wrong_code(): void
    {
        config(['auth.two_factor.enabled' => true]);

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => '000000',
        ]);

        $verifyRes->assertStatus(422);
        $verifyRes->assertJsonValidationErrors(['code']);
    }

    /**
     * 4. 2FA verification succeeds on valid TOTP code.
     */
    public function test_2fa_verification_succeeds_on_valid_code(): void
    {
        config(['auth.two_factor.enabled' => true]);

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');
        $secretKey = $loginRes->json('data.secret_key');

        /** @var Google2FAService $service */
        $service = app(Google2FAService::class);
        $refMethod = new \ReflectionMethod($service, 'calculateCode');
        $refDecode = new \ReflectionMethod($service, 'base32Decode');
        $secretBinary = $refDecode->invoke($service, $secretKey);
        $validCode = $refMethod->invoke($service, $secretBinary, (int) floor(time() / 30));

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-2fa'), [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonPath('data.require_2fa', false);
        $this->assertNotEmpty($verifyRes->json('data.token'));

        // Verify user now has 2FA enabled in database
        $this->adminUser->refresh();
        $this->assertTrue((bool) $this->adminUser->google2fa_enabled);
        $this->assertEquals($secretKey, $this->adminUser->google2fa_secret);
    }

    /**
     * 5. Google Sign-In provisions account and logs in.
     */
    public function test_google_login_authenticates_or_creates_user(): void
    {
        config(['auth.two_factor.enabled' => false]);

        $googleEmail = 'new_google_user@example.com';
        $googleId = 'google_sub_123456789';

        $response = $this->postJson($this->apiUri('auth/auth/google-login'), [
            'email' => $googleEmail,
            'name' => 'Google User',
            'google_id' => $googleId,
            'avatar' => 'https://lh3.googleusercontent.com/photo.jpg',
        ]);

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data.token'));
        $this->assertEquals($googleEmail, $response->json('data.user.email'));

        $this->assertDatabaseHas('users', [
            'email' => $googleEmail,
            'google_id' => $googleId,
        ]);
    }
}
