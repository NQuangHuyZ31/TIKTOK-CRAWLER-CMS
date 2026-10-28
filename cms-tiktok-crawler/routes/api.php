<?php

use Illuminate\Support\Facades\Route;

// Health check endpoint for Docker & Render orchestrator
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'cms-tiktok-crawler-web',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// API routes live in the modules: Modules/<Name>/routes/api.php
// All module routes are auto-discovered, loaded, and processed through Modules\Core\Providers\CoreServiceProvider.
// No routes are registered outside the module.
