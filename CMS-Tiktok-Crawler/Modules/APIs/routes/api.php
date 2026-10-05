<?php

use Illuminate\Support\Facades\Route;
use Modules\APIs\Controllers\CrawlerResultController;

Route::prefix('crawlers')->group(function () {
    Route::post(
        '/crawl-jobs/{jobId}/events',
        [CrawlerResultController::class, 'store']
    );
});