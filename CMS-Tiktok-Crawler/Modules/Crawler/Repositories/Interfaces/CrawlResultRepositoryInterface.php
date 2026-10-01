<?php

namespace Modules\Crawler\Repositories\Interfaces;

interface CrawlResultRepositoryInterface {

	public function getCrawlResultsByJobId(int $jobId);
}