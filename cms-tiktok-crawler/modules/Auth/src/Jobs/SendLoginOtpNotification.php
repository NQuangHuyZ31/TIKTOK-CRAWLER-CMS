<?php

namespace Modules\Auth\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\Auth\Mails\LoginOtp;

class SendLoginOtpNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly string $email,
        public readonly string $otp,
        public readonly ?string $name = null
    ) {}

    public function backoff(): array
    {
        return [10, 30];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Mail::to($this->email)->send(new LoginOtp($this->otp, $this->name));
    }

    public function failed(\Throwable $e): void
    {
        Log::error("Failed to send login OTP email to {$this->email}: " . $e->getMessage());
    }
}
