<?php

namespace Modules\System\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\System\Models\SystemSetting;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General
            [
                'key' => 'site_name',
                'group' => 'general',
                'value' => 'TikTok Crawler CMS',
                'type' => 'string',
                'description' => 'The brand name of the crawler CMS application.',
                'is_public' => true,
            ],
            [
                'key' => 'site_description',
                'group' => 'general',
                'value' => 'High-performance automated TikTok data extraction and profile monitoring platform.',
                'type' => 'textarea',
                'description' => 'Meta description and subtitle displayed on admin headers.',
                'is_public' => true,
            ],
            [
                'key' => 'contact_email',
                'group' => 'general',
                'value' => 'admin@urekamedia.com',
                'type' => 'string',
                'description' => 'Primary system administrative contact email.',
                'is_public' => false,
            ],
            [
                'key' => 'timezone',
                'group' => 'general',
                'value' => 'Asia/Ho_Chi_Minh',
                'type' => 'string',
                'description' => 'Default system display timezone for timestamps.',
                'is_public' => true,
            ],
            [
                'key' => 'maintenance_mode',
                'group' => 'general',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Put the platform into maintenance mode for non-admin users.',
                'is_public' => false,
            ],

            // Crawler Settings
            [
                'key' => 'crawler_api_url',
                'group' => 'crawler',
                'value' => 'http://127.0.0.1:8000/api/crawler',
                'type' => 'string',
                'description' => 'Backend endpoint URL for the Python/Scrapy worker cluster.',
                'is_public' => false,
            ],
            [
                'key' => 'default_concurrency',
                'group' => 'crawler',
                'value' => '5',
                'type' => 'number',
                'description' => 'Default number of parallel accounts crawled concurrently.',
                'is_public' => false,
            ],
            [
                'key' => 'request_timeout_seconds',
                'group' => 'crawler',
                'value' => '30',
                'type' => 'number',
                'description' => 'Maximum timeout in seconds for scraper requests.',
                'is_public' => false,
            ],
            [
                'key' => 'retry_attempts',
                'group' => 'crawler',
                'value' => '3',
                'type' => 'number',
                'description' => 'Number of automatic retries before marking an account crawl as failed.',
                'is_public' => false,
            ],
            [
                'key' => 'max_videos_per_account',
                'group' => 'crawler',
                'value' => '50',
                'type' => 'number',
                'description' => 'Default cap of videos to scrape per account run.',
                'is_public' => false,
            ],
            [
                'key' => 'default_proxy',
                'group' => 'crawler',
                'value' => '',
                'type' => 'string',
                'description' => 'Default residential proxy URL (e.g. http://user:pass@proxy.example:8080).',
                'is_public' => false,
            ],

            // Security Settings
            [
                'key' => 'session_lifetime',
                'group' => 'security',
                'value' => '120',
                'type' => 'number',
                'description' => 'Admin session expiration lifetime in minutes.',
                'is_public' => false,
            ],
            [
                'key' => 'max_login_attempts',
                'group' => 'security',
                'value' => '5',
                'type' => 'number',
                'description' => 'Maximum consecutive failed login attempts before rate limiting.',
                'is_public' => false,
            ],
            [
                'key' => 'allow_registration',
                'group' => 'security',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Allow new users to register through public endpoints.',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
