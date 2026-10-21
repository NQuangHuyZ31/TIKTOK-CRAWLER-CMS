<?php
    $module = $module ?? 'Core';
?>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'CMS TikTok Crawler') }}{{ $module !== 'Core' ? ' - ' . $module : '' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet">

    @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
    @viteReactRefresh
    @vite(['modules/Core/resources/css/app.css', 'modules/Core/resources/js/app.tsx'])
    @else
    {{-- DOM CSS từ entrypoint (Core luôn được DOM, có cache tránh lặp) --}}
    @moduleCss($module)
    @endif
</head>

<body>
    <div id="root"></div>

    @if (!file_exists(public_path('hot')) && !file_exists(public_path('build/manifest.json')))
    {{-- DOM JS từ entrypoint (Core vendor + index luôn được DOM, module tương ứng, có cache tránh lặp) --}}
    @moduleJs($module)
    @endif
</body>

</html>