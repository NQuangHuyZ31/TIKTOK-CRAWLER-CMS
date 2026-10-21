<?php

namespace Modules\TiktokAccount\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Crawler\Models\CrawlResult;

#[Fillable([
    'username',
    'sec_uid',
    'nickname',
    'avatar_url',
    'avatar_path',
    'profile_url',
    'bio',
    'followers_count',
    'following_count',
    'likes_count',
    'video_count',
    'is_verified',
    'status',
    'crawled_at',
    'last_crawled_at',
])]
class TiktokAccount extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Relationship to CrawlResults.
     */
    public function crawlResults(): HasMany
    {
        return $this->hasMany(CrawlResult::class, 'tiktok_account_id');
    }
}
