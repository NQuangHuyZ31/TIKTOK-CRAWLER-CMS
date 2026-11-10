<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Tests\TestCase;

class GuidelineModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guideline_homepage_returns_view(): void
    {
        $response = $this->get('/guideline');

        $response->assertStatus(200);
        $response->assertViewIs('core::app');
        $response->assertViewHas('module', 'Guideline');
    }

    public function test_guideline_learn_subroutes_return_view(): void
    {
        $slugs = [
            'system-overview',
            'core-concepts',
            'crawler-module-architecture',
            'tiktok-account-architecture',
            'user-management-architecture',
            'roles-permissions-architecture',
            'system-diagnostics-architecture',
        ];

        foreach ($slugs as $slug) {
            $response = $this->get("/guideline/learn/{$slug}");
            $response->assertStatus(200);
            $response->assertViewIs('core::app');
            $response->assertViewHas('module', 'Guideline');
        }
    }

    public function test_guideline_follow_subroutes_return_view(): void
    {
        $slugs = [
            'quickstart',
            'auth-security-sop',
            'dashboard-sop',
            'crawler-operations-sop',
            'tiktok-account-sop',
            'user-management-sop',
            'roles-permissions-sop',
            'system-diagnostics-sop',
        ];

        foreach ($slugs as $slug) {
            $response = $this->get("/guideline/follow/{$slug}");
            $response->assertStatus(200);
            $response->assertViewIs('core::app');
            $response->assertViewHas('module', 'Guideline');
        }
    }

    public function test_authenticated_user_can_access_guideline_page(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/guideline');

        $response->assertStatus(200);
        $response->assertViewIs('core::app');
        $response->assertViewHas('module', 'Guideline');
    }

    public function test_guideline_illustration_images_exist_on_disk(): void
    {
        $requiredImages = [
            'dashboard/figure-dashboard-overview.png',
            'dashboard/figure-dashboard-kpis.png',
            'dashboard/figure-dashboard-engine-health.png',
            'dashboard/figure-dashboard-recent-activities.png',
            'crawler/figure-crawl-job-create.png',
            'crawler/figure-crawl-job-date-filter.png',
            'crawler/figure-crawl-job-source-types.png',
            'crawler/figure-crawl-job-modes.png',
            'crawler/figure-crawl-job-start-confirm.png',
            'crawler/figure-crawl-job-detail-summary.png',
            'crawler/figure-crawl-job-results.png',
            'crawler/figure-crawl-job-stop-confirm.png',
            'crawler/figure-crawl-job-retry.png',
            'tiktok-account/figure-account-list.png',
            'tiktok-account/figure-account-detail-overview.png',
            'tiktok-account/figure-account-detail-videos.png',
            'tiktok-account/figure-account-quick-recrawl.png',
            'tiktok-account/figure-account-export.png',
            'user/figure-user-table.png',
            'user/figure-user-create.png',
            'user/figure-user-edit.png',
            'user/figure-user-delete.png',
            'role/figure-role-table.png',
            'role/figure-role-permission-matrix.png',
            'role/figure-role-create.png',
            'system/figure-system-diagnostics.png',
            'system/figure-system-settings.png',
            'system/figure-activity-logs.png',
            'system/figure-login-logs.png',
            'troubleshooting/figure-troubleshooting-rate-limit.png',
            'troubleshooting/figure-troubleshooting-private-account.png',
            'troubleshooting/figure-troubleshooting-engine-offline.png',
            'troubleshooting/figure-troubleshooting-empty-date.png',
        ];

        foreach ($requiredImages as $relPath) {
            $fullPath = public_path('images/guideline/' . $relPath);
            $this->assertFileExists($fullPath, "Missing guideline image: {$relPath}");
        }
    }
}
