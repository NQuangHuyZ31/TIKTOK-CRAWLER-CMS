<?php

namespace Modules\Crawler\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

#[Fillable(['started_at', 'finished_at', 'status', 'source_type', 'data_crawls', 'total_accounts', 'success_count', 'failed_count', 'error_message'])]
#[Hidden([''])]
class CrawlJob extends Model {

	use HasFactory, Notifiable, SoftDeletes;

	public function results() {
		return $this->hasMany(CrawlResult::class, 'crawl_job_id');
	}
}
