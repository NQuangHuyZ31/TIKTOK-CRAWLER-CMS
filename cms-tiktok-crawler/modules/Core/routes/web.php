<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function (Request $request) {
    $path = trim($request->path(), '/');
    $adminPrefix = trim((string) config('admin.admin_path', config('admin.path', 'admin')), '/');

    // Redirect root URL to admin prefix
    if ($path === '') {
        return redirect('/' . $adminPrefix);
    }

    // Redirect routes missing admin prefix (e.g. /login -> /admin/login)
    if (!str_starts_with($path, $adminPrefix . '/') && $path !== $adminPrefix) {
        return redirect('/' . $adminPrefix . '/' . $path);
    }

    if ($path === $adminPrefix) {
        $path = '';
    } elseif (str_starts_with($path, $adminPrefix . '/')) {
        $path = substr($path, strlen($adminPrefix) + 1);
    }
    $segment = explode('/', $path)[0] ?? '';
    $module = config('modules.routes.' . $segment, 'Core');

    return view()->exists('core::app') ? view('core::app', ['module' => $module]) : view('app', ['module' => $module]);
})->where('any', '^(?!api(?:\/|$)).*')->name('app');
