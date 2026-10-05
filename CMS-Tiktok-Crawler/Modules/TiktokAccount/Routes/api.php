<?php

use Modules\TiktokAccount\Controllers\TiktokAccountController;
use Illuminate\Support\Facades\Route;

Route::prefix('tiktok-accounts')->group(function () {
	Route::get('/', [TiktokAccountController::class, 'index']);
	// Get all tiktok accounts without pagination
	Route::get('/all', [TiktokAccountController::class, 'getAllTiktokAccountsNotpaginated']);

	
	// Get a specific tiktok account by ID
	Route::get('/{id}', [TiktokAccountController::class, 'show']);
	Route::post('/', [TiktokAccountController::class, 'store']);
	Route::put('/{id}', [TiktokAccountController::class, 'update']);
	Route::delete('/{id}', [TiktokAccountController::class, 'destroy']);
});