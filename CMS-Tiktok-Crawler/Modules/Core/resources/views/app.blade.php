<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'CMS TikTok Crawler') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet">

    @if (file_exists(public_path('hot')))
        {{-- Vite Development Mode --}}
        @viteReactRefresh
        @vite(['modules/Core/resources/css/app.css', 'modules/Core/resources/js/app.tsx'])
    @else
        {{-- Webpack & Laravel Mix Modular Mode (Ureka Architecture) --}}
        @inject('moduleRegistry', 'Modules\Core\Support\ModuleRegistry')
        @php
            $assets = $moduleRegistry->getAssetsForCurrentRequest($activeModule ?? null);
        @endphp

        {{-- DOM chỉ CSS của Core và Module cần thiết --}}
        @foreach ($assets['css'] as $cssUrl)
            <link rel="stylesheet" href="{{ asset(ltrim($cssUrl, '/')) }}">
        @endforeach
    @endif
</head>

<body>
    <div id="root"></div>

    @if (!file_exists(public_path('hot')))
        {{-- DOM chỉ JS của Core (vendor.js, index.js) và Module cần thiết (index.js) theo entrypoints.json --}}
        @foreach ($assets['js'] as $jsUrl)
            <script src="{{ asset(ltrim($jsUrl, '/')) }}"></script>
        @endforeach
    @endif
</body>

</html>