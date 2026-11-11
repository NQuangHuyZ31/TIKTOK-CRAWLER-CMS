import type { DocArticle } from '../types/docSchema';

export const FOLLOW_ARTICLES: DocArticle[] = [
  {
    "id": "follow-quickstart",
    "slug": "quickstart",
    "pillar": "follow",
    "category": "Getting Started",
    "title": "5-Minute Quick Start Guide",
    "subtitle": "End-to-end operational walkthrough to execute your first crawl job and inspect results",
    "duration": "5 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Getting Started"
      },
      {
        "label": "Quick Start Guide"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "Objective",
        "anchorId": "quickstart-objective"
      },
      {
        "type": "paragraph",
        "text": "This quickstart walkthrough demonstrates how to extract creator profile metadata and latest published videos from TikTok accounts into the CMS repository in under five minutes using the automated Crawler worker pool."
      },
      {
        "type": "callout",
        "variant": "tip",
        "title": "Beginner Handbook (3 Simple Steps)",
        "text": "If this is your first time using the platform, the end-to-end workflow takes just 3 simple steps:\n1. Step 1: Open 'Crawl Jobs' on the left menu -> Enter TikTok creators to monitor (e.g. @vtv24news).\n2. Step 2: Click the green 'Create & Start Crawl' button to initiate automatic profile and video extraction.\n3. Step 3: Open 'TikTok Accounts' on the menu to inspect follower metrics and view the captured video catalog."
      },
      {
        "type": "callout",
        "variant": "note",
        "title": "CMS Workspace Layout",
        "text": "- Left Sidebar (Dark Menu): Access all functional modules (Dashboard, Crawl Jobs, TikTok Accounts, User Management, Roles & Permissions, System Diagnostics).\n- Top Header: Shows your signed-in profile, language switcher (EN/VI), and Sign Out button.\n- Central Workspace: Area displaying data tables, statistics cards, charts, and input forms."
      },
      {
        "type": "procedure",
        "title": "Procedure: Executing Your First Crawl Job",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Sign In to the CMS Dashboard",
            "instruction": "Open your web browser and navigate to the CMS Login page at /admin/auth/login. Enter your administrator email and password, then click 'Sign in'.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-login.png",
              "alt": "Sign In with Credentials",
              "caption": "Figure 1.1: Standard authentication screen with email, password, and remember me options",
              "location": "/admin/auth/login",
              "targetArea": "Sign In Form",
              "captureInstruction": "CMS Login interface"
            },
            "fields": [
              {
                "name": "Email",
                "required": true,
                "description": "Registered account email address (e.g. admin@cms.com)"
              },
              {
                "name": "Password",
                "required": true,
                "description": "Account password (minimum 6 characters)"
              },
              {
                "name": "Remember Me",
                "required": false,
                "description": "Persists authentication session across browser restarts"
              }
            ],
            "expectedResult": "Authentication succeeds and redirects automatically to /admin/dashboard."
          },
          {
            "stepNumber": 2,
            "title": "Navigate to Crawl Jobs Screen",
            "instruction": "In the CMS left sidebar, click 'Crawl Jobs'. Then click the blue '+ Create Job' button in the upper right header.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-table.png",
              "alt": "Create Crawl Job Button",
              "caption": "Figure 1.2: Navigating to Crawl Jobs and clicking + Create Job button",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Crawl Jobs Table Header with + Create Job button",
              "captureInstruction": "Crawl jobs list screen"
            },
            "actionUrl": "/admin/crawler/crawl-job/create",
            "actionLabel": "Open Create Crawl Job",
            "expectedResult": "The Create Crawl Job form opens with default parameters initialized."
          },
          {
            "stepNumber": 3,
            "title": "Configure Target Handles and Crawl Mode",
            "instruction": "Fill in target handles in the Data Crawl input field. Choose 'Account With Videos' as the crawl mode. Under 'Date Filter', select 'Today' to filter only videos published today.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-filled.png",
              "alt": "Filled Crawl Job Form",
              "caption": "Figure 1.3: Setting creator targets (@vtv24news, @khaby.lame) and crawl mode",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Crawl Job Form Fields",
              "captureInstruction": "Filled form"
            },
            "fields": [
              {
                "name": "Source Type",
                "required": true,
                "description": "Select 'Usernames' tab for handles or 'URLs' for profile links"
              },
              {
                "name": "Data Crawl",
                "required": true,
                "description": "Paste target @handle (e.g. @vtv24news, @khaby.lame, @tiktok)"
              },
              {
                "name": "Crawl Mode",
                "required": true,
                "description": "Select 'Account With Videos' for full data collection"
              },
              {
                "name": "Date Filter",
                "required": true,
                "description": "Select 'Today' for current day videos only"
              }
            ],
            "expectedResult": "The form validates successfully, displaying parsed accounts with active Date Filter."
          },
          {
            "stepNumber": 4,
            "title": "Configure Timezone & Date Preset",
            "instruction": "Click on the Date Filter selector dropdown to verify the operational timezone (Asia/Ho_Chi_Minh UTC+7) and preset boundary.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-date-filter.png",
              "alt": "Configuring Date Filter and Timezone",
              "caption": "Figure 1.4: Date Filter dropdown showing Today preset and Asia/Ho_Chi_Minh timezone",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "VideoDateFilterSelector Dropdown",
              "captureInstruction": "Date filter dropdown"
            },
            "expectedResult": "Active date boundary is computed from 00:00:00 to 23:59:59 in target timezone."
          },
          {
            "stepNumber": 5,
            "title": "Submit and Start Crawl Job",
            "instruction": "Click the blue 'Create & Start Crawl' button. When the confirmation popconfirm appears, click 'Yes' to immediately dispatch the job to the Python Crawler Engine.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-start-confirm.png",
              "alt": "Start Crawl Job Confirmation",
              "caption": "Figure 1.5: Confirming immediate job dispatch to worker pool",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Action Column Popconfirm",
              "captureInstruction": "Confirmation popconfirm"
            },
            "expectedResult": "Job status transitions to 'running' with progress bar active."
          },
          {
            "stepNumber": 6,
            "title": "Monitor Progress on Job Detail Screen",
            "instruction": "Click on the Job row or Eye icon to view execution progress, account success rate, and live metrics.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-detail-summary.png",
              "alt": "Crawl Job Detail Summary",
              "caption": "Figure 1.6: Real-time progress bar, account metrics, and target list",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Job Detail Page",
              "captureInstruction": "Detail view"
            },
            "expectedResult": "Job displays 100% completion with accounts extracted successfully."
          },
          {
            "stepNumber": 7,
            "title": "Verify Extracted Media in TikTok Accounts",
            "instruction": "Navigate to 'TikTok Accounts' in the left menu. Click on any creator profile to open the detail drawer and inspect the 'Videos' showcase tab.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-videos.png",
              "alt": "TikTok Video Showcase Tab",
              "caption": "Figure 1.7: Extracted video cards displaying play counts, likes, and published dates",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Account Detail Videos Tab",
              "captureInstruction": "Videos showcase"
            },
            "expectedResult": "Videos are organized in a responsive grid with direct links to TikTok."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-auth-security-sop",
    "slug": "auth-security-sop",
    "pillar": "follow",
    "category": "Getting Started",
    "title": "Authentication, Google Login & 2FA Security SOP",
    "subtitle": "Standard Operating Procedure for corporate sign-in, Google OAuth2, Two-Factor Authentication, and credential resets",
    "duration": "7 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Getting Started"
      },
      {
        "label": "Authentication & Security SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Corporate Authentication via Email & Password",
        "anchorId": "auth-standard-login"
      },
      {
        "type": "paragraph",
        "text": "Every internal operator authenticates into the CMS using their corporate email credentials. The system issues signed JSON Web Tokens (JWT) stored securely in local browser storage."
      },
      {
        "type": "procedure",
        "title": "Procedure: Logging In with Email & Password",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Navigate to Sign In Screen",
            "instruction": "Open /admin/auth/login in your browser. Verify the connection uses HTTPS.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-login.png",
              "alt": "CMS Login Screen",
              "caption": "Figure 2.1: Login interface with email input, password field, and Google OAuth option",
              "location": "/admin/auth/login",
              "targetArea": "Sign In Card",
              "captureInstruction": "Sign In Screen"
            },
            "fields": [
              {
                "name": "Email Address",
                "required": true,
                "description": "Standard corporate email (e.g. admin@cms.com). Case-insensitive, automatically trimmed."
              },
              {
                "name": "Password",
                "required": true,
                "description": "Account secret key (minimum 6 characters). Masked during input."
              },
              {
                "name": "Remember Me",
                "required": false,
                "description": "When checked, maintains persistent login session token."
              }
            ],
            "expectedResult": "If 2FA is disabled on your account, you are redirected immediately to /admin/dashboard. If 2FA is active, you transition to Step 2."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. Single Sign-On with Google OAuth2",
        "anchorId": "auth-google-oauth"
      },
      {
        "type": "paragraph",
        "text": "Users can authenticate in one click using Google Workspace accounts matching authorized company domains."
      },
      {
        "type": "procedure",
        "title": "Procedure: Signing In with Google OAuth",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Click 'Continue with Google'",
            "instruction": "On the login screen, click the white 'Continue with Google' button with the Google color logo.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-google-login.png",
              "alt": "Google OAuth Button",
              "caption": "Figure 2.2: Google OAuth2 single sign-on action button",
              "location": "/admin/auth/login",
              "targetArea": "GoogleLoginButton Component",
              "captureInstruction": "Google sign in button"
            },
            "expectedResult": "Browser redirects to Google's secure OAuth consent dialog (accounts.google.com)."
          },
          {
            "stepNumber": 2,
            "title": "Authorize Google Account",
            "instruction": "Select your corporate Google profile. Google securely transmits your verified email and profile name to the CMS OAuth callback endpoint (/admin/api/auth/google/callback).",
            "expectedResult": "CMS matches or provisions your user profile, grants role permissions, and redirects to Dashboard."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "3. Enabling Two-Factor Authentication (2FA Setup)",
        "anchorId": "auth-enable-2fa"
      },
      {
        "type": "paragraph",
        "text": "To secure high-privilege operations, users can activate Two-Factor Authentication (TOTP) compatible with Google Authenticator, Microsoft Authenticator, and Authy."
      },
      {
        "type": "procedure",
        "title": "Procedure: Setting Up Google Authenticator",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Scan QR Code with Authenticator App",
            "instruction": "When prompted with the 2FA enrollment screen, open Google Authenticator on your mobile device, tap '+' and choose 'Scan a QR code'. Align your phone camera with the QR Code displayed on screen.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-2fa-qrcode.png",
              "alt": "2FA Enrollment QR Code",
              "caption": "Figure 2.3: Scanning Ant Design QRCode or copying secret key string into Authenticator app",
              "location": "/admin/auth/login?step=2fa",
              "targetArea": "TwoFactorVerifyStep Enrollment Card",
              "captureInstruction": "QR code enrollment"
            },
            "fields": [
              {
                "name": "Secret Key",
                "required": true,
                "description": "Base32 secret key string. If camera is unavailable, tap 'Copy' and enter manually into app."
              },
              {
                "name": "Verification Code",
                "required": true,
                "description": "Enter the 6-digit dynamic passcode generated by your Authenticator app."
              }
            ],
            "expectedResult": "Your mobile app begins generating rotating 6-digit tokens labeled 'TikTok Crawler CMS'."
          },
          {
            "stepNumber": 2,
            "title": "Verify Initial 6-Digit Passcode",
            "instruction": "Enter the 6-digit code currently visible in your authenticator app and click 'Verify Code'.",
            "expectedResult": "System verifies two-factor authentication, binds security credentials, and logs you into the CMS."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "4. Verifying 2FA on Subsequent Logins",
        "anchorId": "auth-verify-2fa"
      },
      {
        "type": "procedure",
        "title": "Procedure: 2FA Verification Flow",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Input Rotating 6-Digit TOTP Code",
            "instruction": "After submitting your email and password, the system presents the 2FA Verification prompt. Check your Google Authenticator app for the current code and enter it before the 30-second window expires.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-2fa-verify.png",
              "alt": "2FA Passcode Verification Prompt",
              "caption": "Figure 2.4: Enter 6-digit rotating security code from Authenticator app",
              "location": "/admin/auth/login?step=2fa",
              "targetArea": "Safety Certificate Verification Dialog",
              "captureInstruction": "2FA code entry"
            },
            "expectedResult": "Token exchange completes successfully and loads /admin/dashboard."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "5. Password Recovery",
        "anchorId": "auth-email-otp-reset"
      },
      {
        "type": "paragraph",
        "text": "If a user forgets their password or requires fallback email verification, self-service tools are accessible directly from the login screen."
      },
      {
        "type": "procedure",
        "title": "Procedure: Password Reset",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Request Password Reset Link",
            "instruction": "Click 'Forgot password?' on the login screen. Enter your registered email address and click 'Send Reset Instructions'.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-forgot-password.png",
              "alt": "Forgot Password Request Form",
              "caption": "Figure 2.5: Self-service password recovery email request form",
              "location": "/admin/auth/login?reset-password=1",
              "targetArea": "ResetPasswordForm Component",
              "captureInstruction": "Password recovery form"
            },
            "expectedResult": "System sends a signed password reset email containing a secure token valid for 60 minutes."
          },
          {
            "stepNumber": 2,
            "title": "Input Email OTP Code (Fallback Verification)",
            "instruction": "For accounts with Email OTP active, enter the 6-digit code received in your inbox. Use the 'Resend Code' button if expired.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-email-otp.png",
              "alt": "Email OTP Verification Code Form",
              "caption": "Figure 2.6: Entering 6-digit security code received via corporate email",
              "location": "/admin/auth/login?step=email_otp",
              "targetArea": "EmailOtpVerifyStep Card",
              "captureInstruction": "Email OTP screen"
            },
            "expectedResult": "Verification code is validated and grants access to the CMS."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "6. Administrative 2FA Reset & Password Reset",
        "anchorId": "auth-admin-resets"
      },
      {
        "type": "paragraph",
        "text": "When an employee loses their mobile device or forgets credentials, Administrators can perform secure resets from the User Management directory."
      },
      {
        "type": "procedure",
        "title": "Procedure: Admin Reset Actions",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Reset 2FA Authentication for User",
            "instruction": "In the Users table (/admin/user), locate the user row and click the Unlock icon ('Reset authentication'). Confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-authen.png",
              "alt": "Reset 2FA Authentication Popconfirm",
              "caption": "Figure 2.7: Confirming 2FA reset to clear security credentials and allow user to rescan QR code",
              "location": "/admin/user",
              "targetArea": "User Actions Popconfirm",
              "captureInstruction": "2FA Reset popconfirm"
            },
            "expectedResult": "Two-factor credentials are reset; user will be prompted to scan a fresh QR code on next login."
          },
          {
            "stepNumber": 2,
            "title": "Reset User Password from Table",
            "instruction": "Click the Key icon ('Reset password') in the user action column. Confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-password.png",
              "alt": "Reset Password Popconfirm",
              "caption": "Figure 2.8: Triggering password reset email directly from user management table",
              "location": "/admin/user",
              "targetArea": "User Table Action Column",
              "captureInstruction": "Password reset popconfirm"
            },
            "expectedResult": "Success alert confirms 'Reset password email has been sent successfully'."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-dashboard-sop",
    "slug": "dashboard-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "Dashboard SOP & Health Monitoring",
    "subtitle": "Standard Operating Procedure for monitoring operational metrics, engine status, and system alerts",
    "duration": "6 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "Dashboard SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Operational KPI Monitoring",
        "anchorId": "dashboard-kpis"
      },
      {
        "type": "paragraph",
        "text": "The Dashboard serves as the central mission control for tracking TikTok crawler throughput, candidate pool availability, and overall system health."
      },
      {
        "type": "procedure",
        "title": "Procedure: Daily Health Check",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Inspect KPI Stat Cards",
            "instruction": "Verify the four core metrics at the top of the dashboard: Total TikTok Accounts, Total Videos Collected, Active Crawl Jobs, and Discovered Fresh Pool Candidates.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-kpis.png",
              "alt": "Dashboard KPI Metric Cards",
              "caption": "Figure 3.1: Core system KPI indicators displaying account, video, and candidate counts",
              "location": "/admin/dashboard",
              "targetArea": "KPI Metric Cards Grid",
              "captureInstruction": "Dashboard KPIs"
            },
            "expectedResult": "Fresh Candidate Pool maintains target buffer (~5000 accounts), and active jobs match planned workloads."
          },
          {
            "stepNumber": 2,
            "title": "Verify Crawler Worker Engine Connectivity",
            "instruction": "Check the Python Worker Engine health card. Ensure the status indicator is green ('Online') and worker concurrency is active.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-engine-health.png",
              "alt": "Crawler Engine Health Card",
              "caption": "Figure 3.2: Python FastAPI crawler connectivity and queue health indicator",
              "location": "/admin/dashboard",
              "targetArea": "Engine Health Card",
              "captureInstruction": "Engine health card"
            },
            "expectedResult": "Engine connectivity is healthy with no pending connection timeouts."
          },
          {
            "stepNumber": 3,
            "title": "Audit Recent System Activities",
            "instruction": "Review the Recent Activities and Latest Crawl Jobs tables at the bottom of the dashboard to confirm successful job executions and audit events.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-recent-activities.png",
              "alt": "Dashboard Recent Activities Table",
              "caption": "Figure 3.3: Recent crawl jobs execution log and security audit events",
              "location": "/admin/dashboard",
              "targetArea": "Recent Activity Table",
              "captureInstruction": "Activity logs table"
            },
            "expectedResult": "Recent jobs show completed status with non-zero video extraction counts."
          },
          {
            "stepNumber": 4,
            "title": "Full Dashboard Overview",
            "instruction": "Perform a comprehensive review of the entire operational dashboard.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-overview.png",
              "alt": "Dashboard Full Overview",
              "caption": "Figure 3.4: Complete dashboard overview with charts, KPIs, and status widgets",
              "location": "/admin/dashboard",
              "targetArea": "Dashboard Main View",
              "captureInstruction": "Full dashboard view"
            },
            "expectedResult": "All dashboard widgets render smoothly without error states."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-crawler-operations-sop",
    "slug": "crawler-operations-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "Crawl Job Operations SOP",
    "subtitle": "Standard Operating Procedure for creating, configuring, executing, and monitoring automated crawl jobs",
    "duration": "10 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "Crawl Job Operations SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Crawl Jobs Directory & Lifecycle Management",
        "anchorId": "crawler-job-table"
      },
      {
        "type": "paragraph",
        "text": "The Crawl Jobs module manages the full lifecycle of data collection tasks: creating target batches, dispatching to Python workers, tracking progress, and retrying failed items."
      },
      {
        "type": "procedure",
        "title": "Procedure: Managing Crawl Jobs",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open Crawl Jobs Directory",
            "instruction": "Navigate to /admin/crawler/crawl-job. Use the search input to filter jobs by name, or use the Status dropdown to filter by Pending, Running, Completed, Paused, or Failed.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-table.png",
              "alt": "Crawl Jobs Directory Table",
              "caption": "Figure 4.1: Master table of crawl jobs with status filters, date range, and action buttons",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Crawl Jobs Table",
              "captureInstruction": "Crawl jobs list"
            },
            "expectedResult": "Jobs are displayed with tags, progress percentages, target account counts, and action icons."
          },
          {
            "stepNumber": 2,
            "title": "Initialize Create Crawl Job Screen",
            "instruction": "Click '+ Create Job' in the top-right header.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-empty.png",
              "alt": "Create Crawl Job Initial Screen",
              "caption": "Figure 4.2: Empty Create Crawl Job form ready for target configuration",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Create Job Form",
              "captureInstruction": "Empty create form"
            },
            "expectedResult": "Form renders with Source Type set to Usernames and Crawl Mode set to Account With Videos."
          },
          {
            "stepNumber": 3,
            "title": "Configure Target Source Type",
            "instruction": "Select your input mode: 'Usernames' for creator handles, 'URLs' for direct TikTok links, or 'Account Count' to sample from the system discovery candidate pool.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-source-types.png",
              "alt": "Source Type Selection Tabs",
              "caption": "Figure 4.3: Choosing between Usernames, URLs, and Candidate Pool Count",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Source Type Tabs",
              "captureInstruction": "Source type tabs"
            },
            "expectedResult": "Input controls adjust dynamically to the selected source type."
          },
          {
            "stepNumber": 4,
            "title": "Configure Target Handles and Crawl Mode",
            "instruction": "Enter handles into the Data Crawl textarea. Choose 'Account With Videos' to collect both profile info and published videos, or 'Account Only' for fast metadata collection.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-filled.png",
              "alt": "Populated Crawl Job Parameters",
              "caption": "Figure 4.4: Configured handles (@vtv24news, @khaby.lame) and crawl mode selection",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Data Crawl and Crawl Mode Radios",
              "captureInstruction": "Filled form"
            },
            "fields": [
              {
                "name": "Data Crawl",
                "required": true,
                "description": "Newline or comma-separated TikTok handles or URLs. The '@' symbol is automatically stripped."
              },
              {
                "name": "Crawl Mode",
                "required": true,
                "description": "Choose 'Account With Videos' (extracts profile + recent videos) or 'Account Only' (profile stats only)."
              },
              {
                "name": "Priority",
                "required": false,
                "description": "Job scheduling priority (High, Normal, Low)."
              }
            ],
            "expectedResult": "Target counter updates indicating the total number of parsed creator handles."
          },
          {
            "stepNumber": 5,
            "title": "Configure Video Date Range Filter",
            "instruction": "Click the Date Filter selector dropdown to filter videos by publication time. Choose a preset ('Today', 'Past 7 Days', 'Past 30 Days') or select 'Custom Range'. Verify timezone is Asia/Ho_Chi_Minh.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-date-filter.png",
              "alt": "Video Date Range Filter Selector",
              "caption": "Figure 4.5: Date filter presets with Timezone selection to bound video collection",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "VideoDateFilterSelector Component",
              "captureInstruction": "Date filter selector"
            },
            "fields": [
              {
                "name": "Date Preset",
                "required": false,
                "description": "Presets: All Time, Today, Past 7 Days, Past 30 Days, Custom Range."
              },
              {
                "name": "Custom Range",
                "required": false,
                "description": "From Date and To Date pickers when Custom Range is active."
              },
              {
                "name": "Timezone",
                "required": true,
                "description": "Timezone used to compute the start and end timestamps (default: Asia/Ho_Chi_Minh)."
              }
            ],
            "expectedResult": "Crawler will stop paginating creator videos as soon as it encounters videos published before the selected start date."
          },
          {
            "stepNumber": 6,
            "title": "Start Job & Confirm Dispatch",
            "instruction": "Click 'Create & Start Crawl'. In the popconfirm dialog, confirm execution.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-start-confirm.png",
              "alt": "Start Job Confirmation Popconfirm",
              "caption": "Figure 4.6: Confirming job dispatch to immediate execution",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Start Popconfirm Dialog",
              "captureInstruction": "Start confirmation"
            },
            "expectedResult": "Job enters execution queue and updates to 'running' status."
          },
          {
            "stepNumber": 7,
            "title": "Monitor Execution Details & Target Results",
            "instruction": "Click on the job to view the Job Detail page. Monitor the live progress bar, accounts processed, videos extracted, and per-target account status.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-detail-summary.png",
              "alt": "Crawl Job Detail Summary",
              "caption": "Figure 4.7: Live execution progress bar, statistics, and account results table",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Job Detail Page",
              "captureInstruction": "Job detail view"
            },
            "expectedResult": "Target accounts table lists each creator, extracted video count, status badge, and duration."
          },
          {
            "stepNumber": 8,
            "title": "Retry Failed Target Accounts",
            "instruction": "If any account encountered a temporary network timeout, click the 'Retry' icon in that row to re-dispatch only the failed creator.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-retry.png",
              "alt": "Retry Failed Target Account",
              "caption": "Figure 4.8: Selective target retry for transient network errors",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Target Accounts Table Action Column",
              "captureInstruction": "Retry button"
            },
            "expectedResult": "Worker re-attempts crawling for the target account without re-running the entire job."
          },
          {
            "stepNumber": 9,
            "title": "Pause or Cancel an Active Job",
            "instruction": "To halt a running job, click 'Pause' or 'Cancel' in the action header and confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-stop-confirm.png",
              "alt": "Stop Crawl Job Confirmation",
              "caption": "Figure 4.9: Halting an active crawl job with graceful worker release",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Job Header Actions",
              "captureInstruction": "Stop popconfirm"
            },
            "expectedResult": "Worker processes finish their active chunk and release candidate leases gracefully."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-tiktok-account-sop",
    "slug": "tiktok-account-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "TikTok Accounts & Video Showcase SOP",
    "subtitle": "Standard Operating Procedure for browsing creator profiles, video engagement metrics, manual entries, and CSV exports",
    "duration": "8 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "TikTok Accounts SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Exploring TikTok Creator Directory",
        "anchorId": "account-directory"
      },
      {
        "type": "paragraph",
        "text": "The TikTok Accounts module stores master profiles of tracked creators, including avatar, biography, follower growth, verification badges, and collected video catalogs."
      },
      {
        "type": "procedure",
        "title": "Procedure: Exploring Creator Profiles & Videos",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open TikTok Accounts Table",
            "instruction": "Navigate to /admin/tiktok-account. Use the search bar to locate creators by username or nickname, and filter by verification status.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-list.png",
              "alt": "TikTok Accounts Master Directory",
              "caption": "Figure 5.1: TikTok Accounts table showing avatars, handles, follower counts, and verified tags",
              "location": "/admin/tiktok-account",
              "targetArea": "TikTok Accounts Table",
              "captureInstruction": "Account table"
            },
            "expectedResult": "Table renders with creator avatars, follower statistics, and last crawl timestamps."
          },
          {
            "stepNumber": 2,
            "title": "Open Creator Detail Drawer",
            "instruction": "Click the Eye icon or creator username row to open the Account Detail view.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-overview.png",
              "alt": "Account Detail Profile Overview",
              "caption": "Figure 5.2: Creator profile drawer displaying follower stats, bio, region, and language",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Account Detail Header and Info Tab",
              "captureInstruction": "Detail drawer overview"
            },
            "expectedResult": "Profile statistics (Followers, Following, Likes, Videos) load alongside biographical details."
          },
          {
            "stepNumber": 3,
            "title": "Inspect Videos Showcase Tab",
            "instruction": "Click the 'Videos' tab inside the detail view to browse the grid of collected TikTok videos.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-videos.png",
              "alt": "Creator Video Showcase Grid",
              "caption": "Figure 5.3: Video cards with thumbnails, view count, likes, comments, and publish date",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Account Detail Videos Tab",
              "captureInstruction": "Video showcase grid"
            },
            "expectedResult": "Video grid displays video thumbnails, view counts, engagement metrics, and direct TikTok links."
          },
          {
            "stepNumber": 4,
            "title": "Review Crawl History Tab",
            "instruction": "Click the 'History' tab to inspect every crawl job that targeted this creator, including execution timestamps and status.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-history.png",
              "alt": "Account Crawl History Tab",
              "caption": "Figure 5.4: Crawl execution history log for creator profile",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Account Detail History Tab",
              "captureInstruction": "Crawl history tab"
            },
            "expectedResult": "Table lists job IDs, timestamps, and numbers of videos collected per run."
          },
          {
            "stepNumber": 5,
            "title": "Manually Register New Creator Profile",
            "instruction": "Click '+ Add Account' to manually add a creator record before crawling.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-form.png",
              "alt": "Create TikTok Account Form",
              "caption": "Figure 5.6: Form to register a creator profile with username, nickname, and metadata",
              "location": "/admin/tiktok-account/create",
              "targetArea": "TiktokAccountFormPage",
              "captureInstruction": "Account form"
            },
            "fields": [
              {
                "name": "Username",
                "required": true,
                "description": "TikTok handle string without spaces (e.g. vtv24news)"
              },
              {
                "name": "Nickname",
                "required": false,
                "description": "Display name of creator (e.g. VTV24 Tin Tức)"
              },
              {
                "name": "Following",
                "required": true,
                "description": "Number of users this creator is following"
              },
              {
                "name": "Followers",
                "required": true,
                "description": "Number of users this creator is followers"
              },
              {
                "name": "Likes",
                "required": true,
                "description": "Number of users this creator is likes"
              },
            ],
            "expectedResult": "New creator profile is saved and appears in the accounts directory."
          },
        ]
      }
    ]
  },
  {
    "id": "follow-user-management-sop",
    "slug": "user-management-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "User Management & Administration SOP",
    "subtitle": "Standard Operating Procedure for user provisioning, role assignments, password resets, and account deactivations",
    "duration": "8 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "User Management SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. User Directory & Personnel Administration",
        "anchorId": "user-directory"
      },
      {
        "type": "paragraph",
        "text": "The User Management module manages personnel accounts, assigned security roles, direct permission overrides, account statuses, and authentication resets."
      },
      {
        "type": "procedure",
        "title": "Procedure: Managing Users and Provisioning",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Browse Users Table & KPIs",
            "instruction": "Navigate to /admin/user. Review KPI cards (Total Users, Active, Inactive, Roles Assigned) and the users list table.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-table.png",
              "alt": "Users Directory Table",
              "caption": "Figure 6.1: Users directory showing user cards, avatars, email, phone, and role tags",
              "location": "/admin/user",
              "targetArea": "Users Table and KPI Cards",
              "captureInstruction": "Users list"
            },
            "expectedResult": "Table displays all registered operators with active status switches and role tags."
          },
          {
            "stepNumber": 2,
            "title": "Provision a New User",
            "instruction": "Click '+ Add User' to open the User Creation form at /admin/user/create. Fill in the profile fields and assign roles.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-create.png",
              "alt": "Create User Form",
              "caption": "Figure 6.2: User provisioning form with Profile, Security, and Roles sections",
              "location": "/admin/user/create",
              "targetArea": "UserFormPage",
              "captureInstruction": "Create user form"
            },
            "fields": [
              {
                "name": "Full Name",
                "required": true,
                "description": "Employee full legal or operational name"
              },
              {
                "name": "Email Address",
                "required": true,
                "description": "Corporate email address used for login and notifications"
              },
              {
                "name": "Phone Number",
                "required": false,
                "description": "Contact telephone number"
              },
              {
                "name": "Password",
                "required": true,
                "description": "Temporary password for initial sign-in (minimum 6 characters)"
              },
              {
                "name": "Roles",
                "required": true,
                "description": "Assigned RBAC roles (Administrator, Operations Manager, Crawler Specialist, Guest Auditor)"
              },
              {
                "name": "Status",
                "required": true,
                "description": "Active or Inactive switch"
              }
            ],
            "expectedResult": "User is created, permissions are synchronized, and the account appears in the directory."
          },
          {
            "stepNumber": 3,
            "title": "Edit User Profile and Roles",
            "instruction": "Click the Edit icon on any user row to open /admin/user/:id/edit. Update contact details or adjust assigned roles.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-edit.png",
              "alt": "Edit User Form",
              "caption": "Figure 6.3: Updating user credentials, roles, and status",
              "location": "/admin/user/2/edit",
              "targetArea": "User Edit Form",
              "captureInstruction": "Edit user form"
            },
            "expectedResult": "Form pre-populates existing data; saving updates permissions immediately."
          },
          {
            "stepNumber": 4,
            "title": "View User Detail & Audit Profile",
            "instruction": "Click the Eye icon to view the User Detail screen showing account metadata and assigned module permissions.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-detail.png",
              "alt": "User Detail Profile View",
              "caption": "Figure 6.4: User detail screen displaying profile info, assigned roles, and privileges",
              "location": "/admin/user/1",
              "targetArea": "UserDetailPage",
              "captureInstruction": "User detail view"
            },
            "expectedResult": "Detailed view displays user privileges, security status, and assigned roles."
          },
          {
            "stepNumber": 5,
            "title": "Toggle User Status (Active / Inactive)",
            "instruction": "Click the switch in the 'Status' column to immediately suspend or activate user access.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-status-toggle.png",
              "alt": "Toggle User Status Switch",
              "caption": "Figure 6.5: Changing user status between Active and Inactive",
              "location": "/admin/user",
              "targetArea": "Status Column Switch",
              "captureInstruction": "Status toggle"
            },
            "expectedResult": "Status updates in real-time; inactive users cannot log in."
          },
          {
            "stepNumber": 6,
            "title": "Administrative Password Reset",
            "instruction": "Click the Key icon in the action column. Confirm the popconfirm dialog to dispatch a password reset link to the user's email.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-password.png",
              "alt": "Reset Password Popconfirm",
              "caption": "Figure 6.6: Confirming password reset action for user account",
              "location": "/admin/user",
              "targetArea": "User Action Column Popconfirm",
              "captureInstruction": "Password reset popconfirm"
            },
            "expectedResult": "Success notification confirms email dispatch."
          },
          {
            "stepNumber": 7,
            "title": "Administrative 2FA Authentication Reset",
            "instruction": "If a user loses their authenticator app, click the Unlock icon ('Reset authentication'). Confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-authen.png",
              "alt": "Reset 2FA Authentication Popconfirm",
              "caption": "Figure 6.7: Resetting 2FA credentials to allow the user to rescan QR code",
              "location": "/admin/user",
              "targetArea": "User Action Column Popconfirm",
              "captureInstruction": "2FA Reset popconfirm"
            },
            "expectedResult": "User's two-factor credentials are cleared; they will scan a fresh QR code on next login."
          },
          {
            "stepNumber": 8,
            "title": "Delete User Account",
            "instruction": "Click the Delete icon (trash bin) and confirm the red 'Delete' button in the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-delete.png",
              "alt": "Delete User Popconfirm",
              "caption": "Figure 6.8: Confirming permanent user account removal",
              "location": "/admin/user",
              "targetArea": "User Action Column Popconfirm",
              "captureInstruction": "Delete user popconfirm"
            },
            "expectedResult": "User record is safely deleted from the system."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-roles-permissions-sop",
    "slug": "roles-permissions-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "Roles, Permissions & Module Management SOP",
    "subtitle": "Standard Operating Procedure for configuring RBAC roles, Role Permission Matrices, system modules, and action permissions",
    "duration": "9 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "Roles & Permissions SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Role-Based Access Control (RBAC) Management",
        "anchorId": "role-rbac-management"
      },
      {
        "type": "paragraph",
        "text": "The Role and Permission system governs access across all CMS modules. Roles are collections of granular action permissions assigned to users."
      },
      {
        "type": "procedure",
        "title": "Procedure: Managing Roles and Permission Matrices",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open Roles Directory Table",
            "instruction": "Navigate to /admin/user/role. Review configured system roles, slug identifiers, assigned user counts, and actions.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-table.png",
              "alt": "Roles Directory Table",
              "caption": "Figure 7.1: Configured system roles table showing slugs, user counts, and action buttons",
              "location": "/admin/user/role",
              "targetArea": "Roles Table",
              "captureInstruction": "Roles table"
            },
            "expectedResult": "Roles table renders listing Admin, Manager, Editor, and Viewer roles."
          },
          {
            "stepNumber": 2,
            "title": "Create a New System Role",
            "instruction": "Click 'Create Role' to open the RoleFormModal. Enter the Role Name (slug auto-generates) and Description.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-create.png",
              "alt": "Create Role Modal",
              "caption": "Figure 7.2: Creating a role with name, auto slug generation, and description",
              "location": "/admin/user/role",
              "targetArea": "RoleFormModal",
              "captureInstruction": "Create role modal"
            },
            "fields": [
              {
                "name": "Role Name",
                "required": true,
                "description": "Display name of the role (e.g. Data Analyst Specialist)"
              },
              {
                "name": "Slug",
                "required": true,
                "description": "URL and code identifier (e.g. data-analyst-specialist). Auto-generated from name."
              },
              {
                "name": "Description",
                "required": false,
                "description": "Operational scope of this role"
              }
            ],
            "expectedResult": "Slug is automatically generated in lowercase hyphenated format."
          },
          {
            "stepNumber": 3,
            "title": "Configure Role Permission Matrix",
            "instruction": "Inside the modal, use the Permission Matrix to check permissions by module. Use the 'Select All' checkbox to grant full module access.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-permission-matrix.png",
              "alt": "Role Permission Matrix",
              "caption": "Figure 7.3: Module-based permission matrix with select-all and granular checkboxes",
              "location": "/admin/user/role",
              "targetArea": "PermissionMatrix Component inside Modal",
              "captureInstruction": "Permission matrix"
            },
            "fields": [
              {
                "name": "Module Checkboxes",
                "required": false,
                "description": "Select individual permissions (view, create, edit, delete, export, start_crawl) for each module."
              },
              {
                "name": "Select All Header",
                "required": false,
                "description": "Toggles all permissions across a specific module in one click."
              }
            ],
            "expectedResult": "Assigned permission IDs are saved and synchronized with the role."
          },
          {
            "stepNumber": 4,
            "title": "Edit an Existing Role",
            "instruction": "Click 'Edit' on any role row to open the modal, modify description, or adjust assigned permission checkboxes.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-edit.png",
              "alt": "Edit Role Modal",
              "caption": "Figure 7.4: Editing permissions and description for an existing role",
              "location": "/admin/user/role",
              "targetArea": "RoleFormModal in Edit Mode",
              "captureInstruction": "Edit role modal"
            },
            "expectedResult": "Role updates immediately without requiring server restarts."
          },
          {
            "stepNumber": 5,
            "title": "Delete a Role",
            "instruction": "Click 'Delete' on a role row and confirm the popconfirm dialog. Note: The Super Admin ('admin') role cannot be deleted.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-delete.png",
              "alt": "Delete Role Confirmation",
              "caption": "Figure 7.5: Deleting a role with confirmation dialog",
              "location": "/admin/user/role",
              "targetArea": "Role Table Action Column",
              "captureInstruction": "Delete role popconfirm"
            },
            "expectedResult": "Role is removed; users with this role will no longer inherit its permissions."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. System Module & Permission Definitions",
        "anchorId": "permission-module-management"
      },
      {
        "type": "paragraph",
        "text": "System Permissions define the granular capabilities of the application. Developers and administrators can define new system modules and assignable permissions."
      },
      {
        "type": "procedure",
        "title": "Procedure: Defining Modules and Permissions",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open Permissions Directory",
            "instruction": "Navigate to /admin/user/permission. Use the 'Filter by Module' and 'Filter by Action' dropdowns to explore existing capabilities.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-table.png",
              "alt": "System Permissions Directory Table",
              "caption": "Figure 7.6: System permissions table with module filter and action filter",
              "location": "/admin/user/permission",
              "targetArea": "Permissions Table",
              "captureInstruction": "Permissions table"
            },
            "expectedResult": "Permissions list displays slugs, module tags, action types, and descriptions."
          },
          {
            "stepNumber": 2,
            "title": "Create a New System Module",
            "instruction": "Click 'Create Module' in the header. Enter the Module Key (snake_case) and Display Name. The system automatically preselects standard CRUD actions.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-module-create-modal.png",
              "alt": "Create Module Modal",
              "caption": "Figure 7.7: Create Module Modal with automatic slug formatting and action preview",
              "location": "/admin/user/permission",
              "targetArea": "CreateModuleModal Component",
              "captureInstruction": "Create module modal"
            },
            "fields": [
              {
                "name": "Module Key",
                "required": true,
                "description": "Lowercase snake_case string (e.g. content_moderation). Special characters are auto-sanitized."
              },
              {
                "name": "Display Name",
                "required": false,
                "description": "Human-friendly label (e.g. Content Moderation Engine)"
              },
              {
                "name": "Actions",
                "required": true,
                "description": "Standard actions to generate (View, Create, Edit, Delete)"
              }
            ],
            "expectedResult": "System batch-generates the permissions (module.view, module.create, module.edit, module.delete) and registers the module."
          },
          {
            "stepNumber": 3,
            "title": "Create a Granular System Permission",
            "instruction": "Click 'Create Permission' in the header. Select the target module, type the action name, and inspect the auto-generated slug preview.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-create-modal.png",
              "alt": "Create Permission Modal",
              "caption": "Figure 7.8: Creating a granular permission with auto slug preview (e.g. crawler.export_csv)",
              "location": "/admin/user/permission",
              "targetArea": "CreatePermissionModal Component",
              "captureInstruction": "Create permission modal"
            },
            "fields": [
              {
                "name": "Module",
                "required": true,
                "description": "Target module name from autocomplete or custom entry"
              },
              {
                "name": "Action",
                "required": true,
                "description": "Action verb (e.g. export_csv, start_crawl, purge_queue)"
              },
              {
                "name": "Slug Preview",
                "required": false,
                "description": "Automatically formatted as {module}.{action}"
              },
              {
                "name": "Description",
                "required": false,
                "description": "Explanation of what capability this permission unlocks"
              }
            ],
            "expectedResult": "Permission is added to the system and immediately appears in the Role Permission Matrix."
          },
          {
            "stepNumber": 4,
            "title": "Delete a Permission",
            "instruction": "Click 'Delete' on any permission row and confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-delete.png",
              "alt": "Delete Permission Confirmation",
              "caption": "Figure 7.9: Confirming permission deletion from system catalog",
              "location": "/admin/user/permission",
              "targetArea": "Permission Table Action Column",
              "captureInstruction": "Delete permission popconfirm"
            },
            "expectedResult": "Permission is removed and detached from all roles."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-system-diagnostics-sop",
    "slug": "system-diagnostics-sop",
    "pillar": "follow",
    "category": "Operational SOPs",
    "title": "System Settings, Diagnostics & Audit Logs SOP",
    "subtitle": "Standard Operating Procedure for system diagnostics, engine queue parameters, purging queues, and auditing change logs",
    "duration": "8 min read",
    "breadcrumbs": [
      {
        "label": "Guidelines",
        "url": "/guideline"
      },
      {
        "label": "Follow"
      },
      {
        "label": "Operational SOPs"
      },
      {
        "label": "System Diagnostics SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. System Health & Infrastructure Diagnostics",
        "anchorId": "system-diagnostics"
      },
      {
        "type": "paragraph",
        "text": "The System Diagnostics module provides real-time visibility into the underlying infrastructure: PHP runtime, Laravel version, MySQL connectivity, Redis cache, and storage disk space."
      },
      {
        "type": "procedure",
        "title": "Procedure: System Health Inspection & Diagnostics",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open System Diagnostics Screen",
            "instruction": "Navigate to /admin/system in the sidebar. Inspect server environment metrics, database connection status, and cache availability.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-diagnostics.png",
              "alt": "System Diagnostics Dashboard",
              "caption": "Figure 8.1: Server environment status showing PHP, Laravel, DB, and cache metrics",
              "location": "/admin/system",
              "targetArea": "SystemDiagnosticPage Cards",
              "captureInstruction": "System diagnostics"
            },
            "expectedResult": "All diagnostic cards display green checks confirming active connections."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. Crawler Settings & Queue Administration",
        "anchorId": "system-settings-queues"
      },
      {
        "type": "paragraph",
        "text": "Configure discovery candidate pool thresholds, batch leasing chunk size, worker timeouts, and queue maintenance."
      },
      {
        "type": "procedure",
        "title": "Procedure: Managing Engine Settings & Queues",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open System Settings",
            "instruction": "Navigate to /admin/system/settings. Inspect the Crawler Settings tab.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-settings.png",
              "alt": "System Settings Configuration Form",
              "caption": "Figure 8.2: Configuring discovery candidate target size (5000), batch size, and concurrency",
              "location": "/admin/system/settings",
              "targetArea": "SystemSettingsPage",
              "captureInstruction": "System settings form"
            },
            "fields": [
              {
                "name": "Fresh Target Size",
                "required": true,
                "description": "Maintains dedicated fresh pool buffer (default: 5000 accounts)"
              },
              {
                "name": "Batch Size",
                "required": true,
                "description": "Candidate chunk lease size (default: 20 accounts per batch)"
              },
              {
                "name": "Worker Concurrency",
                "required": true,
                "description": "Parallel headless browser sessions in Python engine"
              },
              {
                "name": "Request Timeout",
                "required": true,
                "description": "HTTP request timeout in seconds"
              }
            ],
            "expectedResult": "Settings save successfully and update the crawler engine configuration."
          },
          {
            "stepNumber": 2,
            "title": "Purge Worker Queue (Queue Reset)",
            "instruction": "To clear stuck tasks or flush stale jobs, click 'Purge Queue' in the worker settings tab and confirm the popconfirm dialog.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-purge-queue.png",
              "alt": "Purge Worker Queue Popconfirm",
              "caption": "Figure 8.3: Confirming queue purge to flush stuck worker assignments",
              "location": "/admin/system/settings",
              "targetArea": "WorkerSettingsTab Popconfirm",
              "captureInstruction": "Purge queue popconfirm"
            },
            "expectedResult": "Stale assignments are cleared, releasing candidates back to the available pool."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "3. Activity Audit Logs & Diff Modal",
        "anchorId": "system-audit-logs"
      },
      {
        "type": "paragraph",
        "text": "Every mutating action performed in the CMS is recorded in the Activity Log with user attribution, timestamp, IP address, and before/after state diffs."
      },
      {
        "type": "procedure",
        "title": "Procedure: Inspecting Audit Trail & State Diffs",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Open Activity Logs Table",
            "instruction": "Navigate to /admin/system/activity-logs. Use the filter bar to filter logs by User, Module, Action, or Date range.",
            "screenshot": {
              "src": "/images/guideline/system/figure-activity-logs.png",
              "alt": "Activity Audit Logs Directory Table",
              "caption": "Figure 8.4: Activity logs table showing user actions, modules, and execution timestamps",
              "location": "/admin/system/activity-logs",
              "targetArea": "ActivityLogTable Component",
              "captureInstruction": "Activity logs table"
            },
            "expectedResult": "Table lists audit records with action descriptions and user details."
          },
          {
            "stepNumber": 2,
            "title": "Inspect Login Session History",
            "instruction": "Navigate to /admin/system/login-logs to review authentication attempts, client IP addresses, user agents, and statuses.",
            "screenshot": {
              "src": "/images/guideline/system/figure-login-logs.png",
              "alt": "Login Logs Directory Table",
              "caption": "Figure 8.6: Login session history showing IP addresses, user agents, and timestamps",
              "location": "/admin/system/login-logs",
              "targetArea": "LoginLogsPage Table",
              "captureInstruction": "Login logs table"
            },
            "expectedResult": "History table displays recent sign-ins with geographic IP and browser details."
          }
        ]
      }
    ]
  }
];
