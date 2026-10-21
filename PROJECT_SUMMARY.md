# CMS TikTok Crawler Architecture & Project Summary

## 1. Overview

The **CMS TikTok Crawler** project has been completely restructured and modernized to align with the enterprise modular architecture of **Ureka**:

- **100% TypeScript**: Fully migrated all frontend code from JSX/JS to TypeScript (`.ts` and `.tsx`) with strict type checking and zero compilation errors (`npx tsc --noEmit` passing 100%).
- **Laravel Blade Shell & Modular Scoped DOM**: Replaced legacy standalone `index.html` with Laravel Blade view ([`modules/Core/resources/views/app.blade.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/views/app.blade.php)). Supports dual frontend asset serving:
  - **Production / Laravel Mix Mode**: Modular Scoped DOM from `public/entrypoints.json` via Blade directives `@moduleCss($module)` and `@moduleJs($module)` with duplicate prevention cache.
  - **Development Mode**: Hot reload via Laravel Vite integration (`@viteReactRefresh` and `@vite`).
- **Ureka Modular Backend Pattern**: Reorganized all PHP code into `modules/<ModuleName>/src/` with dedicated route files in `modules/<ModuleName>/routes/api.php` and PSR-4 autoloading via Composer (`Modules\<Name>\`: `modules/<Name>/src/`).
- **Ureka Modular Frontend Pattern**: Organized frontend code in `modules/<ModuleName>/resources/js/` into clean functional subdirectories (`Action/`, `components/`, `pages/`, `routes/`, `store/`, `configs/`).
- **Standardized Core API Client**: Created [`modules/Core/resources/js/Action/api.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/Action/api.ts) mirroring Ureka's pattern: typed HTTP client, automatic CSRF token header retrieval, `ApiError` class, and strict environment configuration (`.env`).
- **Webpack & Laravel Mix Modular Build (No File Copying)**: Dedicated single `webpack.mix.js` building each module to exactly 2 files (`index.js` and `app.css`), plus a single shared vendor bundle for Core (`vendor.js`), managed by `public/entrypoints.json`.

---

## 2. Directory Structure

```
cms-tiktok-crawler/
├── app/
├── bootstrap/
│   ├── app.php                          # Laravel 11/12 application bootstrap
│   └── providers.php                    # Application service providers
├── config/
│   ├── app.php, auth.php, cache.php, cors.php, database.php, filesystems.php...
├── database/
│   └── migrations/                      # Schema migrations (users, tiktok_accounts, crawl_jobs, crawl_results)
├── modules/                             # Ureka Modular Business Layer
│   ├── API/
│   │   ├── routes/
│   │   │   └── api.php                  # Crawler result webhook routes
│   │   └── src/
│   │       ├── Controllers/
│   │       │   └── CrawlerResultController.php
│   │       └── Requests/
│   ├── Core/                            # Core shared module
│   │   ├── configs/
│   │   │   ├── admin.php                # Admin path & API path configuration
│   │   │   └── modules.php              # Module routes mapping & disabled modules
│   │   ├── resources/
│   │   │   ├── css/app.css              # Global styles & Tailwind
│   │   │   ├── js/
│   │   │   │   ├── Action/api.ts        # Central API client (strict .env baseURL)
│   │   │   │   ├── components/          # Reusable UI widgets (Table, CardKPI, Modal, etc.)
│   │   │   │   ├── layouts/             # AdminLayout, Header, Sidebar
│   │   │   │   ├── pages/               # DashboardPage, NotFoundPage
│   │   │   │   │   └── ui/              # Dashboard UI subcomponents (Header, KpiCards, Overview, Table, Shortcuts)
│   │   │   │   ├── routes/              # Route registry, autoRegister
│   │   │   │   ├── store/               # Redux store with typed hooks
│   │   │   │   └── utils/
│   │   │   └── views/
│   │   │       └── app.blade.php        # Blade Shell (@moduleCss, @moduleJs, Vite fallback)
│   │   ├── routes/
│   │   │   ├── api.php                  # DynamicRouteResovle::routes()
│   │   │   └── web.php                  # Web SPA Catch-all & route-level module resolver
│   │   └── src/
│   │       ├── Controllers/             # BaseController, CoreController
│   │       ├── Middleware/
│   │       ├── Providers/               # CoreServiceProvider, ModuleServiceProvider
│   │       ├── Repositories/            # BaseRepository, BaseRepositoryInterface
│   │       ├── Support/                 # ModuleRegistry, DynamicRouteResovle
│   │       ├── Traits/                  # ApiResponseTrait
│   │       └── Utils/                   # FetchApi, UploadFile, CheckFileUpload
│   ├── Crawler/                         # Crawler management module
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # crawlJob.ts
│   │   │       ├── components/          # CrawlJobListTable, CrawlResultTable, etc.
│   │   │       ├── configs/             # tableConfig.ts
│   │   │       ├── pages/               # CrawlJobsPage, CrawlJobDetailPage, Create, Edit
│   │   │       ├── routes/              # route.ts
│   │   │       └── store/               # crawlJobSlice.ts, crawlJobThunks.ts
│   │   ├── routes/
│   │   │   └── api.php                  # Crawler job API endpoints (handled by Core dynamic routing)
│   │   └── src/
│   │       ├── Controllers/             # CrawlJobController, CrawlResultController
│   │       ├── Models/                  # CrawlJob, CrawlResult
│   │       ├── Providers/               # CrawlerServiceProvider
│   │       ├── Repositories/            # CrawlJobRepository, CrawlResultRepository
│   │       ├── Requests/
│   │       ├── Resources/
│   │       └── Services/
│   └── TiktokAccount/                   # TikTok account management module
│       ├── resources/
│       │   └── js/
│       │       ├── Action/              # tiktokAccount.ts
│       │       ├── components/          # TiktokAccountTableList, AvatarUpload, DeleteAccount
│       │       ├── configs/             # columnConfig.ts
│       │       ├── pages/               # TiktokAccountPage, DetailPage, EditPage
│       │       ├── routes/              # route.ts
│       │       └── store/               # tiktokAccountSlice.ts, tiktokAccountThunks.ts
│       ├── routes/
│       │   └── api.php                  # TikTok account API endpoints
│       └── src/
│           ├── Controllers/             # TiktokAccountController
│           ├── Models/                  # TiktokAccount
│           ├── Providers/               # TiktokAccountServiceProvider
│           ├── Repositories/            # TiktokAccountRepository
│           ├── Requests/
│           ├── Resources/
│           └── Services/
├── public/
│   ├── entrypoints.json                 # Manifest mapping JS/CSS assets per module
│   ├── modules/                         # Compiled modular bundles (No file copy)
│   │   ├── Core/
│   │   │   ├── vendor.js                # Single shared vendor bundle (React, Antd, Axios, Redux...)
│   │   │   ├── index.js                 # Core code bundle (~40 KiB minified)
│   │   │   └── app.css                  # Core CSS bundle (~14 KiB minified)
│   │   ├── Crawler/
│   │   │   └── index.js                 # Crawler module bundle (~71 KiB minified)
│   │   └── TiktokAccount/
│   │       └── index.js                 # TiktokAccount module bundle (~65 KiB minified)
│   └── build/                           # Vite build assets (when using Vite)
├── routes/
│   ├── api.php                          # Clean skeleton (Core auto-discovers module routes)
│   ├── web.php                          # Clean skeleton (Core handles admin web routes)
│   └── console.php
├── scripts/
│   └── mix-module.cjs                   # Modular build runner (Production default, Terser memory optimized)
├── build/
│   ├── modules.js                       # Module auto-discovery & aliases
│   └── EntrypointsPlugin.js             # Webpack plugin generating public/entrypoints.json
├── webpack.mix.js                       # Single unified Webpack 5 / Laravel Mix 6 config
├── composer.json                        # PSR-4 autoloading: "Modules\\<Name>\\": "modules/<Name>/src/"
├── package.json                         # Frontend dependencies & npm run mix scripts
├── tsconfig.json                        # Paths: @/*, @modules/*, @core/*
└── vite.config.ts                       # Laravel Vite Plugin configuration
```

---

## 3. Key Components & Implementation

### A. Blade Template & Web Routing

The application serves [`modules/Core/resources/views/app.blade.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/views/app.blade.php):

```blade
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
```

Catch-all Web Routing in [`modules/Core/routes/web.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/routes/web.php):

```php
Route::get('/{any?}', function (Request $request) {
    $path = trim($request->path(), '/');
    $adminPrefix = trim(config('admin.path', 'admin'), '/');

    if ($path === $adminPrefix) {
        $path = '';
    } elseif (str_starts_with($path, $adminPrefix . '/')) {
        $path = substr($path, strlen($adminPrefix) + 1);
    }
    $segment = explode('/', $path)[0] ?? '';
    $module = config('modules.routes.' . $segment, 'Core');

    return view()->exists('core::app') ? view('core::app', ['module' => $module]) : view('app', ['module' => $module]);
})->where('any', '^(?!api(?:\/|$)).*')->name('app');
```

### B. Standardized API Client (`modules/Core/resources/js/Action/api.ts`)

Implements Ureka's standardized HTTP client pattern with strict `.env` baseURL resolution:

- Resolves CSRF token from `<meta name="csrf-token">`.
- Sets `X-Requested-With: XMLHttpRequest` and `Accept: application/json`.
- Resolves `baseURL` strictly from environment variables (`.env: VITE_API_URL`):
  - In Laravel Mix: `process.env.VITE_API_URL` injected via `webpack.DefinePlugin` from `.env`.
  - In Vite: `import.meta.env.VITE_API_URL` injected at build-time.
  - Does NOT inspect URL, DOM meta tags, or window globals.
- Custom `ApiError` class capturing HTTP status codes and backend validation error arrays.

### C. Redux Store & Typed Hooks (`modules/Core/resources/js/store/index.ts`)

Exports typed versions of hooks for state access:

```typescript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useReduxDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
export const useDispatch = useAppDispatch;
export const useSelector = useAppSelector;
```

- **Cleanup of Obsolete Hooks**: Removed unused `hooks/` directory (`useAsync`, `useDebounce`, `useModal`, `usePageTitle`, `usePagination`, `useTableParams`, `useToggle`) as all module state, pagination, and async operations are standardized via Redux Toolkit slices/thunks and native Ant Design features.

### D. Shared Pure Generic Table Component (`modules/Core/resources/js/components/Table.tsx`)

Pure generic Table component decoupled from domain-specific UI:

- **Decoupled & Pure Generic**: `TableComponent` does not import domain components (`StatusTag`, Avatar, action buttons).
- **Flexible Column Slots**:
  - `prependColumns`: Prepends columns at the beginning (index, selection checkboxes).
  - `extraColumns` / `appendColumns`: Appends columns at the end (actions, detail buttons).
  - `renderColumns`: Custom render callbacks per column key at usage site: `renderColumns={{ status: (s) => <StatusTag status={s} /> }}`.
  - Cell fallback: Automatically displays `'-'` (or custom `defaultValue`) when cell content is null/empty.
  - Server Pagination: Integrates with Laravel pagination structure (`current_page`, `per_page`, `total`).
- Applied across `CrawlJobListTable`, `TiktokAccountTableList`, and `CrawlResultTable`.

### E. Layout Routing & Route-Driven Navigation (`AdminLayout` & Route Registry)

- **`AdminLayout`**: [`modules/Core/resources/js/layouts/AdminLayout.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/AdminLayout.tsx) replacing legacy `MainLayout`.
- **Pathless Layout Routing**: Admin routes live under `<Route element={<AdminLayout />}>`. Child routes render into `<Outlet />`, preventing component remounts and preserving sidebar/header state across navigations.
- **Route-Driven Sidebar**: Replaced hardcoded menu configs with dynamic route consumption via `useMenuRoutes()` hook from Route Registry (`@core/routes`).
- **Module Route Registration**: Modules export clean route definitions consumed by the registry with layout, permissions, labels, and icons (`DashboardOutlined`, `RobotOutlined`, `UserOutlined`).

### F. Core-Driven Module Route Handling & Dynamic Routing Engine

- **`ModuleRegistry` ([`modules/Core/src/Support/ModuleRegistry.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Support/ModuleRegistry.php))**:
  - Discovers all modules under `modules/` and provider classes (`providerClasses`).
  - Manages `entrypoints.json` caching, DOM CSS/JS rendering, and memory cache (`$dommedCss`, `$dommedJs`) to prevent duplicate DOM tags.
  - Directly receives `$module` parameter from Blade (redundant `resolveModuleName` removed).
- **`CoreServiceProvider` ([`modules/Core/src/Providers/CoreServiceProvider.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Providers/CoreServiceProvider.php))**:
  - Scoped binding for `ModuleRegistry`, with `app->terminating()` hook resetting DOM cache.
  - Registers modular Blade directives: `@moduleCss($module)`, `@moduleJs($module)`, `@moduleAssets($module)`.
  - Auto-registers module ServiceProviders.
  - Auto-mounts API routes under `/{admin_path}/api` and Web routes under `/{admin_path}`.
- **Encapsulated Dynamic Route Resolver (`Modules\Core\Support\DynamicRouteResovle`)**:
  - Located in [`modules/Core/src/Support/DynamicRouteResovle.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Support/DynamicRouteResovle.php).
  - Supported URL patterns (domain-agnostic, mounted under `/{admin_path}/api`):
    1. `/{admin_path}/api/{module}/{controller}/{id}/{action}/{parameters?}`
    2. `/{admin_path}/api/{module}/{controller}/{action}/{parameters?}`
    3. `/{admin_path}/api/{module}/{controller}/{id}` (RESTful show/update/delete)
    4. `/{admin_path}/api/{module}/{controller}` (RESTful index/store)
- **Zero Route Leak**: Root `routes/api.php` and `routes/web.php` remain clean skeletons without hardcoded module routes.
- **Full CORS Support**: Configured in `config/cors.php` for local ports and preflight requests with credentials.

### G. Shared RESTful Core & Base Controllers (`BaseController` & `CoreController`)

1. **`BaseController` ([`modules/Core/src/Controllers/BaseController.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Controllers/BaseController.php))**:
   - 5 Standard RESTful Actions: `index`, `show`, `store`, `update`, `destroy`.
   - Global Keyword Search (`applySearch`): `?search=...`, `?keyword=...`, dot-notation relationship searches via `whereHas`.
   - Dynamic Column Filtering (`applyFilters`): `whereIn`, wildcards, date ranges (`_from`, `_to`).
   - Sorting (`applySorting`): Ant Design sorting (`ascend` / `descend`) mapped to SQL `asc` / `desc`.
   - Optional API Resource Transformation (`$resourceClass` & `hasResourceClass`): transforms via Resource when defined, returns raw models when omitted.
   - Bounded Pagination (`respondPaginated`): supports `pagination=false` or `all=true`.
   - Dynamic Model Resolution (`resolveModelClass`): conventional namespace inference or explicit `$modelClass`.
   - Standardized JSON responses via `ApiResponseTrait`.

2. **`CoreController` ([`modules/Core/src/Controllers/CoreController.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Controllers/CoreController.php))**:
   - Concrete controller extending `BaseController` for shared operations (`ping`, `upload`, `delete-uploaded-file`).
   - Dynamic CRUD operations: directly usable with `?model={ModelName}`.

### H. Refactoring Crawler Module Components, Pages & Redux Store

- **Redux Store vs Direct API calls**:
  - Kept in Redux Store: Crawl job list (`data`, `pagination`, `params`, `loading` via `fetchCrawlJobs`) and KPI statistics (`statistics`, `statisticsLoading` via `fetchStatisticsSummary`).
  - Moved to direct API calls: single-action operations (`deleteCrawlJobById`, `createCrawlJob`, `updateCrawlJob`, `startCrawlJobById`, `getCrawlJobResults`).
- **Removed unnecessary intermediate components**: Removed `DeleteCrawlJobButton.tsx`, replaced with inline Ant Design `Popconfirm` calling API directly.
- **Results**: `crawlJobSlice.ts` and `crawlJobThunks.ts` code reduced by >60%, removing redundant state variables (`loadingDeleted`, `startLoaing`, `StartError`).

### I. Clean Layering Refactor: Controller - Service - Repository (`modules/Crawler`)

Tách bạch chuẩn hóa ranh giới phân tầng dựa trên tính chất logic ("nghiệp vụ đơn giản không cần service"):
- **Tầng Service (`CrawlJobService`)**: Chỉ phụ trách các logic nghiệp vụ phức tạp thực thụ:
  1. `start()`: Kiểm tra trạng thái pending, kiểm tra xung đột hệ thống (`hasRunningJob`), giải mã danh sách tài khoản TikTok qua `TiktokAccountRepository`, chuẩn bị payload, điều phối HTTP request sang Python Crawler Engine, cập nhật `started_at` và rollback sang `failed` kèm `error_message` nếu gặp sự cố.
  2. Toàn bộ các thao tác CRUD đơn giản (`create`, `update`, `delete`, `getAll`, `getDetails`) đã được loại bỏ hoàn toàn khỏi Service để tránh tầng trung gian vô ích.
- **Tầng Repository (`CrawlJobRepository` & `CrawlResultRepository`)**: Đảm nhận toàn bộ truy vấn dữ liệu DB thuần túy:
  1. Kế thừa `BaseRepository` (`findById`, `create`, `update`, `delete`, `all`, `paginate`).
  2. `CrawlJobRepository::getStatisticsSummary()`: Truy vấn tổng hợp KPI dashboard (`count`, `sum`).
  3. `CrawlJobRepository::hasRunningJob()`: Kiểm tra sự tồn tại của job đang chạy.
  4. `CrawlResultRepository::getByJobId()`: Phân trang và lọc kết quả crawl theo username / status (chuẩn hóa tên method, giữ alias `getCrawlResultsByJobId`).
- **Tầng Controller (`CrawlJobController` & `CrawlResultController`)**:
  1. **Đồng bộ kế thừa `CoreController`**:
     - `CrawlJobController` kế thừa `CoreController`, khai báo `$modelClass = CrawlJob::class`, `$resourceClass = CrawlJobResource::class`.
     - `CrawlResultController` kế thừa `CoreController`, khai báo `$modelClass = CrawlResult::class`, `$resourceClass = CrawlResultResource::class`, `$searchableColumns`, `$filterableColumns = ['crawl_job_id', 'status', 'tiktok_account_id']`, `$defaultSort = ['id', 'desc']`.
  2. **Thao tác đơn giản thực thi trực tiếp qua Controller & Repository (Không qua Service)**:
     - `store(Request $request)`: Validate qua `CreateCrawlJobRequest`, tính toán `total_accounts` theo `source_type`, tạo job pending trực tiếp qua `$this->crawlJobRepository->create(...)`.
     - `update(Request $request, $id)`: Kiểm tra ràng buộc chỉ cho phép sửa khi job đang `pending`, cập nhật trực tiếp qua `$this->crawlJobRepository->update(...)`.
     - `destroy($id)`: Kiểm tra ràng buộc không được xóa khi job đang `running`, xóa trực tiếp qua `$this->crawlJobRepository->delete(...)`.
     - `statisticsSummary()`: Truy vấn trực tiếp qua `$this->crawlJobRepository->getStatisticsSummary()`.
     - `results(int $id, Request $request)`: Truy vấn danh sách kết quả crawl của job trực tiếp qua `$this->crawlResultRepository->getByJobId(...)`.
  3. **Chỉ tác vụ phức tạp mới điều phối qua Service**:
     - `start(int $id)`: Gọi `$this->crawlJobService->start($id)`.
  4. **Chuẩn hóa RESTful actions và alias tương thích ngược**:
     - `CrawlJobController`: `store`, `update`, `destroy`, `start` (alias `startCrawlJobById`), `statisticsSummary` (alias `getStatisticsSummary`), `results` (alias `getResults`, `getCrawlResultsByJobId`).
     - `CrawlResultController`: `index`, `show` (thừa hưởng từ CoreController), `byJob` (alias `getCrawlResultsByJobId`).
  5. Loại bỏ hoàn toàn service trung gian dư thừa `CrawlResultService`.

### J. Centralized Cross-Module HTTP Client Utility (`Modules\Core\Utils\FetchApi`)

Chuẩn hóa tiện ích gọi API dùng chung đưa về tầng `Core` để tái sử dụng xuyên suốt toàn bộ các module:
- **Vị trí**: [`modules/Core/src/Utils/FetchApi.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Utils/FetchApi.php).
- **Phương thức hỗ trợ**:
  - `FetchApi::request(url, method, payload, headers, options)`: Xử lý request tổng quát.
  - Shortcut methods: `get()`, `post()`, `put()`, `patch()`, `delete()`, `fetch()`, `fetchAPI()`.
- **Tính năng nổi bật**:
  1. Tự động gắn header `Accept: application/json`, kết hợp custom headers.
  2. Hỗ trợ Bearer Token qua `$options['token']` hoặc `$options['bearer_token']`.
  3. Cấu hình timeout linh hoạt (`timeout`, `connect_timeout`).
  4. Cơ chế tự động thử lại khi gặp lỗi mạng (`retry`, `retry_delay`).
  5. Xử lý lỗi tập trung, ném ngoại lệ mô tả chi tiết trạng thái HTTP và nội dung response; cho phép tắt ngoại lệ qua `$options['throw'] = false`.
- **Loại bỏ các file không cần thiết / mã chết**:
  - Xóa bỏ hoàn toàn `Modules\Crawler\Utils\FetchAPIUtil.php` và thư mục `modules/Crawler/src/Utils`.
  - `CrawlJobService` chuyển sang gọi trực tiếp `Modules\Core\Utils\FetchApi::post()`.
  - Xóa bỏ các file Redux Store/Thunks bị comment out: `modules/Crawler/resources/js/store/crawlResult/` (`crawlResultSlice.ts`, `crawlResultThunks.ts`).
  - Xóa bỏ file Action chết: `modules/Crawler/resources/js/Action/crawlResult.ts` và export tương ứng trong `modules/Crawler/resources/js/index.ts`.

### K. Tập Trung Hóa Bảng Điều Khiển Dashboard & Tinh Giản Summary Các Trang

- **Trang Dashboard Tổng Quan ([`modules/Core/resources/js/pages/DashboardPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/DashboardPage.tsx))**:
  - Tái thiết kế toàn diện theo phong cách giao diện hiện đại, cao cấp: Banner chào mừng Gradient (`#091a2f` $\rightarrow$ `#17375e`), huy hiệu Online trạng thái thời gian thực, hiển thị timestamp lấy dữ liệu gần nhất, nút làm mới dữ liệu với hiệu ứng loading quay và phím tắt tạo Crawl Job nhanh.
  - **Tách module hóa toàn diện & Tối đa hóa tái sử dụng Component lõi (`pages/ui/`)**: Tối ưu hóa file chính `DashboardPage.tsx` còn ~170 dòng, tái sử dụng 100% các thành phần nền tảng có sẵn trong `@core/components`:
    1. [`DashboardHeader.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/DashboardHeader.tsx): Tái sử dụng [`PageHeader.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PageHeader.tsx) với `title`, `description`, `extra` (nút reload, tạo job, badge online).
    2. [`DashboardKpiCards.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/DashboardKpiCards.tsx): Tái sử dụng [`CardKPI.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/CardKPI.tsx) và [`formatCurrency.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/utils/formatCurrency.ts) cho 4 thẻ KPI hàng đầu.
    3. [`CrawlEngineOverview.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/CrawlEngineOverview.tsx): Tái sử dụng [`CardKPI.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/CardKPI.tsx) cho 4 ô chỉ số chi tiết (Jobs hoàn tất/lỗi, Accounts hoàn tất/lỗi) thay thế hoàn toàn các thẻ HTML div inline thô sơ.
    4. [`TiktokEcosystemOverview.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/TiktokEcosystemOverview.tsx): Tái sử dụng [`CardKPI.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/CardKPI.tsx) cho 4 ô dữ liệu TikTok (Followers, Likes, Following, Active).
    5. [`RecentCrawlJobsTable.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/RecentCrawlJobsTable.tsx): Tái sử dụng [`TableComponent`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/Table.tsx) thay vì gọi trực tiếp Antd Table, kết hợp [`StatusTag.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/StatusTag.tsx) cho trạng thái và [`EmptyState.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/EmptyState.tsx) cho trường hợp chưa có dữ liệu.
    6. [`DashboardQuickShortcuts.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx): Khối phím tắt nhanh được chuẩn hóa qua cấu trúc mảng lặp DRY, loại bỏ trùng lặp mã.
    7. [`types.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/types.ts) & [`index.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/index.ts): Định nghĩa kiểu dữ liệu thống nhất và barrel export.
- **Loại Bỏ Summary Tại Các Trang Con**:
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobsPage.tsx): Loại bỏ `<StatisticSummary />`, giữ layout trang quản lý danh sách jobs tập trung, thanh thoát và gọn gàng.
  - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx): Loại bỏ `<StatisticSummary />`, giải phóng không gian phía trên bảng danh sách tài khoản TikTok.
  - Xóa bỏ hoàn toàn 2 component trung gian dư thừa:
    - `modules/Crawler/resources/js/components/StatisticSummary.tsx`
    - `modules/TiktokAccount/resources/js/components/StatisticSummary.tsx`
  - Giảm kích thước bundle biên dịch: Crawler bundle giảm xuống 68.7 KiB, TiktokAccount bundle giảm xuống 63.4 KiB.

## 4. Webpack & Laravel Mix Modular Build System (Ureka Pattern - No Copy)

Frontend build system standardized to Ureka's modular architecture:

- **Output File Structure**:
  - Each module compiles into exactly **2 files**:
    - `public/modules/<Name>/index.js` (Module JS/TS code)
    - `public/modules/<Name>/app.css` (Module CSS if present)
  - Core module additionally compiles **`vendor.js`**:
    - `public/modules/Core/vendor.js`: Single bundle containing shared libraries (`react`, `react-dom`, `antd`, `@ant-design/icons`, `axios`, `@reduxjs/toolkit`, `react-redux`, `dayjs`).
    - No chunk fragmentation (`node_modules_*`) thanks to `defaultVendors: false`, `default: false`, and direct module routing imports.
- **Manifest Configuration `public/entrypoints.json`**:
  - Generated automatically by `build/EntrypointsPlugin.js`:
    ```json
    {
      "Core": {
        "name": "Core",
        "route_prefix": "admin",
        "js": ["/modules/Core/vendor.js", "/modules/Core/index.js"],
        "css": ["/modules/Core/app.css"]
      },
      "Crawler": {
        "name": "Crawler",
        "route_prefix": "admin/crawler",
        "js": ["/modules/Crawler/index.js"],
        "css": []
      },
      "TiktokAccount": {
        "name": "TiktokAccount",
        "route_prefix": "admin/tiktok-account",
        "js": ["/modules/TiktokAccount/index.js"],
        "css": []
      }
    }
    ```
- **Scoped DOM Reading from Entrypoints ([`ModuleRegistry`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Support/ModuleRegistry.php))**:
  - **Core Prioritization**: Core CSS and JS (`vendor.js`, `index.js`, `app.css`) are always loaded first before any module assets.
  - **Module Scoping**: Loads only the `index.js` and `app.css` of the active module.
  - **Duplicate Prevention Cache**: `$dommedCss` and `$dommedJs` memory cache prevents duplicate HTML tags even if directives are called multiple times in a request.
  - **Blade Directives**: `@moduleCss($module)`, `@moduleJs($module)`, `@moduleAssets($module)`.
  - **Simplified Module Resolution**: Route [`modules/Core/routes/web.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/routes/web.php) resolves `$module = config('modules.routes.' . $segment, 'Core')` and passes it directly to Blade. Redundant `resolveModuleName` removed.
- **Production-Default Modular Build Runner ([`scripts/mix-module.cjs`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/scripts/mix-module.cjs))**:
  - Defaults to **Production** (`NODE_ENV=production`, Terser minification enabled). Bundle sizes: Core `index.js` ~40 KiB, vendor bundle ~1.36 MiB, module bundles ~65-71 KiB.
  - Terser configuration: `terser: { parallel: false }` and `NODE_OPTIONS=--max-old-space-size=4096` prevents `ERR_WORKER_OUT_OF_MEMORY` worker heap allocation errors on Node.js v24.
  - Available Build Commands:
    - `npm run mix` or `npm run mix:all`: Builds all modules with shared Vendor bundle.
    - `npm run mix:core`: Builds Core module independently (`vendor.js`, `index.js`, `app.css`).
    - `npm run mix:crawler`: Builds Crawler module (`public/modules/Crawler/index.js`).
    - `npm run mix:tiktokaccount`: Builds TiktokAccount module (`public/modules/TiktokAccount/index.js`).
    - `npm run mix:module <Name>`: Builds any specified module.
    - `npm run mix:dev`: Builds in development mode (unminified).
- **Chia sẻ Webpack Runtime Duy Nhất (`runtimeChunk: { name: VENDOR_CHUNK }`)**:
  - Khắc phục triệt để lỗi `Minified React error #520` (`TypeError: Cannot read properties of null (reading 'useContext')`) khi nạp nhiều bundle module trên cùng một trang.
  - Gom toàn bộ runtime của Webpack và bộ nhớ cache module (`__webpack_module_cache__`) duy nhất vào `public/modules/Core/vendor.js`.
  - Các bundle `Core/index.js`, `Crawler/index.js`, `TiktokAccount/index.js` đều là các chunk push vào `self.webpackChunk` và dùng chung instance React 19, React Router v6, Redux Toolkit duy nhất mà không bị khởi tạo lại thành nhiều bản sao riêng biệt.
- **Cơ chế Nạp Tự Động Module & Tự Đăng Ký Route Chuẩn Kiến Trúc Ureka ([`autoRegister.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/routes/autoRegister.tsx) & [`ModuleRegistry.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Support/ModuleRegistry.php))**:
  - **Triết lý Ureka**: `Core` chỉ sở hữu Router và Layout shell, hoàn toàn không cần duy trì danh sách page, menu hay đường dẫn của các module con (`Core has no list of pages, menu entries or paths to maintain`).
  - **Tự động nạp qua Blade Shell**: Directive `@moduleCss('all')` và `@moduleJs('all')` trong `app.blade.php` tự động đọc `public/entrypoints.json` và nạp toàn bộ các bundle JS/CSS của các module con đang kích hoạt.
  - **Tự đăng ký từ Module Entry**: Mỗi module con (`Crawler`, `TiktokAccount`...) tự đăng ký page và menu item của mình vào `window.__CMS_ROUTES_REGISTRY__` khi script của nó thực thi trong DOM.
  - **Triệt tiêu 100% lỗi load 2 lần**: Loại bỏ hoàn toàn component tạm `createModuleLoader` và script injection thủ công lúc runtime. Trình duyệt có sẵn mã nguồn của các module (~180 KiB tổng cộng), điều hướng SPA tức thì 0ms, không còn tình trạng giật spinner script lần 1 rồi mới mount component lần 2.
- **Dual-Environment API Client Compatibility ([`api.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/Action/api.ts))**:
  - Resolves `baseURL` strictly from `.env` (`VITE_API_URL`):
    - Laravel Mix: `dotenv` and `dotenv-expand` load `.env` and pass `process.env.VITE_API_URL` directly into `webpack.DefinePlugin`, inlining the exact URL into the bundle.
    - Vite: Injected via `import.meta.env.VITE_API_URL`.
    - Eliminates `Uncaught TypeError: Cannot read properties of undefined (reading 'VITE_API_URL')` completely.

---

## 5. Quality Verification & Test Results

1. **Composer PSR-4 Mapping**:
   - `composer dump-autoload` maps classes successfully across all modules under `modules/<Name>/src/`.
2. **Backend Routing**:
   - All API routes dynamically dispatched via Core; Web catch-all cleanly routes to `core::app`.
3. **Automated Feature & Unit Tests**:
   - `php artisan test` executed and **passed 100%** (**43/43 tests passed**, 153 assertions), covering:
     - `DynamicRouteResovle` method resolution, dynamic route dispatching, FormRequest injection, ID binding, action mapping, 404 error handling.
     - Admin web routing, root redirect, and CORS headers/preflight OPTIONS tests.
     - `CoreController` inheritance, ping endpoint, file upload/deletion.
     - Dynamic model CRUD resolution via `?model=...`.
     - `BaseController` 5 RESTful actions (index, show, store, update, destroy), keyword search, column filtering (`whereIn`), Ant Design sorting, and pagination.
     - `ModuleEntrypointDomTest` (6 tests): manifest caching, Core prioritization (`vendor.js` before `index.js`), DOM cache duplicate prevention, subsequent module isolation, Blade directives, and route-scoped asset serving.
     - `CrawlerArchitectureTest` (8 tests): `CoreController` inheritance for both `CrawlJobController` and `CrawlResultController`, direct controller-repository creation/calculation, pending enforcement on update, running restriction on delete, `CrawlJobService` start pending & concurrency guards, `CrawlJobRepository` KPI aggregation, `CrawlResultRepository` standardized `getByJobId` and backward-compatible alias, sub-resource `results` endpoint, and filtered `CoreController` crawl-result index.
     - `FetchApiTest` (8 tests): GET with query params, POST with JSON body and bearer token, PUT/PATCH/DELETE shortcuts, fetch/fetchAPI aliases, URL/method validation exceptions, HTTP failure exceptions, and non-throwing failure handling.
4. **TypeScript Strict Type Check**:
   - `node ./node_modules/typescript/bin/tsc --noEmit` completed with **0 errors and 0 warnings**.
5. **Webpack & Laravel Mix Production Build**:
   - `node scripts/mix-module.cjs all` compiled successfully with **0 errors, 0 warnings** in ~13.5s.

---

## 6. Modular Database Architecture & Module-Based RBAC Authorization (View/Edit)

Tái cấu trúc và chuẩn hóa toàn diện hệ thống cơ sở dữ liệu và phân quyền theo mô hình Modular độc lập:

### 1. Phân vùng Database Migrations theo từng Module (No Root Pollution)
- **Nguyên tắc**: Toàn bộ các file migration và seeder thuộc về module nào sẽ nằm trong thư mục `database/` tương ứng của module đó, **hoàn toàn không gom ở thư mục `database/` ngoài cùng của Laravel**.
  - `modules/Core/database/`:
    - `migrations/2026_01_01_000001_create_users_table.php` (Bảng `users`, `password_reset_tokens`, `sessions`).
    - `migrations/2026_01_01_000002_create_roles_and_permissions_tables.php` (Bảng `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions`).
    - `migrations/2026_01_01_000003_create_personal_access_tokens_table.php` (Bảng `personal_access_tokens` cho Sanctum API).
    - `seeders/RolePermissionSeeder.php`, `UserSeeder.php`, `CoreDatabaseSeeder.php`.
  - `modules/TiktokAccount/database/`:
    - `migrations/2026_01_01_000010_create_tiktok_accounts_table.php` (Hợp nhất đầy đủ các trường: `username`, `sec_uid`, `nickname`, `avatar_url`, `avatar_path`, `profile_url`, `bio`, `followers_count`, `following_count`, `likes_count`, `video_count`, `is_verified`, `status`, `crawled_at`, `last_crawled_at`).
    - `seeders/TiktokAccountSeeder.php`.
  - `modules/Crawler/database/`:
    - `migrations/2026_01_01_000020_create_crawl_jobs_table.php` (Bảng `crawl_jobs` gồm `code`, `name`, `source_type`, `status`, `data_crawls`, `total_accounts`, `success_count`, `failed_count`, `error_message`, `started_at`, `finished_at`, `created_by`).
    - `migrations/2026_01_01_000021_create_crawl_results_table.php` (Bảng `crawl_results` gồm `crawl_job_id`, `tiktok_account_id`, `username`, `nickname`, `avatar_url`, `avatar_path`, `profile_url`, `followers_count`, `following_count`, `likes_count`, `video_count`, `bio`, `status`, `raw_data`, `error_message`, `crawled_at`).
    - `seeders/CrawlJobSeeder.php`.
  - **Root `database/migrations/`**: Chỉ giữ lại các bảng hạ tầng mặc định của Laravel Framework (`cache`, `jobs`). Toàn bộ migration nghiệp vụ cũ được dọn sạch.
- **Tự động khám phá Migrations (`CoreServiceProvider::registerModuleMigrations`)**:
  - `CoreServiceProvider` tự động duyệt danh sách tất cả các module đang kích hoạt trong `ModuleRegistry` và gọi `$this->loadMigrationsFrom($migrationDir)`.
  - `php artisan migrate`, `php artisan migrate:fresh --seed` và test suite (`RefreshDatabase`) tự động nhận diện và thực thi toàn bộ migration của module một cách chính xác theo thứ tự timestamp.
- **Tự động tải Seeders qua Composer PSR-4**:
  - `composer.json` khai báo autoload PSR-4 cho seeders từng module: `Modules\Core\Database\Seeders\`, `Modules\Crawler\Database\Seeders\`, `Modules\TiktokAccount\Database\Seeders\`.

### 2. Hệ thống Authentication & Phân Quyền View/Edit theo Module
- **Phân chia Quyền hạn theo Module (View & Edit)**:
  - Phân vùng quyền theo từng module: `crawler`, `tiktok_account`, `core`, `user`.
  - Mỗi module cung cấp 2 cấp độ phân quyền rõ ràng:
    - `*.view`: Quyền xem danh sách, chi tiết, thống kê, báo cáo của module.
    - `*.edit`: Quyền tạo mới, chỉnh sửa, xóa, chạy tác vụ cào dữ liệu của module.
  - Slug permissions:
    - `crawler.view`, `crawler.edit`
    - `tiktok_account.view`, `tiktok_account.edit`
    - `core.view`, `core.edit`
    - `user.view`, `user.edit`
- **Vai trò người dùng (Roles)**:
  - `admin` (Super Administrator): Toàn quyền View & Edit trên mọi module (tự động bypass mọi kiểm tra).
  - `manager` (Operations Manager): Quyền View & Edit cho `crawler`, `tiktok_account`, `core`; quyền View cho `user`.
  - `editor` (Crawler Specialist): Quyền View & Edit cho `crawler`, `tiktok_account`; quyền View cho `core`.
  - `viewer` (Data Viewer / Guest Auditor): Chỉ có quyền View cho `crawler`, `tiktok_account`, `core`; tuyệt đối không có quyền Edit.
- **Logic kiểm tra phân quyền (`HasRolesAndPermissions`)**:
  - `canAccessModule(string $module, string $action = 'view'): bool`:
    - Nếu là `admin` -> luôn cho phép (`true`).
    - Nếu kiểm tra quyền `view`: Cho phép nếu người dùng có quyền `{$module}.view` **HOẶC** có quyền `{$module}.edit` (vì ai có quyền sửa thì mặc nhiên có quyền xem).
    - Nếu kiểm tra quyền `edit`: Bắt buộc phải có quyền `{$module}.edit`.
  - `getModulePermissions()`: Trả về ma trận quyền Boolean theo từng module (`['crawler' => ['view' => true, 'edit' => true], ...]`) để giao diện frontend dễ dàng ẩn/hiện các nút bấm (Tạo, Sửa, Xóa, Chạy) hoặc điều hướng.
- **Middleware Phân Quyền (`CheckModulePermission` / `module.permission`)**:
  - Sử dụng trong route: `->middleware('module.permission:crawler,view')` hoặc `->middleware('module.permission:crawler,edit')`.
  - Tự động trả về HTTP 401 khi chưa xác thực và HTTP 403 Forbidden kèm JSON thông báo rõ ràng khi không đủ quyền.
- **Auth Controller API (`Modules\Core\Controllers\AuthController`)**:
  - `POST /{admin_path}/api/core/auth/login`: Xác thực email/password, cấp Sanctum Bearer Token, trả về user profile kèm roles, permissions và `module_permissions` matrix.
  - `POST /{admin_path}/api/core/auth/logout`: Thu hồi token hiện tại và đăng xuất session.
  - `GET /{admin_path}/api/core/auth/me`: Lấy thông tin user hiện tại kèm token status và ma trận phân quyền module.
  - `GET /{admin_path}/api/core/auth/permissions`: Trả về danh mục toàn bộ permissions trong hệ thống nhóm theo module.
- **Tài khoản Demo mặc định (Mật khẩu: `password`)**:
  - Admin: `admin@cms.com` (Role: `admin`)
  - Manager: `manager@cms.com` (Role: `manager`)
  - Editor: `editor@cms.com` (Role: `editor`)
  - Viewer: `viewer@cms.com` (Role: `viewer`)
- **Kết quả Kiểm thử Tự động**:
  - 51/51 tests passed 100% (228 assertions), bao gồm bộ test feature toàn diện `AuthAndModulePermissionTest`.

---

## 7. Component Reuse Standardization & Elimination of Redundant Wrappers

Tối ưu hóa và chuẩn hóa việc tái sử dụng toàn bộ hệ thống UI components cốt lõi từ `@core/components/`, loại bỏ triệt để các component bọc trung gian (wrappers) và định nghĩa trùng lặp:

1. **Tái sử dụng trực tiếp `TableComponent` (`@core/components/Table`)**:
   - Loại bỏ component bọc thừa `RecentCrawlJobsTable.tsx` trên Dashboard (trước đây định nghĩa lại toàn bộ schema cột bảng crawl job).
   - `DashboardPage` trực tiếp sử dụng `<TableComponent<CrawlJobItem> ... />` cùng các thành phần chuẩn hóa `StatusTag` và `EmptyState`.
2. **Chuẩn hóa `PageHeader` (`@core/components/PageHeader`) toàn hệ thống**:
   - Nâng cấp `PageHeader` hỗ trợ `onBack`, `subtitle` (alias với `description`), `breadcrumbs`, `extra`.
   - Thay thế toàn bộ các header dựng thủ công (bằng `<Space><Title><Text>`) và loại bỏ wrapper trung gian `DashboardHeader.tsx`:
     - `DashboardPage` (Bảng Điều Khiển Tổng Quan)
     - `CrawlJobsPage` (Danh sách Crawl Jobs)
     - `CrawlJobDetailPage` (Chi tiết Crawl Job #ID kèm nút Quay lại và Thao tác)
     - `CreateCrawlJobPage` (Tạo Crawl Job kèm nút Quay lại)
     - `EditCrawlJobPage` (Chỉnh sửa Crawl Job #ID kèm nút Quay lại)
     - `TiktokAccountPage` (TikTok Accounts)
     - `TiktokAccountDetailPage` (Chi tiết tài khoản TikTok kèm nút Quay lại và Thao tác)
     - `TiktokAccountEditPage` (Chỉnh sửa thông tin tài khoản kèm nút Quay lại)
3. **Chuẩn hóa `CardKPI` (`@core/components/CardKPI`)**:
   - Tái sử dụng trên Dashboard và `TiktokAccountDetailPage` (Followers, Following, Likes) thay thế thẻ `<Statistic>` thô.
4. **Chuẩn hóa `StatusTag` (`@core/components/StatusTag`)**:
   - Sử dụng nhất quán cho toàn bộ các trạng thái: active/inactive, pending/running/completed/failed, loại bỏ các thẻ `<Tag color=...>` tự định nghĩa rời rạc.
5. **Chuẩn hóa `ConfirmDialog` (`@core/components/ConfirmDialog`)**:
   - Tái cấu trúc `DeleteAccount.tsx` tái sử dụng `ConfirmDialog` thay cho `CustomModal` tự tạo.
6. **Chuẩn hóa `SpinComponent` (`@core/components/SpinComponent`)**:
   - Sử dụng cho Suspense fallback tại `AppRouter.tsx` thay thế `<div><Spin size="large" /></div>` thủ công.

---

## 8. Unified Modular List Layout (`ListLayout` Component)

Xây dựng thành phần layout danh sách chuẩn hóa dùng chung toàn diện cho mọi module: [`modules/Core/resources/js/components/ListLayout.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ListLayout.tsx), khai thác tối đa các component có sẵn của Ant Design:

### 1. Cấu trúc và Tính năng
- **Tích hợp `PageHeader`**:
  - Tiêu đề danh sách (`title`), mô tả phụ (`subtitle` / `description`), `breadcrumbs`, nút quay lại (`onBack`).
  - Nút thêm mới tự động (`onAdd`, `addText`, `addIcon`): hỗ trợ truyền callback function hoặc đường dẫn route dạng string để tự động chuyển trang.
  - Vùng thao tác bổ sung (`headerExtra`) cho các hành vi như Xuất file (Export), Nhập file (Import).
- **Render Động Search (Ant Design `Input.Search` + `Select`)**:
  - Thanh tìm kiếm từ khóa với icon kính lúp, `allowClear`, hỗ trợ chọn trường tìm kiếm mục tiêu qua `searchFields` (render `addonBefore` bằng `<Select>`).
- **Render Động Filter (Ant Design `Form` + `Form.Item`)**:
  - Quản trị form lọc động thông qua Ant Design Form instance (`Form.useForm()`), hỗ trợ tự động trigger `onValuesChange` và `onFilterChange`.
  - Hỗ trợ đa dạng các field component có sẵn của Ant Design:
    - `select`: `<Select allowClear showSearch options={...} />`
    - `dateRange`: `<DatePicker.RangePicker allowClear />`
    - `date`: `<DatePicker allowClear />`
    - `number`: `<InputNumber />`
    - `radio`: `<Radio.Group optionType="button" buttonStyle="solid" />`
    - `custom`: `filter.render(form)`
  - Tự động gom nhóm bộ lọc nâng cao (Collapsible advanced filters) khi có > 3 trường lọc.
  - Nút Đặt lại bộ lọc (`form.resetFields()`) và nút Làm mới dữ liệu (`onRefresh`, `refreshing`).
- **Render Động Cột Bảng (Dynamic Columns Rendering)**:
  - Cho phép cấu hình và truyền mảng cột `columns: TableColumn<T>[]` động vào `ListLayout`, tự động truyền trực tiếp xuống `TableComponent`.
  - Hỗ trợ đầy đủ `renderColumns`, `prependColumns`, `extraColumns` để linh hoạt tùy biến hiển thị tại từng trang mà không can thiệp vào logic lõi.
  - Loại bỏ hoàn toàn popover cài đặt cột và dropdown mật độ hiển thị để giao diện tối giản, tập trung và sạch sẽ.
  - Trong `TableComponent`: Loại bỏ logic search trong column để giữ component bảng hoàn toàn thuần túy và dễ tái sử dụng.
- **Áp dụng thực tế**:
  - [`CrawlJobsPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobsPage.tsx): Tích hợp trực tiếp `ListLayout` với `crawlJobColumnConfig`, tìm kiếm từ khóa và lọc trạng thái.
  - [`TiktokAccountPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx): Tích hợp trực tiếp `ListLayout` với `columnConfig`, tìm kiếm theo username/nickname và lọc trạng thái hoạt động.

---

## 9. Component Audit, Complete Redundant Removal & 100% English Web Localization

Rà soát toàn diện hệ thống frontend component, loại bỏ dứt điểm các component thừa/trùng lặp, tối đa hóa khả năng dùng chung và chuẩn hóa 100% ngôn ngữ giao diện web và chú thích code sang tiếng Anh:

### 1. Loại Bỏ Triệt Để Các Component Dư Thừa & Trùng Lặp
- **`modules/Core/resources/js/components/SearchColumnTable.tsx`**:
  - Đã xóa hoàn toàn. Tính năng tìm kiếm theo cột cũ được thay thế bằng thanh tìm kiếm động và bộ lọc tại thanh công cụ của `ListLayout`.
- **`modules/Crawler/resources/js/components/CrawlJobListTable.tsx`**:
  - Đã xóa hoàn toàn. `CrawlJobsPage.tsx` chuyển sang render trực tiếp `ListLayout` với cấu hình cột `crawlJobColumnConfig`.
- **`modules/TiktokAccount/resources/js/components/TiktokAccountTableList.tsx`**:
  - Đã xóa hoàn toàn. `TiktokAccountPage.tsx` chuyển sang render trực tiếp `ListLayout` với cấu hình cột `tiktokAccountColumnConfig`.
- **Xóa bỏ các export và import mồ côi**:
  - `modules/Core/resources/js/components/index.ts` chỉ export các component dùng chung thực thụ (`CardKPI`, `CustomModal`, `ConfirmDialog`, `PageHeader`, `EmptyState`, `StatusTag`, `TableComponent`, `SpinComponent`, `ListLayout`).

### 2. Tinh Chỉnh & Tái Sử Dụng Component Dùng Chung
- **`TableComponent` ([`Table.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/Table.tsx))**:
  - Loại bỏ logic dropdown search trong từng cột, giữ component bảng thuần túy và ổn định.
  - Chuyển đổi định dạng tổng số mục phân trang sang tiếng Anh: `Total ${t} items (${range[0]}-${range[1]})`.
  - Toàn bộ chú thích trong code được viết bằng tiếng Anh.
- **`ListLayout` ([`ListLayout.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ListLayout.tsx))**:
  - Chuyển đổi toàn bộ nút bấm và badge trên thanh công cụ sang tiếng Anh: "Reset", "Collapse", "Advanced", "selected", "Refresh data".
- **`ConfirmDialog` ([`ConfirmDialog.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ConfirmDialog.tsx))**:
  - Nút bấm mặc định chuyển sang tiếng Anh: `okText = 'Confirm'`, `cancelText = 'Cancel'`.
- **`CustomModal` ([`CustomModal.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/CustomModal.tsx))**:
  - Nút hủy mặc định chuyển sang tiếng Anh: `cancelText = 'Cancel'`.
- **`EmptyState` ([`EmptyState.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/EmptyState.tsx))**:
  - Dòng thông báo mặc định chuyển sang tiếng Anh: `description = 'No data available'`.
- **`CrawlResultTable` ([`CrawlResultTable.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/components/CrawlResultTable.tsx))**:
  - Thành phần bảng hiển thị kết quả cào tài khoản TikTok được tái sử dụng xuyên suốt tại cả 2 module: `CrawlJobDetailPage` (Crawler) và `CrawlHistory` (TiktokAccount).

### 3. Chuẩn Hóa 100% Tiếng Anh Trên Giao Diện Web (Rule 9)
Toàn bộ văn bản giao diện, nhãn, nút bấm, thông báo toast, validate form và chú thích mã nguồn đã được chuyển sang tiếng Anh:
- **Trang Dashboard & Thư mục UI (`DashboardPage.tsx`, `pages/ui/*.tsx`)**:
  - Header: "System Dashboard", "Centralized monitoring of crawl jobs, TikTok accounts, and real-time engagement metrics.", "Refresh", "Create Crawl Job", "Updated: ...", "Last fetched timestamp".
  - Hero KPI Cards: "Total Crawl Jobs" (completed / failed), "Target Accounts" (success / failed), "Stored Profiles" (active / inactive), "Total Crawled Likes" (followers / following).
  - Analytical Panels: "Crawl Engine Performance", "TikTok Profile Ecosystem", "Completed Jobs", "Failed Jobs", "Successful Accounts", "Failed / Skipped Accounts", "Pending / Running Jobs", "Active profile rate", "Total Followers", "Total Likes", "Total Following", "Active Profiles", "Inactive / Paused Accounts".
  - Quick Shortcuts & System Status: "Quick Actions", "Create New Crawl Job", "Manage Crawl Jobs", "Explore TikTok Profiles", "CMS Architecture: Ureka Modular", "Crawl Pipeline: Async Queue", "Engine Status: Ready".
  - Bảng hoạt động gần nhất: "Recent Crawl Activities", "View all", các cột (`Job ID`, `Source Type`, `Progress`, `Status`, `Created At`, `Action`), "View", `EmptyState` ("No crawl jobs created yet", "Create First Job").
- **Trang & Thành phần Module Crawler**:
  - `CrawlJobsPage.tsx`: "Crawl Jobs List", "Create Job", subtitle, filters ("All statuses"), Popconfirm ("Delete crawl job", "Are you sure you want to delete this crawl job?", "Delete", "Cancel"), toast messages ("Crawl job deleted successfully", "Failed to delete crawl job").
  - `CreateCrawlJobPage.tsx`: "Create Crawl Job", subtitle, radio options ("Username", "URL", "From Database", "Count"), labels ("Account Source", "Username List", "TikTok URL List", "Account Count"), placeholders, hint extras, validation rules ("Please enter at least one username", "Please enter at least one URL", "Please enter account count"), buttons ("Cancel", "Create Job").
  - `EditCrawlJobPage.tsx`: "Edit Crawl Job #ID", subtitle, alerts ("This crawl job is no longer pending."), labels, placeholders, buttons ("Cancel", "Save Changes"), toast messages.
  - `CrawlJobDetailPage.tsx`: "Crawl Job Detail #ID", subtitle, Popconfirm, "Crawl Results", toast messages.
  - `TiktokAccountSelect.tsx`: label ("Saved Accounts"), validation message ("Please select at least one account"), placeholders ("Select accounts", "No accounts available", "Loading accounts...").
- **Trang & Thành phần Module TikTok Account**:
  - `TiktokAccountPage.tsx`: "TikTok Accounts", "Account list", search and filter placeholders.
  - `TiktokAccountDetailPage.tsx`: "Account @username", KPI cards, Descriptions, "Profile information", "Crawl History".
  - `TiktokAccountEditPage.tsx`: "Edit TikTok Account", subtitle ("Manually update TikTok account profile details."), button ("Save Changes").
  - `AccountField.tsx`: validation messages ("Please enter username", "Invalid URL format", "Please enter following count", "Please enter followers count", "Please enter likes count"), placeholders ("Enter TikTok username", "Enter following count", "Enter followers count", "Enter likes count").
- **Đặc tả Chú Thích API (Rule 9)**:
  - Cả 2 service gọi API frontend [`crawlJob.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/Action/crawlJob.ts) và [`tiktokAccount.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/Action/tiktokAccount.ts) được chú thích rõ ràng cú pháp và phương thức gọi endpoint theo chuẩn:
    - `API: GET /crawler/crawl-job`
    - `API: POST /crawler/crawl-job`
    - `API: GET /crawler/crawl-job/{id}`
    - `API: PUT /crawler/crawl-job/{id}`
    - `API: DELETE /crawler/crawl-job/{id}`
    - `API: POST /crawler/crawl-job/{id}/start`
    - `API: GET /crawler/crawl-job/{id}/results`
    - `API: GET /crawler/crawl-job/statistics-summary`
    - `API: GET /tiktok-account/tiktok-account`
    - `API: GET /tiktok-account/tiktok-account/{id}`
    - `API: PUT /tiktok-account/tiktok-account/{id}`
    - `API: DELETE /tiktok-account/tiktok-account/{id}`
    - `API: PATCH /tiktok-account/tiktok-account/{id}/status`
    - `API: GET /tiktok-account/tiktok-account/{id}/results`
    - `API: GET /tiktok-account/tiktok-account/statistic-summary`
- **Kết quả Kiểm tra Tuyệt đối**:
  - Tìm kiếm ký tự tiếng Việt (`[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]`) trên toàn bộ thư mục `modules/`: **0 kết quả** (hoàn toàn 100% tiếng Anh).
  - `tsc --noEmit`: 0 lỗi.
  - `php artisan test`: 51/51 tests passed 100% (228 assertions).
  - `npm run mix:prod`: Biên dịch thành công 100% (Core 68.3 KiB, Crawler 79.8 KiB, TiktokAccount 76.5 KiB).




