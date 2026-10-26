<?php

namespace Modules\API\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Modules\API\Http\Requests\CrawlerResultStoreRequest;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlerResultController extends Controller
{
    public function __construct(
        private readonly CrawlJobRepositoryInterface $crawlJobRepository,
        private readonly CrawlResultRepositoryInterface $crawlResultRepository,
        private readonly TiktokAccountRepositoryInterface $tiktokAccountRepository,
    ) {
    }

    public function saveResult(
        CrawlerResultStoreRequest $request,
        int $jobId
    ): JsonResponse {
        $data = $request->validated();

        if ((int) $data['job_id'] !== $jobId) {
            return response()->json([
                'message' => 'The route job_id does not match the payload job_id.',
            ], 422);
        }

        return DB::transaction(function () use ($data, $jobId) {
            if ($data['event'] === 'account') {
                return $this->storeAccountResult($data, $jobId);
            }

            return $this->completeJob($data, $jobId);
        });
    }

    private function storeAccountResult(array $data, int $jobId): JsonResponse
    {
        $accountData = $data['account'] ?? [];
        $isSuccess = $data['status'] === 'success';
        $username = $isSuccess
            ? $accountData['username']
            : $data['username'];

        $currentAccount = $this->tiktokAccountRepository->getAccountByField('username', $username);

        // Save account data to tiktok_accounts table
        $saveAccountData = [
                    'followers_count' => $accountData['followers'] ?? 0,
                    'following_count' => $accountData['following'] ?? 0,
                    'likes_count' => $accountData['likes'] ?? 0,
                    'profile_url' => $accountData['profile_url'] ?? null,
                    'avatar_url' => $accountData['avatar_url'] ?? null,
                    'avatar_path' => $accountData['avatar_path'] ?? null,
                    'status' => $accountData['status'] ?? 'active',
                    'last_crawled_at' => $accountData['last_crawled_at'] ?? now(),
        ];

        // Update the crawl job's crawled_at timestamp if it hasn't been set yet.
        if (empty($currentAccount->crawled_at)) {
            $saveAccountData['crawled_at'] = $accountData['crawled_at'] ?? now();
        }

        $account = null;
        if ($isSuccess) {
            $account = $this->tiktokAccountRepository->updateOrCreateAccount(
                ['username' => $username], $saveAccountData
            );
        }

        $result = $this->crawlResultRepository->create([
            'crawl_job_id' => $jobId,
            'tiktok_account_id' => $account?->id,
            'username' => $username,
            'followers_count' => $accountData['followers'] ?? 0,
            'following_count' => $accountData['following'] ?? 0,
            'likes_count' => $accountData['likes'] ?? 0,
            'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
            'avatar_url' => $accountData['avatar_url'] ?? null,
            'avatar_path' => $accountData['avatar_path'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'crawled_at' => $accountData['crawled_at'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Crawler result stored successfully.',
            'result_id' => $result->id,
            'tiktok_account_id' => $account?->id,
            'data' => [
                'event' => 'account',
                'job_id' => $jobId,
                'status' => $result->status,
                'account' => $account?->toArray(),
                'result' => $result->toArray(),
            ],
        ], 201);
    }

    private function completeJob(array $data, int $jobId): JsonResponse
    {
        $job = $this->crawlJobRepository->update($jobId, [
            'status' => $data['status'],
            'finished_at' => now(),
            'total_accounts' => $data['total_accounts'],
            'success_count' => $data['success_count'],
            'failed_count' => $data['failed_count'],
            'error_message' => $data['error_message'] ?? null,
        ]);

        return response()->json([
            'message' => 'Crawl job updated successfully.',
            'job_id' => $job->id,
            'status' => $job->status,
            'data' => $job->toArray(),
        ]);
    }
}