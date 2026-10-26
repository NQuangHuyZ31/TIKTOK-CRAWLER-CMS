<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>

<body
    style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a202c;">

    <!-- Wrapper Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
        style="background-color: #f7f9fc; padding: 50px 0;">
        <tr>
            <td align="center">

                <!-- Main Container Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600"
                    style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);">

                    <!-- Top Brand Accent Bar -->
                    <tr>
                        <td height="5"
                            style="background: linear-gradient(90deg, #e6007e 0%, #7b2cbf 33%, #00b4d8 66%, #70e000 100%);">
                        </td>
                    </tr>

                    <!-- Header Logo Section -->
                    <tr>
                        <td align="left" style="padding: 36px 48px 24px 48px; border-bottom: 1px solid #edf2f7;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="right"
                                        style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #718096;">
                                        Security Notification
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content Section -->
                    <tr>
                        <td style="padding: 40px 48px;">

                            <!-- Title & Subtitle -->
                            <h1
                                style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #1a202c; letter-spacing: -0.3px;">
                                Password Reset Request
                            </h1>
                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                                Hello <strong>{{ $name }}</strong>,
                            </p>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                                An administrator has initiated a password reset for your Ureka admin account. Please
                                click the button below to set a new password:
                            </p>

                            <!-- Action Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $resetUrl }}" target="_blank" style="display: inline-block;
                                                padding: 12px 28px;
                                                background-color: #2563eb;
                                                color: #ffffff;
                                                text-decoration: none;
                                                font-size: 14px;
                                                line-height: 1.4;
                                                font-weight: 600;
                                                border-radius: 6px;
                                                box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry Notice Box -->
                            <div
                                style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 4px; margin-bottom: 28px;">
                                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4a5568;">
                                    <strong>Note:</strong> This link is valid for <strong>60 minutes</strong>. If you
                                    did not request a password reset, no action is needed and your account remains safe.
                                </p>
                            </div>

                            <!-- Direct Link Fallback -->
                            <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #718096;">
                                If you are having trouble clicking the "Reset Password" button, copy and paste the
                                following URL into your web browser:
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                                <a href="{{ $resetUrl }}" style="color: #2563eb; text-decoration: underline;">
                                    {{ $resetUrl }}
                                </a>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td align="left"
                            style="padding: 24px 48px; background-color: #f8fafc; border-top: 1px solid #edf2f7; font-size: 12px; color: #718096; line-height: 1.5;">
                            <p style="margin: 0 0 4px 0; font-weight: 500; color: #4a5568;">
                                Ureka Media System &bull; SEA - China - Global &copy; {{ date('Y') }}
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 11px;">
                                This is an automated email sent from the Ureka Admin security service. Please do not
                                reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>

</html>