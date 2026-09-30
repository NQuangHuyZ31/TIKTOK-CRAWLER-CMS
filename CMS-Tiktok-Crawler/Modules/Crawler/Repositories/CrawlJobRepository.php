<?php

namespace Modules\Crawler\Repositories;

use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Models\CrawlJob;

class CrawlJobRepository implements CrawlJobRepositoryInterface {

	public function getAllCrawlJobs() {
		// Implementation for retrieving all crawl jobs

		return CrawlJob::all();
	}

	public function getCrawlJobById(int $id) {
		// Implementation for retrieving a specific crawl job by ID

		return CrawlJob::find($id);
	}

	public function getDashboardSummary() {
		// Implementation for retrieving dashboard summary data

		return [
			'total_jobs' => CrawlJob::count(),
			'total_accounts' => CrawlJob::sum('total_accounts'),
			'total_success_accounts' => CrawlJob::sum('success_count'),
			'total_failed_accounts' => CrawlJob::sum('failed_count'),
			'total_completed_jobs' => CrawlJob::where('status', 'completed')->count(),
			'total_failed_jobs' => CrawlJob::where('status', 'failed')->orWhere('status', '')->count(),
		];
	}
}