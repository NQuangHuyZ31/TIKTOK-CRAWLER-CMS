<?php

namespace Modules\Crawler\Repositories\Interfaces;

interface CrawlJobRepositoryInterface {

	public function getAll(int $per_page, array $params = []);
	public function getCrawlJobById(int $id);
	public function getStatisticsSummary();
	public function getCrawlJobByStatus(int $id, string $status);
	public function create(array $data);
	public function delete(int $id);
	public function update(int $id, array $data);
	public function getResults(int $id);
}
