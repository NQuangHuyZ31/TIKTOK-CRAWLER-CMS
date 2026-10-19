<?php

use Modules\Crawler\Controllers\CrawlJobController;
use Illuminate\Support\Facades\Route;

Route::prefix('crawlers')->group(function () {
    Route::prefix('crawl-jobs')->group(function () {
        Route::get('/', [CrawlJobController::class, 'getAllCrawlJobs']);
        Route::post('/add', [CrawlJobController::class, 'createCrawlJob']);
        Route::get('/{id}', [CrawlJobController::class, 'getCrawlJobById']);
        Route::post('/', [CrawlJobController::class, 'createCrawlJob']);
        Route::get('/{id}/results', [CrawlJobController::class, 'getCrawlResultsByJobId']);
    });
});
