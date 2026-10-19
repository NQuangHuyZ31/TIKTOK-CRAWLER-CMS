<?php

namespace Modules\TiktokAccount\Models;

use Illuminate\Console\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Crawler\Models\CrawlResult;

#[Fillable(['username', 'followers_count', 'following_count', 'likes_count', 'profile_url', 'avatar_url', 'avatar_path', 'status', 'crawled_at', 'last_crawled_at'])]
#[Hidden([''])]

class TiktokAccount extends Model {
    use HasFactory, SoftDeletes;

	public function crawlResults() {
		return $this->hasMany(CrawlResult::class, 'tiktok_account_id');
	}
}
