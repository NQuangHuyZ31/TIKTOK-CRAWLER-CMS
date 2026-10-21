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
        {{-- Webpack & Laravel Mix Production / Built Mode --}}
        {{-- 1. Core Stylesheet --}}
        @if (file_exists(public_path('modules/core/css/app.css')))
            <link rel="stylesheet" href="{{ asset('modules/core/css/app.css') }}">
        @elseif (file_exists(public_path('css/app.css')))
            <link rel="stylesheet" href="{{ asset('css/app.css') }}">
        @endif

        {{-- 2. Dynamic Module Stylesheets --}}
        @inject('moduleRegistry', 'Modules\Core\Support\ModuleRegistry')
        @foreach ($moduleRegistry->getModuleStyles() as $modName => $cssUrl)
            <link rel="stylesheet" href="{{ $cssUrl }}">
        @endforeach
    @endif
</head>

<body>
    <div id="root"></div>

    @if (!file_exists(public_path('hot')))
        {{-- Webpack Runtime & Shared Vendor Dependencies (DOM ra web) --}}
        @if (file_exists(public_path('js/manifest.js')))
            <script src="{{ asset('js/manifest.js') }}"></script>
        @endif
        @if (file_exists(public_path('js/vendor.js')))
            <script src="{{ asset('js/vendor.js') }}"></script>
        @endif

        {{-- Core Application Shell --}}
        @if (file_exists(public_path('modules/core/js/app.js')))
            <script src="{{ asset('modules/core/js/app.js') }}"></script>
        @endif

        {{-- Dynamic Active Module Scripts --}}
        @foreach ($moduleRegistry->getModuleScripts() as $modName => $jsUrl)
            <script src="{{ $jsUrl }}"></script>
        @endforeach
    @endif
</body>

</html>