<?php

use Modules\Crawler\Controllers\CrawlerController;
use Illuminate\Support\Facades\Route;

Route::prefix('crawl-jobs')->group(function () {
	Route::get('/', [CrawlerController::class, 'getAllCrawlJobs']);
	Route::get('/dashboard-summary', [CrawlerController::class, 'getDashboardSummary']);
});