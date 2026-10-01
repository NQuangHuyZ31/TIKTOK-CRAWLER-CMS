<?php

namespace Modules\Crawler\Repositories\Interfaces;

interface CrawlJobRepositoryInterface {

	public function getAllCrawlJobs();
	public function getCrawlJobById(int $id);
	public function createCrawlJob(array $data);
	public function getDashboardSummary();
}
