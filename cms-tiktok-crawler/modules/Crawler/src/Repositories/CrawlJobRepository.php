<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

class CrawlJobRepository extends BaseRepository implements CrawlJobRepositoryInterface {

    protected function getModel(): Model {
        return new CrawlJob();
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
}
