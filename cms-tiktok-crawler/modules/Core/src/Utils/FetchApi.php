<?php

namespace Modules\Core\Utils;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;

/**
 * Class FetchApi
 *
 * Centralized, shared HTTP client utility for making external and internal API requests.
 * Standardized within Modules\Core\Utils for cross-module usage.
 *
 * Example usage:
 * ```php
 * // Quick POST request:
 * $data = FetchApi::post('https://api.example.com/v1/resource', ['key' => 'value'], ['Authorization' => 'Bearer token']);
 *
 * // GET request with query parameters:
 * $data = FetchApi::get('https://api.example.com/v1/items', ['page' => 1, 'limit' => 20]);
 *
 * // Generic request with retry and custom timeout:
 * $data = FetchApi::request(
 *     url: 'https://api.example.com/v1/action',
 *     method: 'POST',
 *     payload: ['id' => 10],
 *     options: ['timeout' => 60, 'retry' => 3, 'retry_delay' => 200]
 * );
 * ```
 */
class FetchApi
{
    /**
     * Default request timeout in seconds.
     */
    protected const DEFAULT_TIMEOUT = 30;

    /**
     * Default connection timeout in seconds.
     */
    protected const DEFAULT_CONNECT_TIMEOUT = 10;

    /**
     * Supported HTTP methods.
     */
    protected const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    /**
     * Perform an HTTP request with customizable options.
     *
     * @param string $url Target API endpoint URL.
     * @param string $method HTTP method (GET, POST, PUT, PATCH, DELETE, etc.).
     * @param array|null $payload Request data (sent as query string for GET/HEAD, JSON for others).
     * @param array $headers Additional HTTP request headers.
     * @param array $options Advanced options (timeout, connect_timeout, retry, retry_delay, token, throw).
     * @return array Decoded JSON response or empty array.
     *
     * @throws InvalidArgumentException When URL or method is invalid.
     * @throws RuntimeException When request fails and throw option is true.
     */
    public static function request(
        string $url,
        string $method = 'GET',
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        $method = strtoupper(trim($method));

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new InvalidArgumentException("A valid API URL is required. Given: '{$url}'");
        }

        if (!in_array($method, self::ALLOWED_METHODS, true)) {
            throw new InvalidArgumentException("Unsupported HTTP method: '{$method}'");
        }

        $timeout = (int) ($options['timeout'] ?? self::DEFAULT_TIMEOUT);
        $connectTimeout = (int) ($options['connect_timeout'] ?? self::DEFAULT_CONNECT_TIMEOUT);

        $client = Http::withHeaders($headers)
            ->acceptJson()
            ->timeout($timeout)
            ->connectTimeout($connectTimeout);

        // Bearer token helper
        if (!empty($options['token']) || !empty($options['bearer_token'])) {
            $token = (string) ($options['token'] ?? $options['bearer_token']);
            $client->withToken($token);
        }

        // Automatic retry logic
        if (!empty($options['retry']) && (int) $options['retry'] > 1) {
            $times = (int) $options['retry'];
            $sleep = (int) ($options['retry_delay'] ?? 100);
            $client->retry($times, $sleep);
        }

        /** @var Response $response */
        $response = match ($method) {
            'GET' => $client->get($url, $payload ?? []),
            'HEAD' => $client->head($url, $payload ?? []),
            'POST' => $client->post($url, $payload ?? []),
            'PUT' => $client->put($url, $payload ?? []),
            'PATCH' => $client->patch($url, $payload ?? []),
            'DELETE' => $client->delete($url, $payload ?? []),
            default => $client->send($method, $url, ['json' => $payload ?? []]),
        };

        $shouldThrow = $options['throw'] ?? true;
        if ($shouldThrow && $response->failed()) {
            throw new RuntimeException(sprintf(
                'API request [%s %s] failed with status %d: %s',
                $method,
                $url,
                $response->status(),
                $response->body()
            ));
        }

        return $response->json() ?? [];
    }

    /**
     * Send a GET request.
     *
     * Example:
     * FetchApi::get('https://api.example.com/items', ['category' => 'books']);
     */
    public static function get(
        string $url,
        array $params = [],
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, 'GET', $params, $headers, $options);
    }

    /**
     * Send a POST request.
     *
     * Example:
     * FetchApi::post('https://api.example.com/items', ['title' => 'Sample'], ['Authorization' => 'Bearer token']);
     */
    public static function post(
        string $url,
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, 'POST', $payload, $headers, $options);
    }

    /**
     * Send a PUT request.
     *
     * Example:
     * FetchApi::put('https://api.example.com/items/1', ['title' => 'Updated Sample']);
     */
    public static function put(
        string $url,
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, 'PUT', $payload, $headers, $options);
    }

    /**
     * Send a PATCH request.
     *
     * Example:
     * FetchApi::patch('https://api.example.com/items/1', ['status' => 'active']);
     */
    public static function patch(
        string $url,
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, 'PATCH', $payload, $headers, $options);
    }

    /**
     * Send a DELETE request.
     *
     * Example:
     * FetchApi::delete('https://api.example.com/items/1');
     */
    public static function delete(
        string $url,
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, 'DELETE', $payload, $headers, $options);
    }

    /**
     * Convenient alias matching modern fetch API semantics.
     *
     * Example:
     * FetchApi::fetch('https://api.example.com/endpoint', 'POST', ['key' => 'val']);
     */
    public static function fetch(
        string $url,
        string $method = 'GET',
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, $method, $payload, $headers, $options);
    }

    /**
     * Backward-compatible alias for fetchAPI.
     */
    public static function fetchAPI(
        string $url,
        string $method = 'GET',
        ?array $payload = null,
        array $headers = [],
        array $options = []
    ): array {
        return static::request($url, $method, $payload, $headers, $options);
    }
}
