<?php

use Modules\Crawler\Controllers\CrawJobController;
use Illuminate\Support\Facades\Route;

Route::prefix('crawlers')->group(function () {
	Route::prefix('crawl-jobs')->group(function () {
		Route::get('/', [CrawJobController::class, 'getAllCrawlJobs']);
		Route::post('/add', [CrawJobController::class, 'createCrawlJob']);
		Route::get('/{id}', [CrawJobController::class, 'getCrawlJobById']);
		Route::post('/', [CrawJobController::class, 'createCrawlJob']);
		Route::get('/{id}/results', [CrawJobController::class, 'getCrawlResultsByJobId']);
	});
});