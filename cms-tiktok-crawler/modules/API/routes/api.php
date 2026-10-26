<?php

use Illuminate\Support\Facades\Route;
use Modules\API\Http\Controllers\CrawlerResultController;

Route::prefix('public')->group(function () {
    Route::post(
        'crawler/crawl-jobs/{jobId}/events',
        [CrawlerResultController::class, 'saveResult']
    );
});