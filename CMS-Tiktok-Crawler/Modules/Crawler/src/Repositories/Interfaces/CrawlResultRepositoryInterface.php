<?php

namespace Modules\Crawler\Repositories\Interfaces;

interface CrawlResultRepositoryInterface {

	public function getCrawlResultsByJobId(int $jobId, $per_page, array $params = []);
	public function createCrawlResult(array $data);
}