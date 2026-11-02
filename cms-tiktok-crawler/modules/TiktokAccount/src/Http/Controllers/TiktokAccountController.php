<?php

namespace Modules\TiktokAccount\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Http\Requests\StoreTiktokAccountRequest;
use Modules\TiktokAccount\Http\Requests\UpdateTiktokAccountRequest;
use Modules\TiktokAccount\Resources\TiktokAccountResource;
use Modules\TiktokAccount\Resources\TiktokVideoResource;
use Modules\TiktokAccount\Services\TiktokAccountService;

class TiktokAccountController extends BaseController
{
    protected string $modelClass = TiktokAccount::class;
    protected ?string $resourceClass = TiktokAccountResource::class;
    protected array $searchableColumns = ['username', 'nickname', 'bio'];
    protected array $filterableColumns = [
        'status',
        'crawled_at',
        'followers_count',
        'following_count',
        'likes_count',
        'followers',
        'following',
        'likes',
        'is_verified',
    ];
    protected array $filterRelationMap = [
        'followers' => 'followers_count',
        'following' => 'following_count',
        'likes' => 'likes_count',
    ];
    protected array $sortableColumns = [
        'id',
        'username',
        'nickname',
        'followers_count',
        'following_count',
        'likes_count',
        'video_count',
        'crawled_at',
        'created_at',
        'updated_at',
    ];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected TiktokAccountService $tiktokAccountService
    ) {
    }

    /**
     * Create a new TikTok account with validation and optional avatar handling.
     * api: POST /tiktok-account/tiktok-account
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(StoreTiktokAccountRequest::class)->validated();

        try {
            $account = $this->tiktokAccountService->create($validated);
            return $this->respondSuccess(new TiktokAccountResource($account), 'Account created successfully.', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * Update existing account profile with avatar handling.
     * api: PUT /tiktok-account/tiktok-account/{id}
     * api: POST /tiktok-account/tiktok-account/{id}
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $validated = app(UpdateTiktokAccountRequest::class)->validated();

        try {
            $account = $this->tiktokAccountService->update((int) $id, $validated);
            return $this->respondSuccess(new TiktokAccountResource($account), 'Account updated successfully.');
        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * Update account status (active/inactive/banned).
     * api: PATCH /tiktok-account/tiktok-account/{id}/status
     * api: POST /tiktok-account/tiktok-account/{id}/status
     */
    public function status(Request $request, int|string $id): JsonResponse
    {
        $status = $request->input('status');
        if (empty($status)) {
            return $this->respondError('Status is required.', 422);
        }

        try {
            $account = $this->tiktokAccountService->updateStatus((int) $id, $status);
            if (!$account) {
                return $this->respondError('Account not found.', 404);
            }
            return $this->respondSuccess(new TiktokAccountResource($account), 'Account status updated successfully.');
        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * Retrieve paginated crawl history results for an account.
     * api: GET /tiktok-account/tiktok-account/{id}/results
     */
    public function results(int|string $id, Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('per_page', 10));
        $results = $this->tiktokAccountService->getCrawlResults((int) $id, $perPage, $request->all());

        if ($results === false || $results === null) {
            return $this->respondError('Invalid account ID or account does not exist.', 404);
        }

        return $this->respondPaginated($this->transform($results), 'Crawl results retrieved successfully.');
    }

    /**
     * Retrieve paginated TikTok videos for an account.
     * api: GET /tiktok-account/tiktok-account/{id}/videos
     */
    public function videos(int|string $id, Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $videos = $this->tiktokAccountService->getVideos((int) $id, $perPage, $request->all());
        if ($videos === null) {
            return $this->respondError('Invalid account ID or account does not exist.', 404);
        }

        $videos->through(fn($item) => new TiktokVideoResource($item));

        return $this->respondPaginated($videos, 'Account videos retrieved successfully.');
    }

    /**
     * Aggregate statistics summary for TikTok account metrics.
     * api: GET /tiktok-account/tiktok-account/statistic-summary
     */
    public function statisticSummary(): JsonResponse
    {
        return $this->respondSuccess($this->tiktokAccountService->getStatisticSummary(), 'Statistic summary retrieved successfully.');
    }
}
