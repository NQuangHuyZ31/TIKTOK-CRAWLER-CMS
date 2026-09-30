<?php

namespace Modules\Crawler\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

#[Fillable(['crawl_job_id', 'tiktok_account_id', 'username', 'followers_count',
	'following_count', 'likes_count', 'profile_url', 'error_message', 'crawled_at'])]
#[Hidden([''])]
class CrawlResult extends Model {

	use HasFactory, Notifiable;

	public function crawlJob() {
		return $this->belongsTo(CrawlJob::class, 'crawl_job_id');
	}
}

