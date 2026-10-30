<?php

namespace Modules\Crawler\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;
use Modules\System\Traits\LogsActivity;
use Modules\TiktokAccount\Models\TiktokAccount;

#[Fillable(['crawl_job_id','tiktok_account_id','username','nickname','avatar_url','avatar_path','profile_url','followers_count','following_count',
    'likes_count',
    'video_count',
    'bio',
    'status',
    'error_code',
    'raw_data',
    'error_message',
    'crawled_at',
])]
class CrawlResult extends Model
{
    use HasFactory, Notifiable, LogsActivity;
    public string $activityModule = 'CRAWLER';
    public string $activityRecordType = 'CRAWL_RESULT';
    public string $activityIdentifierField = 'id';

    /**
     * Relationship to CrawlJob.
     */
    public function crawlJob(): BelongsTo
    {
        return $this->belongsTo(CrawlJob::class, 'crawl_job_id');
    }

    /**
     * Relationship to TiktokAccount.
     */
    public function tiktokAccount(): BelongsTo
    {
        return $this->belongsTo(TiktokAccount::class, 'tiktok_account_id');
    }
}
