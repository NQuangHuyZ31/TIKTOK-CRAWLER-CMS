<?php

namespace Modules\Crawler\Services;

use DomainException;
use Illuminate\Support\Facades\Http;
use Modules\Core\Utils\FetchApi;
use RuntimeException;
use Throwable;

class CrawlerEngineClient
{
    /**
     * Dispatch payload to external Python Crawler Engine (/api/crawl-jobs/start).
     */
    public function startJob(array $payload): array
    {
        $url = $this->getBaseUrl() . '/api/crawl-jobs/start';

        try {
            return FetchApi::post($url, $payload, $this->getHeaders());
        } catch (Throwable $exception) {
            $message = $exception->getMessage();
            if (str_contains($message, 'status 422')) {
                throw new DomainException("Crawler validation failed: {$message}");
            }
            $code = str_contains($message, 'status 500') ? 500 : 503;
            throw new RuntimeException(
                'Crawler service is currently unavailable, please try again.',
                $code,
                $exception
            );
        }
    }

    /**
     * Cancel an active or queued job in the Python Crawler Engine (/api/crawl-jobs/{jobId}).
     */
    public function cancelJob(int $jobId): void
    {
        $url = $this->getBaseUrl() . "/api/crawl-jobs/{$jobId}";

        try {
            FetchApi::request($url, 'DELETE', null, $this->getHeaders(), ['throw' => false]);
        } catch (Throwable) {
            // Ignore cancellation network errors if Python is already down or job is gone
        }
    }

    /**
     * Probe Python engine queue status (/api/queue) preserving full response payload and 2xx success condition.
     */
    public function getQueueStatus(): ?array
    {
        $url = $this->getBaseUrl() . '/api/queue';

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->acceptJson()
                ->connectTimeout(1)
                ->timeout(2)
                ->get($url);

            if ($response->successful()) {
                return $response->json() ?? [];
            }

            return null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Dispatch privacy purge request to Python Crawler Engine (/api/crawler/privacy/purge).
     */
    public function purgePrivacyEntity(string $entityType, string $entityKey, string $purgeRequestId, ?string $reason = null): array
    {
        $url = $this->getBaseUrl() . '/api/crawler/privacy/purge';
        $payload = [
            'entity_type' => $entityType,
            'entity_key' => $entityKey,
            'purge_request_id' => $purgeRequestId,
            'reason' => $reason ?? 'privacy_request',
        ];

        return FetchApi::post($url, $payload, $this->getHeaders());
    }

    /**
     * Resolve authorization headers for Python daemon.
     */
    protected function getHeaders(): array
    {
        $headers = [];
        if ($token = config('services.crawler.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        return $headers;
    }

    /**
     * Resolve base URL for Python daemon.
     */
    protected function getBaseUrl(): string
    {
        return rtrim(
            (string) config('services.crawler.url', 'http://127.0.0.1:8001'),
            '/'
        );
    }
}
