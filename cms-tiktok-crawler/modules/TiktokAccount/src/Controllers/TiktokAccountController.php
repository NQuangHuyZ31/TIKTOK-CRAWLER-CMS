<?php

namespace Modules\TiktokAccount\Controllers;

use Illuminate\Http\Request;
use Modules\Core\Controllers\CoreController;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Resources\TiktokAccountResource;
use Modules\TiktokAccount\Services\TiktokAccountService;

class TiktokAccountController extends CoreController
{
    protected string $modelClass = TiktokAccount::class;
    protected string $resourceClass = TiktokAccountResource::class;
    protected array $searchableColumns = ['username', 'nickname', 'bio'];
    protected array $filterableColumns = ['status'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected TiktokAccountService $tiktokAccountService
    ) {
    }

    /**
     * REST Action: update (PUT/PATCH /{module}/tiktok-account/{id})
     * Complex business logic: avatar file upload, old file cleanup, status validation.
     * Delegated to Service.
     */
    public function update(Request $request, $id)
    {
        try {
            $account = $this->tiktokAccountService->update((int) $id, $request->all());
            return $this->respondSuccess(new TiktokAccountResource($account), 'Account updated successfully.');
        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * Action: status / updateStatus (PATCH/POST /{module}/tiktok-account/{id}/status)
     * Delegated to Service for status validation and business update.
     */
    public function status(Request $request, $id)
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
        }
    }

    public function updateStatus(Request $request, $id)
    {
        return $this->status($request, $id);
    }

    /**
     * Action: results (GET /{module}/tiktok-account/{id}/results)
     * Simple data retrieval: directly calls repository.
     */
    public function results(int $id, Request $request)
    {
        $perPage = (int) ($request->input('per_page', 10));
        $results = $this->tiktokAccountRepository->getCrawlResults($id, $perPage, $request->all());

        if ($results === false) {
            return $this->respondError('Invalid account ID or account does not exist.', 404);
        }

        return CrawlResultResource::collection($results);
    }

    /**
     * Action: statisticSummary / getStatisticSummary (GET /{module}/tiktok-account/statistic-summary)
     * Simple aggregation: directly calls repository.
     */
    public function statisticSummary()
    {
        return response()->json($this->tiktokAccountRepository->getStatisticSummary());
    }
}
