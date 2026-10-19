<?php

namespace Modules\TiktokAccount\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\TiktokAccount\Requests\UpdateTiktokAccountRequest;
use Modules\TiktokAccount\Resources\TiktokAccountResource;
use Modules\TiktokAccount\Services\TiktokAccountService;

class TiktokAccountController extends Controller {

    public function __construct(protected TiktokAccountService $tiktokAccountService) {

    }

    // get all tiktok accounts
    public function getAll(Request $request) {
        $requests = $request->all();

        return TiktokAccountResource::collection($this->tiktokAccountService->getAll($requests));
    }

    public function getDetails($id) {

        $result = $this->tiktokAccountService->getDetails($id);

        if (!$result) {
            return response()->json(['message' => 'TikTok account not found.'], Response::HTTP_NOT_FOUND);
        }

        return new TiktokAccountResource($result);
    }

    public function update(UpdateTiktokAccountRequest $request, $id) {
        $data = $request->validated();

        try {
            $account = $this->tiktokAccountService->update($id, $data);
        } catch (\InvalidArgumentException | \RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'message' => 'TikTok account updated successfully.',
            'data' => new TiktokAccountResource($account),
        ]);
    }

    public function updateStatus(Request $request, $id) {
        $status = $request->input('status');

        try {
            $account = $this->tiktokAccountService->updateStatus($id, $status);
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$account) {
            return response()->json(['message' => 'Account not found.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'message' => "Account status updated to {$status} successfully.",
            'data' => new TiktokAccountResource($account),
        ]);
    }

    public function delete($id) {
        $result = $this->tiktokAccountService->delete($id);

        if (!$result) {
            return response()->json(['message' => 'Account not found or could not be deleted.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'message' => 'TikTok account deleted successfully.',
        ]);
    }

    // Get crawl results for a specific TikTok account
	public function getResults(int $id, Request $request) {
		$params = $request->all(); // Get all query parameters
		$per_page = $params['per_page'] ?? 5; // Default to 5 if not provided

		$results = $this->tiktokAccountService->getCrawlResults($id, $per_page, $params);

		if ($results === false) {
			return response()->json(['message' => 'Invalid account ID or account does not exist.'], 400);
		}
		
		return CrawlResultResource::collection($results);
	}

    public function getStatisticSummary() {
        return response()->json($this->tiktokAccountService->getStatisticSummary());
    }
}