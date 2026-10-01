<?php

namespace Modules\Crawler\Repositories;

use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

class CrawlResultRepository implements CrawlResultRepositoryInterface {

	public function getCrawlResultsByJobId(int $jobId) {
		
		return CrawlResult::where('crawl_job_id', $jobId)->paginate(2);
	}
}