<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Modules\Auth\Jobs\SendLoginOtpNotification;
use Modules\Auth\Mails\LoginOtp;
use Modules\User\Models\User;
use Tests\TestCase;

class EmailOtpAuthTest extends TestCase
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
     * 1. Email login succeeds directly when AUTH_EMAIL_OTP_ENABLED is false.
     */
    public function test_email_login_succeeds_directly_without_otp_when_email_otp_disabled(): void
    {
        config(['auth.email_otp.enabled' => false]);

        $response = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.step', 'completed');
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * 2. Email login initiates OTP and pushes queued job when AUTH_EMAIL_OTP_ENABLED is true.
     */
    public function test_email_login_initiates_otp_and_sends_email_when_email_otp_enabled(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Queue::fake();

        $response = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.step', 'email_otp');
        $response->assertJsonPath('data.require_otp', true);
        $this->assertNotEmpty($response->json('data.temp_token'));
        $this->assertNull($response->json('data.token'));

        Queue::assertPushed(SendLoginOtpNotification::class, function (SendLoginOtpNotification $job) {
            return $job->email === 'admin@cms.com' && strlen($job->otp) === 6;
        });
    }

    /**
     * 3. Verifying email OTP with valid code issues Sanctum token and finalizes login.
     */
    public function test_verify_email_otp_with_valid_code_issues_token_and_invalidates_cache(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Mail::fake();

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');
        $this->assertNotEmpty($tempToken);

        $cachedData = Cache::get("auth_email_otp_{$tempToken}");
        $this->assertNotNull($cachedData);
        $validOtp = $cachedData['otp'];

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-email-otp'), [
            'temp_token' => $tempToken,
            'code' => $validOtp,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonPath('data.step', 'completed');
        $authToken = $verifyRes->json('data.token');
        $this->assertNotEmpty($authToken);

        // Anti-replay check: Cache must be invalidated
        $this->assertNull(Cache::get("auth_email_otp_{$tempToken}"));

        // Verify that authenticated user can access /me
        $meRes = $this->withHeader('Authorization', "Bearer {$authToken}")
            ->getJson($this->apiUri('auth/auth/me'));
        $meRes->assertStatus(200);
        $meRes->assertJsonPath('data.email', 'admin@cms.com');
    }

    /**
     * 4. Verifying email OTP with invalid code is rejected.
     */
    public function test_verify_email_otp_with_invalid_code_is_rejected(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Mail::fake();

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');

        $wrongRes = $this->postJson($this->apiUri('auth/auth/verify-email-otp'), [
            'temp_token' => $tempToken,
            'code' => '000000',
        ]);

        $wrongRes->assertStatus(422);
        $wrongRes->assertJsonValidationErrors(['code']);
    }

    /**
     * 5. Exceeding max verification attempts locks session.
     */
    public function test_exceeding_max_attempts_locks_session(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Mail::fake();

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');

        for ($i = 0; $i < 5; $i++) {
            $this->postJson($this->apiUri('auth/auth/verify-email-otp'), [
                'temp_token' => $tempToken,
                'code' => '000000',
            ])->assertStatus(422);
        }

        // 6th attempt should fail with too many attempts
        $lockRes = $this->postJson($this->apiUri('auth/auth/verify-email-otp'), [
            'temp_token' => $tempToken,
            'code' => '000000',
        ]);

        $lockRes->assertStatus(422);
        $this->assertStringContainsString('Too many failed', $lockRes->json('message'));
    }

    /**
     * 6. Resend email OTP generates fresh code and sends new email.
     */
    public function test_resend_email_otp_generates_fresh_code(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Queue::fake();

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');

        $resendRes = $this->postJson($this->apiUri('auth/auth/resend-email-otp'), [
            'temp_token' => $tempToken,
        ]);

        $resendRes->assertStatus(200);
        $resendRes->assertJsonPath('data.require_otp', true);

        Queue::assertPushed(SendLoginOtpNotification::class, 2);
    }

    /**
     * 7. Queued SendLoginOtpNotification job sends email with OTP.
     */
    public function test_send_login_otp_job_sends_email(): void
    {
        Mail::fake();

        $job = new SendLoginOtpNotification('admin@cms.com', '654321', 'Administrator');
        $job->handle();

        Mail::assertSent(LoginOtp::class, function (LoginOtp $mail) {
            return $mail->hasTo('admin@cms.com') && $mail->otp === '654321';
        });
    }

    /**
     * 8. Unified verify-code endpoint successfully verifies challenge code and issues token.
     */
    public function test_unified_verify_code_endpoint_successfully_authenticates(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Queue::fake();

        $loginRes = $this->postJson($this->apiUri('auth/auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $tempToken = $loginRes->json('data.temp_token');
        $cachedData = Cache::get("auth_email_otp_{$tempToken}");
        $validOtp = $cachedData['otp'];

        $verifyRes = $this->postJson($this->apiUri('auth/auth/verify-code'), [
            'temp_token' => $tempToken,
            'code' => $validOtp,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonPath('data.step', 'completed');
        $this->assertNotEmpty($verifyRes->json('data.token'));
    }
}
