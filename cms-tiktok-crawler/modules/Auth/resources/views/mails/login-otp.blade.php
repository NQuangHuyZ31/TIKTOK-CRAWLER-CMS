<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification Code</title>
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
                                Sign-in Verification Code
                            </h1>
                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                                Hello <strong>{{ $name }}</strong>,
                            </p>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                                We received a sign-in attempt for your account. Please use the following 6-digit verification code to complete your authentication:
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <div
                                            style="background-color: #f1f5f9; border-radius: 8px; padding: 18px 36px; display: inline-block; border: 1px dashed #cbd5e1;">
                                            <span
                                                style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1677ff;">
                                                {{ $otp }}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry Notice Box -->
                            <div
                                style="background-color: #f8fafc; border-left: 4px solid #1677ff; padding: 14px 18px; border-radius: 4px; margin-bottom: 28px;">
                                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4a5568;">
                                    <strong>Note:</strong> This verification code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone. If you did not initiate this login request, please change your password immediately.
                                </p>
                            </div>

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
