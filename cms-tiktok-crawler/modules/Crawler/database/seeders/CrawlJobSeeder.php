<?php

namespace Modules\Crawler\Database\Seeders;

use Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\TiktokAccount\Models\TiktokAccount;

class CrawlJobSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::where('email', 'admin@cms.com')->first();
        $tiktokAccount = TiktokAccount::where('username', 'tiktok')->first();
        $khabyAccount = TiktokAccount::where('username', 'khaby.lame')->first();

        // 1. Completed Crawl Job
        $job1 = CrawlJob::updateOrCreate(
            ['code' => 'JOB-20261021-001'],
            [
                'name' => 'Top Popular TikTok Accounts Crawl',
                'source_type' => 'usernames',
                'status' => 'completed',
                'data_crawls' => json_encode(['tiktok', 'khaby.lame']),
                'total_accounts' => 2,
                'success_count' => 2,
                'failed_count' => 0,
                'started_at' => now()->subHours(2),
                'finished_at' => now()->subHours(1),
                'created_by' => $adminUser?->id,
            ]
        );

        // Results for Job 1
        CrawlResult::updateOrCreate(
            ['crawl_job_id' => $job1->id, 'username' => 'tiktok'],
            [
                'tiktok_account_id' => $tiktokAccount?->id,
                'nickname' => 'TikTok Official',
                'avatar_url' => 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/tiktok_official.jpeg',
                'profile_url' => 'https://www.tiktok.com/@tiktok',
                'followers_count' => 78500000,
                'following_count' => 520,
                'likes_count' => 312000000,
                'status' => 'success',
                'crawled_at' => now()->subHours(1)->subMinutes(50),
            ]
        );

        CrawlResult::updateOrCreate(
            ['crawl_job_id' => $job1->id, 'username' => 'khaby.lame'],
            [
                'tiktok_account_id' => $khabyAccount?->id,
                'nickname' => 'Khabane lame',
                'avatar_url' => 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/khaby_lame.jpeg',
                'profile_url' => 'https://www.tiktok.com/@khaby.lame',
                'followers_count' => 162000000,
                'following_count' => 75,
                'likes_count' => 2400000000,
                'status' => 'success',
                'crawled_at' => now()->subHours(1)->subMinutes(40),
            ]
        );

        // 2. Pending Crawl Job
        CrawlJob::updateOrCreate(
            ['code' => 'JOB-20261021-002'],
            [
                'name' => 'Agency Brands TikTok Crawl',
                'source_type' => 'usernames',
                'status' => 'pending',
                'data_crawls' => json_encode(['urekamedia']),
                'total_accounts' => 1,
                'success_count' => 0,
                'failed_count' => 0,
                'created_by' => $adminUser?->id,
            ]
        );
    }
}
