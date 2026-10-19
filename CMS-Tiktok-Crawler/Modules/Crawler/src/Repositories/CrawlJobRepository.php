<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Support\Carbon;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

class CrawlJobRepository implements CrawlJobRepositoryInterface {

    public function getAll(int $per_page, array $params = []) {
        // Implementation for retrieving all crawl jobs
        $query = CrawlJob::query();

        if (isset($params['started_at'])) {
            $query->where('started_at', '>=', Carbon::parse($params['started_at'])->startOfDay());
        }

        if (isset($params['finished_at'])) {
            $query->where('finished_at', '<=', Carbon::parse($params['finished_at'])->endOfDay());
        }

        return  $query->paginate($per_page ?? 5);
    }

    public function getCrawlJobById(int $id) {
        // Implementation for retrieving a specific crawl job by ID

        return CrawlJob::find($id);
    }

    // get crawl jobs by status
    public function getCrawlJobByStatus(int $id, string $status) {
        if (empty($id)) {
            return CrawlJob::where('status', $status)->get();
        }

        return CrawlJob::where('id', $id)->where('status', $status)->get();
    }

    public function create(array $data) {
        // Implementation for creating a new crawl job

        return CrawlJob::create($data);
    }

    public function delete(int $id) {
        // Implementation for deleting a specific crawl job by ID
        $crawlJob = CrawlJob::find($id);

        if ($crawlJob) {
            return $crawlJob->delete();
        }
    }

    public function getStatisticsSummary(): array {
        return [
            'total_jobs' => CrawlJob::count(),

            'total_accounts' => CrawlJob::sum('total_accounts'),

            'total_success_accounts' => CrawlJob::sum('success_count'),

            'total_failed_accounts' => CrawlJob::sum('failed_count'),

            'total_completed_jobs' => CrawlJob::where(
                'status',
                'completed'
            )->count(),

            'total_failed_jobs' => CrawlJob::where(
                'status',
                'failed'
            )->count(),
        ];
    }

    public function getResults(int $id) {
        $crawlJob = CrawlJob::find($id);

        if (!$crawlJob) {
            return false;
        }

        return $crawlJob->results; // Assuming 'results' is a relationship defined in the CrawlJob model
    }

    public function update(int $id, array $data) {
        $crawlJob = CrawlJob::findOrFail($id);
        $crawlJob->update($data);

        return $crawlJob->refresh();
    }
}
