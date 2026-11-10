<?php

namespace Modules\Crawler\Models;

use Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Modules\System\Traits\LogsActivity;

#[Fillable([
    'code',
    'name',
    'source_type',
    'crawl_mode',
    'max_videos_per_account',
    'target_date',
    'date_from',
    'date_to',
    'status',
    'data_crawls',
    'total_accounts',
    'success_count',
    'failed_count',
    'total_videos_crawled',
    'resume_count',
    'error_message',
    'queued_at',
    'worker_id',
    'started_at',
    'finished_at',
    'created_by',
    'started_by',
])]
class CrawlJob extends Model
{
    use HasFactory, Notifiable, SoftDeletes, LogsActivity;
    public string $activityModule = 'CRAWLER';
    public string $activityRecordType = 'CRAWL_JOB';
    public string $activityIdentifierField = 'id';

    /**
     * Relationship to CrawlResults.
     */
    public function results(): HasMany
    {
        return $this->hasMany(CrawlResult::class, 'crawl_job_id');
    }

    /**
     * Relationship to CrawlVideoResults.
     */
    public function videoResults(): HasMany
    {
        return $this->hasMany(CrawlVideoResult::class, 'crawl_job_id');
    }

    /**
     * Relationship to user creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relationship to user who started/retried the job.
     */
    public function starter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }
}
