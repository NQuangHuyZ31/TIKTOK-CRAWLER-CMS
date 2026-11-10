import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
PUBLIC_IMG_DIR = os.path.abspath("cms-tiktok-crawler/public/images/guideline")

SUBDIRS = [
    "auth",
    "dashboard",
    "crawler",
    "tiktok-account",
    "user",
    "role",
    "permission",
    "system",
    "troubleshooting",
    "follow/quickstart",
]

for sub in SUBDIRS:
    os.makedirs(os.path.join(PUBLIC_IMG_DIR, sub), exist_ok=True)

def wait_and_save(page, rel_path, wait_ms=1200, selector=None):
    if selector:
        try:
            page.wait_for_selector(selector, timeout=3000)
        except Exception:
            pass
    time.sleep(wait_ms / 1000.0)
    full_path = os.path.join(PUBLIC_IMG_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    try:
        page.screenshot(path=full_path, full_page=False, timeout=5000, animations="disabled")
        size_kb = os.path.getsize(full_path) / 1024.0
        print(f"Captured: {rel_path} ({size_kb:.1f} KB)", flush=True)
    except Exception as e:
        print(f"Warning on screenshot {rel_path}: {e}", flush=True)

def main():
    print("Starting Laravel server...", flush=True)
    server_proc = subprocess.Popen(
        ["php", "artisan", "serve", "--port=8000"],
        cwd=os.path.abspath("cms-tiktok-crawler"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=1.25,
            )
            page = context.new_page()

            # -------------------------------------------------------------
            # 1. AUTHENTICATION & LOGIN FLOWS
            # -------------------------------------------------------------
            print("\n--- 1. Capturing Auth Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/auth/login", wait_until="domcontentloaded")
            time.sleep(1)
            
            # Fill credentials
            try:
                email_field = page.locator('input[id*="email"], input[type="email"], input[type="text"]').first
                if email_field.is_visible():
                    email_field.fill("admin@cms.com")
                pw_field = page.locator('input[id*="password"], input[type="password"]').first
                if pw_field.is_visible():
                    pw_field.fill("password")
            except Exception:
                pass
            
            wait_and_save(page, "auth/figure-auth-login.png", wait_ms=400)
            wait_and_save(page, "follow/quickstart/figure-auth-login.png", wait_ms=200)

            # Google Login button hover
            try:
                google_btn = page.locator('button:has-text("Continue with Google")').first
                if google_btn.is_visible():
                    google_btn.hover()
                    wait_and_save(page, "auth/figure-auth-google-login.png", wait_ms=400)
            except Exception:
                pass

            # Forgot Password
            page.goto(f"{BASE_URL}/admin/auth/login?reset-password=1", wait_until="domcontentloaded")
            time.sleep(1)
            try:
                email_reset = page.locator('input[id*="email"], input[type="email"]').first
                if email_reset.is_visible():
                    email_reset.fill("admin@cms.com")
            except Exception:
                pass
            wait_and_save(page, "auth/figure-auth-forgot-password.png", wait_ms=600)

            # 2FA QR Code & Verify Mock step
            page.goto(f"{BASE_URL}/admin/auth/login?step=2fa&temp_token=demo_token_setup", wait_until="domcontentloaded")
            time.sleep(1)
            wait_and_save(page, "auth/figure-auth-2fa-qrcode.png", wait_ms=600)
            wait_and_save(page, "auth/figure-auth-2fa-verify.png", wait_ms=400)

            # Email OTP step
            page.goto(f"{BASE_URL}/admin/auth/login?step=email_otp&temp_token=demo_otp_token&email=admin%40cms.com", wait_until="domcontentloaded")
            time.sleep(1)
            wait_and_save(page, "auth/figure-auth-email-otp.png", wait_ms=600)

            # Perform actual login
            page.goto(f"{BASE_URL}/admin/auth/login", wait_until="domcontentloaded")
            time.sleep(1)
            page.locator('input[id*="email"], input[type="email"], input[type="text"]').first.fill("admin@cms.com")
            page.locator('input[id*="password"], input[type="password"]').first.fill("password")
            page.locator('button[type="submit"]').first.click()
            page.wait_for_url("**/admin/dashboard", timeout=15000)
            time.sleep(2.5)

            # -------------------------------------------------------------
            # 2. DASHBOARD
            # -------------------------------------------------------------
            print("\n--- 2. Capturing Dashboard Screens ---", flush=True)
            wait_and_save(page, "dashboard/figure-dashboard-overview.png", wait_ms=2000, selector=".ant-card")
            wait_and_save(page, "dashboard/figure-dashboard-kpis.png", wait_ms=400)
            wait_and_save(page, "dashboard/figure-dashboard-engine-health.png", wait_ms=400)
            wait_and_save(page, "dashboard/figure-dashboard-recent-activities.png", wait_ms=400)

            # -------------------------------------------------------------
            # 3. CRAWL JOBS (CRAWLER ENGINE)
            # -------------------------------------------------------------
            print("\n--- 3. Capturing Crawl Job Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/crawler/crawl-job", wait_until="domcontentloaded")
            wait_and_save(page, "crawler/figure-crawl-job-table.png", wait_ms=2000, selector=".ant-table-row")

            # 3.1 Empty Create Crawl Job form
            page.goto(f"{BASE_URL}/admin/crawler/crawl-job/create", wait_until="domcontentloaded")
            wait_and_save(page, "crawler/figure-crawl-job-create-empty.png", wait_ms=1200)
            wait_and_save(page, "crawler/figure-crawl-job-create.png", wait_ms=400)
            wait_and_save(page, "crawler/figure-crawl-job-source-types.png", wait_ms=400)

            # 3.2 Filled Create Crawl Job form
            try:
                textarea = page.locator('textarea').first
                if textarea.is_visible():
                    textarea.fill("@vtv24news\n@khaby.lame\n@tiktok")
                radio_with_videos = page.locator('input[value="with_videos"], input[value="account_with_videos"], .ant-radio-wrapper:has-text("Account With Videos"), .ant-radio-wrapper:has-text("Videos")').first
                if radio_with_videos.is_visible():
                    radio_with_videos.click()
            except Exception:
                pass

            wait_and_save(page, "crawler/figure-crawl-job-create-filled.png", wait_ms=1000)
            wait_and_save(page, "crawler/figure-crawl-job-modes.png", wait_ms=400)

            # 3.3 Open Date Filter Selector
            try:
                date_filter_btn = page.locator('.ant-select:has-text("All Time"), .ant-select:has-text("Date Filter"), button:has-text("Date Filter"), [data-testid="date-filter"]').first
                if date_filter_btn.is_visible():
                    date_filter_btn.click(timeout=2000)
                    time.sleep(0.8)
            except Exception:
                pass
            wait_and_save(page, "crawler/figure-crawl-job-date-filter.png", wait_ms=1000)

            # 3.4 Start Job Confirmation
            page.goto(f"{BASE_URL}/admin/crawler/crawl-job", wait_until="domcontentloaded")
            time.sleep(1.2)
            try:
                start_btn = page.locator('button:has-text("Run"), button:has-text("Start"), button[title*="Start" i], .ant-btn-primary').first
                if start_btn.is_visible():
                    start_btn.hover()
            except Exception:
                pass
            wait_and_save(page, "crawler/figure-crawl-job-start-confirm.png", wait_ms=800)

            # 3.5 Crawl Job Detail Page
            page.goto(f"{BASE_URL}/admin/crawler/crawl-job/1", wait_until="domcontentloaded")
            wait_and_save(page, "crawler/figure-crawl-job-detail-summary.png", wait_ms=1800, selector=".ant-descriptions, .ant-card")
            wait_and_save(page, "crawler/figure-crawl-job-results.png", wait_ms=800, selector=".ant-table-row")
            wait_and_save(page, "crawler/figure-crawl-job-stop-confirm.png", wait_ms=600)
            wait_and_save(page, "crawler/figure-crawl-job-retry.png", wait_ms=600)

            # -------------------------------------------------------------
            # 4. TIKTOK ACCOUNTS
            # -------------------------------------------------------------
            print("\n--- 4. Capturing TikTok Account Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/tiktok-account", wait_until="domcontentloaded")
            wait_and_save(page, "tiktok-account/figure-account-list.png", wait_ms=2000, selector=".ant-table-row")
            wait_and_save(page, "tiktok-account/figure-account-export.png", wait_ms=600)
            wait_and_save(page, "tiktok-account/figure-account-quick-recrawl.png", wait_ms=600)

            # 4.1 Account Detail Page
            page.goto(f"{BASE_URL}/admin/tiktok-account/1", wait_until="domcontentloaded")
            wait_and_save(page, "tiktok-account/figure-account-detail-overview.png", wait_ms=1800)

            try:
                videos_tab = page.locator('.ant-tabs-tab:has-text("Videos"), .ant-tabs-tab:has-text("Video")').first
                if videos_tab.is_visible():
                    videos_tab.click(timeout=2000)
                    time.sleep(1.2)
            except Exception:
                pass
            wait_and_save(page, "tiktok-account/figure-account-detail-videos.png", wait_ms=1200)

            try:
                history_tab = page.locator('.ant-tabs-tab:has-text("History"), .ant-tabs-tab:has-text("Crawl")').first
                if history_tab.is_visible():
                    history_tab.click(timeout=2000)
                    time.sleep(1.0)
            except Exception:
                pass
            wait_and_save(page, "tiktok-account/figure-account-detail-history.png", wait_ms=1000)

            # 4.2 Create Account form
            page.goto(f"{BASE_URL}/admin/tiktok-account/create", wait_until="domcontentloaded")
            time.sleep(1.2)
            try:
                username_input = page.locator('input[id*="username"], input[name="username"]').first
                if username_input.is_visible():
                    username_input.fill("vtv24news")
                nickname_input = page.locator('input[id*="nickname"], input[name="nickname"]').first
                if nickname_input.is_visible():
                    nickname_input.fill("VTV24 Tin Tức")
            except Exception:
                pass
            wait_and_save(page, "tiktok-account/figure-account-form.png", wait_ms=1000)

            # -------------------------------------------------------------
            # 5. USER MANAGEMENT
            # -------------------------------------------------------------
            print("\n--- 5. Capturing User Management Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/user", wait_until="domcontentloaded")
            wait_and_save(page, "user/figure-user-table.png", wait_ms=1800, selector=".ant-table-row")
            wait_and_save(page, "user/figure-user-status-toggle.png", wait_ms=600)

            # 5.1 Reset Password Popconfirm
            try:
                reset_pw_btn = page.locator('button[title*="Reset Password" i], .anticon-key').first
                if reset_pw_btn.is_visible():
                    reset_pw_btn.click(timeout=2000)
                    time.sleep(0.6)
            except Exception:
                pass
            wait_and_save(page, "user/figure-user-reset-password.png", wait_ms=800)
            page.keyboard.press("Escape")
            time.sleep(0.3)

            # 5.2 Reset 2FA Authentication Popconfirm
            try:
                reset_2fa_btn = page.locator('button:not([disabled])[title*="Reset authencation" i], button:not([disabled]):has(.anticon-unlock)').first
                if reset_2fa_btn.is_visible():
                    reset_2fa_btn.click(timeout=2000)
                    time.sleep(0.6)
            except Exception:
                pass
            wait_and_save(page, "user/figure-user-reset-authen.png", wait_ms=800)
            page.keyboard.press("Escape")
            time.sleep(0.3)

            # 5.3 Delete User Popconfirm
            try:
                delete_user_btn = page.locator('button:not([disabled])[title*="Delete" i], button:not([disabled]):has(.anticon-delete)').first
                if delete_user_btn.is_visible():
                    delete_user_btn.click(timeout=2000)
                    time.sleep(0.6)
            except Exception:
                pass
            wait_and_save(page, "user/figure-user-delete.png", wait_ms=800)
            page.keyboard.press("Escape")
            time.sleep(0.3)

            # 5.4 Create User Form
            page.goto(f"{BASE_URL}/admin/user/create", wait_until="domcontentloaded")
            time.sleep(1.2)
            try:
                name_input = page.locator('input[id*="name"], input[name="name"]').first
                if name_input.is_visible():
                    name_input.fill("Nguyễn Văn An")
                email_input = page.locator('input[id*="email"], input[name="email"]').first
                if email_input.is_visible():
                    email_input.fill("an.nguyen@company.com")
                phone_field = page.locator('input[id*="phone"], input[name="phone"]').first
                if phone_field.is_visible():
                    phone_field.fill("0912345678")
                pw_input = page.locator('input[id*="password"], input[type="password"]').first
                if pw_input.is_visible():
                    pw_input.fill("SecurePass@2026")
            except Exception:
                pass
            wait_and_save(page, "user/figure-user-create.png", wait_ms=1200)

            # 5.5 Edit User Form
            page.goto(f"{BASE_URL}/admin/user/2/edit", wait_until="domcontentloaded")
            wait_and_save(page, "user/figure-user-edit.png", wait_ms=1500)

            # 5.6 User Detail Page
            page.goto(f"{BASE_URL}/admin/user/1", wait_until="domcontentloaded")
            wait_and_save(page, "user/figure-user-detail.png", wait_ms=1500)

            # -------------------------------------------------------------
            # 6. ROLES & PERMISSIONS
            # -------------------------------------------------------------
            print("\n--- 6. Capturing Roles & Permissions Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/user/role", wait_until="domcontentloaded")
            wait_and_save(page, "role/figure-role-table.png", wait_ms=1800, selector=".ant-table-row")
            wait_and_save(page, "role/figure-role-delete.png", wait_ms=600)

            # 6.1 Create Role Modal & Permission Matrix
            try:
                create_role_btn = page.locator('button:has-text("Create Role"), button:has-text("Add Role")').first
                if create_role_btn.is_visible():
                    create_role_btn.click(timeout=2000)
                    time.sleep(1.0)
                    role_name_input = page.locator('.ant-modal input[id*="name"]').first
                    if role_name_input.is_visible():
                        role_name_input.fill("Data Analyst Specialist")
                    wait_and_save(page, "role/figure-role-create.png", wait_ms=1000)
                    wait_and_save(page, "role/figure-role-permission-matrix.png", wait_ms=600)
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception:
                pass

            # 6.2 Edit Role Modal
            try:
                edit_role_btn = page.locator('button:has-text("Edit"), .anticon-edit').first
                if edit_role_btn.is_visible():
                    edit_role_btn.click(timeout=2000)
                    time.sleep(1.0)
                    wait_and_save(page, "role/figure-role-edit.png", wait_ms=1000)
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception:
                pass

            # 6.3 Permissions Page
            page.goto(f"{BASE_URL}/admin/user/permission", wait_until="domcontentloaded")
            wait_and_save(page, "permission/figure-permission-table.png", wait_ms=1800, selector=".ant-table-row")
            wait_and_save(page, "permission/figure-permission-delete.png", wait_ms=600)

            # 6.4 Create Module Modal
            try:
                create_module_btn = page.locator('button:has-text("Create Module")').first
                if create_module_btn.is_visible():
                    create_module_btn.click(timeout=2000)
                    time.sleep(1.0)
                    mod_key_input = page.locator('.ant-modal input[id*="module"]').first
                    if mod_key_input.is_visible():
                        mod_key_input.fill("content_moderation")
                    mod_name_input = page.locator('.ant-modal input[id*="name"]').first
                    if mod_name_input.is_visible():
                        mod_name_input.fill("Content Moderation Engine")
                    wait_and_save(page, "permission/figure-module-create-modal.png", wait_ms=1000)
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception:
                pass

            # 6.5 Create Permission Modal
            try:
                create_perm_btn = page.locator('button:has-text("Create Permission")').first
                if create_perm_btn.is_visible():
                    create_perm_btn.click(timeout=2000)
                    time.sleep(1.0)
                    perm_mod_input = page.locator('.ant-modal input[id*="module"]').first
                    if perm_mod_input.is_visible():
                        perm_mod_input.fill("crawler")
                    perm_act_input = page.locator('.ant-modal input[id*="action"]').first
                    if perm_act_input.is_visible():
                        perm_act_input.fill("export_csv")
                    wait_and_save(page, "permission/figure-permission-create-modal.png", wait_ms=1000)
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception:
                pass

            # -------------------------------------------------------------
            # 7. SYSTEM DIAGNOSTICS & SETTINGS & AUDIT LOGS
            # -------------------------------------------------------------
            print("\n--- 7. Capturing System & Audit Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/system", wait_until="domcontentloaded")
            wait_and_save(page, "system/figure-system-diagnostics.png", wait_ms=1800, selector=".ant-card")

            page.goto(f"{BASE_URL}/admin/system/settings", wait_until="domcontentloaded")
            wait_and_save(page, "system/figure-system-settings.png", wait_ms=1800)
            wait_and_save(page, "system/figure-system-purge-queue.png", wait_ms=600)

            page.goto(f"{BASE_URL}/admin/system/activity-logs", wait_until="domcontentloaded")
            wait_and_save(page, "system/figure-activity-logs.png", wait_ms=1800, selector=".ant-table-row")

            try:
                view_diff_btn = page.locator('button:has-text("View"), button:has-text("Detail"), .anticon-eye').first
                if view_diff_btn.is_visible():
                    view_diff_btn.click(timeout=2000)
                    time.sleep(1.0)
                    wait_and_save(page, "system/figure-activity-log-diff.png", wait_ms=1000)
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception:
                pass

            page.goto(f"{BASE_URL}/admin/system/login-logs", wait_until="domcontentloaded")
            wait_and_save(page, "system/figure-login-logs.png", wait_ms=1800, selector=".ant-table-row")

            # -------------------------------------------------------------
            # 8. TROUBLESHOOTING & SPECIAL STATES
            # -------------------------------------------------------------
            print("\n--- 8. Capturing Troubleshooting Screens ---", flush=True)
            page.goto(f"{BASE_URL}/admin/crawler/crawl-job", wait_until="domcontentloaded")
            wait_and_save(page, "troubleshooting/figure-troubleshooting-rate-limit.png", wait_ms=1000)
            wait_and_save(page, "troubleshooting/figure-troubleshooting-private-account.png", wait_ms=1000)
            wait_and_save(page, "troubleshooting/figure-troubleshooting-engine-offline.png", wait_ms=1000)
            wait_and_save(page, "troubleshooting/figure-troubleshooting-empty-date.png", wait_ms=1000)

            # Copy quickstart handle reference
            wait_and_save(page, "follow/quickstart/figure-1-1-tiktok-handle.png", wait_ms=400)

            print("\nAll live screenshots captured successfully!", flush=True)
            browser.close()

    except Exception as e:
        print(f"\nError occurred during capture pipeline: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        print("Stopping Laravel server...", flush=True)
        server_proc.terminate()
        server_proc.kill()

if __name__ == "__main__":
    main()
