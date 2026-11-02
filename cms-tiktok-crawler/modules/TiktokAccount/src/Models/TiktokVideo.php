<?php

namespace Modules\TiktokAccount\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Crawler\Models\CrawlVideoResult;
use Modules\System\Traits\LogsActivity;

#[Fillable([
    'tiktok_account_id',
    'video_id',
    'username',
    'video_url',
    'description',
    'hashtags',
    'duration',
    'width',
    'height',
    'definition',
    'cover_url',
    'dynamic_cover_url',
    'music_id',
    'music_title',
    'music_author',
    'is_original_sound',
    'is_pinned',
    'is_ad',
    'play_count',
    'digg_count',
    'comment_count',
    'share_count',
    'collect_count',
    'status',
    'published_at',
    'crawled_at',
    'last_crawled_at',
])]
class TiktokVideo extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public string $activityModule = 'TIKTOK';
    public string $activityRecordType = 'TikTokVideo';
    public string $activityIdentifierField = 'video_id';

    protected function casts(): array
    {
        return [
            'hashtags' => 'array',
            'is_original_sound' => 'boolean',
            'is_pinned' => 'boolean',
            'is_ad' => 'boolean',
            'duration' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'play_count' => 'integer',
            'digg_count' => 'integer',
            'comment_count' => 'integer',
            'share_count' => 'integer',
            'collect_count' => 'integer',
        ];
    }

    /**
     * Relationship to TiktokAccount.
     */
    public function tiktokAccount(): BelongsTo
    {
        return $this->belongsTo(TiktokAccount::class, 'tiktok_account_id');
    }

    /**
     * Relationship to CrawlVideoResults (snapshot history across jobs).
     */
    public function videoResults(): HasMany
    {
        return $this->hasMany(CrawlVideoResult::class, 'tiktok_video_id');
    }
}
