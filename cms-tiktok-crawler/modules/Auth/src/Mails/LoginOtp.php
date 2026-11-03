<?php

namespace Modules\Auth\Mails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginOtp extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly ?string $name = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Login Verification Code - ' . config('app.name', 'TikTok Crawler CMS'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'auth::mails.login-otp',
            with: [
                'otp' => $this->otp,
                'name' => $this->name ?? 'Administrator',
            ],
        );
    }
}
