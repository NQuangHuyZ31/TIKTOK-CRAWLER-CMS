<?php

namespace Modules\TiktokAccount\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\TiktokAccount\Models\TiktokAccount;

class TiktokAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'username' => 'tiktok',
                'sec_uid' => 'MS4wLjABAAAA_tiktok_official',
                'nickname' => 'TikTok Official',
                'avatar_url' => null,
                'avatar_path' => 'tiktok-accounts/avatars/tiktok.jpg',
                'profile_url' => 'https://www.tiktok.com/@tiktok',
                'bio' => 'Make Your Day. The official account of TikTok.',
                'followers_count' => 78500000,
                'following_count' => 520,
                'likes_count' => 312000000,
                'video_count' => 1420,
                'is_verified' => true,
                'status' => 'active',
                'last_crawled_at' => now(),
            ],
            [
                'username' => 'khaby.lame',
                'sec_uid' => 'MS4wLjABAAAA_khaby_lame',
                'nickname' => 'Khabane lame',
                'avatar_url' => null,
                'avatar_path' => 'tiktok-accounts/avatars/khaby.lame.jpg',
                'profile_url' => 'https://www.tiktok.com/@khaby.lame',
                'bio' => 'If u wanna laugh u r in the right place! 🤣',
                'followers_count' => 162000000,
                'following_count' => 75,
                'likes_count' => 2400000000,
                'video_count' => 1250,
                'is_verified' => true,
                'status' => 'active',
                'last_crawled_at' => now(),
            ],
            [
                'username' => 'urekamedia',
                'sec_uid' => 'MS4wLjABAAAA_urekamedia',
                'nickname' => 'Ureka Media Official',
                'avatar_url' => null,
                'avatar_path' => 'tiktok-accounts/avatars/urekamedia.jpg',
                'profile_url' => 'https://www.tiktok.com/@urekamedia',
                'bio' => 'Ureka Media - Digital Marketing & Technology Solutions',
                'followers_count' => 150000,
                'following_count' => 88,
                'likes_count' => 1250000,
                'video_count' => 120,
                'is_verified' => false,
                'status' => 'active',
                'last_crawled_at' => now(),
            ],
        ];

        foreach ($accounts as $acc) {
            TiktokAccount::updateOrCreate(
                ['username' => $acc['username']],
                $acc
            );
        }
    }
}
