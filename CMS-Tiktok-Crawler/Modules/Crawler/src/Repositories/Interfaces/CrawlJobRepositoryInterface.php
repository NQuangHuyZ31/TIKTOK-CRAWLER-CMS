<?php

namespace Modules\Crawler\Repositories\Interfaces;

interface CrawlJobRepositoryInterface {
	public function getStatisticsSummary();
	public function getResults(int $id);
}
