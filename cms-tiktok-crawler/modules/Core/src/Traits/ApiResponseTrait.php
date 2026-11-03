<?php

namespace Modules\Core\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponseTrait
{
    /**
     * Return a standardized success JSON response.
     */
    protected function respondSuccess(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200,
        array $headers = []
    ): JsonResponse {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $status, $headers);
    }

    /**
     * Return a standardized error JSON response.
     */
    protected function respondError(
        string $message = 'Error',
        int $status = 400,
        mixed $errors = null,
        array $headers = []
    ): JsonResponse {
        $payload = [
            'status' => 'error',
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status, $headers);
    }

    /**
     * Return a standardized paginated JSON response.
     */
    protected function respondPaginated(
        LengthAwarePaginator $paginator,
        string $message = 'Success',
        int $status = 200,
        array $headers = []
    ): JsonResponse {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ], $status, $headers);
    }
}
