<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    return view('core::app');
})->where('any', '.*')->name('app');
