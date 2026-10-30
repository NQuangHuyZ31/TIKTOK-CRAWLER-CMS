<?php

namespace Modules\API\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyCrawlerToken
{
    /**
     * Verify shared Bearer token between Laravel and Python Crawler Service.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = (string) config('services.crawler.token', '');

        if ($configuredToken === '') {
            return $next($request);
        }

        $suppliedToken = (string) $request->bearerToken();

        if ($suppliedToken === '' || !hash_equals($configuredToken, $suppliedToken)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized crawler token.',
            ], 401);
        }

        return $next($request);
    }
}
