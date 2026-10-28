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

#[Fillable(['code', 'name', 'source_type', 'status', 'data_crawls', 'total_accounts', 'success_count', 'failed_count', 'error_message', 'started_at', 'finished_at', 'created_by',])]

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
     * Relationship to user creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
