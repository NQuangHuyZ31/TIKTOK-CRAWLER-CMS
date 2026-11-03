<?php

use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect'])->name('api.auth.google.redirect');
    Route::get('/google/callback', [AuthController::class, 'googleCallback'])->name('api.auth.google.callback');
});
