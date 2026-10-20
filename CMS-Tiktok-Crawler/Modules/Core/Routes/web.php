<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    return view()->exists('core::app') ? view('core::app') : view('app');
})->where('any', '^(?!api(?:\/|$)).*')->name('app');
