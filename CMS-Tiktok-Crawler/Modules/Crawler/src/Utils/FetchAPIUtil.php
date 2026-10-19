<?php

namespace Modules\Crawler\Utils;

use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;

class FetchAPIUtil {
	public static function fetchAPI(
		string $url,
		string $method = 'GET',
		?array $payload = null,
		array $headers = []
	): array {
		$method = strtoupper($method);

		if (!filter_var($url, FILTER_VALIDATE_URL)) {
			throw new InvalidArgumentException('A valid API URL is required.');
		}

		if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
			throw new InvalidArgumentException("Unsupported HTTP method: {$method}");
		}

		$request = Http::withHeaders($headers)
			->acceptJson()
			->timeout(30)
			->connectTimeout(10);

		$response = $method === 'GET'
			? $request->get($url, $payload ?? [])
			: $request->send($method, $url, ['json' => $payload ?? []]);

		if ($response->failed()) {
			throw new RuntimeException(sprintf(
				'API request failed with status %d: %s',
				$response->status(),
				$response->body()
			));
		}

		return $response->json() ?? [];
	}
}