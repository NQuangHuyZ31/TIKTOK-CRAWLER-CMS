<?php

use Illuminate\Support\Facades\Route;
use Modules\API\Http\Controllers\CrawlerResultController;
use Modules\API\Http\Middleware\VerifyCrawlerToken;

Route::prefix('public')
    ->middleware(VerifyCrawlerToken::class)
    ->group(function () {
        Route::post(
            'crawler/crawl-jobs/{jobId}/events',
            [CrawlerResultController::class, 'saveResult']
        );
        Route::get(
            'crawler/jobs/unfinished',
            [CrawlerResultController::class, 'unfinishedJobs']
        );
    });
