<?php

namespace Modules\Crawler\Repositories;

use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

class CrawlResultRepository implements CrawlResultRepositoryInterface {

	public function getCrawlResultsByJobId(int $jobId, $per_page = 5, array $params = []) {
		// You can add filtering logic based on $params if needed
		$query = CrawlResult::where('crawl_job_id', $jobId);
		
		if (isset($params['username'])) {
			$query->where('username', 'like', '%' . $params['username'] . '%');
		}
		
		return $query->paginate($per_page);
	}

	public function createCrawlResult(array $data) {
		return CrawlResult::create($data);
	}
}