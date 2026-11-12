<?php
    $module = $module ?? 'Core';
    $hiddenModules = [];
    try {
        $rawHidden = app(\Modules\System\Services\SystemSettingService::class)->getSetting('hidden_modules', []);
        if (is_array($rawHidden)) {
            $hiddenModules = array_values(array_filter($rawHidden, fn ($m) => is_string($m) && !in_array($m, ['core', 'auth', 'system'], true)));
        }
    } catch (\Throwable) {
        $hiddenModules = [];
    }
?>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script>
        window.__CMS_HIDDEN_MODULES__ = @json($hiddenModules);
    </script>
    <title>{{ config('app.name', 'CMS TikTok Crawler') }}{{ $module !== 'Core' ? ' - ' . $module : '' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet">

    @if (file_exists(public_path('hot')))
    @viteReactRefresh
    @vite(['modules/Core/resources/css/app.css', 'modules/Core/resources/js/app.tsx'])
    @else
    {{-- Automatically load CSS for Core and all modules from entrypoints.json --}}
    @moduleCss('all')
    @endif
</head>

<body>
    <div id="root"></div>

    @if (!file_exists(public_path('hot')))
    {{-- Automatically load JS for Core vendor + index and all modules from entrypoints.json --}}
    @moduleJs('all')
    @endif
</body>

</html>