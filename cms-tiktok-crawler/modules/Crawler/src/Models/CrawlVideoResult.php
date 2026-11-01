<?php

namespace Modules\Crawler\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\System\Traits\LogsActivity;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Models\TiktokVideo;

#[Fillable([
    'crawl_job_id',
    'crawl_result_id',
    'tiktok_account_id',
    'tiktok_video_id',
    'video_id',
    'username',
    'video_url',
    'description',
    'hashtags',
    'cover_url',
    'duration',
    'play_count',
    'digg_count',
    'comment_count',
    'share_count',
    'collect_count',
    'play_count_delta',
    'digg_count_delta',
    'comment_count_delta',
    'share_count_delta',
    'collect_count_delta',
    'published_at',
    'status',
    'error_code',
    'error_message',
    'crawled_at',
])]
class CrawlVideoResult extends Model
{
    use HasFactory, LogsActivity;

    public string $activityModule = 'CRAWLER';
    public string $activityRecordType = 'CRAWL_VIDEO_RESULT';
    public string $activityIdentifierField = 'video_id';

    protected function casts(): array
    {
        return [
            'hashtags' => 'array',
            'duration' => 'integer',
            'play_count' => 'integer',
            'digg_count' => 'integer',
            'comment_count' => 'integer',
            'share_count' => 'integer',
            'collect_count' => 'integer',
            'play_count_delta' => 'integer',
            'digg_count_delta' => 'integer',
            'comment_count_delta' => 'integer',
            'share_count_delta' => 'integer',
            'collect_count_delta' => 'integer',
        ];
    }

    public function crawlJob(): BelongsTo
    {
        return $this->belongsTo(CrawlJob::class, 'crawl_job_id');
    }

    public function crawlResult(): BelongsTo
    {
        return $this->belongsTo(CrawlResult::class, 'crawl_result_id');
    }

    public function tiktokAccount(): BelongsTo
    {
        return $this->belongsTo(TiktokAccount::class, 'tiktok_account_id');
    }

    public function tiktokVideo(): BelongsTo
    {
        return $this->belongsTo(TiktokVideo::class, 'tiktok_video_id');
    }
}
