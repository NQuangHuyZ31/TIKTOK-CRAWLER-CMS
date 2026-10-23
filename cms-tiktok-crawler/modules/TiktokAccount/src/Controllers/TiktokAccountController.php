<?php

namespace Modules\TiktokAccount\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Controllers\BaseController;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Requests\StoreTiktokAccountRequest;
use Modules\TiktokAccount\Requests\UpdateTiktokAccountRequest;
use Modules\TiktokAccount\Resources\TiktokAccountResource;
use Modules\TiktokAccount\Services\TiktokAccountService;

class TiktokAccountController extends BaseController
{
    protected string $modelClass = TiktokAccount::class;
    protected ?string $resourceClass = TiktokAccountResource::class;
    protected array $searchableColumns = ['username', 'nickname', 'bio'];
    protected array $filterableColumns = ['status'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
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
    public function results(int|string $id, Request $request):JsonResponse
    {
        $perPage = (int) ($request->input('per_page', 10));
        $results = $this->tiktokAccountRepository->getCrawlResults((int) $id, $perPage, $request->all());

        if ($results === false) {
            return $this->respondError('Invalid account ID or account does not exist.', 404);
        }

        return $this->respondPaginated($this->transform($results), 'Crawl results retrieved successfully.');
    }

    /**
     * Aggregate statistics summary for TikTok account metrics.
     * api: GET /tiktok-account/tiktok-account/statistic-summary
     */
    public function statisticSummary(): JsonResponse
    {
        return $this->respondSuccess($this->tiktokAccountRepository->getStatisticSummary(), 'Statistic summary retrieved successfully.');
    }
}
