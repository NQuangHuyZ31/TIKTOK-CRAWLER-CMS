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
│   ├── Auth/                            # Authentication & RBAC Access Control module
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # auth.ts (login, logout, me, forgot/reset password, permissions)
│   │   │       ├── components/          # AuthGuard, PermissionGate, RoleGate, ChangePasswordModal
│   │   │       ├── configs/             # authConfig.ts
│   │   │       ├── pages/               # LoginPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage
│   │   │       ├── routes/              # route.ts (/login, /forgot-password, /reset-password, /profile)
│   │   │       └── store/               # authSlice.ts, authThunks.ts
│   │   ├── routes/
│   │   │   └── api.php                  # Auth API routes (/auth/login, logout, me, permissions...)
│   │   └── src/
│   │       ├── Controllers/             # AuthController, PermissionController
│   │       ├── Providers/               # AuthServiceProvider
│   │       ├── Repositories/            # AuthRepository, AuthRepositoryInterface
│   │       ├── Requests/                # LoginRequest, ForgotPasswordRequest, ResetPasswordRequest...
│   │       └── Services/                # AuthService
│   ├── Core/                            # Core shared infrastructure module
│   │   ├── configs/
│   │   │   ├── admin.php                # Admin path & API path configuration
│   │   │   └── modules.php              # Module routes mapping & disabled modules
│   │   ├── resources/
│   │   │   ├── css/app.css              # Global styles & Tailwind
│   │   │   ├── js/
│   │   │   │   ├── Action/api.ts        # Central API client (strict .env baseURL)
│   │   │   │   ├── components/          # Generic UI widgets (Table, CardKPI, UploadComponent, ResourceForm, Modal, etc.)
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
│   │       ├── Middleware/              # CheckModulePermission
│   │       ├── Providers/               # CoreServiceProvider, ModuleServiceProvider
│   │       ├── Repositories/            # BaseRepository, BaseRepositoryInterface
│   │       ├── Support/                 # ModuleRegistry, DynamicRouteResovle
│   │       ├── Traits/                  # ApiResponseTrait, HasRolesAndPermissions
│   │       └── Utils/                   # FetchApi, UploadFile, CheckFileUpload
│   ├── Crawler/                         # Crawler management module
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # crawlJob.ts
│   │   │       ├── components/          # CrawlJobListTable, CrawlResultTable, etc.
│   │   │       ├── configs/             # tableConfig.ts
│   │   │       ├── pages/               # CrawlJobsPage, CrawlJobDetailPage, CrawlJobFormPage (Create & Edit unified)
│   │   │       ├── routes/              # route.ts
│   │   │       └── store/               # crawlJobSlice.ts, crawlJobThunks.ts
│   │   ├── routes/
│   │   │   └── api.php                  # Crawler job API endpoints (handled by Core dynamic routing)
│   │   └── src/
│   │       ├── Controllers/             # CrawlJobController, CrawlResultController (extend BaseController)
│   │       ├── Models/                  # CrawlJob, CrawlResult
│   │       ├── Providers/               # CrawlerServiceProvider
│   │       ├── Repositories/            # CrawlJobRepository, CrawlResultRepository
│   │       ├── Requests/
│   │       ├── Resources/
│   │       └── Services/
│   ├── TiktokAccount/                   # TikTok account management module
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # tiktokAccount.ts
│   │   │       ├── components/          # TiktokAccountTableList, DeleteAccount
│   │   │       ├── configs/             # columnConfig.ts
│   │   │       ├── pages/               # TiktokAccountPage, DetailPage, EditPage
│   │   │       ├── routes/              # route.ts
│   │   │       └── store/               # tiktokAccountSlice.ts, tiktokAccountThunks.ts
│   │   ├── routes/
│   │   │   └── api.php                  # TikTok account API endpoints
│   │   └── src/
│   │       ├── Controllers/             # TiktokAccountController (extends BaseController)
│   │       ├── Models/                  # TiktokAccount
│   │       ├── Providers/               # TiktokAccountServiceProvider
│   │       ├── Repositories/            # TiktokAccountRepository
│   │       ├── Requests/
│   │       ├── Resources/
│   │       └── Services/
│   ├── System/                          # System Configuration & Runtime Diagnostics
│   │   ├── database/
│   │   │   └── migrations/              # create_system_settings_table.php
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # systemSetting.ts
│   │   │       ├── configs/             # settingsConfig.ts
│   │   │       ├── pages/               # SystemSettingsPage.tsx
│   │   │       ├── routes/              # route.ts (/system/settings)
│   │   │       └── index.ts             # Auto-register into Core Route Registry
│   │   ├── routes/
│   │   │   └── api.php                  # System API routes documentation
│   │   └── src/
│   │       ├── Controllers/             # SystemSettingController (extends BaseController)
│   │       ├── Models/                  # SystemSetting
│   │       ├── Providers/               # SystemServiceProvider
│   │       ├── Repositories/            # SystemSettingRepository, SystemSettingRepositoryInterface
│   │       ├── Requests/                # UpdateSystemSettingsRequest
│   │       ├── Resources/               # SystemSettingResource
│   │       └── Services/                # SystemSettingService
│   ├── Role/                            # Role RBAC Domain Module
│   │   ├── database/
│   │   │   ├── migrations/              # create_roles_tables.php
│   │   │   └── seeders/                 # RoleSeeder.php
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # role.ts
│   │   │       ├── components/          # RoleTableList, RoleFormModal (injects PermissionMatrix)
│   │   │       ├── configs/             # roleTableConfig.ts
│   │   │       ├── pages/               # RolesPage.tsx
│   │   │       ├── routes/              # route.ts (/role)
│   │   │       └── index.ts             # Auto-register into Core Route Registry
│   │   ├── routes/
│   │   │   └── api.php                  # Role API routes documentation
│   │   └── src/
│   │       ├── Controllers/             # RoleController (extends BaseController)
│   │       ├── Models/                  # Role (standalone Eloquent model)
│   │       ├── Providers/               # RoleServiceProvider
│   │       ├── Repositories/            # RoleRepository, RoleRepositoryInterface
│   │       ├── Requests/                # StoreRoleRequest, UpdateRoleRequest
│   │       ├── Resources/               # RoleResource
│   │       └── Services/                # RoleService
│   ├── Permission/                      # Permission Matrix & Catalog Module
│   │   ├── database/
│   │   │   ├── migrations/              # create_permissions_table.php
│   │   │   └── seeders/                 # PermissionSeeder.php
│   │   ├── resources/
│   │   │   └── js/
│   │   │       ├── Action/              # permission.ts
│   │   │       ├── components/          # PermissionMatrix.tsx (canonical Ant Design matrix)
│   │   │       └── index.ts             # Exports PermissionMatrix & action APIs
│   │   ├── routes/
│   │   │   └── api.php                  # Permission API routes documentation
│   │   └── src/
│   │       ├── Controllers/             # PermissionController (extends BaseController)
│   │       ├── Models/                  # Permission (standalone Eloquent model)
│   │       ├── Providers/               # PermissionServiceProvider
│   │       ├── Repositories/            # PermissionRepository, PermissionRepositoryInterface
│   │       ├── Resources/               # PermissionResource
│   │       └── Services/                # PermissionService
│   └── User/                            # User Management Module
│       ├── database/
│       │   ├── migrations/              # create_users_table.php
│       │   └── seeders/                 # UserSeeder.php
│       ├── resources/
│       │   └── js/
│       │       ├── Action/              # user.ts
│       │       ├── components/          # UserKpiCards, RoleSelector, PermissionMatrixSelector, UserColumn
│       │       ├── configs/             # columnConfig.ts, userConstants.ts
│       │       ├── pages/               # UserListPage.tsx, UserDetailPage.tsx, UserFormPage.tsx
│       │       ├── routes/              # route.ts (/user, /user/create, /user/:id, /user/:id/edit)
│       │       ├── store/               # userSlice.ts, userThunks.ts
│       │       └── index.ts             # Auto-register into Core Route Registry
│       ├── routes/
│       │   └── api.php                  # User API routes with module.permission middleware
│       └── src/
│           ├── Controllers/             # UserController (extends BaseController)
│           ├── Models/                  # User (extends App\Models\User)
│           ├── Providers/               # UserServiceProvider
│           ├── Repositories/            # UserRepository, UserRepositoryInterface
│           ├── Requests/                # StoreUserRequest, UpdateUserRequest
│           ├── Resources/               # UserResource
│           └── Services/                # UserService
├── public/
│   ├── entrypoints.json                 # Manifest mapping JS/CSS assets per module
│   ├── modules/                         # Compiled modular bundles (No file copy)
│   │   ├── Core/
│   │   │   ├── vendor.js                # Single shared vendor bundle (React, Antd, Axios, Redux...)
│   │   │   ├── index.js                 # Core code bundle (~40 KiB minified)
│   │   │   └── app.css                  # Core CSS bundle (~14 KiB minified)
│   │   ├── Crawler/
│   │   │   └── index.js                 # Crawler module bundle (~71 KiB minified)
│   │   ├── TiktokAccount/
│   │   │   └── index.js                 # TiktokAccount module bundle (~65 KiB minified)
│   │   ├── System/
│   │   │   └── index.js                 # System module bundle (~57 KiB minified)
│   │   ├── Auth/
│   │   │   └── index.js                 # Auth module bundle (~81 KiB minified)
│   │   └── User/
│   │       └── index.js                 # User module bundle (~98 KiB minified)
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

### E.1 Standardized ResourceForm & CRUD Routes (`/create` & `/:id/edit`)

- **Unified Component**: [`modules/Core/resources/js/components/ResourceForm.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ResourceForm.tsx) provides a consistent form shell across all modules for both Create and Edit operations.
- **Strict Route Conventions**:
  - `/create` $\rightarrow$ Create mode (`isEdit = false`, `id = undefined`). Automatically calls `onCreate(values)`.
  - `/:id/edit` (e.g. `/1/edit`) $\rightarrow$ Edit mode (`isEdit = true`, `id = '1'`). Automatically calls `fetchRecord(id)` and `onUpdate(id, values, record)`.
  - Discards `"create"` literal if captured by greedy routing params (`id !== 'create'`).
  - Supports explicit overrides via `isEdit?: boolean` and `id?: string | number` props.
  - Automatically redirects to `redirectUrl` or falls back to `backUrl` upon successful submission.
- **Module Route Alignment**:
  - **Crawler**: `/crawler/crawl-job/create` (Create) and `/crawler/crawl-job/:id/edit` (Edit).
  - **TikTok Accounts**: `/tiktok-account/create` (Create) and `/tiktok-account/:id/edit` (Edit).
  - **Users**: `/user/create` (Create) and `/user/:id/edit` (Edit).
  - **Auth**: Dual route aliases `/login` and `/auth/login` (plus `/forgot-password`, `/reset-password`, `/profile`).

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

---

## 10. Table Action Columns: Fixed Right & Icon-Only Actions with Tooltips

Chuẩn hóa toàn diện cột Thao tác (Action) trên tất cả các bảng dữ liệu trong hệ thống:

### 1. Cố Định Cột Thao Tác Bên Phải (`fixed: 'right'`)
- Cấu hình thuộc tính `fixed: 'right'` kèm chiều rộng cố định xác định (`width`) cho cột `action` trên toàn bộ các schema cấu hình bảng:
  - [`crawlJobColumnConfig`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/configs/tableConfig.ts): `fixed: 'right'`, `width: 110`.
  - [`tiktokAccountColumnConfig`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/configs/columnConfig.ts): `fixed: 'right'`, `width: 110`.
  - `recentJobColumns` ([`DashboardPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/DashboardPage.tsx)): `fixed: 'right'`, `width: 80`.
- **Hiệu quả**: Khi bảng cuộn ngang trên màn hình vừa hoặc nhỏ (nhờ `scroll={{ x: 'max-content' }}` mặc định của `TableComponent`), cột Action luôn được ghim cố định ở cạnh phải, không bị trôi hay ẩn khuất, giúp người dùng thao tác tức thì.

### 2. Chuyển Đổi Nút Thao Tác Sang Icon Kèm Tooltip Trực Quan
Thay thế toàn bộ các chữ link đơn điệu ("Detail", "Edit", "Delete") bằng các nút bấm Icon Ant Design tinh gọn kèm hiệu ứng Tooltip chú thích hành động:
- **Xem chi tiết (Detail / View)**:
  - Icon: `<EyeOutlined style={{ color: '#1677ff' }} />`
  - Bọc trong `<Tooltip title="Detail">` và `<Button size="small" type="text" />`.
- **Chỉnh sửa (Edit)**:
  - Icon: `<EditOutlined style={{ color: '#52c41a' }} />`
  - Bọc trong `<Tooltip title="Edit">` và `<Button size="small" type="text" />`.
  - Chỉ hiển thị trên Crawl Job khi job ở trạng thái `pending`.
- **Xóa (Delete)**:
  - Icon: `<DeleteOutlined />`
  - Bọc trong `<Tooltip title="Delete">` và `<Button size="small" type="text" danger />`.
  - Tích hợp hộp thoại xác nhận an toàn (`Popconfirm` hoặc `ConfirmDialog`).
- **Nâng cấp Component [`DeleteAccount`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/components/DeleteAccount.tsx)**:
  - Bổ sung prop `iconOnly?: boolean`.
  - Khi `iconOnly = true`: Tự động render nút icon `DeleteOutlined` gọn gàng kèm Tooltip "Delete", thích hợp hoàn hảo cho cột action trong bảng dữ liệu.
  - Khi `iconOnly = false`: Render nút bấm đầy đủ kèm text, phù hợp cho thanh tiêu đề trang chi tiết (`PageHeader extra`).


---

## 11. Complete Harmonization & Synchronization: Crawler & TikTok Account Modules

Thực hiện rà soát và đồng bộ hóa toàn diện giữa 2 trang trung tâm của hệ thống: **Crawl Jobs** ([`CrawlJobsPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)) và **TikTok Accounts** ([`TiktokAccountPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx)):

### 1. Đồng Bộ Tiêu Đề & Cấu Trúc Khối `ListLayout`
- **Tiêu đề khối thẻ (`cardTitle`)**:
  - `CrawlJobsPage`: `cardTitle="Crawl Jobs List"`
  - `TiktokAccountPage`: Đồng bộ thành `cardTitle="TikTok Accounts List"` (thay cho `Account list` không đồng nhất).
- **Hành động tạo mới (`onAdd` / `addText`)**:
  - `CrawlJobsPage`: `onAdd="/crawler/crawl-job/create"`, `addText="Create Job"`.
  - `TiktokAccountPage`: `onAdd="/crawler/crawl-job/create"`, `addText="Create Account"`.
- **Thanh tìm kiếm & Bộ lọc động (`filters`)**:
  - Cả 2 trang sử dụng chung chuẩn cấu hình bộ lọc Ant Design Form động từ `ListLayout`, bao gồm dropdown lọc `status` ("All statuses") với giá trị rỗng mặc định.
  - Nút **Reset** trên cả 2 trang kích hoạt chuẩn `dispatch(resetParams())`.

### 2. Chuẩn Hóa Cấu Hình Cột Bảng (`tableConfig.ts` & `columnConfig.ts`)
- **Bổ sung cột `ID` cho TikTok Accounts**:
  - Bổ sung cột `{ title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id }` vào [`tiktokAccountColumnConfig`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/configs/columnConfig.ts), đảm bảo tính tương đồng tuyệt đối với `crawlJobColumnConfig`.
- **Chuẩn hóa chữ hoa tiêu đề cột (Title Case)**:
  - `Total account` $\rightarrow$ `Total Accounts`.
  - `Error message` $\rightarrow$ `Error Message`.
- **Sắp xếp cột số học (Numeric Sorters)**:
  - Bổ sung hàm sắp xếp `sorter` cho tất cả các chỉ số: `Total Accounts`, `Success`, `Failed`, `Followers`, `Following`, `Likes`.
- **Cột Thao Tác (Action Column)**:
  - Thống nhất `width: 120`, `fixed: 'right'`, `title: ''` trên toàn bộ cấu hình cột của cả 2 module.

### 3. Đồng Bộ Trải Nghiệm Thao Tác Dòng Bảng (Action Column & Popconfirm)
- Thống nhất trải nghiệm xóa dòng trực tiếp trên bảng dữ liệu bằng Ant Design `Popconfirm`:
  - `CrawlJobsPage`: `Popconfirm` với thông điệp "Are you sure you want to delete this crawl job?", sau đó gọi API xóa, hiển thị toast thông báo và kích hoạt `dispatch(fetchCrawlJobs(params))` tải lại dữ liệu mới nhất.
  - `TiktokAccountPage`: Chuyển đổi từ modal `ConfirmDialog` sang Ant Design `Popconfirm` với thông điệp "Are you sure you want to delete this account?", sau khi xóa tự động gọi `dispatch(fetchAllTiktokAccounts(params))` để bảo đảm phân trang luôn đủ số dòng.

### 4. Đồng Bộ Định Dạng Dữ Liệu (Formatters: Numbers & Dates)
- Tái sử dụng các utility chuẩn trong `@core/utils`:
  - **Định dạng số**: Sử dụng `formatNumber()` từ [`@core/utils/formatNumber`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/utils/formatNumber.ts) cho tất cả các cột số lượng (`Total Accounts`, `Success`, `Failed`, `Followers`, `Following`, `Likes`).
  - **Định dạng thời gian**: Sử dụng `formatDateTime()` từ [`@core/utils/formatDate`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/utils/formatDate.ts) cho các cột thời gian (`started_at`, `finished_at`, `crawled_at`).
  - **Cột thông tin tài khoản ([`AccountColumn.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/components/AccountColumn.tsx))**:
    - Sửa lỗi prop `orientation="vertical"` thành `direction="vertical"` chuẩn Ant Design.
    - Bổ sung hỗ trợ hiển thị `nickname` tinh tế bên dưới `@{username}`.
  - **Bảng kết quả cào ([`CrawlResultTable.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/components/CrawlResultTable.tsx))**:
    - Tích hợp `formatNumber` và `formatDateTime` cho các cột kết quả crawl, hiển thị đồng nhất cả ở `CrawlJobDetailPage` và `CrawlHistory` (TiktokAccount).

### 5. Chuẩn Hóa Redux Store & Thunks
- **Sửa lỗi chính tả (Typo)**: Thunk `fechAllTiktokAccounts` được sửa thành `fetchAllTiktokAccounts`, đồng thời duy trì alias tương thích ngược `fechAllTiktokAccounts = fetchAllTiktokAccounts`.
- **Thống nhất số lượng bản ghi mặc định (`per_page: 10`)**:
  - Trước đây `tiktokAccountSlice` khởi tạo `per_page: 5`, trong khi `crawlJobSlice` khởi tạo `10`. Đã đồng bộ cả 2 về mặc định `10` bản ghi / trang.
- **Bổ sung action `resetParams`**:
  - `tiktokAccountSlice` được bổ sung reducer `resetParams` đặt lại `page: 1, per_page: 10`, đồng bộ 100% với `crawlJobSlice`.
- **Sửa lỗi phân trang trong [`CrawlHistory.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/components/CrawlHistory.tsx)**:
  - Khắc phục lỗi truyền `setParams` chưa dispatch, chuyển sang `onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}`.

### 6. TikTok Account Module Architecture Refactoring
- **Tách bạch Controller / Service / Repository**:
  - [`TiktokAccountController.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/src/Controllers/TiktokAccountController.php): Sửa lỗi `$modelClass = CrawlResult::class` thành `$modelClass = TiktokAccount::class`, `$resourceClass = TiktokAccountResource::class`, `$searchableColumns = ['username', 'nickname', 'bio']`, `$filterableColumns = ['status']`. Các truy vấn CRUD đơn giản được xử lý trực tiếp qua BaseController và Repository, không gọi service trung gian.
  - [`TiktokAccountRepository.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/src/Repositories/TiktokAccountRepository.php): Kế thừa `BaseRepository` và triển khai `TiktokAccountRepositoryInterface`, xử lý các hàm truy vấn cơ sở dữ liệu chuyên biệt: `getStatisticSummary()`, `getCrawlResults()`, `getUsernamesByIds()`, `updateStatus()`.
  - [`TiktokAccountService.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/src/Services/TiktokAccountService.php): Loại bỏ toàn bộ các phương thức CRUD thuần túy; chỉ giữ lại các nghiệp vụ phức tạp: thẩm định định dạng file avatar (`CheckFileUpload`), lưu trữ disk (`UploadFile`), dọn dẹp file avatar cũ trên disk và thẩm định enum trạng thái hoạt động.
- **Tối ưu hóa Redux Slice & Thunk**:
  - [`tiktokAccountThunks.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks.ts): Loại bỏ các thunk thao tác bản ghi đơn lẻ (`fetchTiktokAccountByID`, `deleteTiktokAccount`, `updateTiktokAccount`, `updateTiktokAccountStatus`, `fetchResultsByAccountID`). Chỉ giữ lại các thunk toàn cục cấp trang: `fetchAllTiktokAccounts` và `fetchStatisticSummary`.
  - [`tiktokAccountSlice.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountSlice.ts): Tinh gọn state, loại bỏ `currentAccount`, `results`, `resultsLoading`, `resultsError`. Chỉ quản lý trạng thái danh sách (`data`, `loading`, `error`, `pagination`, `params`) và `statistics`.
- **Refactor Components & Pages**:
  - [`TiktokAccountPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx): Gọi trực tiếp `tiktokAccountAPI.deleteTiktokAccount(id)` với `Popconfirm` và thông báo toast.
  - [`TiktokAccountDetailPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountDetailPage.tsx): Quản lý state cục bộ với `useState` cho dữ liệu chi tiết tài khoản và lịch sử crawl; tái sử dụng trực tiếp component [`CrawlResultTable`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/components/CrawlResultTable.tsx).
  - [`TiktokAccountEditPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountEditPage.tsx): Quản lý local state cho form chỉnh sửa, gọi API multipart `FormData` với `_method=PUT` để upload avatar.
  - Đã xóa bỏ các component trùng lặp dư thừa: `DeleteAccount.tsx` và `CrawlHistory.tsx`.

---

## 8. Nguyên Nhân & Giải Pháp Lỗi 404 Khi Refresh Trang (SPA Routing)

### 1. Hiện Tượng
- Khi người dùng truy cập trực tiếp hoặc bấm **F5 (Refresh)** ở bất kỳ trang nào thuộc module con (ví dụ: `/admin/crawler/crawl-job`, `/admin/crawler/crawl-job/1`, `/admin/tiktok-account`, `/admin/tiktok-account/1/edit`), giao diện bị chuyển hướng và hiển thị trang **404 - Page Not Found**.
- Ngược lại, khi refresh tại `/admin/dashboard` hoặc điều hướng nội bộ bằng cách click link thì hiển thị bình thường.

### 2. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis)
1. **Khởi tạo và Render sớm của React Root (`app.tsx`)**:
   - Trong mô hình Scoped DOM của Ureka qua Blade template (`app.blade.php`), các thẻ script được nạp tuần tự ở cuối body:
     1. `<script src="/modules/Core/vendor.js"></script>`
     2. `<script src="/modules/Core/index.js"></script>`
     3. `<script src="/modules/Crawler/index.js"></script>`
     4. `<script src="/modules/TiktokAccount/index.js"></script>`
   - `modules/Core/index.js` (từ `app.tsx`) thực thi `createRoot(container).render(<AppRouter />)` ngay lập tức khi file script vừa tải xong.
   - Tại thời điểm này, các thẻ script phía dưới (`Crawler/index.js`, `TiktokAccount/index.js`) **chưa được trình duyệt thực thi**, do đó hàm `registerRoutes()` của các module con chưa được gọi.
   - Kho route `adminRoutes` trong registry lúc này **chỉ có duy nhất route `/dashboard` và `/404`** do Core đăng ký sẵn trong `autoRegister.tsx`.
2. **Hành vi chuyển hướng cưỡng bức của `<Navigate to="/404" replace />`**:
   - Trong [`AppRouter.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/AppRouter.tsx), route bắt lỗi được cấu hình:
     ```tsx
     <Route path="*" element={<Navigate to="/404" replace />} />
     ```
   - Khi refresh tại `/admin/crawler/crawl-job`, React Router so khớp URL hiện tại với danh sách route sẵn có. Vì `/crawler/crawl-job` chưa có trong danh sách, nó khớp với route `*`.
   - Component `<Navigate>` lập tức kích hoạt lệnh `history.replaceState('/admin/404')`, **thay đổi vĩnh viễn URL trên thanh địa chỉ trình duyệt thành `/admin/404`**.
   - Ngay sau đó khi `Crawler/index.js` tải xong và nạp route vào registry, URL của trình duyệt lúc này đã bị đổi thành `/admin/404`, dẫn đến việc người dùng bị giữ lại vĩnh viễn tại trang 404.
   - Trang `/admin/dashboard` không bị lỗi vì `/dashboard` đã được Core đăng ký sẵn đồng bộ từ trước.

### 3. Giải Pháp Đã Triển Khai
1. **Trì hoãn gắn kết React DOM đến `DOMContentLoaded` ([`app.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/app.tsx))**:
   - Bao bọc hàm `mount()` và lắng nghe sự kiện `DOMContentLoaded` (hoặc `setTimeout(mount, 0)` nếu DOM đã nạp xong).
   - Đảm bảo toàn bộ các thẻ script của module con (`Crawler`, `TiktokAccount`) đã hoàn tất chạy `registerRoutes()` trước khi React Router tiến hành so khớp URL đầu tiên.
2. **Loại bỏ chuyển hướng cưỡng bức URL ([`AppRouter.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/AppRouter.tsx))**:
   - Thay thế `<Route path="*" element={<Navigate to="/404" replace />} />` bằng `<Route path="*" element={<NotFound />} />`.
   - Khi gặp route thực sự không tồn tại, hiển thị trực tiếp component `NotFound` mà không can thiệp viết đè URL của trình duyệt, tuân thủ đúng chuẩn UX web.
3. **Đồng bộ tiền tố cấu hình admin ([`modules/Core/routes/web.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/routes/web.php))**:
   - Cập nhật `$adminPrefix` sử dụng `(string) config('admin.admin_path', config('admin.path', 'admin'))` đồng bộ với `CoreServiceProvider`.

### 4. Kết Quả Kiểm Thử & Xác Nhận
- **TypeScript (`npx tsc --noEmit`)**: 0 lỗi (Exit Code 0).
- **Backend Tests (`php artisan test`)**: 54/54 tests passed 100% (244 assertions).
- **Laravel Mix Build (`npm run mix`)**: Biên dịch hoàn tất thành công (`Core`, `Crawler`, `TiktokAccount`).

---

## 9. Component Upload Dùng Chung (`UploadComponent`)

### 1. Giới thiệu tổng quan
Tạo mới component upload dùng chung chuẩn hóa [`UploadComponent.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/UploadComponent.tsx) đặt tại `@core/components/UploadComponent`, hỗ trợ linh hoạt 4 biến thể giao diện đáp ứng mọi nhu cầu tải file trong CMS:
- **`variant="avatar"`**: Khung ảnh đại diện / thẻ ảnh vuông (hoặc tròn) hiển thị ảnh xem trước, tích hợp lớp phủ overlay khi rê chuột gồm: nút xem ảnh phóng to (`EyeOutlined`), nút thay đổi ảnh (`CameraOutlined`), và nút xóa ảnh (`DeleteOutlined`).
- **`variant="dragger"`**: Khung kéo thả file mở rộng (Ant Design `Upload.Dragger`) kèm icon `InboxOutlined`, tiêu đề, mô tả định dạng và danh sách file đã chọn.
- **`variant="button"`**: Nút bấm tải file đơn giản chuẩn Ant Design (`Button` + `UploadOutlined`) kèm danh sách file bên dưới.
- **`variant="picture-card"`**: Lưới thẻ ảnh dạng thumbnail hỗ trợ tải nhiều ảnh, có modal phóng to khi nhấn xem trước.

### 2. Các Tính Năng Nổi Bật & Tối Ưu Hóa
- **Tối ưu không cần truyền `onChange`**: Tương thích tự động 100% với Ant Design `<Form.Item name="avatar">`. Khi đặt bên trong `Form.Item`, component tự động nhận `value` và kích hoạt cập nhật giá trị form (chứa trực tiếp đối tượng `File` sạch hoặc `null` khi xóa) mà **không bắt buộc page cha phải truyền prop `onChange`** hay viết hàm xử lý sự kiện.
- **Tự động hiển thị ảnh xem trước khi file thay đổi (Instant Preview)**: Tạo `Object URL` ngay lập tức từ `File` (`URL.createObjectURL(file)`) và hiển thị trực tiếp lên khung ảnh, đồng thời quản lý giải phóng bộ nhớ (`URL.revokeObjectURL`) tránh memory leak.
- **Thẩm định dung lượng file tự động (`maxSizeMB`)**: Mặc định 5MB (hoặc tùy biến theo prop). Tự động chặn file vượt quá dung lượng và hiển thị thông báo lỗi bằng Ant Design `message.error`.
- **Thẩm định định dạng MIME (`accept`)**: Hỗ trợ lọc theo MIME (ví dụ: `image/*`, `.pdf`, `.xlsx`) và hiển thị cảnh báo nếu sai định dạng.
- **Modal xem trước tích hợp**: Tích hợp sẵn Ant Design `Modal` phóng to ảnh xem trước khi người dùng nhấn biểu tượng con mắt mà không cần viết thêm modal hay state ngoài page.
- **Xóa bỏ component trùng lặp `AvatarUpload.tsx`**: Loại bỏ hoàn toàn component đơn lẻ [`AvatarUpload.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/components/AvatarUpload.tsx) trong module `TiktokAccount`. Trang [`TiktokAccountEditPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountEditPage.tsx) chuyển sang gọi trực tiếp `<UploadComponent variant="avatar" />` đặt bên trong `<Form.Item name="avatar">`, xóa bỏ toàn bộ `useState` quản lý preview và FileReader thủ công.

---

## 10. Form Resource Dùng Chung Cho Create & Edit (`ResourceForm`)

### 1. Giới thiệu tổng quan
Tạo mới component form dùng chung tối giản, tinh gọn [`ResourceForm.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ResourceForm.tsx) đặt tại `@core/components/ResourceForm`, cho phép phát triển các chức năng Tạo mới (Create) và Chỉnh sửa (Edit) trong **một trang duy nhất** mà không phải phân tách thành hai file trang riêng biệt.

Component được tối ưu loại bỏ hoàn toàn cấu hình schema cồng kềnh, **cho phép lập trình viên render trực tiếp các input chuẩn Ant Design `<Form.Item>` ngay trong JSX code**:
```tsx
<ResourceForm
    resourceName="TikTok Account"
    fetchRecord={async (id) => tiktokAccountAPI.getTiktokAccountByID(id)}
    onUpdate={async (id, values) => tiktokAccountAPI.updateTiktokAccount(id, values)}
    backUrl={(ctx) => `/tiktok-account/${ctx.id || ''}`}
>
    <Form.Item name="username" label="Username">
        <Input placeholder="Enter username" />
    </Form.Item>

    <Form.Item name="avatar" label="Avatar" extra="Supported formats: JPG, PNG, WEBP. Max size: 2MB.">
        <UploadComponent variant="avatar" maxSizeMB={2} accept="image/*" />
    </Form.Item>
</ResourceForm>
```

### 2. Các Tính Năng & Tối Ưu Hóa Cốt Lõi
- **Tự động nhận diện Mode (`mode: 'create' | 'edit'`)**: Tự động trích xuất `id` từ URL qua `useParams()` của React Router. Nếu URL có chứa `:id` (hoặc `recordId`), component chuyển sang chế độ `edit`; ngược lại chuyển sang `create`. Có thể ghi đè thủ công bằng prop `mode`.
- **Tự động Fetch & Điền dữ liệu ban đầu (Edit Mode)**: Khi ở chế độ Edit, component tự động gọi hàm `fetchRecord(id)`, hiển thị trạng thái loading quay tròn (`Spin`), xử lý lỗi tải dữ liệu với banner `Alert` và nút `Retry`, đồng thời tự động gọi `form.setFieldsValue()` (có hỗ trợ hàm tiền xử lý `transformInitialValues`).
- **Không tự động render theo Initial**: Form không phụ thuộc vào schema cố định để render layout; toàn bộ `<Form.Item>` được viết tự nhiên trong code JSX hoặc qua render-prop `children: ({ form, mode, isEdit, record }) => ReactNode`.
- **Tự động Xử lý Submit & Chuyển hướng**: Tự động kích hoạt `onCreate(payload)` hoặc `onUpdate(id, payload, record)` (hoặc hàm tổng quát `onSubmit`), hiển thị thông báo thành công qua Ant Design `message.success`, khóa nút submit chống double-submit (`loading={submitting}`), và tự động điều hướng theo `redirectUrl`.
- **Thanh tác vụ chuẩn hóa**: Tự động sinh nút Cancel (điều hướng lùi hoặc về `backUrl`), nút Submit (tự động đổi text tương ứng `Create [Resource]` / `Save Changes`), và hỗ trợ nút tùy chỉnh qua `extraActions`.
- **Tích hợp liền mạch với `UploadComponent`**: Dễ dàng nhúng `<UploadComponent>` bên trong `<Form.Item>` mà không cần truyền `onChange` hay quản lý state ảnh thủ công.

### 3. Áp dụng Thực tế trong Hệ thống
1. **Module Crawler ([`CrawlJobFormPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobFormPage.tsx))**:
   - Hợp nhất hai trang độc lập `CreateCrawlJobPage.tsx` và `EditCrawlJobPage.tsx` thành một trang duy nhất `CrawlJobFormPage.tsx`.
   - Cấu hình route: cả `/crawler/crawl-job/create` và `/crawler/crawl-job/:id/edit` đều trỏ về `CrawlJobFormPage`.
   - Render trực tiếp các input tùy biến bằng code qua `children`: `Radio.Group` chọn nguồn tài khoản, dynamic `TextArea` theo username/url, component `TiktokAccountSelect` từ database, và `InputNumber` theo số lượng.
   - Đã xóa bỏ 2 file trang dư thừa: `CreateCrawlJobPage.tsx` và `EditCrawlJobPage.tsx`.
2. **Module TiktokAccount ([`TiktokAccountEditPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountEditPage.tsx))**:
   - Refactor toàn bộ trang chỉnh sửa tài khoản sử dụng `<ResourceForm resourceName="TikTok Account">`.
   - Render trực tiếp các input bằng code: `<AccountFields />` và `<UploadComponent variant="avatar" />`.
   - Rút gọn code từ 136 dòng xuống còn 60 dòng cực kỳ trong sáng và dễ bảo trì.

---

## 11. Hỗ Trợ Tích Hợp Module Auth (Core Infrastructure Support)

Từ vai trò quản lý module Core, hệ thống đã chuẩn bị sẵn sàng toàn bộ cơ sở hạ tầng nền tảng để hỗ trợ module **Auth** làm việc độc lập và đồng bộ với hệ thống:

1. **Tự động gắn Bearer Token (`modules/Core/resources/js/Action/api.ts`)**:
   - HTTP Interceptor tự động kiểm tra `localStorage.getItem('token')` (hoặc `access_token`).
   - Tự động gắn header `Authorization: Bearer <token>` vào mọi API request gửi từ frontend.
   - Khi gặp mã lỗi `401 Unauthorized`, interceptor tự động xóa token hỏng khỏi `localStorage` để bảo vệ phiên đăng nhập.
   - Xuất khẩu sẵn các helper functions: `setAuthToken(token)`, `getAuthToken()`, `clearAuthToken()`.

2. **Cấu hình Dynamic Route Resolver (`modules/Core/configs/modules.php`)**:
   - Bổ sung ánh xạ module `'auth' => 'Auth'` và `'user' => 'User'` vào `modules.php`.
   - Bất kỳ API request nào có dạng `/{admin_prefix}/api/auth/*` sẽ tự động được điều hướng đến Controller tương ứng trong `Modules\Auth\Controllers` theo chuẩn Ureka.

3. **Cấu hình Autoload Composer (`composer.json`)**:
   - Bổ sung đăng ký PSR-4 `"Modules\\Auth\\": "modules/Auth/src/"` và `"Modules\\User\\": "modules/User/src/"` để đảm bảo các class của Auth được nạp tự động, không phát sinh lỗi class not found.

4. **Tự động Biên dịch Bundle Frontend (`build/modules.js` & `app.blade.php`)**:
   - Cơ chế tự động phát hiện module trong `build/modules.js` sẽ tự động quét và biên dịch file `resources/js/index.ts` của module `Auth` khi được tạo, đồng thời Blade template `@moduleJs('all')` sẽ nạp script tự động vào trang SPA.

---

## 12. Phân Tách Trách Nhiệm Đơn (Single Responsibility) & Dependency Injection: Module System, Role, Permission

Theo nguyên tắc kiến trúc Ureka, mỗi module chịu trách nhiệm cho đúng phạm vi nghiệp vụ của mình (không gộp quá nhiều model/controller vào một module), tách bạch thành 3 modules độc lập và inject vào nhau:

### A. Module System (`modules/System`): Cấu Hình Hệ Thống & Chẩn Đoán Máy Chủ
- **Phạm vi nghiệp vụ**: Chỉ phụ trách tham số cấu hình hệ thống (`system_settings`), tham số Scraper Engine, chính sách bảo mật và thông số chẩn đoán máy chủ runtime.
- **Model & Database**:
  - `Modules\System\Models\SystemSetting`: cast kiểu dữ liệu động (`boolean`, `number`, `json`, `string`).
  - Migration: `2026_01_01_000004_create_system_settings_table.php`.
- **Controller & Service & Repository**:
  - `SystemSettingController`: API `/admin/api/system/system-setting`, `/group/{group}`, `/batch-update`, `/info`.
  - `SystemSettingService`: Caching cấu hình hệ thống, tự động giải phóng cache khi cập nhật batch.
  - `SystemSettingRepository`: Truy vấn dữ liệu theo nhóm (`general`, `crawler`, `security`).
- **Frontend**:
  - `SystemSettingsPage.tsx`: Tabs thẻ Card (General Settings, Crawler Engine, Security & Access, System Diagnostics).
  - Route: `/system/settings` (Icon `SettingOutlined`, order 31).
  - Bundle: `public/modules/System/index.js` (~30.9 KiB).

### B. Module Permission (`modules/Permission`): Ma Trận Quyền Hạn & Quản Lý Quyền Module
- **Phạm vi nghiệp vụ**: Quản lý toàn bộ danh mục quyền hạn của hệ thống, phân loại theo module (`core`, `crawler`, `tiktok_account`, `system`, `role`, `user`) và hành động (`view`, `edit`).
- **Model**: `Modules\Permission\Models\Permission`.
- **Tầng Repository & Service**:
  - `PermissionRepositoryInterface` & `PermissionRepository`: Cung cấp `getGroupedByModule()`, `getBySlugs()`, `getByIds()`.
  - `PermissionService`: Cung cấp nghiệp vụ nhóm quyền theo module phục vụ ma trận phân quyền.
- **Controller**:
  - `PermissionController`:
    - `GET /admin/api/permission/permission`: Lấy danh sách toàn bộ permissions (hỗ trợ search, filter).
    - `GET /admin/api/permission/permission/modules`: Lấy permissions nhóm theo từng module.
- **Frontend Component Tái Sử Dụng (Exported Component)**:
  - `PermissionMatrix.tsx`: Ma trận phân quyền trực quan với badge màu sắc, checkbox chọn nhanh từng module và chọn toàn cục.
  - Action client: `permission.ts` (`getPermissions`, `getGroupedPermissions`).

### C. Module Role (`modules/Role`): Quản Lý Vai Trò & Phân Quyền (Dependency Injection)
- **Phạm vi nghiệp vụ**: Quản trị vai trò người dùng (Roles), gán/đồng bộ quyền hạn cho vai trò, bảo vệ vai trò Super Administrator `admin`.
- **Dependency Injection (DI)**:
  - `RoleService` inject trực tiếp:
    1. `RoleRepositoryInterface`
    2. `Modules\Permission\Repositories\PermissionRepositoryInterface`
  - `RoleController` inject trực tiếp:
    1. `RoleService`
    2. `Modules\Permission\Services\PermissionService`
  - Khi tạo/sửa vai trò hoặc lấy danh sách permissions khả dụng, `RoleController` và `RoleService` sử dụng trực tiếp service/repository được inject từ module **Permission**.
- **Frontend Component Injection**:
  - `RoleFormModal.tsx` nhúng trực tiếp `<PermissionMatrix />` import từ `@modules/Permission/resources/js/components/PermissionMatrix`.
  - `RoleTableList.tsx`: Kế thừa pure generic `TableComponent` từ Core.
  - `RolesPage.tsx`: Trang quản trị vai trò hoàn chỉnh với thẻ KPI, tìm kiếm, sửa/xóa vai trò an toàn.
  - Route: `/role/roles` (Icon `SafetyCertificateOutlined`, order 30).
  - Bundle: `public/modules/Role/index.js` (~75.8 KiB).

---

## 9. Module Auth: Authentication & Role-Based Access Control (RBAC)

Module **Auth** chịu trách nhiệm toàn bộ về xác thực người dùng, ủy quyền dựa trên vai trò (RBAC), quản lý token truy cập (Laravel Sanctum), đặt lại mật khẩu, hồ sơ người dùng và bảo vệ điều hướng giao diện.

### A. Tính Năng & Kiến Trúc Tổng Quan

1. **Xác thực Đăng nhập & Đăng xuất (Login / Logout)**:
   - Đăng nhập bảo mật với email và mật khẩu qua Laravel Sanctum.
   - Trả về token cá nhân (`Bearer {token}`) và cấu trúc thông tin người dùng kèm ma trận quyền theo từng module (`module_permissions`).
   - Đăng xuất thu hồi token truy cập (`personal_access_tokens`) trên cơ sở dữ liệu.
2. **Quản lý & Đặt lại Mật khẩu (Password Reset & Change Password)**:
   - **Forgot Password**: Tiếp nhận email và tạo mã xác nhận reset token bảo mật trong bảng `password_reset_tokens`.
   - **Reset Password**: Đặt lại mật khẩu an toàn với token hợp lệ, mã hóa Bcrypt và tự động thu hồi tất cả phiên token cũ.
   - **Change Password**: Cho phép người dùng đã đăng nhập đổi mật khẩu với xác nhận mật khẩu hiện tại.
3. **Phân quyền Module & Hành động (RBAC View/Edit)**:
   - Cơ chế phân quyền 2 chiều: `roles` -> `permissions` -> `users` và `user_permissions` (ghi đè trực tiếp).
   - Phân cấp module: `crawler`, `tiktok_account`, `core`, `user`.
   - Phân cấp hành động: `view` (chỉ xem), `edit` (thêm, sửa, xóa, chạy tác vụ).
   - Super Administrator (`admin`): Toàn quyền truy cập mọi module và hành động.
   - Operations Manager (`manager`): Toàn quyền crawler & tiktok_account, xem user, không được sửa user.
   - Crawler Specialist (`editor`): Toàn quyền crawler & tiktok_account, không được truy cập user.
   - Data Viewer / Auditor (`viewer`): Chỉ xem dữ liệu (read-only), không được chỉnh sửa bất kỳ module nào.
4. **Middleware & Bảo vệ Tuyến đường (AuthGuard & CheckModulePermission)**:
   - Backend Middleware [`CheckModulePermission`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Middleware/CheckModulePermission.php) kiểm tra quyền hạn trước khi request đi vào Controller (trả về 401 khi chưa đăng nhập, 403 khi thiếu quyền).
   - Frontend Component [`AuthGuard`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/components/AuthGuard.tsx) bao bọc toàn bộ [`AdminLayout`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/AdminLayout.tsx), chuyển hướng về `/login` nếu chưa đăng nhập.
   - Component [`PermissionGate`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/components/PermissionGate.tsx) và [`RoleGate`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/components/RoleGate.tsx) phục vụ render giao diện có điều kiện.

### B. Cấu Trúc Backend Module Auth

1. **Controllers & Endpoints ([`modules/Auth/src/Controllers/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Controllers/))**:
   - **`AuthController`**:
     - `POST /admin/api/auth/login` (và alias `/admin/api/core/auth/login`): Đăng nhập, cấp Bearer token và trả về thông tin user + module permissions matrix.
     - `POST /admin/api/auth/logout` (và alias `/admin/api/core/auth/logout`): Thu hồi token hiện tại.
     - `GET /admin/api/auth/me` (và alias `/admin/api/core/auth/me`): Lấy thông tin user hiện tại và module permissions matrix.
     - `GET /admin/api/auth/permissions` (và alias `/admin/api/core/auth/permissions`): Danh mục permissions phân nhóm theo module.
     - `POST /admin/api/auth/forgot-password`: Tạo token đặt lại mật khẩu.
     - `POST /admin/api/auth/reset-password`: Đặt lại mật khẩu với token xác thực.
     - `POST /admin/api/auth/change-password`: Đổi mật khẩu người dùng đã xác thực.
     - `PUT /admin/api/auth/profile`: Cập nhật thông tin cá nhân (name, phone, avatar).
   - **`PermissionController`**:
     - `GET /admin/api/auth/roles`: Lấy danh sách roles và permissions.
     - `GET /admin/api/auth/permission-list`: Lấy danh sách permissions phẳng.
     - `GET /admin/api/auth/check-permission`: Kiểm tra quyền hạn trực tiếp (`module`, `action`, hoặc `slug`).
2. **Services & Repositories**:
   - [`AuthService`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Services/AuthService.php): Xử lý logic nghiệp vụ đăng nhập, đăng xuất, cấp/thu hồi token Sanctum, mã hóa mật khẩu, kiểm tra trạng thái tài khoản (`blocked`, `inactive`).
   - [`AuthRepository`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Repositories/AuthRepository.php) & [`AuthRepositoryInterface`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Repositories/Interfaces/AuthRepositoryInterface.php): Tương tác dữ liệu người dùng, nạp quan hệ roles/permissions, quản lý bảng `password_reset_tokens`.
3. **Core RBAC Models & Traits ([`modules/Core/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/))**:
   - [`Modules\Core\Models\Role`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Models/Role.php): Model vai trò hệ thống, hỗ trợ `syncPermissions`.
   - [`Modules\Core\Models\Permission`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Models/Permission.php): Model quyền hạn theo module (`crawler`, `tiktok_account`, `core`, `user`) và action (`view`, `edit`).
   - [`Modules\Core\Traits\HasRolesAndPermissions`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Traits/HasRolesAndPermissions.php): Trait tích hợp trực tiếp vào `App\Models\User`, cung cấp `canAccessModule($module, $action)`, `hasRole()`, `hasPermission()`, `getModulePermissionsMatrix()`.
   - [`Modules\Core\Middleware\CheckModulePermission`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Middleware/CheckModulePermission.php): Middleware kiểm tra phân quyền module với mã lỗi HTTP 401 (chưa đăng nhập) và 403 (không có quyền).
   - [`Modules\Core\Controllers\AuthController`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Controllers/AuthController.php): Controller alias kế thừa `Modules\Auth\Controllers\AuthController`, đảm bảo tương thích 100% với Dynamic Route Resolver và test suite cũ.

### C. Cấu Trúc Frontend Module Auth

1. **Pages ([`modules/Auth/resources/js/pages/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/pages/))**:
   - **`LoginPage.tsx`**: Giao diện đăng nhập hiện đại, phong cách dark gradient nền với card trắng bo tròn, Form Ant Design định kiểu, checkbox Remember Me, link Quên mật khẩu và thanh Quick-Fill tài khoản demo (`Admin`, `Manager`, `Editor`, `Viewer`) tiện lợi cho kiểm thử.
   - **`ForgotPasswordPage.tsx`**: Nhập email nhận mã xác nhận reset token với hiển thị trực quan và chuyển tiếp sang trang đặt lại mật khẩu.
   - **`ResetPasswordPage.tsx`**: Form đặt lại mật khẩu với token, mật khẩu mới và xác nhận mật khẩu, thông báo thành công và chuyển hướng về đăng nhập.
   - **`ProfilePage.tsx`**: Hồ sơ người dùng với Avatar, thông tin cá nhân, danh sách vai trò được gán, Bảng ma trận quyền hạn theo từng module (View/Edit), chức năng chỉnh sửa thông tin và Modal đổi mật khẩu.
2. **Components ([`modules/Auth/resources/js/components/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/components/))**:
   - `AuthGuard.tsx`: Kiểm tra trạng thái xác thực và quyền hạn module trước khi render component con.
   - `PermissionGate.tsx`: Render có điều kiện các nút hành động (Button, Form...) dựa trên quyền của user.
   - `RoleGate.tsx`: Render có điều kiện các thành phần giao diện dựa trên vai trò của user.
   - `ChangePasswordModal.tsx`: Modal Ant Design Form đổi mật khẩu với validate trực tiếp.
3. **State Management & Interceptors**:
   - Redux Slice [`authSlice.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/store/auth/authSlice.ts) & Thunks [`authThunks.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/store/auth/authThunks.ts): Lưu trữ user, token, roles, permissions, modulePermissions và đồng bộ với `localStorage` (`cms_tiktok_token`, `cms_tiktok_user`).
   - Tích hợp Central API Client [`api.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/Action/api.ts): Tự động đính kèm header `Authorization: Bearer {token}` trên mọi request và tự động dọn dẹp storage khi gặp lỗi 401.
   - Tích hợp [`Header.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Header.tsx): Hiển thị tên, avatar và vai trò thực tế của người dùng từ Redux; menu dropdown liên kết tới `/profile` và nút "Sign out" đăng xuất an toàn.
   - Tích hợp [`Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx): Tự động ẩn/hiện các mục menu Crawler hoặc TikTok Account dựa theo quyền view của người dùng.
4. **Biên Dịch & Bundling**:
   - Lệnh build: `npm run mix:auth` (hoặc `npm run mix:all`).
   - Kết quả biên dịch: `public/modules/Auth/index.js` (81.5 KiB) và tự động ghi nhận vào `public/entrypoints.json`.
   - TypeScript: 100% định kiểu tĩnh (`npx tsc --noEmit` đạt 0 lỗi).
   - Test suite: Đạt 100% kiểm thử tích hợp.

---

## 12. Module Quản Lý Người Dùng & Phân Quyền (`modules/User`)

### A. Tổng Quan Kiến Trúc
Module **User** phụ trách quản lý toàn diện tài khoản quản trị CMS, phân vai trò (Roles) và cấp quyền hạn theo từng module (View/Edit Modular Permissions). Toàn bộ thao tác CRUD (tạo, xem, xóa, sửa) và cập nhật trạng thái được bảo vệ nghiêm ngặt:
- **Cơ chế cấp quyền**: Phải được cấp quyền hạn tương ứng trên module `user` (`user.view` cho xem danh sách/chi tiết, `user.edit` cho tạo/sửa/xóa/phân quyền) **hoặc tài khoản thực hiện phải có vai trò Super Administrator (`admin`)**.
- **Cơ chế 2 lớp bảo vệ (Double Protection)**:
  1. *Lớp Middleware*: `module.permission:user,{action}` chặn ngay từ tầng route HTTP, trả về mã lỗi 401 khi chưa đăng nhập và 403 khi thiếu quyền.
  2. *Lớp Controller*: Phương thức `checkModuleAuthorization($request, $action)` kiểm tra ngữ cảnh người dùng thực tế (hỗ trợ Sanctum Bearer token, Laravel Session và header mô phỏng `X-User-Id` phục vụ kiểm thử).
- **Ràng buộc nghiệp vụ an toàn (Business Safeguards)**:
  - Chặn người dùng tự xóa tài khoản của chính mình (`You cannot delete your own account`).
  - Chặn xóa Super Administrator duy nhất còn lại trong hệ thống (`Cannot delete the last remaining administrator`).
  - Chặn tước quyền admin hoặc vô hiệu hóa tài khoản admin duy nhất đang hoạt động.

### B. Cấu Trúc Backend Module User
1. **Model & Trait ([`modules/User/src/Models/User.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Models/User.php))**:
   - Kế thừa [`App\Models\User`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/app/Models/User.php), tích hợp trait [`HasRolesAndPermissions`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Traits/HasRolesAndPermissions.php).
   - Cung cấp query scopes: `scopeSearch($query, $search)` (tìm theo tên, email, phone), `scopeFilterStatus($query, $status)` (lọc theo active/inactive/blocked), `scopeFilterRole($query, $role)` (lọc theo role slug hoặc role ID).
   - Phương thức hỗ trợ: `syncRoles(array $roles)`, `syncPermissions(array $permissions)`, `isAdmin()`.
2. **Resource ([`modules/User/src/Resources/UserResource.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Resources/UserResource.php))**:
   - Chuyển đổi dữ liệu chuẩn JSON: `id`, `name`, `email`, `phone`, `avatar`, `avatar_url`, `status`, `is_admin`, `roles`, `role_slugs`, `permissions`, `all_permissions`, `permissions_matrix` (`crawler`, `tiktok_account`, `core`, `user` với cờ `view`/`edit`), `created_at`, `updated_at`.
3. **Repository ([`modules/User/src/Repositories/UserRepository.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Repositories/UserRepository.php))**:
   - Kế thừa `BaseRepository` và triển khai `UserRepositoryInterface`.
   - `getPaginatedUsers($params, $perPage)`: Phân trang kèm eager loading quan hệ `roles.permissions`, `permissions`, tìm kiếm từ khóa và lọc đa tiêu chí.
   - `getUserById($id)`: Truy vấn chi tiết người dùng kèm quan hệ.
   - `createUserWithRolesAndPermissions($data)`: Tạo người dùng, băm bcrypt mật khẩu và đồng bộ vai trò/quyền trong DB Transaction.
   - `updateUserWithRolesAndPermissions($id, $data)`: Cập nhật thông tin, đổi mật khẩu và đồng bộ vai trò/quyền trong DB Transaction.
   - `deleteUser($id)`: Xóa mềm người dùng.
   - `updateStatus($id, $status)`: Cập nhật trạng thái `active`, `inactive`, hoặc `blocked`.
   - `getStatisticsSummary()`: Tổng hợp số lượng người dùng theo trạng thái và theo vai trò.
   - `getAllRolesAndPermissions()`: Danh mục vai trò và quyền hạn toàn hệ thống phân nhóm theo module phục vụ UI chọn lựa.
4. **Service ([`modules/User/src/Services/UserService.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Services/UserService.php))**:
   - Chịu trách nhiệm thực thi các quy tắc nghiệp vụ an toàn (chặn tự xóa, chặn xóa admin cuối, chặn vô hiệu hóa admin cuối).
5. **Form Requests ([`modules/User/src/Requests/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Requests/))**:
   - `StoreUserRequest`: Validate name, email (unique), password (min 6), phone, status, roles, permissions.
   - `UpdateUserRequest`: Validate name, email (unique ngoại trừ ID hiện tại), password tùy chọn, status, roles, permissions.
6. **Controller ([`modules/User/src/Controllers/UserController.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Controllers/UserController.php))**:
   - Kế thừa `CoreController`, hỗ trợ định tuyến động Ureka và định tuyến chuẩn.
   - 100% phương thức được chú thích bằng tiếng Anh kèm hướng dẫn gọi API theo Rule 9:
     - `GET /{admin_path}/api/user/users`: Danh sách người dùng (quyền: `user.view` hoặc `admin`).
     - `GET /{admin_path}/api/user/users/{id}`: Chi tiết người dùng (quyền: `user.view` hoặc `admin`).
     - `POST /{admin_path}/api/user/users`: Tạo người dùng mới (quyền: `user.edit` hoặc `admin`).
     - `PUT /{admin_path}/api/user/users/{id}`: Cập nhật người dùng (quyền: `user.edit` hoặc `admin`).
     - `DELETE /{admin_path}/api/user/users/{id}`: Xóa người dùng (quyền: `user.edit` hoặc `admin`).
     - `PATCH /{admin_path}/api/user/users/{id}/status`: Cập nhật trạng thái (quyền: `user.edit` hoặc `admin`).
     - `GET /{admin_path}/api/user/users/statistics-summary`: Thống kê KPI người dùng (quyền: `user.view` hoặc `admin`).
     - `GET /{admin_path}/api/user/users/roles-and-permissions`: Danh mục vai trò & quyền hạn (quyền: `user.view` hoặc `admin`).

### C. Cấu Trúc Frontend Module User
1. **Pages ([`modules/User/resources/js/pages/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/))**:
   - **`UserListPage.tsx`**: Trang danh sách tài khoản hiện đại với 4 Hero KPI Cards trên đỉnh, thanh chuyển đổi mô phỏng quyền hạn kiểm thử trực tiếp (`UserSimulateSwitcher`), bộ lọc trạng thái và vai trò, tìm kiếm từ khóa, bảng dữ liệu Ant Design với avatar và tags quyền hạn, dropdown thao tác nhanh và Popconfirm xóa an toàn.
   - **`UserDetailPage.tsx`**: Trang chi tiết hồ sơ tài khoản với Avatar cỡ lớn, nhãn trạng thái và vai trò, bảng thông tin cá nhân và Bảng ma trận quyền hạn module (Module Access Matrix).
   - **`UserFormPage.tsx`**: Trang form thống nhất cho cả Tạo mới (`/user/create`) và Chỉnh sửa (`/user/:id/edit`), chia làm 3 phân vùng rõ ràng:
     - *Phần 1 - Basic Profile Information*: Họ tên, Email, Số điện thoại, Trạng thái tài khoản (`Active`, `Inactive`, `Blocked`), URL Avatar.
     - *Phần 2 - Security & Credentials*: Mật khẩu và Xác nhận mật khẩu (bắt buộc khi tạo, tùy chọn khi sửa).
     - *Phần 3 - Role & Module Access Privileges*: Trình chọn vai trò trực quan (`RoleSelector`) và Bảng ma trận cấp quyền theo từng module (`PermissionMatrixSelector`).
2. **Components ([`modules/User/resources/js/components/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/components/))**:
   - `UserKpiCards.tsx`: 4 thẻ thống kê tổng quan (Tổng người dùng, Người dùng hoạt động, Bị khóa/Ngưng hoạt động, Quản trị viên & Trưởng nhóm).
   - `UserSimulateSwitcher.tsx`: Thanh chọn tài khoản mô phỏng (`Super Administrator`, `Operations Manager`, `Crawler Specialist`, `Guest Auditor`) tích hợp trực tiếp trên giao diện để kiểm thử nhanh phân quyền trong môi trường phát triển.
   - `RoleSelector.tsx`: Component chọn vai trò dạng thẻ Radio với icon, nhãn màu và mô tả chi tiết quyền hạn của từng vai trò.
   - `PermissionMatrixSelector.tsx`: Bảng ma trận cấp quyền cho 4 module (`Crawler`, `TikTok Account`, `Core System`, `User Management`) với các ô kiểm View/Edit.
   - `UserColumn.tsx`: Hiển thị avatar tròn (kèm initials dự phòng), tên người dùng đậm và email phụ.
3. **State Management & Typed Client**:
   - Typed Client [`Action/user.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/Action/user.ts): Định kiểu TypeScript đầy đủ cho `UserItem`, `UserRole`, `UserPermission`, `UserStatistics`, `RolesAndPermissionsCatalog`.
   - Redux Slice [`userSlice.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/store/user/userSlice.ts) & Thunks [`userThunks.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/store/user/userThunks.ts): Quản lý state danh sách, bộ lọc, chi tiết người dùng, thống kê KPI và lưu giữ `simulated_user_id` vào `localStorage`.
   - Đăng ký reducer `user: userReducer` vào Redux store dùng chung của Core ([`modules/Core/resources/js/store/index.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/store/index.ts)).
4. **Đăng Ký Tuyến Đường (Route Registration)**:
   - File định tuyến [`modules/User/resources/js/routes/route.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/routes/route.ts) tự động đăng ký các route `/user`, `/user/create`, `/user/:id`, `/user/:id/edit` kèm icon `TeamOutlined` và nhãn menu `Users` (order: 30) vào Core Route Registry khi script nạp vào DOM.

### D. Kiểm Thử & Biên Dịch
- **Feature Test Suite ([`tests/Feature/UserModuleTest.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/tests/Feature/UserModuleTest.php))**:
  - Gồm 15 test cases chuyên sâu kiểm tra toàn diện:
    1. Chặn request chưa xác thực (401 Unauthenticated).
    2. Admin xem danh sách người dùng thành công (200 OK kèm meta pagination).
    3. Admin xem chi tiết người dùng thành công.
    4. Admin tạo người dùng mới thành công (201 Created).
    5. Admin cập nhật thông tin người dùng thành công.
    6. Admin cập nhật trạng thái người dùng thành công.
    7. Admin xóa người dùng thành công (soft delete).
    8. Chặn người dùng tự xóa chính mình (422 Unprocessable Entity).
    9. Manager có quyền `user.view` được phép xem danh sách và chi tiết.
    10. Manager không có quyền `user.edit` bị chặn khi tạo người dùng (403 Forbidden).
    11. Manager không có quyền `user.edit` bị chặn khi cập nhật người dùng (403 Forbidden).
    12. Manager không có quyền `user.edit` bị chặn khi xóa người dùng (403 Forbidden).
    13. Viewer không có quyền `user.view` bị chặn khi xem danh sách (403 Forbidden).
    14. Lấy thống kê KPI người dùng thành công.
    15. Lấy danh mục vai trò & quyền hạn thành công.
  - Kết quả kiểm thử: **15/15 tests `UserModuleTest` passed (100%), toàn bộ test suite hệ thống đạt 73/73 tests passed (326 assertions)**.
- **Biên dịch Frontend**:
  - `npx tsc --noEmit`: 100% đạt chuẩn, 0 lỗi TypeScript.
  - `npm run mix:user`: Biên dịch độc lập `public/modules/User/index.js` (98.2 KiB minified) chỉ trong 15s.

---

## 14. Cross-Module Shared Standardization & Unified Route Convergence

### A. Chuẩn Hóa Single Route Kiến Trúc Form (`/form/:id?`)
- **Nguyên tắc thiết kế**: Thay vì khai báo phân tách 2 route `/create` và `/:id/edit`, Core thiết lập và đồng bộ mô hình **Single Form Route** `/form/:id?` cho các module tài nguyên:
  - **Crawler**: `/crawler/crawl-job/form/:id?` -> [`CrawlJobFormPage`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobFormPage.tsx).
  - **TiktokAccount**: `/tiktok-account/form/:id?` -> [`TiktokAccountEditPage`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountEditPage.tsx).
  - **User**: `/user/form/:id?` -> [`UserFormPage`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/UserFormPage.tsx).
  - Duy trì các alias cũ (`/create`, `/:id/edit`) để đảm bảo tính tương thích ngược 100% với các bookmark hoặc liên kết hiện hữu.
- **Tự động nhận diện chế độ**:
  - `const { id } = useParams<{ id?: string }>();`
  - `const isEdit = Boolean(id);`
  - Khi `id` rỗng/undefined -> Create mode: Reset form hoặc gán `initialValues`.
  - Khi `id` tồn tại -> Edit mode: Tự động kích hoạt `fetchRecord(id)` và điền dữ liệu ban đầu.

### B. Thành Phần Dùng Chung Tối Giản
1. **[`ResourceForm`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/ResourceForm.tsx)**:
   - Loại bỏ hoàn toàn các thuộc tính style cứng nhắc (`layout = 'vertical'`, `cardMaxWidth = 680`, `cardStyle`).
   - Hỗ trợ render linh hoạt custom fields viết trực tiếp dưới dạng JSX `<Form.Item>` trong `children`.
   - Tự động quản lý loading state, submission handling (`onCreate`, `onUpdate`, `onSubmit`), redirect logic và error alert.
2. **[`UploadComponent`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/UploadComponent.tsx)**:
   - Tương thích trực tiếp với Ant Design `<Form.Item>` mà không cần truyền `onChange` thủ công.
   - Hỗ trợ đa dạng biến thể: `avatar` (ảnh đại diện tròn/vuông), `dragger` (kéo thả tập tin), `button` (nút upload tiêu chuẩn), `picture-card` (lưới ảnh).
   - Tích hợp modal preview phóng to ảnh, quản lý blob URL tự giải phóng bộ nhớ, giới hạn kích thước (`maxSizeMB`) và định dạng file (`accept`).

### C. Đồng Bộ Điều Hướng Dashboard & Sidebar
- **[`DashboardQuickShortcuts.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx)**:
  - Cập nhật shortcut tạo job hướng tới `/crawler/crawl-job/form`.
  - Bổ sung shortcut quản lý người dùng `User Management` (`/user`) với icon `TeamOutlined`.
- **[`DashboardPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/pages/DashboardPage.tsx)**:
  - Cập nhật nút Create Crawl Job và Empty State action link hướng tới `/crawler/crawl-job/form`.

### D. Toàn Bộ 6 Modules Hoàn Thiện & Biên Dịch
- **Master Build Status**: Lệnh `npm run mix:all` biên dịch trọn vẹn toàn bộ 6 modules (`Core`, `Crawler`, `TiktokAccount`, `Auth`, `System`, `User`) trong ~13.9 giây.
- **Entrypoints Registry ([`public/entrypoints.json`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/public/entrypoints.json))**:
  - `Core`: `vendor.js` (1.52 MiB), `index.js` (85.7 KiB), `app.css` (16.3 KiB)
  - `Crawler`: `index.js` (108 KiB)
  - `TiktokAccount`: `index.js` (111 KiB)
  - `System`: `index.js` (57.6 KiB)
  - `Auth`: `index.js` (81.5 KiB), `app.css` (Core)
  - `User`: `index.js` (98.3 KiB)
- **Kiểm định chất lượng**:

---

## 15. Extraction of Shared RBAC Components to Core & 8-Module Build Synchronization

### A. Đưa Các Component Phân Quyền & RBAC Dùng Chung Vào Core
1. **[`PermissionMatrix`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PermissionMatrix.tsx)**:
   - Trước đây bị trùng lặp mã nguồn giữa `modules/System` và `modules/Permission`.
   - Đã gom chung và chuẩn hóa toàn diện vào `modules/Core/resources/js/components/PermissionMatrix.tsx`.
   - Hỗ trợ đầy đủ ma trận quyền hạn cho tất cả module: `core`, `crawler`, `tiktok_account`, `system`, `role`, `user`.
   - Các module [`Permission`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Permission/resources/js/components/PermissionMatrix.tsx) và [`Role`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Role/resources/js/components/RoleFormModal.tsx) được tái cấu trúc để trực tiếp import/re-export từ `@core/components`.
2. **[`PermissionGate`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PermissionGate.tsx)**:
   - Đưa component kiểm tra quyền hạn có điều kiện từ `Auth` lên Core để dùng chung cho mọi module.
   - Hỗ trợ kiểm tra quyền theo module + action (`<PermissionGate module="crawler" action="edit">`) hoặc theo slug (`<PermissionGate slug="user.delete">`).
   - Tái sử dụng ngay lập tức trong [`CrawlJobsPage`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/resources/js/pages/CrawlJobsPage.tsx) và [`TiktokAccountPage`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx) để ẩn/hiện an toàn các nút Thao tác (Edit, Delete).
3. **[`RoleGate`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/RoleGate.tsx)**:
   - Đưa component kiểm tra vai trò người dùng lên Core, hỗ trợ kiểm tra vai trò đơn hoặc mảng (`roles={['admin', 'manager']}`).
4. **Mở rộng [`StatusTag`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/StatusTag.tsx)**:
   - Bổ sung cấu hình trạng thái `'blocked'` (`error`) và `'disabled'` (`default`) hỗ trợ trực tiếp các trạng thái tài khoản của module `User` và `System`.

### B. Đồng Bộ Hóa Toàn Diện 8 Modules
- **Master Build Status**: Lệnh `npm run mix:all` biên dịch thành công toàn bộ **8 modules** (`Auth`, `Core`, `Crawler`, `Permission`, `Role`, `System`, `TiktokAccount`, `User`) trong 38.8 giây.
- **Entrypoints Registry ([`public/entrypoints.json`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/public/entrypoints.json))**:
  - `Core`: `vendor.js` (1.52 MiB), `index.js` (85.8 KiB), `app.css` (16.3 KiB)
  - `Crawler`: `index.js` (114 KiB)
  - `TiktokAccount`: `index.js` (117 KiB)
  - `System`: `index.js` (30.9 KiB)
  - `Role`: `index.js` (98.3 KiB)
  - `Permission`: `index.js` (12.8 KiB)
  - `Auth`: `index.js` (79.5 KiB), `app.css` (Core)
  - `User`: `index.js` (98.3 KiB)
- **Kiểm định chất lượng**:
  - TypeScript: `npm run check-types` (`tsc --noEmit`) -> 0 errors.
  - PHP Unit & Feature Tests: `php artisan test` -> 73/73 tests passed (330 assertions).

---

## 16. Chuẩn Hóa Module Auth: Điểm Truy Cập Quyền Hạn Duy Nhất (`/auth/me`) & Khai Thác Triệt Để Định Tuyến Động

### A. Tinh Giản Endpoint Phân Quyền Về Điểm Truy Cập Duy Nhất (`GET /admin/api/auth/me`)
- **Nguyên lý thiết kế**:
  - Trong kiến trúc CMS TikTok Crawler, module `Auth` chỉ chịu trách nhiệm về xác thực danh tính phiên người dùng (`login`, `logout`, `me`, `profile`, `password reset`).
  - Toàn bộ trạng thái phân quyền cá nhân của user đang đăng nhập (bao gồm danh sách `roles`, danh sách `permissions`, và ma trận `module_permissions`) đều được đóng gói đồng bộ và trả về đầy đủ ngay trong endpoint `GET /admin/api/auth/me`.
  - Do đó, **loại bỏ hoàn toàn các route phân quyền thừa/phân tán** khỏi module `Auth` (như `permissions`, `roles`, `check-permission`).
  - Quản trị danh mục quyền hạn và vai trò toàn hệ thống được giao trọn vẹn cho 2 module chuyên trách: [`Permission`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Permission) và [`Role`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Role).
- **Cấu trúc dữ liệu phản hồi của `me`**:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@cms.com",
      "phone": null,
      "avatar": null,
      "status": "active",
      "roles": ["admin"],
      "permissions": ["crawler.view", "crawler.edit", "tiktok_account.view", "tiktok_account.edit", "core.view", "core.edit", "user.view", "user.edit"],
      "module_permissions": {
        "crawler": { "view": true, "edit": true },
        "tiktok_account": { "view": true, "edit": true },
        "core": { "view": true, "edit": true },
        "user": { "view": true, "edit": true }
      }
    },
    "message": "Profile retrieved successfully."
  }
  ```

### B. Cân Nhắc Về Việc Khai Báo Route Trong `modules/Auth/routes/api.php`
- **Cơ chế Định tuyến Động Core ([`DynamicRouteResovle`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Support/DynamicRouteResovle.php))**:
  - `DynamicRouteResovle` tự động match tất cả các request dạng `/{admin_path}/api/{module}/{controller}/{action}` hoặc `/{admin_path}/api/{module}/{action}` (Single-Controller Module Fallback).
  - Vì module có tên `Auth` và controller chính là [`AuthController`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Controllers/AuthController.php), mọi request tới:
    - `POST /admin/api/auth/login` $\rightarrow$ `AuthController::login`
    - `POST /admin/api/auth/logout` $\rightarrow$ `AuthController::logout`
    - `GET  /admin/api/auth/me` $\rightarrow$ `AuthController::me`
    - `POST /admin/api/auth/forgot-password` $\rightarrow$ `AuthController::forgotPassword`
    - `POST /admin/api/auth/reset-password` $\rightarrow$ `AuthController::resetPassword`
    - `POST /admin/api/auth/change-password` $\rightarrow$ `AuthController::changePassword`
    - `PUT  /admin/api/auth/profile` $\rightarrow$ `AuthController::updateProfile`
    đều được tự động nhận diện và chuyển giao chính xác mà **hoàn toàn không cần khai báo route thủ công trong `routes/api.php`**.
- **Quyết định kiến trúc**:
  - **Không khai báo route tĩnh** trong `modules/Auth/routes/api.php`.
  - Giữ `modules/Auth/routes/api.php` làm file **Route Documentation & Usage Guide** (tương tự như `modules/System/routes/api.php`, `modules/Role/routes/api.php`, `modules/Permission/routes/api.php`), tuân thủ triệt để Rule 9.
  - Xử lý xác thực linh hoạt: Trong `AuthController`, các action bảo vệ sử dụng `getAuthenticatedUser()` (kết hợp `Request::user()` và `auth('sanctum')->user()`), đảm bảo các request gửi kèm Bearer Token qua Dynamic Route được xác thực và bảo mật 100% mà không phụ thuộc vào route middleware tĩnh.

---

## 17. Phân Phối Lại Database Migrations Về Đúng Module Tương Ứng (Decentralized Migrations)

### A. Nguyên Tắc Kiến Trúc
- **Không dồn migration vào Core**: Core là module nền tảng thuần túy (infrastructure, base classes, central API client, dynamic routing, shared UI system). Toàn bộ các bảng nghiệp vụ và quản trị phải thuộc quyền sở hữu của module chức năng tương ứng.
- **Cơ chế nạp tự động qua [`CoreServiceProvider`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Providers/CoreServiceProvider.php)**:
  `registerModuleMigrations()` tự động quét tất cả các module con trong thư mục `modules/` và đăng ký `$this->loadMigrationsFrom($migrationDir)` nếu thư mục `database/migrations` tồn tại.

### B. Bảng Phân Bổ Migrations Theo Đúng Module

| Thứ tự Timestamp | Tên Migration | Bảng Tạo Ra | Module Sở Hữu | Đường Dẫn File |
| :--- | :--- | :--- | :--- | :--- |
| `000001` | `create_users_table.php` | `users`, `password_reset_tokens`, `sessions` | **User** | [`modules/User/database/migrations/2026_01_01_000001_create_users_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/database/migrations/2026_01_01_000001_create_users_table.php) |
| `000002` | `create_permissions_table.php` | `permissions` | **Permission** | [`modules/Permission/database/migrations/2026_01_01_000002_create_permissions_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Permission/database/migrations/2026_01_01_000002_create_permissions_table.php) |
| `000003` | `create_roles_tables.php` | `roles`, `role_permissions`, `user_roles`, `user_permissions` | **Role** | [`modules/Role/database/migrations/2026_01_01_000003_create_roles_tables.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Role/database/migrations/2026_01_01_000003_create_roles_tables.php) |
| `000004` | `create_system_settings_table.php` | `system_settings` | **System** | [`modules/System/database/migrations/2026_01_01_000004_create_system_settings_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/System/database/migrations/2026_01_01_000004_create_system_settings_table.php) |
| `000005` | `create_personal_access_tokens_table.php` | `personal_access_tokens` | **Auth** | [`modules/Auth/database/migrations/2026_01_01_000005_create_personal_access_tokens_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/database/migrations/2026_01_01_000005_create_personal_access_tokens_table.php) |
| `000010` | `create_tiktok_accounts_table.php` | `tiktok_accounts` | **TiktokAccount** | [`modules/TiktokAccount/database/migrations/2026_01_01_000010_create_tiktok_accounts_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/database/migrations/2026_01_01_000010_create_tiktok_accounts_table.php) |
| `000020` | `create_crawl_jobs_table.php` | `crawl_jobs` | **Crawler** | [`modules/Crawler/database/migrations/2026_01_01_000020_create_crawl_jobs_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/database/migrations/2026_01_01_000020_create_crawl_jobs_table.php) |
| `000021` | `create_crawl_results_table.php` | `crawl_results` | **Crawler** | [`modules/Crawler/database/migrations/2026_01_01_000021_create_crawl_results_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Crawler/database/migrations/2026_01_01_000021_create_crawl_results_table.php) |

### C. Trạng Thái Core
- Thư mục [`modules/Core/database/migrations/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/database/migrations/) hiện tại **hoàn toàn trống** (0 file migration).
- Toàn bộ 73 tests trong bộ kiểm thử `php artisan test` chạy với DB sqlite memory đều vượt qua 100% (330 assertions), xác nhận thứ tự thực thi ràng buộc khóa ngoại (foreign keys) hoàn toàn chính xác.

---

## 18. Loại Bỏ Hoàn Toàn Thành Phần Demo, Test & Simulation Chuẩn Bị Triển Khai Thực Tế (Production Readiness)

Nhằm đáp ứng yêu cầu triển khai thực tế trên môi trường Production, toàn bộ các thành phần phục vụ demo, nút điền nhanh tài khoản mẫu, thanh công cụ giả lập quyền hạn và các backdoor bypass xác thực đã được rà soát và loại bỏ triệt để:

### A. Module Auth: Chuẩn Hóa Giao Diện Đăng Nhập
- **Loại bỏ Demo Accounts**: Xóa bỏ hoàn toàn khối `Quick Fill Demo Accounts` cùng các thẻ tag tài khoản thử nghiệm (`Admin`, `Manager`, `Editor`, `Viewer`) và hàm `handleQuickFill` trong [`modules/Auth/resources/js/pages/LoginPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/pages/LoginPage.tsx).
- Giao diện đăng nhập hiện tại là trang đăng nhập doanh nghiệp tiêu chuẩn: yêu cầu nhập chính xác email và mật khẩu của tài khoản thực tế, hỗ trợ "Remember me", "Forgot password" và thông báo lỗi bảo mật chính xác.

### B. Module User: Loại Bỏ Công Cụ Giả Lập Quyền Hạn (Role & Permission Simulation)
- **Xóa bỏ Component [`UserSimulateSwitcher`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/components/UserSimulateSwitcher.tsx)**: Xóa hoàn toàn file component công cụ chuyển đổi vai trò giả lập (`Test Role & Permission Simulation`).
- **Làm sạch các trang quản trị**:
  - [`UserListPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/UserListPage.tsx): Gỡ bỏ nhúng switcher giả lập quyền hạn, chỉ hiển thị KPI Cards và bảng dữ liệu người dùng thực tế.
  - [`UserFormPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/UserFormPage.tsx): Gỡ bỏ switcher giả lập, chuẩn hóa placeholder ảnh đại diện sang URL chuẩn `https://...`.
  - [`UserDetailPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/UserDetailPage.tsx): Gỡ bỏ switcher giả lập ở cả trạng thái lỗi và trạng thái hiển thị chi tiết.
- **Dọn dẹp Redux Store & Constants**:
  - [`userSlice.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/store/user/userSlice.ts): Loại bỏ thuộc tính `simulatedUserId`, hàm đọc `localStorage`, và action `setSimulatedUserId`.
  - [`userConstants.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/configs/userConstants.ts): Loại bỏ interface `SimulatedAccount` và mảng `SIMULATED_ACCOUNTS`.

### C. Module Core: Xóa Bỏ Backdoor Bypass Xác Thực & Giả Lập Header
- **Client API Interceptor ([`modules/Core/resources/js/Action/api.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/Action/api.ts))**: Gỡ bỏ logic tự động đính kèm header `X-User-Id` từ localStorage. Client chỉ gửi duy nhất token xác thực tiêu chuẩn `Authorization: Bearer <token>`.
- **Middleware Phân Quyền ([`modules/Core/src/Middleware/CheckModulePermission.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Middleware/CheckModulePermission.php))**: Xóa bỏ đoạn mã cho phép đọc `X-User-Id` để gán user giả lập. Ngăn chặn 100% lỗ hổng leo thang đặc quyền trái phép.
- **Controller Quản Lý User ([`modules/User/src/Controllers/UserController.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Controllers/UserController.php))**: Chuẩn hóa phương thức `resolveRequestUser`, chỉ tin cậy phiên đăng nhập Sanctum token hoặc session thực sự.
- **Layout Header ([`modules/Core/resources/js/layouts/Header.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Header.tsx))**: Gỡ bỏ số huy hiệu thông báo cứng `Badge count={3}` trên nút chuông thông báo.

### D. Module System: Chuẩn Hóa Chuỗi Cấu Hình
- [`CrawlerSettingsTab.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/System/resources/js/components/CrawlerSettingsTab.tsx): Thay thế chuỗi mô tả ví dụ sang định dạng chuẩn `http://username:password@host:port`.

---

## 19. Tính Năng Ghi Nhận Lịch Sử Đăng Nhập (Login Activity Logging & Audit Trail)

Nhằm tăng cường tính bảo mật và kiểm tra kiểm toán (audit security) cho hệ thống, chức năng lưu log đăng nhập đã được triển khai hoàn chỉnh trong module **Auth**:

### A. Thiết Kế Cơ Sở Dữ Liệu
- **Migration**: [`modules/Auth/database/migrations/2026_01_01_000006_create_login_logs_table.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/database/migrations/2026_01_01_000006_create_login_logs_table.php)
- **Bảng `login_logs`**:
  - `id`: Khóa chính tự tăng (BIGINT).
  - `user_id`: Khóa ngoại trỏ tới bảng `users` (`nullOnDelete`), lưu ID người dùng nếu xác thực thành công hoặc tài khoản tồn tại.
  - `email`: Địa chỉ email được nhập vào lúc đăng nhập (index).
  - `ip_address`: Địa chỉ IP của máy khách (VARCHAR 45, hỗ trợ cả IPv4 và IPv6).
  - `user_agent`: Chuỗi nhận dạng trình duyệt/thiết bị từ HTTP header `User-Agent`.
  - `device`: Loại thiết bị được phân tích tự động (`Desktop`, `Mobile`, `Tablet`, `Unknown`).
  - `status`: Trạng thái đăng nhập (`success`, `failed`, có index).
  - `failure_reason`: Lý do thất bại nếu có (`invalid_credentials`, `account_blocked`, `account_inactive`).
  - `created_at`, `updated_at`: Dấu thời gian.

### B. Tầng Backend (Model, Repository, Service & Controller)
1. **Model [`LoginLog`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Models/LoginLog.php)**:
   - Đại diện Eloquent cho bảng `login_logs`, có quan hệ `belongsTo(User::class)`.
2. **Repository [`AuthRepository`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Repositories/AuthRepository.php)**:
   - `recordLoginLog(array $data)`: Lưu bản ghi log đăng nhập mới.
   - `getLoginLogs(array $filters = [], int $perPage = 15)`: Truy vấn danh sách log có phân trang, hỗ trợ lọc theo `user_id`, `status`, `email`, `ip_address`, và tìm kiếm từ khóa `search`.
3. **Service [`AuthService`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Services/AuthService.php)**:
   - Trong `login($email, $password, $ipAddress, $userAgent)`: Tự động phân tích thiết bị client và ghi nhận log:
     - Ghi nhận `success` khi email & mật khẩu hợp lệ và tài khoản đang active.
     - Ghi nhận `failed` kèm `failure_reason = 'invalid_credentials'` khi sai mật khẩu hoặc không tìm thấy email.
     - Ghi nhận `failed` kèm `failure_reason = 'account_blocked'` khi tài khoản bị khóa.
     - Ghi nhận `failed` kèm `failure_reason = 'account_inactive'` khi tài khoản chưa kích hoạt.
   - `getLoginLogs($user, $filters, $perPage)`: Phân quyền tự động — người dùng thường chỉ xem được lịch sử đăng nhập của chính mình (`user_id = $user->id`), tài khoản `admin` xem được toàn bộ hệ thống.
4. **Controller [`AuthController`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/src/Controllers/AuthController.php)**:
   - Endpoint: `GET /{admin_path}/api/auth/login-logs` (tự động phân giải qua Core `DynamicRouteResovle`).

### C. Tầng Frontend (Action & Giao Diện Hồ Sơ Cá Nhân)
1. **Action Client ([`modules/Auth/resources/js/Action/auth.ts`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/Action/auth.ts))**:
   - Khai báo kiểu `LoginLogItem` và hàm `getLoginLogs(params)`.
2. **Giao Diện Hồ Sơ ([`modules/Auth/resources/js/pages/ProfilePage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/pages/ProfilePage.tsx))**:
   - Tích hợp Card **"Recent Login Activity History"** hiển thị bảng lịch sử đăng nhập trực quan:
     - Dấu thời gian đăng nhập (`toLocaleString`).
     - Địa chỉ IP kèm icon mạng.
     - Nhãn thiết bị (`Tag` Desktop / Mobile / Tablet kèm icon tương ứng).
     - Nhãn trạng thái (`Tag` Success xanh lá hoặc Failed đỏ kèm lý do từ chối).
     - Nút "Refresh" tải lại dữ liệu nhanh và phân trang Ant Design nhỏ gọn.

### D. Kiểm Thử Hệ Thống
- Đã tạo Feature Test: [`tests/Feature/AuthLoginLogTest.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/tests/Feature/AuthLoginLogTest.php) bao quát:
  1. `test_successful_login_creates_login_log`: Xác minh đăng nhập thành công lưu log `success`.
  2. `test_failed_login_creates_failed_login_log`: Xác minh đăng nhập sai pass lưu log `failed` + `invalid_credentials`.
  3. `test_blocked_user_login_creates_blocked_login_log`: Xác minh đăng nhập nick blocked lưu log `failed` + `account_blocked`.
  4. `test_authenticated_user_can_retrieve_login_logs`: Xác minh API trả về phân trang lịch sử đăng nhập.
  5. `test_unauthenticated_access_to_login_logs_returns_401`: Xác minh bảo vệ quyền riêng tư 401.
- Kết quả kiểm thử: **5/5 tests passed (100%), tổng bộ kiểm thử toàn dự án đạt 78/78 tests passed (358 assertions)**.

---

## 17. UI Redesign, Responsive Layout & Module Form Synchronization

### A. Bối Cảnh & Mục Tiêu Cải Tiến
Giao diện quản trị CMS được chuẩn hóa toàn diện theo các yêu cầu nâng cấp:
1. **Thiếu khả năng đáp ứng (Responsive)**: Khung Sidebar cố định 220px chiếm quá nhiều diện tích trên màn hình máy tính bảng và điện thoại di động (< 992px); thanh Header thiếu nút hamburger toggle thu gọn/mở rộng menu; lề và đệm của khung nội dung chưa co giãn linh hoạt theo kích thước màn hình.
2. **Icon Sidebar chưa đầy đủ hoặc trùng lặp**: Một số route chưa có icon chuyên biệt hoặc sử dụng chung icon (`UserOutlined` dùng chung cho cả TikTok Accounts và Users), chưa có cơ chế tự động phân giải icon dự phòng (fallback) nếu route con không khai báo icon.
3. **Các Form bị thu hẹp nằm giữa nội dung (Centered Form)**: Trang form tạo/sửa người dùng ([`UserFormPage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/resources/js/pages/UserFormPage.tsx)) bị giới hạn chiều rộng cứng `maxWidth: 960, margin: '0 auto'` và trang hồ sơ tài khoản ([`ProfilePage.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Auth/resources/js/pages/ProfilePage.tsx)) bị giới hạn `maxWidth: 1100, margin: '0 auto'`, khiến các form này nằm lơ lửng ở giữa màn hình lớn với khoảng trắng thừa hai bên, không đồng bộ với các form và danh sách chiếm trọn 100% không gian làm việc của các module khác (`CrawlJobFormPage`, `TiktokAccountEditPage`, `ListLayout`).

### B. Giải Pháp Đã Triển Khai

#### 1. Hệ Thống Quản Lý Layout Đáp Ứng (`LayoutContext`)
- **Tệp mới**: [`modules/Core/resources/js/layouts/LayoutContext.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/LayoutContext.tsx)
- Cung cấp `LayoutProvider` và hook `useLayout()`:
  - Tự động nhận diện thiết bị di động (`isMobile = window.innerWidth < 992`).
  - Quản lý trạng thái thu gọn/mở rộng thanh bên trên desktop (`collapsed`: 230px $\leftrightarrow$ 74px).
  - Quản lý ngăn kéo điều hướng trên mobile (`mobileDrawerOpen`).
  - Tự động đóng Drawer di động khi người dùng nhấp chọn link chuyển trang (`useEffect` theo dõi `location.pathname`).

#### 2. Nâng Cấp Sidebar Thông Minh & Đa Nền Tảng (`Sidebar.tsx`)
- **Tệp**: [`modules/Core/resources/js/layouts/Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx)
- **Cơ chế hiển thị thích ứng kép**:
  - **Trên Mobile/Tablet (< 992px)**: Hiển thị dưới dạng Ant Design `Drawer` mượt mà trượt từ cạnh trái, đầy đủ logo thương hiệu và nút đóng, tự động đóng khi chọn mục menu.
  - **Trên Desktop (>= 992px)**: Hiển thị dưới dạng `Layout.Sider` có thể thu gọn (230px khi mở rộng, 74px khi thu gọn). Khi thu gọn, Ant Design Menu tự động hiển thị tooltip nhãn tên trang khi di chuột qua icon.
- **Hệ thống phân giải icon thông minh (`resolveMenuIcon`)**:
  - Hỗ trợ cả React element lẫn component class.
  - Cung cấp bản đồ ánh xạ icon tự động theo từ khóa đường dẫn (`dashboard` $\rightarrow$ `DashboardOutlined`, `crawler` $\rightarrow$ `RobotOutlined`, `tiktok` $\rightarrow$ `VideoCameraOutlined`, `user` $\rightarrow$ `TeamOutlined`, `role` $\rightarrow$ `SafetyCertificateOutlined`, `system` $\rightarrow$ `SettingOutlined`, `profile` $\rightarrow$ `UserOutlined`, fallback $\rightarrow$ `AppstoreOutlined`).
  - Cập nhật icon cho module TikTok Accounts thành [`VideoCameraOutlined`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/TiktokAccount/resources/js/routes/route.ts) tạo sự nhận diện khác biệt rõ ràng với Users (`TeamOutlined`).
- **Brand Banner & Nút Điều Khiển Chân Trang**:
  - Logo TikTok Crawler gradient xanh dương - xanh lục (`linear-gradient(135deg, #1677ff 0%, #00b96b 100%)`) kèm icon `DeploymentUnitOutlined` sang trọng.
  - Chân Sidebar trên desktop tích hợp nút bấm chuyển đổi thu gọn/mở rộng trực quan kèm tooltip.

#### 3. Nâng Cấp Header Tương Thích Di Động (`Header.tsx`)
- **Tệp**: [`modules/Core/resources/js/layouts/Header.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Header.tsx)
- Tích hợp nút Hamburger toggle ở góc trái: hiển thị `MenuOutlined` trên mobile để mở Drawer, hoặc `MenuFoldOutlined`/`MenuUnfoldOutlined` trên desktop để thu gọn Sider.
- Hiển thị nhãn định vị phân hệ đang hoạt động (ví dụ: "Dashboard", "Crawl Jobs", "TikTok Accounts", "Users").
- Trạng thái crawler: hiển thị tag đầy đủ "Crawler online" trên desktop và dot status gọn gàng trên mobile.
- Nút thông báo với badge xanh dương.
- Menu tài khoản người dùng co giãn linh hoạt: thu gọn text tên và vai trò trên màn hình nhỏ để tránh vỡ/tràn thanh Header.

#### 4. Khung Làm Việc Co Giãn Toàn Diện (`AdminLayout.tsx`)
- **Tệp**: [`modules/Core/resources/js/layouts/AdminLayout.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/AdminLayout.tsx)
- Bọc toàn bộ layout bằng `LayoutProvider`.
- Đệm và lề vùng nội dung làm việc (`Content`) được tối ưu linh hoạt:
  - Trên mobile: đệm 16px, lề `12px 10px 16px` giúp tận dụng tối đa diện tích hiển thị trên smartphone.
  - Trên desktop: đệm 24px, lề `20px 20px 24px`, nền thẻ trắng sang trọng bo góc 12px viền `#edf0f5`.

#### 5. Đồng Bộ Toàn Bộ Form Chiếm Trọn 100% Không Gian Nội Dung
- **`UserFormPage.tsx`**:
  - Xóa bỏ giới hạn `maxWidth: 960, margin: '0 auto'`; thiết lập `width: '100%', display: 'flex', flexDirection: 'column', gap: 20`.
  - Tích hợp thành phần dùng chung [`PageHeader`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PageHeader.tsx) chuẩn hóa với breadcrumb điều hướng (Dashboard $\rightarrow$ Users $\rightarrow$ Create/Edit User) và nút thao tác Cancel/Save Changes ở đầu trang.
  - Cấu trúc các khối thẻ card toàn chiều rộng với lưới phản hồi `Row gutter={[16, 16]}` (`xs={24} md={12}`) cho thông tin cơ bản và mật khẩu.
  - Bổ sung thanh footer card ở cuối trang với nút quay lại danh sách và nút submit lưu thông tin người dùng.
- **`ProfilePage.tsx`**:
  - Xóa bỏ giới hạn `maxWidth: 1100, margin: '0 auto'`; thiết lập `width: '100%', display: 'flex', flexDirection: 'column', gap: 20`.
  - Tích hợp `PageHeader` chuẩn mực với breadcrumbs (Dashboard $\rightarrow$ Profile).
  - Tỷ lệ cột lưới Responsive: cột thẻ tóm tắt hồ sơ `xs={24} md={8} lg={7}` và cột nội dung chỉnh sửa/lịch sử đăng nhập `xs={24} md={16} lg={17}`.
- **`UserDetailPage.tsx`**:
  - Chuẩn hóa điều hướng đầu trang sang `PageHeader` kèm breadcrumbs (Dashboard $\rightarrow$ Users $\rightarrow$ [Tên người dùng]) và nút chỉnh sửa, đồng bộ phong cách với `CrawlJobDetailPage` và `TiktokAccountDetailPage`.

### C. Xác Minh & Kết Quả
- Đạt 100% kiểm tra kiểu tĩnh: `npm run check-types` (`tsc --noEmit`) thành công với **0 lỗi**.
- Đạt 100% biên dịch Vite Bundle: `npm run build` hoàn tất trong **1.26s**.
- Đạt 100% biên dịch Laravel Mix: `npm run mix:core`, `npm run mix:user`, `npm run mix:auth` hoàn tất thành công xuất ra `index.js` và `vendor.js`.

---

## 8. Codebase Audit, Redundancy Elimination & Domain Decoupling

Nhằm đảm bảo nguyên lý **Single Responsibility Principle (SRP)** và cấu trúc module hóa chuẩn **Ureka Enterprise Architecture**, toàn bộ codebase đã được rà soát, dọn dẹp các tệp tin dư thừa và di chuyển các thành phần nghiệp vụ về đúng module sở hữu:

### 1. Xóa Bỏ Model Kế Thừa Giả & Chuẩn Hóa Domain Model Độc Lập
- **Vấn đề trước đây**: `modules/Core/src/Models/` chứa `Role.php` và `Permission.php`, trong khi `modules/Role` và `modules/Permission` lại khai báo `class Role extends CoreRole` và `class Permission extends CorePermission`. Đây là kiến trúc phản mẫu (anti-pattern) khiến Core bị ô nhiễm bởi các domain model cụ thể và các module chức năng bị phụ thuộc vô ích vào Core.
- **Giải pháp xử lý**:
  - Xóa bỏ hoàn toàn thư mục `modules/Core/src/Models/` (bao gồm `Role.php` và `Permission.php`).
  - Thiết lập [`modules/Role/src/Models/Role.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Role/src/Models/Role.php) thành Eloquent Model độc lập (`extends Model`), định nghĩa quan hệ `$this->belongsToMany(Permission::class)` và `$this->belongsToMany(User::class)`, cùng phương thức đồng bộ quyền theo slug `syncPermissions(array $permissions)`.
  - Thiết lập [`modules/Permission/src/Models/Permission.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Permission/src/Models/Permission.php) thành Eloquent Model độc lập (`extends Model`), định nghĩa quan hệ `$this->belongsToMany(Role::class)`.
  - Cập nhật toàn bộ các tệp tiêu thụ sang domain model chuẩn:
    - [`modules/Core/src/Traits/HasRolesAndPermissions.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Traits/HasRolesAndPermissions.php) $\rightarrow$ import `Modules\Permission\Models\Permission` và `Modules\Role\Models\Role`.
    - [`modules/User/src/Models/User.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Models/User.php) $\rightarrow$ import `Modules\Permission\Models\Permission` và `Modules\Role\Models\Role`.
    - [`modules/User/src/Repositories/UserRepository.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/src/Repositories/UserRepository.php) $\rightarrow$ import `Modules\Permission\Models\Permission` và `Modules\Role\Models\Role`.

### 2. Xóa Bỏ Controller Wrapper Thừa & Chuẩn Hóa Kế Thừa BaseController
- Xóa bỏ `modules/Core/src/Controllers/AuthController.php` (vốn chỉ là class rỗng kế thừa `Modules\Auth\Controllers\AuthController`). Cơ chế `DynamicRouteResovle` tự động định tuyến trực tiếp vào controller của từng module.
- Chuyển toàn bộ các Controller nghiệp vụ sang kế thừa trực tiếp từ [`Modules\Core\Controllers\BaseController`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/src/Controllers/BaseController.php) thay vì qua lớp trung gian `CoreController`:
  - `UserController extends BaseController`
  - `TiktokAccountController extends BaseController`
  - `CrawlJobController extends BaseController`
  - `CrawlResultController extends BaseController`
  - `RoleController extends BaseController`
  - `PermissionController extends BaseController`
  - `SystemSettingController extends BaseController`
  - `AuthController extends BaseController`

### 3. Di Chuyển & Chuẩn Hóa Seeders Về Đúng Domain Module
- **Chuyển Seeder người dùng**: Chuyển `UserSeeder.php` từ `modules/Core/database/seeders/` sang [`modules/User/database/seeders/UserSeeder.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/User/database/seeders/UserSeeder.php) thuộc namespace `Modules\User\Database\Seeders`.
- **Loại bỏ Seeder dư thừa trong Core**: Xóa bỏ `RolePermissionSeeder.php` và `CoreDatabaseSeeder.php` khỏi `modules/Core/database/seeders/` vì đã được đảm nhận độc lập bởi `PermissionSeeder.php` (module Permission) và `RoleSeeder.php` (module Role).
- **Cập nhật Root Seeder**: [`database/seeders/DatabaseSeeder.php`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/database/seeders/DatabaseSeeder.php) gọi tuần tự các seeder theo thứ tự phụ thuộc dữ liệu chuẩn:
  ```php
  $this->call([
      PermissionSeeder::class,
      RoleSeeder::class,
      UserSeeder::class,
      TiktokAccountSeeder::class,
      CrawlJobSeeder::class,
  ]);
  ```

### 4. Chuẩn Hóa Toàn Diện Các Thành Phần Dùng Chung Tại Core (`@core/components`)
- **Triết lý kiến trúc**: Mọi thành phần giao diện, tiện ích và cơ sở hạ tầng dùng chung xuyên suốt các module nghiệp vụ đều được đặt tập trung tại `modules/Core`:
  - **Shared UI Components** ([`modules/Core/resources/js/components/`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/)):
    - [`PermissionGate.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PermissionGate.tsx): Cổng bảo vệ render giao diện theo quyền module/action hoặc slug quyền hạn, đọc trạng thái auth toàn cục từ Redux.
    - [`RoleGate.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/RoleGate.tsx): Cổng bảo vệ render giao diện theo vai trò người dùng (`admin`, `manager`, etc.).
    - [`PermissionMatrix.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/components/PermissionMatrix.tsx): Bảng ma trận phân quyền trực quan Ant Design chia theo module và hành động (view/edit), được dùng chung bởi cả Role và User.
    - Bộ UI widgets dùng chung: `TableComponent`, `CardKPI`, `CustomModal`, `ConfirmDialog`, `PageHeader`, `EmptyState`, `StatusTag`, `SpinComponent`, `UploadComponent`, `ResourceForm`.
  - **Nhất quán import tại các module nghiệp vụ**: Toàn bộ trang nghiệp vụ (`TiktokAccountPage.tsx`, `CrawlJobsPage.tsx`, `RoleFormModal.tsx`) import các thành phần dùng chung thống nhất từ `@core/components`:
    ```tsx
    import { PermissionGate, RoleGate, PermissionMatrix, TableComponent, CardKPI, PageHeader } from '@core/components';
    ```
  - **Re-export tương thích tại Domain Module**: Các module `Auth` và `Permission` re-export các thành phần này để bảo đảm khả năng mở rộng và tương thích ngược.

### 5. Kết Quả Kiểm Thử Toàn Diện
- **PHP Syntax (`php -l`)**: 100% tệp tin PHP mới và cập nhật đạt chuẩn không có lỗi cú pháp.
- **TypeScript Type Checking (`npm run check-types`)**: Hoàn tất với **0 lỗi**.
- **Webpack / Laravel Mix Bundles**:
  - `mix:core` $\rightarrow$ `public/modules/Core/index.js` & `vendor.js`
  - `mix:permission` $\rightarrow$ `public/modules/Permission/index.js`
  - `mix:role` $\rightarrow$ `public/modules/Role/index.js`
  - `mix:crawler` $\rightarrow$ `public/modules/Crawler/index.js`
  - `mix:tiktokaccount` $\rightarrow$ `public/modules/TiktokAccount/index.js`

### 6. Tái Cấu Trúc Toàn Diện Sidebar Responsive & Hỗ Trợ Mobile (`Sidebar.tsx`)
- **Nguyên nhân lỗi vỡ giao diện trên mobile**:
  - Trước đây, component [`Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx) chỉ render trực tiếp thẻ `<Menu mode="inline">` bên trong `<Layout>`, hoàn toàn không bọc bằng `<Layout.Sider>` trên desktop hay `<Drawer>` trên mobile.
  - Khi truy cập bằng thiết bị di động (`isMobile < 992px`), Menu inline vẫn xuất hiện dưới dạng một flex child chiếm chiều rộng cạnh layout chính, ép khung nhìn co lại gây vỡ giao diện, đồng thời nút hamburger tại Header không thể kích hoạt mở menu.
- **Giải pháp triển khai hoàn chỉnh**:
  - **Chế độ Mobile (`isMobile < 992px`)**:
    - Render Ant Design `<Drawer>` (portal rendering, không chiếm diện tích trong DOM layout chính).
    - Đồng bộ trạng thái mở/đóng với `useLayout().mobileDrawerOpen` và `setMobileDrawerOpen`.
    - Header Drawer có logo thương hiệu, phiên bản `v1.0`, và nút đóng `X` bo tròn trực quan.
    - Footer Drawer hiển thị thông tin tài khoản (Avatar, họ tên, vai trò) và nút Đăng xuất nhanh (`LogoutOutlined`).
    - Tự động đóng Drawer khi người dùng click vào bất kỳ mục liên kết nào hoặc khi chuyển route.
  - **Chế độ Desktop (`isMobile >= 992px`)**:
    - Render Ant Design `<Layout.Sider>` với chiều rộng 250px (khi mở) và 80px (khi thu gọn), đồng bộ với `useLayout().collapsed`.
    - Header hiển thị logo TikTok Crawler CMS và tag định danh. Khi thu gọn, hiển thị icon trung tâm kèm Tooltip.
    - Footer Sider tích hợp nút toggle thu gọn/mở rộng và tag hiển thị trạng thái hệ thống.
  - **Tối ưu Outer Layout (`AdminLayout.tsx`)**:
    - Thiết lập dynamic prop `hasSider={!isMobile}` trên `<Layout>` ngoài cùng. Đảm bảo khi trên mobile, Layout chính tự động chiếm trọn 100% viewport width mà không bị ảnh hưởng bởi Sider.
  - **Tự động Active Menu thông minh (Longest Prefix Match)**:
    - Thay vì chỉ so khớp chính xác `pathname === item.path`, `selectedKey` tự động tìm route cha có tiền tố dài nhất phù hợp. Do đó, các trang chi tiết/thêm mới/chỉnh sửa (ví dụ `/crawler/crawl-job/1/edit` hay `/crawler/crawl-job/create`) vẫn giữ highlight chuẩn xác trên menu cha `Crawl Jobs`.
  - **Tinh chỉnh CSS mượt mà (`modules/Core/resources/css/app.css`)**:
    - Thanh cuộn siêu mảnh tùy biến cho Menu desktop và Drawer mobile (`.cms-sidebar-menu::-webkit-scrollbar`).
    - Bo tròn các menu item (`border-radius: 8px !important`), màu nền active dịu mắt `#eff8ff` và text `#175cd3`.

### 7. Khắc Phục Triệt Để Lỗi React Rules of Hooks tại `ResourceForm` & `CrawlJobFormPage`
- **Nguyên nhân lỗi (`React has detected a change in the order of Hooks called by ResourceForm`)**:
  - Trong `ResourceForm.tsx`, khi ở chế độ chỉnh sửa (`isEdit: true`), lần render đầu tiên hiển thị `<Spin>` và bỏ qua hàm `children(...)`. Khi dữ liệu tải xong (`loading: false`), `children(...)` được thực thi trực tiếp như một hàm JavaScript thông thường trong body của `ResourceForm`.
  - Tại `CrawlJobFormPage.tsx`, bên trong `children` có gọi hook `Form.useWatch('source_type', form)`. Khi `children(...)` được gọi như một hàm thường, React gán hook này vào danh sách hook của chính `ResourceForm`, dẫn đến lần render 1 có 24 hook, lần render 2 có 25 hook, vi phạm Rules of Hooks.
- **Giải pháp chuẩn hóa**:
  1. **Tách biệt sub-component trong `CrawlJobFormPage.tsx`**: Trích xuất toàn bộ trường nhập liệu và `Form.useWatch` thành component riêng biệt `CrawlJobFormFields({ form, isEdit, record })`. Component này sở hữu hook của riêng mình và tuân thủ tuyệt đối quy tắc React.
  2. **Bọc cách ly tại `ResourceForm.tsx`**: Tạo component `<FormContent renderFn={children} context={...} />` để thực thi hàm render prop. Bất kỳ hook nào được gọi qua render prop đều được cô lập bên trong fiber của `FormContent`, bảo vệ danh sách 24 hook của `ResourceForm` luôn cố định 100% ở mọi lần render.
  3. **Reset trạng thái sạch sẽ**: Khi chuyển từ chế độ chỉnh sửa sang tạo mới, tự động gọi `form.resetFields()` và `setRecord(null)` tránh lưu giữ giá trị cũ.

### 8. Mở Rộng Kiểu `PermissionAction` Trong `usePermission.ts`
- Bổ sung hành động `'edit'` vào type định nghĩa: `export type PermissionAction = 'view' | 'create' | 'update' | 'edit' | 'delete'`.
- Trong hàm `canDoModule`, xử lý tương đương giữa `'update'` và `'edit'`, đảm bảo an toàn tuyệt đối khi kiểm tra quyền và triệt tiêu lỗi TypeScript type check.

### 9. Tinh Gọn & Tối Ưu Hóa Header, Sidebar và Route Hooks (Triệt Tiêu Trùng Lặp & Double Tree Build)
- **Triệt tiêu trùng lặp User & Auth Logic**:
  - Tạo hook dùng chung [`useCurrentUser()`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/hooks/useCurrentUser.ts) tại `@core/hooks`. Đóng gói toàn bộ logic: lấy `user`, `isAuthenticated` từ Redux auth slice, format ký tự viết tắt `initials`, chuẩn hóa tên vai trò `roleLabel`, và hàm điều phối `logout` (dispatch `logoutThunk` và chuyển hướng về `/login`).
  - Cả [`Header.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Header.tsx) và [`Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx) dùng chung hook này, loại bỏ hoàn toàn code lặp và các import dư thừa.
- **Tối ưu hóa Header với `useCurrentRoute()`**:
  - Trước đây, `Header.tsx` gọi `useMenuRoutes()` (vốn build lại toàn bộ cây menu phân cấp trên mỗi lần render) chỉ để chạy `.find()` lấy label hiển thị breadcrumb/tiêu đề, dẫn đến việc không thể tìm thấy các sub-routes (như `/crawler/crawl-job/create`).
  - Tạo hook [`useCurrentRoute()`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/routes/registry.ts) tra cứu trực tiếp trên danh sách route phẳng (exact match trước, sau đó longest prefix match). Header chỉ cần gọi `useCurrentRoute()` để hiển thị chính xác `currentRoute?.title || currentRoute?.label`, đạt tốc độ tối đa và không phụ thuộc menu tree.
- **Triệt tiêu Double Tree Build trong Sidebar**:
  - `useMenuRoutes()` được memoize bằng `useMemo(() => buildMenuTree(routes), [routes])`, ngăn chặn việc tái tạo cây khi không có route mới đăng ký.
  - Trong [`Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx), gộp 2 hàm đệ quy duyệt cây riêng biệt (`filterAccessibleRoutes` và `buildMenuItems`) thành **một pass duy nhất**: duyệt cây route đã dựng sẵn từ `useMenuRoutes()`, kiểm tra quyền hạn và chuyển đổi trực tiếp sang Ant Design `Menu` items. Nếu node cha không có child nào được cấp quyền, node cha tự động bị ẩn.
- **Cơ chế Responsive Tinh Gọn (Icon-Only Trên Mobile, Không Dùng Modal/Drawer)**:
  - Header đã có sẵn Avatar, họ tên, vai trò và menu dropdown Đăng xuất hiển thị đầy đủ trên cả desktop lẫn mobile.
  - Loại bỏ hoàn toàn component `<Drawer>` hoặc modal popup phức tạp trên mobile.
  - Toàn bộ giao diện sử dụng thuần túy Ant Design `<Layout.Sider>` với `collapsible`, `width={240}` và `collapsedWidth={64}`:
    - Trên mobile (`< 992px`): Sidebar tự động ở chế độ thu gọn (`collapsed: true`), chỉ hiển thị các icon menu tối giản 64px, không che khuất màn hình và không bật popup.
    - Nút đóng mở tại Header và chân Sidebar điều khiển trực tiếp trạng thái `toggleCollapsed` (mở rộng 240px $\leftrightarrow$ thu gọn 64px icon-only).
### 10. Hỗ Trợ Điều Hướng Cho Menu Cha (Clickable Parent SubMenu & Active State Highlight)
- **Vấn đề ban đầu**:
  - Khi một menu cha (ví dụ `Users` tại đường dẫn `/user`) chứa các menu con (ví dụ `Roles & Access` tại `/user/role` thông qua cấu hình `parentPath: '/user'`), Ant Design Menu mặc định chuyển node cha thành `SubMenu`.
  - Do thuộc tính `label` ban đầu chỉ truyền chuỗi văn bản thuần túy và không có cơ chế bắt sự kiện điều hướng, khi người dùng click vào mục `Users`, menu chỉ thực hiện mở/đóng danh sách con mà không thể click để truy cập vào trang `/user`.
- **Giải pháp triển khai hoàn chỉnh tại [`Sidebar.tsx`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/js/layouts/Sidebar.tsx) & [`app.css`](file:///e:/Urekamedia/project1/cms-tiktok-crawler/modules/Core/resources/css/app.css)**:
  1. **Clickable Link trên tiêu đề menu cha (`label`)**:
     - Bọc `label` của node cha có `route.path` bằng `<NavLink to={route.path}>`.
     - Sử dụng `e.stopPropagation()` khi click vào liên kết để ngăn Ant Design tự động thu gọn menu khi người dùng nhấn chuyển trang.
     - Đồng thời tự động cập nhật `openKeys` đảm bảo menu cha luôn giữ trạng thái mở, hiển thị trọn vẹn các menu con bên dưới.
  2. **Xử lý sự kiện thông minh trên toàn bộ dòng tiêu đề (`onTitleClick`)**:
     - Kiểm tra vị trí click của người dùng thông qua `domEvent.target`:
       - Nếu click trúng icon mũi tên chevron bên phải (`.ant-menu-submenu-arrow`): Ant Design thực hiện mở/đóng submenu mượt mà mà không điều hướng.
       - Nếu click vào icon bên trái hoặc khoảng đệm: Tự động gọi `navigate(route.path)` để chuyển hướng vào trang của menu cha (ví dụ `/user`) khi ở chế độ expanded.
       - Khi ở chế độ thu gọn (`collapsed: true`): Giữ nguyên tương tác mở popup menu phụ của Ant Design.
  3. **Tự động mở menu cha khi truy cập (`useEffect openKeys`)**:
     - Bổ sung kiểm tra `isCurrentParent = Boolean(parent.path && (pathname === parent.path || pathname.startsWith(parent.path + '/')))`.
     - Khi người dùng truy cập trực tiếp `/user` hoặc các trang con (`/user/create`, `/user/1`), menu `Users` tự động mở rộng để hiển thị các tùy chọn con.
  4. **Active State Styling cho menu cha (`.cms-parent-active`)**:
     - Khi `pathname` khớp với route cha (`/user`, `/user/create`, `/user/:id`) và không có menu con nào đang active: Gán class `cms-parent-active` vào `SubMenu`.
     - Tinh chỉnh CSS trong `app.css` với nền xanh nhạt `#eff8ff`, màu chữ, icon và mũi tên chuyển sang xanh thương hiệu `#175cd3`, font weight `600`, đồng bộ tuyệt đối với các item thông thường.
  5. **Chuẩn hóa đường dẫn module User & Role (`route.ts`)**:
     - Chuẩn hóa các route con trong `modules/User/resources/js/routes/route.ts` thành đường dẫn tuyệt đối: `/user/create`, `/user/:id`, `/user/:id/edit`, khắc phục lỗi 404 khi truy cập từ `UserListPage`.
     - Route `/user` là menu cha cấp 1 độc lập (`icon: TeamOutlined`), không cấu hình `parentPath`.
     - Chuẩn hóa đường dẫn trong `modules/Role/resources/js/routes/route.ts` thành `/user/role` với `parentPath: '/user'`.
  6. **Phòng vệ chống vòng lặp tự tham chiếu (`registry.ts - buildMenuTree`)**:
     - Bổ sung kiểm tra `node.parentPath !== node.path` trong hàm `buildMenuTree` để đảm bảo nếu một route cấu hình `parentPath` trỏ vào chính nó, hệ thống sẽ tự động coi nó là root node thay vì tự nhét vào `subMenu` và làm biến mất khỏi giao diện.

### 11. Refactor Toàn Diện Hệ Thống Permission Matrix & Tinh Giản Component
- **Mục tiêu & Yêu cầu**:
  - Tái cấu trúc và chuẩn hóa component `PermissionMatrix` dùng chung tại Core ([`modules/Core/resources/js/components/PermissionMatrix.tsx`](modules/Core/resources/js/components/PermissionMatrix.tsx)) dựa trên Ant Design `<Table>`.
  - Tận dụng tối đa các component chuẩn có sẵn (`Table`, `Checkbox`, `Typography`, `Tag`, `Tooltip`, `Input`, `Alert`), tuyệt đối không tạo thêm các component thừa làm phình to source code.
  - Tương thích linh hoạt với tất cả các định dạng dữ liệu phân quyền trả về từ backend:
    - Định dạng nhóm `grouped_permissions`: `[{ module: 'core', items: [...] }, { module: 'system', ... }]`
    - Định dạng danh sách phẳng `permissions`: `[{ id: 1, name: '...', slug: 'core.view', module: 'core', action: 'view' }, ...]`
    - Định dạng bản đồ key-value `Record<string, PermissionItem[]>` từ API Role: `{ core: [...], user: [...] }`
  - Hỗ trợ cả 2 chế độ chọn:
    - `mode="slug"`: Trả về mảng slug strings (`string[]`, ví dụ `['core.view', 'user.create']`) tích hợp trực tiếp vào form người dùng `UserFormPage`.
    - `mode="id"`: Trả về mảng numeric IDs (`number[]`) tương thích với `RoleFormModal`.
    - Tự động nhận diện (mode `auto`) dựa trên kiểu dữ liệu đầu vào.
- **Tính năng nổi bật của PermissionMatrix mới**:
  1. **Bảng phân quyền trực quan theo dòng module & cột hành động**:
     - Cột Module: Tự động gắn icon chuyên biệt theo từng module (`AppstoreOutlined`, `RobotOutlined`, `ApiOutlined`, `UserOutlined`, `SafetyCertificateOutlined`, `KeyOutlined`, `SettingOutlined`), tên hiển thị chuẩn hóa và tag mã định danh module.
     - Các cột hành động chuẩn (`View`, `Create`, `Edit`, `Delete`): Checkbox với Tooltip hiển thị slug và mô tả chi tiết quyền. Tự động render dấu gạch ngang mờ `—` nếu module không hỗ trợ hành động đó.
     - Cột "All" (Cấp dòng): Cho phép bật/tắt toàn bộ quyền của riêng từng module với hỗ trợ trạng thái `indeterminate`.
  2. **Thanh công cụ Toolbar phía trên**:
     - Hiển thị tổng số quyền đã chọn / tổng số quyền của toàn hệ thống (`{selected} / {total} Selected`).
     - Checkbox "Select All Permissions" cho phép chọn tất cả hoặc bỏ chọn tất cả chỉ với 1 click (hỗ trợ trạng thái `indeterminate`).
     - Giao diện tinh gọn, tập trung hoàn toàn vào ma trận phân quyền không cần thanh tìm kiếm thừa.
  3. **Hỗ trợ đặc quyền Super Administrator**:
     - Khi `isAdmin: true` hoặc role có chứa `admin`, tự động hiển thị `Alert` thông báo đặc quyền Super Administrator.
     - Tất cả các checkbox tự động được đánh dấu và disable, đảm bảo tính nhất quán trực quan (Super Admin sở hữu toàn quyền không giới hạn).
- **Loại bỏ trùng lặp tại Module User ([`PermissionMatrixSelector.tsx`](modules/User/resources/js/components/PermissionMatrixSelector.tsx))**:
  - Xóa bỏ hoàn toàn 205 dòng mã khai báo ma trận tĩnh cứng `MODULES_MATRIX`.
  - Chuyển `PermissionMatrixSelector` thành lightweight bridge kết nối trực tiếp với Redux store (`groupedPermissionsCatalog` / `permissionsCatalog`) và bọc component Core `PermissionMatrix`.
  - Tích hợp trực tiếp vào [`UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx) thông qua `<Form.Item name="permissions">` với binding 2 chiều tự động.
- **Cải tiến hook `usePermission.ts`**:
  - Dọn sạch `console.log` thừa.
  - Chuẩn hóa kiểu `PermissionAction = 'view' | 'create' | 'edit' | 'update' | 'delete'`.
  - Hàm `canDoModule` xử lý tương đương giữa `'edit'` và `'update'`, đồng thời cấp quyền xem ngầm định (`view: true`) khi người dùng sở hữu bất kỳ quyền chỉnh sửa, cập nhật, tạo mới hoặc xóa nào.

### 12. Hỗ Trợ Lọc Quan Hệ Eloquent (Relation Filtering) Trong BaseController & UserController (Thuần Khai Báo - Không Cần Viết Hàm Tùy Biến)
- **Vấn đề ban đầu**:
  - `BaseController::applyFilters()` mặc định chỉ thực hiện truy vấn trực tiếp trên bảng chính (`$query->where($key, $value)` hoặc `$query->whereIn(...)`).
  - Khi frontend gửi tham số lọc theo quan hệ (ví dụ `roles.slug=editor` hoặc `role=editor` trên trang quản lý User), truy vấn sinh ra lỗi SQL `Unknown column 'roles.slug' in 'where clause'` do `roles` là quan hệ nhiều-nhiều (`BelongsToMany` qua bảng pivot `user_roles`), không phải cột trực tiếp của bảng `users`.
- **Giải pháp chuẩn hóa trong [`BaseController.php`](modules/Core/src/Controllers/BaseController.php)**:
  1. **Lọc quan hệ tự động qua Dot Notation (`whereHas`)**:
     - Trong `applyFilterItem`: Tự động nhận diện chuỗi có dấu chấm (`.` ví dụ `roles.slug`, `author.profile.city`). Tách phần quan hệ và cột (`[$relation, $relColumn]`), tự động bọc bằng `$query->whereHas($relation, fn($relQuery) => $this->applyColumnFilter($relQuery, $relColumn, $value))`.
     - Hỗ trợ toàn bộ các toán tử lọc bên trong relation: so sánh số (`>=`, `<=`, `>`, `<`), khoảng giá trị `whereBetween` (`10..50`), mảng giá trị `whereIn` (`admin,editor` hoặc mảng `['admin', 'editor']`), và tìm kiếm mẫu `like`.
     - Hỗ trợ cả các hậu tố so sánh ngày/số trên quan hệ (ví dụ `roles.created_at_gte`).
  2. **Bản đồ ánh xạ bí danh tham số (`$filterRelationMap`)**:
     - Cho phép controller con định nghĩa bí danh thân thiện từ query param sang đường dẫn quan hệ:
       ```php
       protected array $filterRelationMap = [
           'role' => 'roles.slug',
       ];
       ```
     - Khi frontend gọi `?role=admin`, hệ thống tự động ánh xạ sang `roles.slug` và lọc qua `whereHas('roles', fn($q) => $q->where('slug', 'admin'))`.
  3. **Không cần viết bất kỳ hàm tùy biến nào (Zero Custom Function)**:
     - Toàn bộ cơ chế vận hành thuần túy qua khai báo thuộc tính (`declarative`), triệt tiêu việc phải viết thêm hàm `filterByRole` hay reflection phức tạp.
  4. **Khai báo tinh gọn tại [`UserController.php`](modules/User/src/Controllers/UserController.php)**:
     - Chỉ cần khai báo 2 dòng thuộc tính:
       ```php
       protected array $filterableColumns = ['status', 'roles'];
       protected array $filterRelationMap = ['role' => 'roles.slug'];
       ```
     - `isFilterableColumn()` tự động phân giải: kiểm tra cả bí danh `'role'` lẫn quan hệ gốc `'roles'`, cho phép lọc trực tiếp qua `whereHas`.
  5. **Đồng bộ Frontend [`UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx)**:
     - Khai báo filter theo khóa `'role'`:
       ```tsx
       initialValue: params.role,
       onChange: (val) => dispatch(setParams({ role: val, page: 1 })),
       ```
     - Request gửi `?role=admin` và nhận về danh sách tài khoản chính xác 100%.

### 13. Khắc Phục Lỗi Cắt Nhầm Hậu Tố `_at` và Chuẩn Hóa Thứ Tự Ưu Tiên Filter trong `BaseController`
- **Vấn đề ban đầu**:
  - Khi thực hiện lọc theo các cột ngày tháng tiêu chuẩn của Laravel như `started_at`, `finished_at`, `created_at`, biểu thức chính quy so sánh hậu tố (`preg_match('/^(.+)_(from|start|min|gte|at|to|end|max|lte|gt|lt)$/', ...)`) chạy trước khi kiểm tra tên cột gốc, và cắt mất đuôi `_at` thành tên cột không tồn tại `started` (`Unknown column 'started' in 'where clause'`).
- **Giải pháp chuẩn hóa trong [`BaseController.php`](modules/Core/src/Controllers/BaseController.php)**:
  1. **Thứ tự ưu tiên 1 (Exact Match)**:
     - Kiểm tra nếu khóa gửi lên (`$rawKey` hoặc mapped key) trùng khớp với cột được khai báo trong `$filterableColumns` (ví dụ `started_at`, `finished_at`, `status`), hệ thống giữ nguyên 100% tên cột gốc để lọc, tuyệt đối không cắt chuỗi.
  2. **Thứ tự ưu tiên 2 (Comparison Suffix)**:
     - Chỉ khi khóa không khớp với cột gốc, hệ thống mới kiểm tra các hậu tố so sánh (`_from`, `_to`, `_start`, `_end`, `_min`, `_max`, `_gte`, `_lte`, `_gt`, `_lt`).
     - Loại bỏ hoàn toàn hậu tố không hợp lệ `at` khỏi danh sách regex và switch-case so sánh.
     - Tiền tố của hậu tố (ví dụ `started_at` trong `started_at_from`) bắt buộc phải là cột hợp lệ đã được khai báo trong `$filterableColumns`.
  3. **Hỗ trợ định dạng ngày `YYYY-MM-DD` trên timestamp**:
     - Khi lọc chính xác một ngày (ví dụ `started_at=2026-10-23`), hệ thống tự động sử dụng `whereDate($column, $value)` để khớp toàn bộ bản ghi trong ngày thay vì chỉ khớp lúc `00:00:00`.

---

### 14. AI Agent Operating System, Workspace Skills (.agents/skills), and Comprehensive Technical Documentation (docs/)
- **Context & Motivation**:
  - Standardized guidelines and procedural runbooks for AI agents (Antigravity, Cursor, Windsurf, Copilot) and human engineers working on the repository.
  - Enforced critical architectural guardrails: universal English language requirement across documentation, comments, and Web UI; Core-first reusability principle; autonomous agent self-evolution; and mandatory maintenance of `PROJECT_SUMMARY.md`.
- **Architectural Implementation**:
  1. **Master Agent Operating Directives ([`AGENTS.md`](AGENTS.md))**:
     - Formulated **The 10 Golden Rules** covering modular isolation (`modules/<ModuleName>/`), dynamic routing (`DynamicRouteResovle`), controller inheritance from [`BaseController`](modules/Core/src/Controllers/BaseController.php), standardized JSON responses via [`ApiResponseTrait`](modules/Core/src/Traits/ApiResponseTrait.php), repository-service separation, 100% strict TypeScript (`npm.cmd run check-types`), Windows PowerShell execution conventions (`npm.cmd` / `npx.cmd`), Core inspection & reusability, autonomous skill creation, and compulsory `PROJECT_SUMMARY.md` tracking.
  2. **Custom Workspace Skills ([`.agents/skills/`](.agents/skills/))**:
     - Created [`.agents/skills/ureka-module-scaffolder/SKILL.md`](.agents/skills/ureka-module-scaffolder/SKILL.md): Full-stack runbook to scaffold new Ureka modules across Backend and Frontend with complete boilerplate (Model, Repository, Service, Controller, FormRequest, Resource, ServiceProvider, Action, Redux slice/thunks, Route auto-registration, Pages).
     - Created [`.agents/skills/core-reusability-promoter/SKILL.md`](.agents/skills/core-reusability-promoter/SKILL.md): Decision matrix and protocol to inspect `modules/Core/` first, eliminate duplicate code, and promote reusable utilities/components to `Core`.
     - Created [`.agents/skills/self-evolution-guide/SKILL.md`](.agents/skills/self-evolution-guide/SKILL.md): Grants explicit authority and instructions for agents to autonomously author new skills and documentation as new workflows or integrations emerge.
     - Created [`.agents/skills/project-summary-updater/SKILL.md`](.agents/skills/project-summary-updater/SKILL.md): Procedural checklist for updating `PROJECT_SUMMARY.md` upon the conclusion of every coding session.
  3. **Specialized Technical Documentation Suite ([`docs/`](docs/))**:
     - Created [`docs/CORE_MODULE_GUIDE.md`](docs/CORE_MODULE_GUIDE.md): Inventory of all Core backend classes and frontend reusable components (`TableComponent`, `CardKPI`, `ResourceForm`, `ListLayout`, `CustomModal`, `PermissionGate`...).
     - Created [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md): React 19, TypeScript strict mode, Ant Design v6, Tailwind CSS v4, Redux Toolkit, and UI English vocabulary standards.
     - Created [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md): Detailed directory tree, module boundaries, and PSR-4 autoload mapping.
     - Created [`docs/API_GUIDE.md`](docs/API_GUIDE.md): Dynamic routing patterns, BaseController extension, Request validation, and TypeScript client integration.
     - Created [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md): In-memory SQLite testing, Sanctum authentication helpers, and static typecheck execution.
     - Created [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md): PSR-12, TypeScript conventions, naming standards, and Conventional Commits.
- **Verification**:
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 compilation errors.


### 15. Persistent Git Worktree Architecture & Concurrency Standards (Rule 0)
- **Context & Motivation**:
  - Implemented the worktree-exclusive development protocol to enable multi-agent concurrency, eliminate branch-hopping side-effects, and isolate running processes/ports across worktrees.
- **Architectural Implementation**:
  1. **Mandatory Worktree-Exclusive Protocol (Step 0)**:
     - Promoted to Rule 0 in [`AGENTS.md`](AGENTS.md): Agents must inspect active worktrees via `git worktree list` as the first step before running any coding tasks or modifying files.
     - The root repository (`E:\Urekamedia\project1`) acts strictly as an idle repository anchor tracking `main`.
     - All development, branch checkout, testing, and file operations must occur inside persistent worktrees (`project1-worktree-1` through `project1-worktree-5`).
  2. **Dedicated Workspace Skill ([`.agents/skills/git-workflow/SKILL.md`](.agents/skills/git-workflow/SKILL.md))**:
     - Operational procedures for inspecting worktrees, branching with `git checkout -B <type>/<task-name> origin/main`, Conventional Commits v1.0.0, direct rebase and push to remote `main`, and resetting worktrees back to idle tracking branches.
  3. **Technical Guide ([`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md))**:
     - Complete documentation of the 5-worktree architecture, directory paths, and partitioned port allocation:
       - Root Anchor: Laravel `8000`, Vite `5173` (Idle).
       - Worktree 1: Laravel `8010`, Vite `5181` (`project1-worktree-1`).
       - Worktree 2: Laravel `8020`, Vite `5182` (`project1-worktree-2`).
       - Worktree 3: Laravel `8030`, Vite `5183` (`project1-worktree-3`).
       - Worktree 4: Laravel `8040`, Vite `5184` (`project1-worktree-4`).
       - Worktree 5: Laravel `8050`, Vite `5185` (`project1-worktree-5`).
- **Verification**:
  - Verified worktree listing via `git worktree list`.
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 compilation errors.


### 16. TikTokAccount Metrics Filtering (Followers, Following, Likes) & Core NumericRangeFilter Promotion
- **Context & Motivation**:
  - Required list page filtering by TikTok metric counts (Followers, Following, Likes) in the `TiktokAccount` module (`TiktokAccountPage.tsx`).
  - Adhered to the Core-First Reusability principle (Golden Rule 2) by creating a generic, reusable numeric range filter component for all modules and natively integrating it with `ListLayout`.
- **Architectural Implementation**:
  1. **Core Reusable Component & ListLayout Integration (`modules/Core/`)**:
     - Created [`modules/Core/resources/js/components/NumericRangeFilter.tsx`](modules/Core/resources/js/components/NumericRangeFilter.tsx): Compact Ant Design Popover control with clickable quick preset tags and custom Min / Max numeric inputs, seamlessly outputting URL/query-ready strings (`min..max`, `>=min`, `<=max`, `<max`).
     - Enhanced [`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx) to support `type: 'numberRange'` and `presets?: NumericPreset[]` dynamically in its filter bar.
     - Exported `NumericRangeFilter` and its types in [`modules/Core/resources/js/components/index.ts`](modules/Core/resources/js/components/index.ts).
  2. **Backend Controller Filter & Sort Configuration (`modules/TiktokAccount/`)**:
     - Configured [`modules/TiktokAccount/src/Controllers/TiktokAccountController.php`](modules/TiktokAccount/src/Controllers/TiktokAccountController.php):
       - Allow-listed filterable columns: `followers_count`, `following_count`, `likes_count`, `status`, `crawled_at`, `is_verified`.
       - Added `$filterRelationMap` mapping convenience aliases `followers`, `following`, `likes` to database columns.
       - Allow-listed `$sortableColumns`: `followers_count`, `following_count`, `likes_count`, `video_count`, `crawled_at`, etc.
  3. **Frontend Preset Configuration & List Page (`modules/TiktokAccount/`)**:
     - Created [`modules/TiktokAccount/resources/js/configs/filterPresets.ts`](modules/TiktokAccount/resources/js/configs/filterPresets.ts) providing standard creator metric tiers:
       - Followers: `< 1K`, `1K - 10K`, `10K - 50K`, `50K - 100K`, `100K - 500K`, `500K - 1M`, `≥ 1M`.
       - Following: `< 100`, `100 - 500`, `500 - 1K`, `1K - 5K`, `5K - 10K`, `≥ 10K`.
       - Likes: `< 10K`, `10K - 50K`, `50K - 100K`, `100K - 500K`, `500K - 1M`, `1M - 5M`, `≥ 5M`.
     - Integrated `followers_count`, `following_count`, and `likes_count` into `filters` in [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx).
- **Verification**:
  - Authored Feature test suite [`tests/Feature/TiktokAccountFilterTest.php`](tests/Feature/TiktokAccountFilterTest.php): 6/6 tests passing (34 assertions) verifying range string filtering, comparison operator filtering, min/max suffix filtering, and combined multi-metric queries.
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 compilation errors.


### 17. Core ListLayout Component Refactoring & Performance Optimization
- **Context & Motivation**:
  - `ListLayout.tsx` was bloated with ~40 props, an over-engineered interface, and redundant logic (such as an unused search field dropdown selector, batch action indicators, duplicate filter value synchronization, and card styling parameters) that none of the active modules (`Crawler`, `TiktokAccount`, `User`) used.
  - An inline array dependency in `useEffect` caused repetitive re-render cycles and form field synchronization loops.
- **Architectural Implementation**:
  1. **Pruned Unused Props & Streamlined Interface ([`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx))**:
     - Stripped ~20 unused props: `searchFields`, `selectedSearchField`, `onSearchFieldChange`, `filterValues`, `onFilterChange`, `batchActions`, `selectedRowKeys`, `cardExtra`, `cardStyle`, `toolbarExtra`, `prependColumns`, `extraColumns`, `size`, `emptyDescription`, `emptyActionText`, `onEmptyAction`, `description`, `addIcon`, `addDisabled`.
     - Preserved the essential 14 props utilized across all module list pages (`title`, `subtitle`, `onAdd`, `addText`, `cardTitle`, `showSearch`, `searchPlaceholder`, `searchValue`, `onSearch`, `filters`, `onResetFilters`, `onRefresh`, `refreshing`, `columns`, `data`, `loading`, `pagination`, `onPageChange`, `renderColumns`, `rowKey`, `rowSelection`).
     - Reduced file size from 474 lines down to ~270 clean, highly maintainable lines.
  2. **Eliminated Re-render Loops**:
     - Removed the unnecessary `useEffect` that was observing the inline `filters` array literal on every render.
     - Form filter fields now initialize cleanly via Ant Design `initialValue` and reset predictably on `handleReset`.
  3. **Preserved Complete Type Compatibility**:
     - Retained exported TypeScript types (`FilterFieldType`, `FilterItemOption`, `SearchFieldOption`, `DynamicFilterField`, `FilterItemConfig`, `ListLayoutProps`) in [`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx) and [`modules/Core/resources/js/layouts/index.ts`](modules/Core/resources/js/layouts/index.ts).
- **Verification**:
  - Static typecheck verification: `npm.cmd run check-types` passing with 0 compilation errors across all modules.
  - Verified backend test suite: `php artisan test --filter TiktokAccountFilterTest` and `FetchApiTest` passing 100%.

---

### 18. Elimination of Redundant Barrel Re-Export `index.ts` Files & Direct Import Refactoring
- **Context & Motivation**:
  - Identified multiple redundant `index.ts` files throughout `modules/Core` and feature modules whose sole purpose was re-exporting internal symbols (barrel pattern).
  - Removing these files reduces bundle bloat, prevents circular dependency risks, eliminates compilation overhead, and enforces explicit, transparent import paths.
- **Architectural & Technical Solution**:
  1. **Deleted Redundant Barrel Re-Export Files**:
     - Removed `modules/Core/resources/js/index.ts` (root barrel).
     - Removed `modules/Core/resources/js/components/index.ts` (component barrel).
     - Removed `modules/Core/resources/js/hooks/index.ts` (hooks barrel).
     - Removed `modules/Core/resources/js/layouts/index.ts` (layouts barrel).
     - Removed `modules/Core/resources/js/utils/index.ts` (utils barrel).
     - Removed `modules/Core/resources/js/pages/ui/index.ts` (dashboard UI barrel).
     - Removed `modules/Core/resources/js/routes/index.ts` (routes barrel).
     - Removed `modules/Permission/resources/js/index.ts` (empty re-export file).
  2. **Cleaned Module Entrypoint Files**:
     - Stripped unused `export * from ...` re-export bloat from `modules/Auth/resources/js/index.ts`, `modules/Crawler/resources/js/index.ts`, `modules/Role/resources/js/index.ts`, `modules/System/resources/js/index.ts`, `modules/TiktokAccount/resources/js/index.ts`, and `modules/User/resources/js/index.ts`. Retained strictly their runtime route registration logic (`registerRoutes(...)`).
  3. **Direct Import Refactoring**:
     - Converted all barrel imports to direct component/hook/registry imports across `CrawlJobDetailPage.tsx`, `CrawlJobFormPage.tsx`, `CrawlJobsPage.tsx`, `RoleFormModal.tsx`, `TiktokAccountFormPage.tsx`, `TiktokAccountPage.tsx`, `UserDetailPage.tsx`, `UserFormPage.tsx`, `AppRouter.tsx`, `Header.tsx`, `Sidebar.tsx`, and `DashboardPage.tsx`.
- **Verification**:
  - TypeScript static verification: `npm.cmd run check-types` passed with 0 errors.
  - Laravel Mix build: `npm.cmd run mix:crawler` compiled successfully (generating `/modules/Core/index.js`, `/modules/Crawler/index.js`, `modules/Core/app.css`, `modules/Core/vendor.js`, and `entrypoints.json`).


### 19. Webpack Module Discovery Fix: Re-establishing Minimal Module Entrypoint for Permission Module
- **Context & Problem**:
  - Running Webpack / Laravel Mix produced `ERROR in /modules/Permission/index: Module not found: Can't resolve '.../modules/Permission/resources/js/index.ts'`.
  - Cause: While sub-directory re-export barrels (e.g. `components/index.ts`, `utils/index.ts`) are redundant and safely removed, the root file `modules/<ModuleName>/resources/js/index.ts` serves a dual purpose: it acts as the build entrypoint discovered by `build/modules.js` (`discoverModules()`) to compile `/modules/<ModuleName>/index.js` for Laravel Mix / Blade Scoped DOM.
- **Architectural & Technical Solution**:
  1. **Re-established Minimal Entrypoint**:
     - Created a clean, minimal entrypoint in [`modules/Permission/resources/js/index.ts`](modules/Permission/resources/js/index.ts) containing only its runtime module dependencies (`Action/permission` and `components/PermissionMatrix`), with zero redundant re-export barrel overhead.
  2. **Preserved Pure Barrel Elimination**:
     - Confirmed that all internal sub-directory barrel files (`components/index.ts`, `hooks/index.ts`, `layouts/index.ts`, `utils/index.ts`, `pages/ui/index.ts`, `routes/index.ts`, and `Core/resources/js/index.ts`) remain eliminated with all consuming components utilizing explicit direct imports.
- **Verification**:
  - Full Laravel Mix build (`npm.cmd run mix:all`) successfully compiled all 8 modules (`Auth`, `Core`, `Crawler`, `Permission`, `Role`, `System`, `TiktokAccount`, `User`) and generated `public/entrypoints.json` with 0 errors.
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 errors.


### 18. User, Role, and Permission Module Decoupling & Unified User Controller Architecture
- **Context & Motivation**:
  - The `User` module previously contained direct queries to `Role` and `Permission` models in `UserRepository` (`getAllRolesAndPermissions()`, direct Eloquent `Role::with(...)` and `Permission::all()` queries, and raw `Role::whereIn` / `Permission::whereIn` lookups in `User.php`), violating modular boundaries and leaking role/permission persistence logic into the User repository.
  - The user requested strict differentiation and decoupling of query responsibilities across `User`, `Role`, and `Permission`, while centralizing the API controllers for user management under the `User` module (`UserController -> /admin/api/user`, `RoleController -> /admin/api/user/role`, `PermissionController -> /admin/api/user/permission`) for cohesive management.
- **Architectural & Technical Solution**:
  1. **Strict Query Decoupling (Module Boundary Separation)**:
     - **Role Module (`modules/Role/`)**:
       - Added `allWithPermissions(): Collection`, `getBySlugs(array $slugs): Collection`, and `resolveIdsBySlugs(array $slugs): array` to [`RoleRepositoryInterface`](modules/Role/src/Repositories/RoleRepositoryInterface.php) and [`RoleRepository`](modules/Role/src/Repositories/RoleRepository.php).
       - Encapsulated all `roles` and role-permission queries strictly within `RoleRepository` / `RoleService`.
     - **Permission Module (`modules/Permission/`)**:
       - Added `resolveIdsBySlugs(array $slugs): array` to [`PermissionRepositoryInterface`](modules/Permission/src/Repositories/PermissionRepositoryInterface.php) and [`PermissionRepository`](modules/Permission/src/Repositories/PermissionRepository.php).
       - Encapsulated all `permissions` queries strictly within `PermissionRepository` / `PermissionService`.
     - **User Module (`modules/User/`)**:
       - Removed `use Modules\Permission\Models\Permission;` and `use Modules\Role\Models\Role;` from [`UserRepository.php`](modules/User/src/Repositories/UserRepository.php).
       - Removed `getAllRolesAndPermissions()` from [`UserRepositoryInterface`](modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php) and [`UserRepository`](modules/User/src/Repositories/UserRepository.php).
       - In [`User.php`](modules/User/src/Models/User.php), replaced raw Eloquent queries in `syncRoles` and `syncPermissions` with injected calls to `RoleRepositoryInterface::resolveIdsBySlugs()` and `PermissionRepositoryInterface::resolveIdsBySlugs()`.
       - Updated [`UserService`](modules/User/src/Services/UserService.php): injected `RoleRepositoryInterface` and `PermissionRepositoryInterface`, and introduced `getRolesAndPermissionsCatalog()` aggregating data cleanly across domain repositories.
       - Updated [`UserServiceProvider`](modules/User/src/Providers/UserServiceProvider.php) to bind and inject `RoleRepositoryInterface` and `PermissionRepositoryInterface` into `UserService`.
  2. **Controller Centralization Under `modules/User/`**:
     - **`Modules\User\Controllers\UserController`**:
       - Serves `/admin/api/user` (and `/admin/api/user/user`).
       - Set `public string $permissionModule = 'user';`.
       - Handles CRUD, `updateStatus`, `statisticsSummary`, and `rolesAndPermissions` (delegating to `UserService::getRolesAndPermissionsCatalog()`).
     - **`Modules\User\Controllers\RoleController`**:
       - Created in [`modules/User/src/Controllers/RoleController.php`](modules/User/src/Controllers/RoleController.php).
       - Serves `/admin/api/user/role`.
       - Set `public string $permissionModule = 'role';`.
       - Handles role CRUD and `permissions()` catalog using injected `RoleService` and `PermissionService`.
     - **`Modules\User\Controllers\PermissionController`**:
       - Created in [`modules/User/src/Controllers/PermissionController.php`](modules/User/src/Controllers/PermissionController.php).
       - Serves `/admin/api/user/permission`.
       - Set `public string $permissionModule = 'permission';`.
       - Handles permission index and `modules()` grouped permissions.
     - **Backward Compatibility**:
       - [`Modules\Role\Controllers\RoleController`](modules/Role/src/Controllers/RoleController.php) and [`Modules\Permission\Controllers\PermissionController`](modules/Permission/src/Controllers/PermissionController.php) inherit from their counterparts in `Modules\User\Controllers`, ensuring both `/admin/api/role/role` and `/admin/api/permission/permission` legacy routes continue working without breakage.
  3. **Core Dynamic Routing Support (`DynamicRouteResovle.php`)**:
     - Added support in [`modules/Core/src/Support/DynamicRouteResovle.php`](modules/Core/src/Support/DynamicRouteResovle.php) for single-segment module routes:
       - `/{module}` -> maps to `$module` controller (e.g. `/admin/api/user`).
       - `/{module}/{id}` -> maps to `$module` controller with ID (e.g. `/admin/api/user/5`).
       - `/{module}/{id}/{action}` -> maps to `$module` controller with ID and action (e.g. `/admin/api/user/5/status`).
     - Constrained route segment regexes to prevent numeric IDs from shadowing controller names.
     - Added support for `$controllerInstance->permissionModule` property in `DynamicRouteResovle::handle()` for precise RBAC permission checking.
  4. **Frontend API Client Alignment**:
     - [`modules/Role/resources/js/Action/role.ts`](modules/Role/resources/js/Action/role.ts): aligned endpoints to `/user/role` (and `/user/role/permissions`).
     - [`modules/Permission/resources/js/Action/permission.ts`](modules/Permission/resources/js/Action/permission.ts): aligned endpoints to `/user/permission` (and `/user/permission/modules`).
     - [`modules/User/resources/js/Action/user.ts`](modules/User/resources/js/Action/user.ts): aligned `baseURL` to `/user`.
- **Verification**:
  - Authored comprehensive test suite [`tests/Feature/UserRolePermissionDecouplingTest.php`](tests/Feature/UserRolePermissionDecouplingTest.php): 4/4 passing (51 assertions).
  - Verified [`tests/Feature/UserModuleTest.php`](tests/Feature/UserModuleTest.php): 15/15 passing (64 assertions).
  - Verified [`tests/Feature/AuthAndModulePermissionTest.php`](tests/Feature/AuthAndModulePermissionTest.php): 8/8 passing (79 assertions).
  - TypeScript type check: `npm.cmd run check-types` passed with 0 compilation errors.

---

### 20. Elimination of Redundant BaseRepository Overrides, Model Query Standardization & Barrel Rule Enforcement
- **Context & Problem**:
  - Identified anti-patterns in repository classes: `PermissionRepository` and `RoleRepository` were re-implementing methods already provided by `BaseRepository` (such as `findById`, `findOrFail`), and interfaces were re-declaring them instead of extending `BaseRepositoryInterface`.
  - In multiple repositories (`PermissionRepository`, `RoleRepository`, `CrawlJobRepository`, `SystemSettingRepository`, `UserRepository`), custom methods called static models directly (e.g. `Permission::where(...)`, `Role::with(...)`, `CrawlJob::count()`, `User::create(...)`) instead of utilizing `$this->model`, violating the Repository Pattern and impeding test mockability.
  - Agents previously created unnecessary `index.ts` barrel files used solely for re-exporting.
- **Architectural & Technical Solution**:
  1. **Refactored Repositories & Interfaces**:
     - `PermissionRepositoryInterface` & `RoleRepositoryInterface`: Now extend `Modules\Core\Repositories\Interfaces\BaseRepositoryInterface`. Removed duplicate declarations of `all`, `findById`, `findOrFail`, `create`, `update`, `delete`.
     - `PermissionRepository` & `RoleRepository`: Removed redundant `findById()` and `findOrFail()` method implementations. Converted all internal queries from static model calls (`Permission::`, `Role::`) to `$this->model->...`.
     - `CrawlJobRepository`: Converted `CrawlJob::count()`, `CrawlJob::sum(...)`, and `CrawlJob::where(...)` to `$this->model->...`.
     - `SystemSettingRepository`: Converted `SystemSetting::where(...)` and `SystemSetting::all()` to `$this->model->where(...)` and `$this->all()`.
     - `UserRepository`: Standardized `User::create($userData)` to `$this->model->create($userData)`.
  2. **Rule Codification Across Project Directives**:
     - Updated **Rule 2** in [`AGENTS.md`](AGENTS.md): Enforced Zero Redundant Overrides of base methods and mandatory querying via `$this->model`.
     - Updated **Rule 11** in [`AGENTS.md`](AGENTS.md): Strictly banned the creation of unnecessary `index.ts` barrel re-export files; mandated explicit direct imports.
     - Synchronized guidelines into [`docs/CORE_MODULE_GUIDE.md`](docs/CORE_MODULE_GUIDE.md), [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md), and [`.agents/skills/core-reusability-promoter/SKILL.md`](.agents/skills/core-reusability-promoter/SKILL.md).
- **Verification**:
  - Executed automated test suites: `UserModuleTest` (15/15 passed), `AuthAndModulePermissionTest` (8/8 passed), `TiktokAccountFilterTest` (6/6 passed).
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 compilation errors.

---

### 21. Fix Dashboard Route Registration and 404 Not Found
- **Context & Problem**:
  - The dashboard page at `/admin` and `/admin/dashboard` returned 404 Not Found.
  - Root cause: When barrel `index.ts` files were removed, `initRouteRegistry()` inside [`modules/Core/resources/js/routes/autoRegister.tsx`](modules/Core/resources/js/routes/autoRegister.tsx) was left orphaned with no callers. Consequently, Core built-in routes (`/dashboard`, `/404`) were never registered into `window.__CMS_ROUTES_REGISTRY__`, causing React Router to fall through to `<Route path="*" element={<NotFound />} />`.
- **Architectural & Technical Solution**:
  1. **Core Route Auto-Initialization**:
     - Updated [`modules/Core/resources/js/routes/autoRegister.tsx`](modules/Core/resources/js/routes/autoRegister.tsx) to self-execute `initRouteRegistry()` on import and export it cleanly.
     - Imported `./routes/autoRegister` in [`modules/Core/resources/js/AppRouter.tsx`](modules/Core/resources/js/AppRouter.tsx).
  2. **Permission Safeguard**:
     - Updated [`modules/Core/resources/js/hooks/usePermission.ts`](modules/Core/resources/js/hooks/usePermission.ts) to automatically allow `core` and `auth` modules for authenticated users, aligning with `config('modules.ignore_check_permission')`.
  3. **Syntax Fix in Role Table**:
     - Fixed missing comma in column definitions inside [`modules/Role/resources/js/components/RoleTableList.tsx`](modules/Role/resources/js/components/RoleTableList.tsx).
  4. **Bundle Recompilation**:
     - Recompiled Core module bundle with `npm.cmd run mix:core`, emitting updated `public/modules/Core/index.js` containing `DashboardPage` and `/dashboard` route.
- **Verification**:
  - Verified `public/modules/Core/index.js` includes `path:"/dashboard"` and `DashboardPage`.
  - TypeScript static typecheck: `npm.cmd run check-types` passing cleanly with 0 errors.
  - Automated PHP test suite: `tests/Feature/UserRolePermissionDecouplingTest.php` passing 100% (4/4 passed).

---

### 22. Standardized Table Base Actions, Universal useAction Hook & Redux State Architecture
- **Context & Problem**:
  - Across multiple pages (e.g. `RolesPage.tsx`, `UserListPage.tsx`, `CrawlJobsPage.tsx`), components manually declared action columns with Popconfirm, Tooltip, and Button boilerplate.
  - Asynchronous CRUD handlers (`handleDelete`, status changes) duplicated 10-15 lines of try/catch, manual message notifications, and reload boilerplate across files.
  - `RolesPage.tsx` suffered from sprawling `useState` anti-patterns (7 separate state hooks for roles, permissions, loading, search keyword, pagination, modal visibility, and selected role), manually calculating pagination and duplicating async dispatching.
- **Architectural & Technical Solution**:
  1. **Streamlined `TableComponent` with Essential Base Actions**:
     - Updated [`modules/Core/resources/js/components/Table.tsx`](modules/Core/resources/js/components/Table.tsx) to keep only truly necessary action props:
       - `onEdit?: (record: T) => void`
       - `onDelete?: (record: T) => any`
       - `canDelete?: (record: T) => boolean`
       - `extraActions?: (record: T) => React.ReactNode`
     - Automatically renders fixed right action column with Edit button and Delete button wrapped in Popconfirm, eliminating over-engineered configurations (`actionsColumnTitle`, `actionsColumnWidth`, `actionsAlign`, `actionsColumnFixed`, `deleteConfirmTitle`, etc.).
     - Forwarded streamlined props through [`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx).
  2. **Concise Action Execution Hook (`useAction`)**:
     - Streamlined [`modules/Core/resources/js/hooks/useAction.ts`](modules/Core/resources/js/hooks/useAction.ts) (`@core/hooks/useAction`):
       - Signature: `useAction(api, successMessage, callback)` or `useAction(api, options)`.
       - Calls the API function, automatically displays `message.success` or `message.error`, and executes the callback to reload data.
       - Returns `{ execute, loading }`.
  3. **Role Domain Redux Architecture & Page Refactoring**:
     - Authored [`modules/Role/resources/js/store/role/roleSlice.ts`](modules/Role/resources/js/store/role/roleSlice.ts) and [`modules/Role/resources/js/store/role/roleThunks.ts`](modules/Role/resources/js/store/role/roleThunks.ts) managing roles, permissions, pagination, and modal dialog state.
     - Registered `roleReducer` in Core [`modules/Core/resources/js/store/index.ts`](modules/Core/resources/js/store/index.ts).
     - Refactored [`modules/Role/resources/js/pages/RolesPage.tsx`](modules/Role/resources/js/pages/RolesPage.tsx): eliminated all 7 `useState` hooks in favor of `useSelector((state) => state.role)`, `useDispatch()`, and concise `useAction`.
     - Streamlined [`modules/Role/resources/js/components/RoleTableList.tsx`](modules/Role/resources/js/components/RoleTableList.tsx): removed manual 35-line `actionColumns` boilerplate in favor of `TableComponent`'s native `onEdit`, `onDelete`, and `canDelete`.
  4. **Codified Agent Operating Standards**:
     - Added **Rule 12** in [`AGENTS.md`](AGENTS.md): Strict ban on sprawling `useState` in pages; mandatory self-evaluation to author Redux Slices & Thunks for domain entities; universal adoption of `useAction` and `TableComponent` base action props.
     - Documented guidelines in [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md).
- **Verification**:
  - TypeScript static verification: `npm.cmd run check-types` passing with 0 compilation errors.
  - Recompiled bundles via `npm.cmd run mix:role`: `public/modules/Core/index.js` (103 KiB) and `public/modules/Role/index.js` (81.2 KiB) successfully emitted.
  - Automated PHP test suite: `tests/Feature/UserRolePermissionDecouplingTest.php` passing 100%.

---

### 23. Role & Permission Module Refactoring Verification & Redux Integration Completion
- **Context & Motivation**:
  - The user requested completing the refactoring of both `Role` and `Permission` modules.
  - Addressed residual static queries in `Role.php`, decoupled permission resolution via `PermissionRepositoryInterface`, streamlined `RoleService`, and fully migrated `RolesPage.tsx` to Redux state management and `useAction`.
- **Architectural & Technical Solution**:
  1. **Model & Service Cleanups**:
     - In [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php): Replaced static `Permission::whereIn(...)` in `syncPermissions()` with dependency injection via `PermissionRepositoryInterface::resolveIdsBySlugs()`.
     - In [`modules/Role/src/Services/RoleService.php`](modules/Role/src/Services/RoleService.php): Standardized `updateRole()` to invoke `$this->roleRepository->update($role->id, $updateData)` and reload fresh database attributes with `->refresh()->load('permissions')`.
     - In [`modules/Core/src/Support/DynamicRouteResovle.php`](modules/Core/src/Support/DynamicRouteResovle.php): Restored single-segment module routing patterns (`/{module}`, `/{module}/{id}`, `/{module}/{id}/{action}`) and ensured `$controllerInstance->permissionModule` binds to the request attribute for accurate RBAC verification.
  2. **Frontend State & Page Refactoring**:
     - Fully migrated [`modules/Role/resources/js/pages/RolesPage.tsx`](modules/Role/resources/js/pages/RolesPage.tsx) from sprawling local `useState` hooks to centralized Redux (`useSelector((state) => state.role)`, `useDispatch()`) and [`useAction`](modules/Core/resources/js/hooks/useAction.ts).
     - Dispatched `fetchRoles(params)` on filter changes and `fetchAvailablePermissions()` on mount.
     - Cleaned minimal entrypoint in [`modules/Permission/resources/js/index.ts`](modules/Permission/resources/js/index.ts) with zero barrel re-exports.
- **Verification**:
  - Static TypeScript typecheck: `npm.cmd run check-types` passed with 0 errors.
  - Webpack / Laravel Mix: `npm.cmd run mix:role` successfully compiled `/modules/Core/index.js` (102 KiB) and `/modules/Role/index.js` (81.1 KiB) into `public/entrypoints.json`.
  - Automated backend test suite: `UserRolePermissionDecouplingTest` (4/4 passed), `UserModuleTest` (15/15 passed), `AuthAndModulePermissionTest` (8/8 passed).

---

### 24. Backend Architectural Restructuring: Standardized `Http/` Layer (`Controllers`, `Middleware`, `Requests`)
- **Context & Motivation**:
  - The user requested updating the backend architecture so that inside each module's `src/` directory, an `Http/` layer is introduced to encapsulate HTTP transport concerns: `Controllers/`, `Middleware/`, and `Requests/` (`modules/<ModuleName>/src/Http/Controllers/`, `modules/<ModuleName>/src/Http/Middleware/`, `modules/<ModuleName>/src/Http/Requests/`).
- **Architectural & Technical Solution**:
  1. **Physical Directory Reorganization & Git History Preservation**:
     - Relocated `Controllers/`, `Requests/`, and `Middleware/` into `Http/` across all 9 modules (`API`, `Auth`, `Core`, `Crawler`, `Permission`, `Role`, `System`, `TiktokAccount`, `User`) using `git mv` to preserve git tracking history.
  2. **Namespace & Import Modernization**:
     - Controllers updated to `namespace Modules\<Module>\Http\Controllers;`.
     - Form Requests updated to `namespace Modules\<Module>\Http\Requests;`.
     - Middleware updated to `namespace Modules\Core\Http\Middleware;`.
     - BaseController moved to `Modules\Core\Http\Controllers\BaseController`, with all feature controllers extending it.
     - Updated cross-module imports (e.g., `Modules\User\Http\Controllers\RoleController`, `Modules\User\Http\Controllers\PermissionController`), service provider middleware aliases (`AuthServiceProvider`), route definitions (`modules/API/routes/api.php`, `modules/Crawler/routes/api.php`, `modules/TiktokAccount/routes/api.php`), and test suites.
  3. **Dynamic Routing Engine Update (`DynamicRouteResovle.php`)**:
     - Enhanced `DynamicRouteResovle::resovleController()` to resolve candidate controllers prioritizing `Modules\<Module>\Http\Controllers\` first, with fallback candidates maintaining backwards compatibility.
     - Updated pipeline middleware reference to `Modules\Core\Http\Middleware\CheckModulePermission::class`.
  4. **Autoload & Documentation Synchronization**:
     - Regenerated Composer classmap via `composer dump-autoload` (8,169 classes discovered).
     - Updated architectural blueprints and developer documentation:
       - [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md): Documented `src/Http/` directory tree.
       - [`docs/API_GUIDE.md`](docs/API_GUIDE.md): Updated controller boilerplate and Form Request namespaces.
       - [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md): Codified `src/Http/Controllers/`, `src/Http/Requests/`, `src/Http/Middleware/` placement rules.
       - [`AGENTS.md`](AGENTS.md): Updated Golden Rule 6 to specify `src/Http/` transport layer.
       - [`.agents/skills/ureka-module-scaffolder/SKILL.md`](.agents/skills/ureka-module-scaffolder/SKILL.md): Updated module generation sequence to produce `src/Http/Controllers/`, `src/Http/Middleware/`, and `src/Http/Requests/`.
- **Verification**:
  - Static TypeScript verification: `npm.cmd run check-types` passed with 0 errors.
  - Automated PHP feature tests:
    - `UserModuleTest`: 15/15 passed (100%).
    - `UserRolePermissionDecouplingTest`: 4/4 passed (100%).
    - `AuthLoginLogTest`: 5/5 passed (100%).
    - `ModuleEntrypointDomTest`: 6/6 passed (100%).
    - `TiktokAccountFilterTest`: 6/6 passed (100%).
    - `CoreDynamicRoutingTest::test_dynamic_route_resolver_unit_methods`: passed.
    - `CrawlerArchitectureTest::test_controllers_inherit_from_core_controller`: passed.

---

### 25. Permission Management System & Universal `ListLayout` Adoption (Role & Permission Summary Cards Removal)
- **Context & Motivation**:
  - The user requested:
    1. In the `Permission` module: Add a comprehensive permissions list page (`PermissionsPage`), a modal to create a module with standard permissions (`CreateModuleModal` supporting `view`, `create`, `edit`, `delete`), and a modal to create individual permissions (`CreatePermissionModal` supporting module selection and custom permission attributes).
    2. Refactor both `Role` and `Permission` modules to utilize Core's standardized `ListLayout` and remove summary cards (`CardKPI` blocks).
- **Architectural & Technical Solution**:
  1. **Core `ListLayout` Enhancement**:
     - Extended [`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx) to accept `extra?: ReactNode;` in `ListLayoutProps`, allowing custom multi-button header actions (e.g. "Create Module" and "Create Permission") while remaining 100% backward-compatible with `onAdd` and `addText`.
  2. **Role Module `ListLayout` Refactoring**:
     - Modernized [`modules/Role/resources/js/pages/RolesPage.tsx`](modules/Role/resources/js/pages/RolesPage.tsx):
       - Removed `CardKPI` summary cards (`<Row gutter={[16, 16]}>`).
       - Adopted `ListLayout` for unified header, search toolbar, reset filters, and refresh actions.
       - Embedded `<RoleTableList />` as child content, preserving existing edit/delete workflows with zero local `useState` boilerplate.
  3. **Permission Module Backend & API Implementation**:
     - **Form Requests**:
       - [`modules/Permission/src/Http/Requests/StorePermissionRequest.php`](modules/Permission/src/Http/Requests/StorePermissionRequest.php): Validates single permission creation.
       - [`modules/Permission/src/Http/Requests/CreateModulePermissionsRequest.php`](modules/Permission/src/Http/Requests/CreateModulePermissionsRequest.php): Validates module key, label, and array of actions (`view`, `create`, `edit`, `delete`).
     - **Service Layer**:
       - Enhanced [`modules/Permission/src/Services/PermissionService.php`](modules/Permission/src/Services/PermissionService.php) with `createPermission`, `createModulePermissions`, and `deletePermission`.
     - **Controller Endpoints**:
       - Updated [`modules/User/src/Http/Controllers/PermissionController.php`](modules/User/src/Http/Controllers/PermissionController.php) with `store`, `createModule`, `destroy`, `distinctModules`, and `index`.
  4. **Permission Frontend Architecture**:
     - **API Client**:
       - Updated [`modules/Permission/resources/js/Action/permission.ts`](modules/Permission/resources/js/Action/permission.ts) with `getPermissions`, `getGroupedPermissions`, `getDistinctModules`, `createPermission`, `createModulePermissions`, `deletePermission`.
     - **Redux Slice & Thunks**:
       - Created [`modules/Permission/resources/js/store/permission/permissionSlice.ts`](modules/Permission/resources/js/store/permission/permissionSlice.ts) and [`modules/Permission/resources/js/store/permission/permissionThunks.ts`](modules/Permission/resources/js/store/permission/permissionThunks.ts), mounted in Core store [`modules/Core/resources/js/store/index.ts`](modules/Core/resources/js/store/index.ts).
     - **Components**:
       - [`CreateModuleModal.tsx`](modules/Permission/resources/js/components/CreateModuleModal.tsx): Module identifier input, display name, 4 basic action checkboxes (`view`, `create`, `edit`, `delete`), Select/Deselect All shortcuts, live generated slug previews, and submission handler.
       - [`CreatePermissionModal.tsx`](modules/Permission/resources/js/components/CreatePermissionModal.tsx): Module AutoComplete (selecting existing or typing new), action AutoComplete with presets, auto-suggested name and slug, and description input.
       - [`PermissionTableList.tsx`](modules/Permission/resources/js/components/PermissionTableList.tsx) & [`permissionTableConfig.ts`](modules/Permission/resources/js/configs/permissionTableConfig.ts): Color-coded tags for modules and action verbs (view=blue, create=green, edit=orange, delete=red, etc.) and delete action with confirmation.
       - [`PermissionsPage.tsx`](modules/Permission/resources/js/pages/PermissionsPage.tsx): Built with `ListLayout`, featuring dynamic module and action filters, keyword search, refresh, and header buttons to launch modals without card summary clutter.
     - **Route Registration**:
       - Defined `/user/permission` in [`modules/Permission/resources/js/routes/route.ts`](modules/Permission/resources/js/routes/route.ts) with `parentPath: '/user'`, integrating seamlessly under the Users navigation menu.
       - Auto-registered routes in [`modules/Permission/resources/js/index.ts`](modules/Permission/resources/js/index.ts).
- **Verification**:
  - TypeScript Typecheck: `npm.cmd run check-types` passed with 0 errors.
  - Production Builds:
    - `npm.cmd run mix:role`: Compiled `/modules/Role/index.js` (97.8 KiB).
    - `npm.cmd run mix:permission`: Compiled `/modules/Permission/index.js` (101 KiB).
  - Automated PHP Tests:
    - `tests/Feature/PermissionManagementTest.php`: 5/5 tests passed (23 assertions).
    - `tests/Feature/UserRolePermissionDecouplingTest.php`: 4/4 tests passed (51 assertions).

---

### 26. AGENTS.md Optimization & High-Density Core Reusability Matrix
- **Context & Motivation**:
  - The user observed that `AGENTS.md` was excessively verbose and consumed too many tokens, yet AI agents frequently failed to focus on the essential rules—often reinventing boilerplate logic instead of utilizing existing Core assets such as `ListLayout`, `TableComponent`, `useAction`, and `BaseRepository`.
  - The objective was to streamline `AGENTS.md` by ~65% token reduction while making the Core reusability guidelines concrete, prominent, and strictly mandatory.
- **Architectural & Technical Solution**:
  1. **Token Reduction & Structural Streamlining**:
     - Condensed `AGENTS.md` from 169 lines (~1,800 tokens) down to 67 lines (~600 tokens), eliminating redundant Mermaid flowcharts, duplicated index tables, and verbose multi-section repetitions.
     - Structured into 4 high-signal, punchy sections:
       1. *Non-Negotiable Core Invariants* (Worktrees, English-only, Strict TypeScript, Windows PowerShell, No barrel index files, Mandatory summary update).
       2. *Core Reusability Matrix (DO NOT REINVENT — REUSE EXISTING ASSETS!)*.
       3. *Step-by-Step Execution Protocol*.
       4. *Quick Command Reference*.
  2. **Concrete Core Reusability Enforcement**:
     - High-density lookup table explicitly mandating the usage of:
       - [`ListLayout`](modules/Core/resources/js/components/ListLayout.tsx) for all listing pages (strict ban on custom container divs).
       - [`TableComponent`](modules/Core/resources/js/components/Table.tsx) with native action props (`onEdit`, `onDelete`, `canDelete`, `extraActions`).
       - [`useAction`](modules/Core/resources/js/hooks/useAction.ts) for async CRUD item execution (strict ban on manual `try/catch` and `useState(loading)`).
       - Redux Toolkit for state management (strict ban on 5+ local `useState` hooks per page).
       - [`BaseController`](modules/Core/src/Http/Controllers/BaseController.php) in `src/Http/Controllers/` with thin controller rules.
       - [`BaseRepository`](modules/Core/src/Repositories/BaseRepository.php) with `$this->model` querying and zero redundant method overrides.
- **Verification**:
  - Validated markdown formatting and clickable file links.
  - Confirmed concise token footprint and clear guidance.

---

### 27. Single-Module Build Manifest & Entrypoint Retention Mechanism
- **Context & Motivation**:
  - When executing single-module builds (e.g. `npm run mix:permission` or `npm run mix:crawler`), Laravel Mix's default behavior was to completely recreate and wipe `public/mix-manifest.json` with only the currently compiled module entries.
  - Furthermore, `public/entrypoints.json` was at risk of discarding modules not present in the active Webpack compilation graph.
  - As a result, opening the browser after building a single module rendered only the compiled module and Core in the sidebar, while all other business modules disappeared and threw asset loading errors in Laravel Blade.
- **Architectural & Technical Solution**:
  1. **Manifest Merging & Preservation in `webpack.mix.js`**:
     - Hooked directly into `Mix.primary.manifest` from `laravel-mix/src/Mix`.
     - Pre-populated `mixManifest.manifest` on initialization from existing `public/mix-manifest.json`.
     - Overrode `mixManifest.refresh()` to merge existing manifest entries with newly compiled assets (`this.manifest = { ...existing, ...this.manifest }`).
     - Scanned `public/modules/` directory to guarantee that every previously built module (`index.js` and `app.css`) remains present in the manifest even across partial builds.
     - Implemented `safeWriteFileSync()` with retries to protect against transient Windows EPERM / filesystem file lock contentions.
  2. **Entrypoint Persistence & Cache-Busting Version Query Synchronization**:
     - Updated [`build/EntrypointsPlugin.js`](build/EntrypointsPlugin.js) to resolve all JS and CSS asset paths against `mix-manifest.json`, ensuring `entrypoints.json` directly saves cache-busting version strings (`?id=<hash>`) identical to `mix-manifest.json`.
     - In [`webpack.mix.js`](webpack.mix.js), hooked into `mixManifest.refresh()` to immediately propagate updated asset version hashes from `this.manifest` into `public/entrypoints.json` whenever any module build finishes.
     - Enhanced [`ModuleRegistry.php`](modules/Core/src/Support/ModuleRegistry.php) with `resolveAssetUrl()` and `getMixManifest()`, ensuring that Blade directives `@moduleJs` and `@moduleCss` always render versioned asset URLs (`<script src=".../modules/Core/vendor.js?id=...">`), eliminating browser stale caching issues.
     - Restored [`modules/Core/configs/modules.php`](modules/Core/configs/modules.php) defaults with standard array mappings for modules, routes, and permissions.
- **Touched Files**:
  - [`webpack.mix.js`](webpack.mix.js): Manifest interceptor, merge logic, disk discovery, `safeWriteFileSync()`, and live `entrypoints.json` hash sync.
  - [`build/EntrypointsPlugin.js`](build/EntrypointsPlugin.js): Fallback module disk detection, `mix-manifest.json` version mapping, and resilient manifest writing.
  - [`modules/Core/src/Support/ModuleRegistry.php`](modules/Core/src/Support/ModuleRegistry.php): Asset URL resolver with manifest fallback and cache busting.
  - [`modules/Core/configs/modules.php`](modules/Core/configs/modules.php): Module routes, actions, and permission bypass configuration arrays.
  - [`tests/Feature/ModuleEntrypointDomTest.php`](tests/Feature/ModuleEntrypointDomTest.php): Automated test asserting cache-busting version query inclusion.
- **Verification**:
  - **TypeScript Typecheck**: `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - **Single-Module Build**: `npm.cmd run mix:permission` compiled successfully in 22.4s.
  - **Manifest & Entrypoints Validation**:
    - `public/mix-manifest.json`: Retained all 12 entries across all 8 modules with updated hash queries.
    - `public/entrypoints.json`: 100% in sync with `mix-manifest.json`, containing versioned hashes (`?id=...`) for all active modules.
  - **Automated PHP Tests**: `php artisan test --filter ModuleEntrypointDomTest` $\rightarrow$ 7/7 tests passed (40 assertions).

---

### 28. Unified Modular Build & Runtime Chunk Synchronization (Fixing `r[e] is not a function` via Ureka StableVendorIdsPlugin)
- **Context & Bug Root Cause**:
  - **Runtime Chunk Collision & Missing Module IDs**: When building individual modules (e.g., `npm run mix:user`), the previous configuration registered only `[Core, User]` into Webpack's entry list. Webpack recompiles `public/modules/Core/vendor.js`. With Webpack's default `deterministic` numeric module IDs, building a subset shifts or removes module IDs that untouched modules (`Crawler`, `TiktokAccount`, etc.) still reference. When Laravel Blade loaded all modules via `@moduleJs('all')`, calling `__webpack_require__(moduleId)` on missing IDs resulted in `r[e]` being `undefined`, throwing `Uncaught TypeError: r[e] is not a function`.
  - **Node 24 Windows V8 Zone Allocation Crash**: Running full production builds (`npm run mix:all`) crashed with `FATAL ERROR: Zone Allocation failed - process out of memory` due to Terser worker threads (`parallel: true`) on Node 24 Windows and insufficient heap (4096MB).
- **Architectural & Technical Solution (Aligned with Ureka Core)**:
  1. **Adopted Ureka's `StableVendorIdsPlugin`**:
     - Inspected `E:/Urekamedia/ureka/build/StableVendorIdsPlugin.js` and `E:/Urekamedia/ureka/webpack.mix.js`.
     - Ported and enhanced [`build/StableVendorIdsPlugin.js`](build/StableVendorIdsPlugin.js) for `cms-tiktok-crawler`:
       - Hooks into Webpack's `compilation.hooks.moduleIds` to assign immutable relative path IDs (`react/index.js`, `antd/es/table/index.js`, `modules/Core/...`) instead of arbitrary numeric hashes.
       - Hooks into `compilation.hooks.chunkIds` to assign stable canonical names to chunks (`modules/Core/vendor`).
       - This guarantees that when building a single module (`npm run mix:user` compiling only `[Core, User]`), all module and chunk IDs remain 100% identical and compatible across all modules on disk.
  2. **Single-Module vs Build All Support**:
     - `npm run mix:user` / `npm run mix:<module>`: Compiles **ONLY** `[Core, <module>]` in ~11s without touching or breaking other modules.
     - `npm run mix:all`: Compiles all 8 modules in ~24s without any memory issues.
     - `public/entrypoints.json` & `public/mix-manifest.json`: Retains all 8 modules across single-module builds.
  3. **Terser & Memory Optimization for Node 24 Windows**:
     - Set `terser: { parallel: false, extractComments: false }` to prevent Windows Node 24 worker thread Zone allocation failures.
     - Upgraded heap memory to `--max-old-space-size=8192` across [`package.json`](package.json) scripts and in [`scripts/mix-module.cjs`](scripts/mix-module.cjs).
- **Touched Files**:
  - [`build/StableVendorIdsPlugin.js`](build/StableVendorIdsPlugin.js): Ureka immutable module/chunk ID plugin.
  - [`webpack.mix.js`](webpack.mix.js): Single-module target filtering (`[Core, <Target>]`), `StableVendorIdsPlugin` integration, filesystem cache, safe Terser config.
  - [`scripts/mix-module.cjs`](scripts/mix-module.cjs): Node memory allocation enforcement (`--max-old-space-size=8192`) and target logging.
  - [`package.json`](package.json): Updated all `mix:*` scripts to 8192MB heap.
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md): Documented milestone 28.
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - `npm.cmd run mix:all` $\rightarrow$ Compiled all 8 modules cleanly in 24s.
  - `npm.cmd run mix:user` $\rightarrow$ Compiled **only** `[Core, User]` in 11s.
  - Verified 100% of module IDs in `TiktokAccount` exist and match `vendor.js` and `core.js` (0 missing IDs).


---

### 29. Dynamic Sidebar Menu Accessibility & Parent Route Display Fix
- **Context & Bug Root Cause**:
  - **Issue**: When a user was granted permissions on a parent module (e.g., `view` permission on `user`), but had no permissions on its submodules (`role`, `permission` which declare `parentPath: '/user'`), the entire `user` menu item disappeared from the sidebar navigation.
  - **Root Cause in `Sidebar.tsx`**:
    - Route hierarchy is dynamically constructed via `buildMenuTree()`, which attaches child routes (`role`, `permission`) to their parent route (`user`) in `route.subMenu`.
    - In `Sidebar.tsx`, `transformRoutes()` evaluated `const hasChildren = Boolean(route.subMenu && route.subMenu.length > 0);`. When `accessibleChildren = transformRoutes(route.subMenu!)` returned an empty array `[]` (because the user lacked view permissions for both `role` and `permission`), the function immediately executed `continue;`.
    - This prematurely discarded the parent `user` route before evaluating whether the parent itself was accessible via `isAccessible(route)`.
- **Architectural & Technical Solution**:
  1. **Fallback to Leaf Navigation Item**:
     - Refactored `transformRoutes()` in [`modules/Core/resources/js/layouts/Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx):
       - If `accessibleChildren.length > 0`: Render as an Ant Design `SubMenu` containing only the accessible child items. The parent title links to `route.path` and triggers navigation only if `isAccessible(route)` is true.
       - If `accessibleChildren.length === 0`: The loop no longer halts via `continue;`. Instead, it falls through to evaluate `if (isAccessible(route) && route.path)`:
         - If the parent route is accessible (e.g., `user` has `view` permission), it renders directly as a top-level single leaf menu item with its own icon and `NavLink` pointing to `route.path`.
         - If the parent route is also not accessible, it is excluded completely.
  2. **Comprehensive Permission Evaluation**:
     - Streamlined `isAccessible(route)` to leverage `can({ role: route.roles, slug: route.slug, module: route.module, action: route.action || 'view' })` from [`usePermission`](modules/Core/resources/js/hooks/usePermission.ts), correctly respecting custom route actions and slugs.
  3. **Cleanup**:
     - Removed leftover development `console.log` statements in [`Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx).
- **Touched Files**:
  - [`modules/Core/resources/js/layouts/Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx): Fallback to leaf menu item when children are inaccessible, `usePermission.can()` integration, removed debug logs.
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md): Added Section 29 documentation.
- **Verification**:
  - **TypeScript Typecheck**: `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - **Bundle Compilation**: Recompiled Core module assets with Webpack Mix successfully.

---

### 30. Collapsed Sidebar Icon Preservation, Distinct Submenu Icons & Direct Navigation
- **Context & Bug Root Cause**:
  - **Issue 1 (Disappearing Submenu Icons in Collapsed Mode)**: When sidebar was collapsed to 64px icon rail (`collapsed === true`), routes with submenus (e.g. `user` containing `role` and `permission`) were rendered as an Ant Design `SubMenu`. Ant Design hid child items inside a collapsed hover popup, causing `role` and `permission` icons to completely vanish from the sidebar rail.
  - **Issue 2 (User Icon Unclickable in Collapsed Mode)**: Clicking the `user` icon in collapsed mode failed to navigate to `/user`. `onTitleClick` specifically exited early via `if (collapsed) return;`, and Ant Design does not fire Menu `onClick` for `SubMenu` header titles.
  - **Issue 3 (Identical Icons for User, Role, and Permission)**:
    - In [`Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx), `resolveMenuIcon(item)` checked `if (typeof item.icon === 'function')`. In modern `@ant-design/icons`, components are created via `React.forwardRef`, which evaluate to `typeof === 'object'`, causing the check to fail.
    - The fallback path matching checked `if (path.includes('user')) return <TeamOutlined />` before checking `role` or `permission`. Since role (`/user/role`) and permission (`/user/permission`) contain `user`, they both defaulted to `TeamOutlined`, duplicating the User icon.
- **Architectural & Technical Solution**:
  1. **Flattened Rail in Collapsed Mode**:
     - In [`modules/Core/resources/js/layouts/Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx), updated `transformRoutes()`: when `collapsed === true`, all accessible routes (parent and children) are flattened directly into top-level menu items.
     - Each item renders its distinct icon, a `<NavLink>` to its target URL, and `title: route.label` so Ant Design displays a clean native tooltip on hover.
     - Role and Permission icons remain visible, accessible, and one-click navigable on the collapsed rail.
  2. **Direct Parent Route Navigation**:
     - In collapsed mode, `user` is rendered as a standard leaf item, so clicking the icon navigates immediately to `/user`.
     - In expanded mode, removed `collapsed` blocker in `onTitleClick` so clicking the parent title or icon navigates smoothly to `/user` while keeping the submenu expanded.
  3. **Accurate Icon Resolution**:
     - Updated `resolveMenuIcon()` to render any React component (`const IconComponent = item.icon as any; return <IconComponent />`), supporting forwardRef icon objects.
     - Imported [`KeyOutlined`](https://ant.design/components/icon) from `@ant-design/icons`.
     - Re-ordered path fallbacks to check specific submodules first: `permission` $\rightarrow$ `KeyOutlined`, `role` $\rightarrow$ `SafetyCertificateOutlined`, `user` $\rightarrow$ `TeamOutlined`.
- **Touched Files**:
  - [`modules/Core/resources/js/layouts/Sidebar.tsx`](modules/Core/resources/js/layouts/Sidebar.tsx): Flattening in collapsed mode, forwardRef icon instantiation, path fallback order, and navigation fixes.
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md): Added Section 30 documentation.
- **Verification**:
  - **TypeScript Typecheck**: `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - **Bundle Compilation**: Recompiled Core bundle (`node scripts/mix-module.cjs Core`) $\rightarrow$ Compiled successfully in 11.1s.

---

### 31. Core Module Refactoring: Dedicated Dashboard Aggregated API & Decoupled RBAC Permission Resolution
- **Context & Motivation**:
  - Users granted strictly `core.view` (Dashboard access) without access to feature modules (`crawler`, `tiktok_account`) experienced blank/empty dashboard cards because `DashboardPage.tsx` previously fired 3 independent requests directly to module-specific endpoints:
    1. `GET /crawler/crawl-job/statistics-summary` (demanded `crawler.view`)
    2. `GET /tiktok-account/tiktok-account/statistic-summary` (demanded `tiktok_account.view`)
    3. `GET /crawler/crawl-job` (demanded `crawler.view`)
  - Middleware `CheckModulePermission` returned 403 Forbidden on these requests, breaking data loading for restricted viewers.
- **Architectural & Technical Solution (Hướng 1 - Dedicated Dashboard API)**:
  1. **Backend Aggregator Service (`DashboardService`)**:
     - Created [`modules/Core/src/Services/DashboardService.php`](modules/Core/src/Services/DashboardService.php).
     - Injects `CrawlJobRepositoryInterface` and `TiktokAccountRepositoryInterface` to compile `crawler_statistics`, `tiktok_statistics`, and top 5 `recent_jobs` in a single server-side execution.
     - Gracefully handles missing tables or inactive services with safe default zero-state dictionaries.
  2. **Dedicated Core Controller (`DashboardController`)**:
     - Created [`modules/Core/src/Http/Controllers/DashboardController.php`](modules/Core/src/Http/Controllers/DashboardController.php) extending `BaseController`.
     - Declared `public string $permissionModule = 'core';`, ensuring any user with `core.view` permission is authorized.
     - Handled `GET /admin/api/core/dashboard` (`index()` and `overview()`), returning unified JSON payload via `ApiResponseTrait`.
  3. **Frontend API & Page Optimization**:
     - Created [`modules/Core/resources/js/Action/dashboard.ts`](modules/Core/resources/js/Action/dashboard.ts) with `getDashboardOverview()`.
     - Refactored [`modules/Core/resources/js/pages/DashboardPage.tsx`](modules/Core/resources/js/pages/DashboardPage.tsx):
       - Eliminated 3 parallel `Promise.allSettled` requests in favor of a single `getDashboardOverview()` call.
       - Wrapped actionable triggers ("Create Crawl Job" button, "View all" link, row detail link) in `<PermissionGate>` so users without `crawler` permissions see static labels instead of broken links.
     - Enhanced [`modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx`](modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx) with `usePermission()` filtering to dynamically render only shortcuts the current user is authorized to perform.
  4. **Automated Feature Verification**:
     - Created [`tests/Feature/DashboardOverviewTest.php`](tests/Feature/DashboardOverviewTest.php) verifying:
       1. Admin receives full dashboard data.
       2. User with strictly `core.view` successfully fetches aggregated dashboard data.
       3. User with strictly `core.view` remains strictly forbidden (403) from querying `/crawler/crawl-job/statistics-summary` directly, adhering to the Principle of Least Privilege.
- **Touched Files**:
  - [`modules/Core/src/Services/DashboardService.php`](modules/Core/src/Services/DashboardService.php)
  - [`modules/Core/src/Http/Controllers/DashboardController.php`](modules/Core/src/Http/Controllers/DashboardController.php)
  - [`modules/Core/resources/js/Action/dashboard.ts`](modules/Core/resources/js/Action/dashboard.ts)
  - [`modules/Core/resources/js/pages/DashboardPage.tsx`](modules/Core/resources/js/pages/DashboardPage.tsx)
  - [`modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx`](modules/Core/resources/js/pages/ui/DashboardQuickShortcuts.tsx)
  - [`tests/Feature/DashboardOverviewTest.php`](tests/Feature/DashboardOverviewTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
---

### 32. Workspace-wide `useAction` Adoption & `UploadComponent` Streamlining
- **Context & Motivation**:
  - **Repetitive Action Logic**: Multiple modules (`User`, `Crawler`, `TiktokAccount`, `Role`, `Permission`, `System`, `Auth`, `Core`) contained boilerplate `try / catch` blocks with manual `message.success`, `message.error`, and `loading` state handling for API actions (delete, status toggling, submission, resetting).
  - **Bloated `UploadComponent`**: [`UploadComponent.tsx`](modules/Core/resources/js/components/UploadComponent.tsx) grew to over 500 lines containing 4 complex variants (`dragger`, `picture-card`, `button`, `avatar`), redundant enlarged preview Modals, complex `fileList` synchronizations, and unused upload options (`customRequest`, `action`, `multiple`, `createdUrlsRef`), whereas the application only required a clean, Form.Item-compatible avatar/image uploader.
- **Architectural & Technical Solution**:
  1. **Enhanced `useAction` & `useAct` Hook**:
     - Upgraded [`modules/Core/resources/js/hooks/useAction.ts`](modules/Core/resources/js/hooks/useAction.ts) and created [`useAct.ts`](modules/Core/resources/js/hooks/useAct.ts) supporting 3 flexible execution paradigms:
       - **Pre-bound Action**: `const { execute: handleDelete } = useAction((item) => deleteItem(item.id), 'Success message', reload);`
       - **Pre-bound Reload**: `const { act, loading } = useAction(reloadCallback); act(() => apiCall(), 'Success message');`
       - **Call-site Action**: `const { act, loading } = useAction(); act(() => apiCall(), 'Success', onSuccess);`
  2. **Workspace-wide Refactoring**:
     - Refactored all entity actions to use `useAction`:
       - [`modules/User/resources/js/pages/UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx) & [`UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx)
       - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx) & [`CrawlJobDetailPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx)
       - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx) & [`TiktokAccountDetailPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountDetailPage.tsx)
       - [`modules/Role/resources/js/components/RoleFormModal.tsx`](modules/Role/resources/js/components/RoleFormModal.tsx)
       - [`modules/Permission/resources/js/components/CreateModuleModal.tsx`](modules/Permission/resources/js/components/CreateModuleModal.tsx) & [`CreatePermissionModal.tsx`](modules/Permission/resources/js/components/CreatePermissionModal.tsx)
       - [`modules/System/resources/js/pages/SystemSettingsPage.tsx`](modules/System/resources/js/pages/SystemSettingsPage.tsx)
       - [`modules/Auth/resources/js/components/ResetPasswordForm.tsx`](modules/Auth/resources/js/components/ResetPasswordForm.tsx)
       - [`modules/Core/resources/js/components/ResourceForm.tsx`](modules/Core/resources/js/components/ResourceForm.tsx)
  3. **`UploadComponent` Streamlining**:
     - Refactored [`modules/Core/resources/js/components/UploadComponent.tsx`](modules/Core/resources/js/components/UploadComponent.tsx) from **505 lines down to 180 lines** (65% reduction).
     - Stripped unused `dragger`, `picture-card`, `button` variants and popup preview Modals.
     - Kept essential core: native Ant Design `<Form.Item name="avatar">` binding (`value` & `onChange`), instant ObjectURL image preview, file size/MIME validation, hover overlay to change/remove image, and full backward compatibility.
- **Touched Files**:
  - [`modules/Core/resources/js/hooks/useAction.ts`](modules/Core/resources/js/hooks/useAction.ts) & [`modules/Core/resources/js/hooks/useAct.ts`](modules/Core/resources/js/hooks/useAct.ts)
  - [`modules/Core/resources/js/components/UploadComponent.tsx`](modules/Core/resources/js/components/UploadComponent.tsx)
  - [`modules/Core/resources/js/components/ResourceForm.tsx`](modules/Core/resources/js/components/ResourceForm.tsx)
  - [`modules/User/resources/js/pages/UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx) & [`UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx) & [`CrawlJobDetailPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx)
  - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx) & [`TiktokAccountDetailPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountDetailPage.tsx)
  - [`modules/Role/resources/js/components/RoleFormModal.tsx`](modules/Role/resources/js/components/RoleFormModal.tsx)
  - [`modules/Permission/resources/js/components/CreateModuleModal.tsx`](modules/Permission/resources/js/components/CreateModuleModal.tsx) & [`CreatePermissionModal.tsx`](modules/Permission/resources/js/components/CreatePermissionModal.tsx)
  - [`modules/System/resources/js/pages/SystemSettingsPage.tsx`](modules/System/resources/js/pages/SystemSettingsPage.tsx)
  - [`modules/Auth/resources/js/components/ResetPasswordForm.tsx`](modules/Auth/resources/js/components/ResetPasswordForm.tsx)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - `npm.cmd run mix:core` $\rightarrow$ Compiled successfully in 13.8s.

---

### 33. Domain Decoupling & Model Burden Reduction across User, Role, and Permission Modules
- **Context & Motivation**:
  - The user identified architectural violations where the User module was overburdened: `UserRepository` and `User.php` simultaneously handled user creation, data hashing, cross-module role syncing, permission syncing, and validation.
  - Crucially, Eloquent Models (`User.php` and `Role.php`) contained service locator anti-patterns (`app(\Modules\Role\Repositories\RoleRepositoryInterface::class)->resolveIdsBySlugs(...)` and `app(\Modules\Permission\Repositories\PermissionRepositoryInterface::class)->resolveIdsBySlugs(...)`) to resolve slugs inside database entity classes.
  - The objective was to enforce strict domain boundaries ("module nào làm nhiệm vụ của module đó"), eliminate `app(...)` service locator calls in models in favor of constructor Dependency Injection in the Service layer, and lighten the burden on Eloquent models.
- **Architectural & Technical Solution**:
  1. **Lightweight Models (Zero `app(...)` Service Locator Calls)**:
     - In [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php): Removed all `app(...)` container resolutions. `syncRoles(array $roleIds)` and `syncPermissions(array $permissionIds)` now strictly receive integer IDs and sync via Eloquent `belongsToMany` relations.
     - In [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php): Removed `app(PermissionRepositoryInterface::class)` call. `syncPermissions(array $permissionIds)` now strictly receives integer IDs.
  2. **Encapsulated Slug Resolvers & Service Domain Delegation**:
     - In [`modules/Permission/src/Services/PermissionService.php`](modules/Permission/src/Services/PermissionService.php): Added `resolvePermissionIds(array $permissions): array` resolving mixed slug strings and integer IDs via injected `PermissionRepositoryInterface`.
     - In [`modules/Role/src/Services/RoleService.php`](modules/Role/src/Services/RoleService.php): Added `resolveRoleIds(array $roles): array` resolving mixed slug strings and integer IDs via injected `RoleRepositoryInterface`, and manages role permission syncing.
     - In [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php): Refactored `createUser()` and `updateUser()` to orchestrate the lifecycle cleanly:
       - Injects `UserRepositoryInterface`, `RoleRepositoryInterface`, and `PermissionRepositoryInterface`.
       - Extracts User model attributes, hashes passwords, and calls `$this->userRepository->create($userData)` / `update()`.
       - Resolves role IDs via injected `RoleRepositoryInterface` and syncs via `$this->userRepository->syncRoles($user, $roleIds)`.
       - Resolves permission IDs via injected `PermissionRepositoryInterface` and syncs via `$this->userRepository->syncPermissions($user, $permissionIds)`.
       - Entire orchestration wrapped in `DB::transaction(...)`.
       - Refactored admin count queries from static `User::count()` to `$this->userRepository->getModel()->newQuery()`.
  3. **Repository Refinement (`UserRepository.php`)**:
     - Stripped cross-module business orchestration out of `UserRepository`.
     - Provided explicit, clean methods: `syncRoles(User $user, array $roleIds): array` and `syncPermissions(User $user, array $permissionIds): array`.
     - Replaced static `User::count()` and `User::where(...)` in `getStatisticsSummary()` with `$this->model->count()` and `$this->model->where(...)` adhering strictly to Core repository standards.
  4. **Form Request Validation Isolation**:
     - Form validation cleanly isolated into dedicated Form Requests (`StoreUserRequest`, `UpdateUserRequest`, `RoleRequest`, `StorePermissionRequest`, `CreateModulePermissionsRequest`), leaving controllers and models uncluttered.
- **Touched Files**:
  - [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php)
  - [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`modules/Role/src/Services/RoleService.php`](modules/Role/src/Services/RoleService.php)
  - [`modules/Permission/src/Services/PermissionService.php`](modules/Permission/src/Services/PermissionService.php)
  - [`modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php`](modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php)
  - [`modules/User/src/Repositories/UserRepository.php`](modules/User/src/Repositories/UserRepository.php)
  - [`modules/User/src/Http/Controllers/UserController.php`](modules/User/src/Http/Controllers/UserController.php)
  - [`modules/User/src/Http/Controllers/RoleController.php`](modules/User/src/Http/Controllers/RoleController.php)
  - [`modules/User/src/Http/Controllers/PermissionController.php`](modules/User/src/Http/Controllers/PermissionController.php)
  - [`modules/User/src/Http/Requests/UpdateUserRequest.php`](modules/User/src/Http/Requests/UpdateUserRequest.php)
  - [`tests/Feature/UserRolePermissionDecouplingTest.php`](tests/Feature/UserRolePermissionDecouplingTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - Automated PHP Feature Tests:
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions), including explicit assertion verifying zero `app(` calls in `User.php` and `Role.php`.
    - `UserModuleTest`: 15/15 passed (115 assertions).
    - `PermissionManagementTest`: 5/5 passed (23 assertions).
    - `DashboardOverviewTest`: 3/3 passed (26 assertions).
    - `AuthAndModulePermissionTest`: 8/8 passed (79 assertions).
    - Total: 36/36 tests passed (247 assertions, 100%).


---

### 34. TiktokAccount Update Request Validation & Multipart Method Spoofing Fix
- **Context & Bug Root Cause**:
  - **Issue**: Updating TikTok accounts (e.g. `khaby.lame`) failed validation with `"The username field is required."` even though the username input was filled in.
  - **Root Cause**:
    1. In `TiktokAccountFormPage.tsx`, account updates wrapped fields in `FormData` (multipart/form-data).
    2. `tiktokAccountAPI.updateTiktokAccount` dispatched an HTTP `PUT` request with `FormData`.
    3. PHP natively only parses `multipart/form-data` payloads when the request method is `POST`. On HTTP `PUT` requests, PHP leaves `$_POST` and `$_FILES` completely empty, resulting in Laravel receiving `$request->all() = []`.
    4. `UpdateTiktokAccountRequest` failed on `'username' => 'required'`, throwing 422 Unprocessable Entity.
    5. Additionally, in `DynamicRouteResovle.php`, `POST /{module}/{controller}/{id}` was hardcoded to resolve to `store` rather than `update`.
- **Architectural & Technical Solution**:
  1. **Frontend Method Spoofing for FormData (`tiktokAccount.ts`)**:
     - Updated [`modules/TiktokAccount/resources/js/Action/tiktokAccount.ts`](modules/TiktokAccount/resources/js/Action/tiktokAccount.ts): when `data instanceof FormData`, it appends `_method: 'PUT'` and dispatches via `POST`. Non-form-data requests continue to use clean JSON `PUT`.
  2. **Core Dynamic Route Resolution (`DynamicRouteResovle.php`)**:
     - Updated REST defaults in [`modules/Core/src/Support/DynamicRouteResovle.php`](modules/Core/src/Support/DynamicRouteResovle.php): when `$hasId` is true, `POST` requests resolve to `['update', 'edit', 'store', 'add', 'create']`.
  3. **Form Request Refinement (`UpdateTiktokAccountRequest.php`)**:
     - Added `'sometimes'` to `'username'` in [`modules/TiktokAccount/src/Http/Requests/UpdateTiktokAccountRequest.php`](modules/TiktokAccount/src/Http/Requests/UpdateTiktokAccountRequest.php) allowing flexible partial updates.
     - Added custom validation messages in English for user-friendly feedback.
- **Touched Files**:
  - [`modules/TiktokAccount/resources/js/Action/tiktokAccount.ts`](modules/TiktokAccount/resources/js/Action/tiktokAccount.ts)
  - [`modules/TiktokAccount/src/Http/Requests/UpdateTiktokAccountRequest.php`](modules/TiktokAccount/src/Http/Requests/UpdateTiktokAccountRequest.php)
  - [`modules/Core/src/Support/DynamicRouteResovle.php`](modules/Core/src/Support/DynamicRouteResovle.php)
  - [`tests/Feature/TiktokAccountUpdateTest.php`](tests/Feature/TiktokAccountUpdateTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - Authored automated test suite [`tests/Feature/TiktokAccountUpdateTest.php`](tests/Feature/TiktokAccountUpdateTest.php): 5/5 passed (19 assertions) covering JSON update, multipart method spoofing, direct POST to ID, partial updates, and duplicate username rejection.
  - Verified `php artisan test --filter TiktokAccountFilterTest`: 6/6 passed (34 assertions).

---

### 35. User Service Validation Cleanup & Dead Repository Code Removal
- **Context & Architectural Decisions**:
  - **Input Validation vs. Business Invariant Safeguards**:
    - *FormRequests (`StoreUserRequest`, `UpdateUserRequest`)*: Responsible 100% for HTTP input format, data types, enum boundaries (`status in:active,inactive,blocked`), and syntax validation.
    - *Service Layer (`UserService`)*: Responsible strictly for domain orchestrations and stateful business safeguards (e.g. preventing self-deletion, preventing self-blocking, preventing revoking admin rights or deactivating the last active administrator).
    - Removed redundant validation checks from `UserService` (such as `in_array($status, ['active', 'inactive', 'blocked'])`) and encapsulated domain invariants into dedicated private helper safeguards:
      - `assertNotDemotingLastAdmin(User $targetUser, array $data)`
      - `assertNotDeletingSelf(User|null $currentUser, int|string $id)`
      - `assertNotDeletingLastAdmin(User $targetUser)`
      - `assertNotBlockingSelf(User|null $currentUser, int|string $id, string $status)`
      - `assertNotDeactivatingLastAdmin(User $targetUser, string $status)`
  - **Dead Methods Removal in `UserRepository`**:
    - Pruned obsolete methods `createUserWithRolesAndPermissions` and `updateUserWithRolesAndPermissions` from [`modules/User/src/Repositories/UserRepository.php`](modules/User/src/Repositories/UserRepository.php) and [`modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php`](modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php).
    - *Reason*: These methods were leftover legacy code from before `UserService` orchestrated role and permission syncing via `RoleRepositoryInterface` and `PermissionRepositoryInterface`. They were never invoked anywhere in the codebase.
    - Repositories now remain strictly thin Data Access Objects (DAOs) interacting exclusively with `$this->model`.
- **Touched Files**:
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`modules/User/src/Repositories/UserRepository.php`](modules/User/src/Repositories/UserRepository.php)
  - [`modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php`](modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors.
  - Automated PHP Feature Tests:
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - Total: 20/20 passed (119 assertions, 100%).

---

### 36. Crawl Job Retry Feature for Failed Status in Crawler Module
- **Context & Architectural Decisions**:
  - **Feature Requirement**: Allow retrying crawl jobs whose status is `failed` from both the Crawl Jobs list view and the Crawl Job detail view.
  - **Backend Domain Logic (`CrawlJobService.php`)**:
    - Added `retry(int $id): ?CrawlJob` domain orchestration method.
    - *Status Invariant Safeguard*: Strictly verifies that only jobs with status `failed` can be retried. If the job is in any other status (`pending`, `running`, `completed`), a `\DomainException` is thrown (mapped to HTTP 422 Unprocessable Entity).
    - *Concurrency Safeguard*: Reuses `$this->crawlJobRepository->hasRunningJob($id)` to guarantee only 1 active running crawl job system-wide at any given moment.
    - *State Reset & Data Consistency*: Cleans up partial/failed results from previous attempts (`$crawlJob->results()->delete()`), resets `error_message` to `null`, `finished_at` to `null`, `success_count` to 0, `failed_count` to 0, updates `status` to `running`, sets `started_at` to `now()`, and dispatches the standardized payload to the Python Crawler Service.
    - *Fault Handling*: Catches unexpected failures from the crawler engine dispatch and marks the job status back to `failed` with the error message.
  - **Backend Controller & Routing (`CrawlJobController.php` & `DynamicRouteResovle.php`)**:
    - Added `retry(int $id): JsonResponse` custom action method in `CrawlJobController`.
    - Added `'retry' => 'edit'` in `DynamicRouteResovle::resolvePermissionAction()` ensuring standard RBAC permission checks against the `crawler.edit` permission.
  - **Frontend Integration (`crawlJob.ts`, `CrawlJobsPage.tsx`, `CrawlJobDetailPage.tsx`)**:
    - Added typed API method `retryCrawlJobByID(id)` in `modules/Crawler/resources/js/Action/crawlJob.ts`.
    - Integrated standard Core `useAction` hook in `CrawlJobsPage.tsx` with a `RedoOutlined` button wrapped in an Ant Design `Popconfirm` for jobs in `failed` status.
    - Rendered a primary `Retry` button in `CrawlJobDetailPage.tsx` header actions when `job.status === 'failed'`, gated by `<PermissionGate module="crawler" action="edit">`.
- **Touched Files**:
  - [`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)
  - [`modules/Crawler/src/Http/Controllers/CrawlJobController.php`](modules/Crawler/src/Http/Controllers/CrawlJobController.php)
  - [`modules/Core/src/Support/DynamicRouteResovle.php`](modules/Core/src/Support/DynamicRouteResovle.php)
  - [`modules/Crawler/resources/js/Action/crawlJob.ts`](modules/Crawler/resources/js/Action/crawlJob.ts)
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx)
  - [`tests/Feature/CrawlJobRetryTest.php`](tests/Feature/CrawlJobRetryTest.php)
  - [`tests/Feature/CrawlerArchitectureTest.php`](tests/Feature/CrawlerArchitectureTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `CrawlJobRetryTest`: 7/7 passed (30 assertions, 100%).
    - `CrawlerArchitectureTest`: 10/10 passed (46 assertions, 100%).
    - Total: 17/17 passed (76 assertions, 100%).

---

### 37. Crawl Job Action Refinement: Move Start to List Page & Retain Delete Only in Detail
- **Context & Architectural Decisions**:
  - **Requirement**: In the Crawl Job detail page (`CrawlJobDetailPage.tsx`), only retain the `Delete` action button and remove start/retry/status controls. Relocate the `Start` job trigger to the listing table in `CrawlJobsPage.tsx` so users can execute pending jobs directly from the list.
  - **Listing Page Actions (`CrawlJobsPage.tsx` & `tableConfig.ts`)**:
    - Integrated `handleStart` via Core `useAction` hook dispatching `crawlJobAPI.startCrawlJobByID(id)` and refreshing table data and statistics summary upon completion.
    - Added Ant Design `PlayCircleOutlined` button with `Popconfirm` inside `renderColumns.action` for rows where `record.status === 'pending'`, gated by `<PermissionGate module="crawler" action="edit">`.
    - Adjusted action column width from 120px to 140px in [`modules/Crawler/resources/js/configs/tableConfig.ts`](modules/Crawler/resources/js/configs/tableConfig.ts) to accommodate action icons cleanly without line breaking.
  - **Detail Page Simplification (`CrawlJobDetailPage.tsx`)**:
    - Removed `actStart`, `handleStartCrawlJob`, `actRetry`, `handleRetryCrawlJob`, and unused icon imports (`PlayCircleOutlined`, `EditOutlined`, `RedoOutlined`).
    - Gated `PageHeader.extra` exclusively with `<PermissionGate module="crawler" action="delete">` and the existing danger-styled `Delete` button and confirmation dialog.
- **Touched Files**:
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx)
  - [`modules/Crawler/resources/js/configs/tableConfig.ts`](modules/Crawler/resources/js/configs/tableConfig.ts)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `CrawlJobRetryTest`: 7/7 passed (30 assertions).
    - `CrawlerArchitectureTest`: 10/10 passed (46 assertions).

---

### 38. TikTok Account Association & Username Normalization in Crawler Webhook
- **Context & Bug Analysis**:
  - When the Python crawler processed accounts and sent an `account` event back to [`CrawlerResultController::storeAccountResult`](modules/API/src/Http/Controllers/CrawlerResultController.php):
    1. **Missing ID on Failed Crawl**: If an account failed during crawl (`status === 'failed'`), `$account` was left `null`, causing `crawl_results.tiktok_account_id` to be stored as `null` even though the account already existed in the `tiktok_accounts` table.
    2. **Username Mismatch due to `@` Prefix**: Extracted usernames from TikTok HTML profiles often contained a leading `@` symbol (e.g. `@khaby.lame`), whereas the CMS `tiktok_accounts` table stores clean usernames without `@` (`khaby.lame`). Consequently, `getAccountByField('username', ...)` failed to find the existing record, creating a duplicate record (`@khaby.lame`) or failing to associate the original account's primary ID.
    3. **Unsafe Null Property Access**: `empty($currentAccount->crawled_at)` resulted in PHP warnings when `$currentAccount` was `null`.
- **Architectural & Technical Solution**:
  - **Username Normalization (`CrawlerResultController.php`)**:
    - Stripped leading `@` and whitespace via `ltrim(trim($rawUsername), '@')` before performing any database query.
    - Updated query to check for both clean username and `@`-prefixed fallback:
      `$currentAccount = $this->tiktokAccountRepository->getAccountByField('username', $username) ?? $this->tiktokAccountRepository->getAccountByField('username', '@' . $username);`
  - **Preserving Account Linkage on Both Success & Failure**:
    - Defaulted `$account = $currentAccount`.
    - If `status === 'success'`:
      - Existing record: updated directly via `$this->tiktokAccountRepository->update($currentAccount->id, $saveAccountData)` (preserving original ID and avoiding duplicates).
      - New record: created via `$this->tiktokAccountRepository->create(...)` with clean normalized username.
    - If `status === 'failed'`:
      - Linked `$currentAccount->id` into `crawl_results.tiktok_account_id` if the account already existed in the database.
  - **Python Crawler Normalization (`profile_crawler.py`)**:
    - Added `normalize_username()` in `ProfileCrawler.crawl` to ensure extracted profile usernames are clean before dispatching callbacks to Laravel.
- **Touched Files**:
  - [`modules/API/src/Http/Controllers/CrawlerResultController.php`](modules/API/src/Http/Controllers/CrawlerResultController.php)
  - `ProcessData/tiktok-crawler/app/services/profile_crawler.py`
  - [`tests/Feature/CrawlerResultWebhookTest.php`](tests/Feature/CrawlerResultWebhookTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `CrawlerResultWebhookTest`: 3/3 passed (18 assertions) verifying successful linkage, `@` normalization without duplicate account creation, and failed account ID preservation.
    - `CrawlJobRetryTest`: 7/7 passed (30 assertions).
    - `CrawlerArchitectureTest`: 10/10 passed (46 assertions).
    - Total: 20/20 passed (94 assertions, 100%).







---

### 39. System Module Audit Architecture: Login Logs, Activity Logs & System Diagnostics
- **Context & Requirement**:
  - Transformed the `System` module into a dedicated Observability & System Audit suite with 3 organized submenus:
    1. **Login Logs** (`/system/login-logs`): Audit history of user authentication sessions, device signatures, and access results.
    2. **Activity Logs** (`/system/activity-logs`): Comprehensive, immutable audit trail of business events (`CREATE`, `UPDATE`, `DELETE`, `CRAWL`, `RETRY_CRAWL`, `ROLE_CHANGE`, `PERMISSION_CHANGE`).
    3. **System Diagnostic** (`/system/system-diagnostic`): Environment runtime metrics, PHP/Laravel versioning, database connectivity, and server status.
  - Architecture Decision: Kept login attempts isolated within the dedicated `login_logs` table (status, IP, device, failure reason) rather than polluting `activity_logs`, preventing duplicate log bloat while keeping `activity_logs` focused strictly on critical administrative changes and operations.
- **Architectural & Technical Solution**:
  - **Database Migration (`activity_logs`)**:
    - Created [`2026_01_01_000008_create_activity_logs_table.php`](modules/System/database/migrations/2026_01_01_000008_create_activity_logs_table.php) with actor snapshots (`user_id`, `user_email`, `user_role`), action & target targets (`action`, `module`, `record_id`, `record_type`), state snapshots (`old_data`, `new_data`, `metadata` JSONB), and contextual status (`status`, `error_message`, `created_at`).
  - **Backend Audit Engine & Services**:
    - [`ActivityLogger`](modules/System/src/Services/ActivityLogger.php): Static & DI logging helper automatically extracting authenticated user context and request environment (`ip`, `user_agent`).
    - [`LogsActivity`](modules/System/src/Traits/LogsActivity.php): Reusable Eloquent model lifecycle trait automating `CREATE`, `UPDATE`, and `DELETE` activity records with dirty-state change snapshots.
    - Integrated tracking into [`TiktokAccount`](modules/TiktokAccount/src/Models/TiktokAccount.php), [`UserService`](modules/User/src/Services/UserService.php) (`ROLE_CHANGE`, `PERMISSION_CHANGE`, `CREATE`, `UPDATE`, `DELETE`), and [`CrawlJobController`](modules/Crawler/src/Http/Controllers/CrawlJobController.php) (`CRAWL`, `RETRY_CRAWL`).
  - **Thin Controllers & Repositories**:
    - [`LoginLogController`](modules/System/src/Http/Controllers/LoginLogController.php) extending `BaseController` via [`LoginLogRepository`](modules/System/src/Repositories/LoginLogRepository.php).
    - [`ActivityLogController`](modules/System/src/Http/Controllers/ActivityLogController.php) extending `BaseController` with aggregation statistics endpoint.
    - [`SystemDiagnosticController`](modules/System/src/Http/Controllers/SystemDiagnosticController.php) providing runtime server telemetry.
  - **Frontend Architecture & Submenus**:
    - Registered 3 submenus in [`systemRoutes`](modules/System/resources/js/routes/route.ts) under parent `/system`.
    - Integrated Redux state: [`systemSlice.ts`](modules/System/resources/js/store/system/systemSlice.ts), [`systemThunks.ts`](modules/System/resources/js/store/system/systemThunks.ts), registered in root Redux store.
    - Reused Core assets: [`ListLayout`](modules/Core/resources/js/components/ListLayout.tsx), [`TableComponent`](modules/Core/resources/js/components/Table.tsx), [`CardKPI`](modules/Core/resources/js/components/CardKPI.tsx).
    - Added [`ActivityLogDetailModal`](modules/System/resources/js/components/ActivityLogDetailModal.tsx) for interactive visual diffing of previous state (`old_data`) vs modified state (`new_data`) and metadata context.
- **Touched Files**:
  - [`modules/System/database/migrations/2026_01_01_000008_create_activity_logs_table.php`](modules/System/database/migrations/2026_01_01_000008_create_activity_logs_table.php)
  - [`modules/System/src/Models/ActivityLog.php`](modules/System/src/Models/ActivityLog.php), [`modules/System/src/Models/LoginLog.php`](modules/System/src/Models/LoginLog.php)
  - [`modules/System/src/Repositories/ActivityLogRepository.php`](modules/System/src/Repositories/ActivityLogRepository.php), [`modules/System/src/Repositories/LoginLogRepository.php`](modules/System/src/Repositories/LoginLogRepository.php)
  - [`modules/System/src/Services/ActivityLogger.php`](modules/System/src/Services/ActivityLogger.php), [`modules/System/src/Services/ActivityLogService.php`](modules/System/src/Services/ActivityLogService.php), [`modules/System/src/Services/SystemDiagnosticService.php`](modules/System/src/Services/SystemDiagnosticService.php)
  - [`modules/System/src/Traits/LogsActivity.php`](modules/System/src/Traits/LogsActivity.php)
  - [`modules/System/src/Http/Controllers/ActivityLogController.php`](modules/System/src/Http/Controllers/ActivityLogController.php), [`modules/System/src/Http/Controllers/LoginLogController.php`](modules/System/src/Http/Controllers/LoginLogController.php), [`modules/System/src/Http/Controllers/SystemDiagnosticController.php`](modules/System/src/Http/Controllers/SystemDiagnosticController.php)
  - [`modules/System/resources/js/routes/route.ts`](modules/System/resources/js/routes/route.ts)
  - [`modules/System/resources/js/pages/LoginLogsPage.tsx`](modules/System/resources/js/pages/LoginLogsPage.tsx), [`modules/System/resources/js/pages/ActivityLogsPage.tsx`](modules/System/resources/js/pages/ActivityLogsPage.tsx), [`modules/System/resources/js/pages/SystemDiagnosticPage.tsx`](modules/System/resources/js/pages/SystemDiagnosticPage.tsx)
  - [`modules/System/resources/js/components/LoginLogTable.tsx`](modules/System/resources/js/components/LoginLogTable.tsx), [`modules/System/resources/js/components/ActivityLogTable.tsx`](modules/System/resources/js/components/ActivityLogTable.tsx), [`modules/System/resources/js/components/ActivityLogDetailModal.tsx`](modules/System/resources/js/components/ActivityLogDetailModal.tsx), [`modules/System/resources/js/components/SystemInfo.tsx`](modules/System/resources/js/components/SystemInfo.tsx)
  - [`modules/System/resources/js/store/system/systemSlice.ts`](modules/System/resources/js/store/system/systemSlice.ts), [`modules/System/resources/js/store/system/systemThunks.ts`](modules/System/resources/js/store/system/systemThunks.ts)
  - [`modules/Core/resources/js/store/index.ts`](modules/Core/resources/js/store/index.ts)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`modules/Crawler/src/Http/Controllers/CrawlJobController.php`](modules/Crawler/src/Http/Controllers/CrawlJobController.php)
  - [`modules/TiktokAccount/src/Models/TiktokAccount.php`](modules/TiktokAccount/src/Models/TiktokAccount.php)
  - [`modules/Auth/src/Http/Controllers/AuthController.php`](modules/Auth/src/Http/Controllers/AuthController.php)
  - [`tests/Feature/SystemAuditAndDiagnosticTest.php`](tests/Feature/SystemAuditAndDiagnosticTest.php)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 6/6 passed (97 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - Total: 26/26 passed (189 assertions, 100%).

---

### 40. Architecture Refactoring: Decoupling Login Logs to System Module & Enforcing Repository-Only Persistence
- **Context & Architecture Review**:
  - **Issue 1 (Module Boundary Leak)**: `Auth` module was previously maintaining `recordLoginLog`, `getLoginLogs`, and the `login_logs` model/migration, coupling authentication mechanisms with system audit storage.
  - **Issue 2 (Repository Pattern Violation in Service)**: `ActivityLogger` directly invoked Eloquent `ActivityLog::create(...)`, bypassing the `BaseRepository` persistence abstraction and violating modular layer separation.
- **Architectural & Technical Solution**:
  - **Decoupled Login Log to System Module**:
    - Transferred ownership of `login_logs` persistence and retrieval completely to `Modules\System`:
      - [`LoginLogService`](modules/System/src/Services/LoginLogService.php) and [`LoginLogRepository`](modules/System/src/Repositories/LoginLogRepository.php) implementing [`LoginLogRepositoryInterface`](modules/System/src/Repositories/Interfaces/LoginLogRepositoryInterface.php).
      - Moved migration to [`modules/System/database/migrations/2026_01_01_000006_create_login_logs_table.php`](modules/System/database/migrations/2026_01_01_000006_create_login_logs_table.php).
    - Refactored [`AuthService`](modules/Auth/src/Services/AuthService.php) to inject [`LoginLogService`](modules/System/src/Services/LoginLogService.php) across both successful (`login`) and failed (`logAndFail`) authentication attempts.
    - Stripped redundant `recordLoginLog` and `getLoginLogs` methods from [`AuthRepository`](modules/Auth/src/Repositories/AuthRepository.php), [`AuthRepositoryInterface`](modules/Auth/src/Repositories/Interfaces/AuthRepositoryInterface.php), and [`AuthController`](modules/Auth/src/Http/Controllers/AuthController.php).
  - **Enforced Repository-Only Persistence in System Services**:
    - Created [`ActivityLogRepositoryInterface`](modules/System/src/Repositories/Interfaces/ActivityLogRepositoryInterface.php) and [`LoginLogRepositoryInterface`](modules/System/src/Repositories/Interfaces/LoginLogRepositoryInterface.php).
    - Refactored [`ActivityLogService::record`](modules/System/src/Services/ActivityLogService.php) to execute mutations strictly via `$this->activityLogRepository->create(...)` instead of direct Eloquent `ActivityLog::create(...)`.
    - Updated [`ActivityLogger::log`](modules/System/src/Services/ActivityLogger.php) to delegate creation to `ActivityLogService`.
- **Touched Files**:
  - [`modules/System/src/Repositories/Interfaces/ActivityLogRepositoryInterface.php`](modules/System/src/Repositories/Interfaces/ActivityLogRepositoryInterface.php)
  - [`modules/System/src/Repositories/Interfaces/LoginLogRepositoryInterface.php`](modules/System/src/Repositories/Interfaces/LoginLogRepositoryInterface.php)
  - [`modules/System/src/Repositories/ActivityLogRepository.php`](modules/System/src/Repositories/ActivityLogRepository.php)
  - [`modules/System/src/Repositories/LoginLogRepository.php`](modules/System/src/Repositories/LoginLogRepository.php)
  - [`modules/System/src/Services/ActivityLogService.php`](modules/System/src/Services/ActivityLogService.php)
  - [`modules/System/src/Services/ActivityLogger.php`](modules/System/src/Services/ActivityLogger.php)
  - [`modules/System/src/Services/LoginLogService.php`](modules/System/src/Services/LoginLogService.php)
  - [`modules/System/src/Providers/SystemServiceProvider.php`](modules/System/src/Providers/SystemServiceProvider.php)
  - [`modules/System/database/migrations/2026_01_01_000006_create_login_logs_table.php`](modules/System/database/migrations/2026_01_01_000006_create_login_logs_table.php)
  - [`modules/Auth/src/Services/AuthService.php`](modules/Auth/src/Services/AuthService.php)
  - [`modules/Auth/src/Repositories/AuthRepository.php`](modules/Auth/src/Repositories/AuthRepository.php)
  - [`modules/Auth/src/Repositories/Interfaces/AuthRepositoryInterface.php`](modules/Auth/src/Repositories/Interfaces/AuthRepositoryInterface.php)
  - [`modules/Auth/src/Http/Controllers/AuthController.php`](modules/Auth/src/Http/Controllers/AuthController.php)
  - [`modules/Auth/src/Models/LoginLog.php`](modules/Auth/src/Models/LoginLog.php)
  - [`modules/Auth/routes/api.php`](modules/Auth/routes/api.php)
  - [`modules/Auth/resources/js/Action/auth.ts`](modules/Auth/resources/js/Action/auth.ts)
  - [`tests/Feature/AuthLoginLogTest.php`](tests/Feature/AuthLoginLogTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 6/6 passed (97 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - Total: 26/26 passed (189 assertions, 100%).

---

### 41. Project-Wide Model Audit: Strict Single-Model-Per-Table Architecture (No Cross-Module Inheritance)
- **Context & Audit Findings**:
  - The user required a project-wide audit ensuring that **each database table produces exactly ONE model, with NO cross-module inheritance or duplicate models**.
  - **Audit Results Across All Tables**:
    1. `users` table: Canonical model relocated to [`Modules\User\Models\User`](modules/User/src/Models/User.php). The default Laravel skeleton `app/Models/User.php` was completely removed, ensuring `app/` remains a pure skeleton and all domain models live strictly inside their corresponding domain modules.
    2. `login_logs` table: Exactly 1 model [`Modules\System\Models\LoginLog`](modules/System/src/Models/LoginLog.php) (removed duplicate `Modules\Auth\Models\LoginLog`).
    3. `roles` table: Exactly 1 model [`Modules\Role\Models\Role`](modules/Role/src/Models/Role.php).
    4. `permissions` table: Exactly 1 model [`Modules\Permission\Models\Permission`](modules/Permission/src/Models/Permission.php).
    5. `tiktok_accounts` table: Exactly 1 model [`Modules\TiktokAccount\Models\TiktokAccount`](modules/TiktokAccount/src/Models/TiktokAccount.php).
    6. `crawl_jobs` table: Exactly 1 model [`Modules\Crawler\Models\CrawlJob`](modules/Crawler/src/Models/CrawlJob.php).
    7. `crawl_results` table: Exactly 1 model [`Modules\Crawler\Models\CrawlResult`](modules/Crawler/src/Models/CrawlResult.php).
    8. `activity_logs` table: Exactly 1 model [`Modules\System\Models\ActivityLog`](modules/System/src/Models/ActivityLog.php).
- **Architectural & Technical Solution**:
  - **Relocated `users` Model to `Modules\User\Models\User`**:
    - Placed canonical `User` model in [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php) implementing `Authenticatable`, `HasApiTokens`, and [`HasRolesAndPermissions`](modules/Core/src/Traits/HasRolesAndPermissions.php).
    - Completely deleted `app/Models/User.php` and cleaned up `app/Models/`.
    - Configured [`config/auth.php`](config/auth.php) to use `Modules\User\Models\User::class` for the default user provider (`'model' => env('AUTH_MODEL', User::class)`).
    - Configured [`database/factories/UserFactory.php`](database/factories/UserFactory.php) to instantiate `Modules\User\Models\User`.
    - Updated all consumers across [`Auth`](modules/Auth/src/), [`Crawler`](modules/Crawler/src/), [`Role`](modules/Role/src/), [`System`](modules/System/src/), and [`User`](modules/User/src/) to import `Modules\User\Models\User`.
  - **Removed Duplicate `LoginLog` Model**:
    - Deleted redundant inherited model [`modules/Auth/src/Models/LoginLog.php`](modules/Auth/src/Models/LoginLog.php).
    - Sole model is [`Modules\System\Models\LoginLog`](modules/System/src/Models/LoginLog.php).
  - **Autoload & Feature Test Alignment**:
    - Ran `composer dump-autoload` to regenerate classmap without stale class entries.
    - Updated all test suites in `tests/Feature/` to import `Modules\User\Models\User`.
- **Touched Files**:
  - [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php)
  - [`config/auth.php`](config/auth.php)
  - [`database/factories/UserFactory.php`](database/factories/UserFactory.php)
  - [`modules/Auth/src/Http/Controllers/AuthController.php`](modules/Auth/src/Http/Controllers/AuthController.php)
  - [`modules/Auth/src/Repositories/AuthRepository.php`](modules/Auth/src/Repositories/AuthRepository.php)
  - [`modules/Auth/src/Services/AuthService.php`](modules/Auth/src/Services/AuthService.php)
  - [`modules/Crawler/src/Models/CrawlJob.php`](modules/Crawler/src/Models/CrawlJob.php)
  - [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php)
  - [`modules/System/src/Models/ActivityLog.php`](modules/System/src/Models/ActivityLog.php)
  - [`modules/System/src/Models/LoginLog.php`](modules/System/src/Models/LoginLog.php)
  - [`modules/System/src/Services/ActivityLogService.php`](modules/System/src/Services/ActivityLogService.php)
  - [`modules/System/src/Services/ActivityLogger.php`](modules/System/src/Services/ActivityLogger.php)
  - [`modules/User/src/Http/Controllers/UserController.php`](modules/User/src/Http/Controllers/UserController.php)
  - [`modules/User/src/Repositories/UserRepository.php`](modules/User/src/Repositories/UserRepository.php)
  - [`modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php`](modules/User/src/Repositories/Interfaces/UserRepositoryInterface.php)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`tests/Feature/UserRolePermissionDecouplingTest.php`](tests/Feature/UserRolePermissionDecouplingTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - `composer dump-autoload` $\rightarrow$ 8188 classes regenerated cleanly.
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 6/6 passed (97 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - Total: 31/31 passed (244 assertions, 100%).

---

### 42. Streamlined Event-Driven Audit Logging: Single Generic Event & Queued Background Listener
- **Context & Architecture Decision**:
  - Direct synchronous logging inside business services created code bloat and coupled business logic with audit persistence.
  - To prevent **Class Explosion** (creating dozens of event classes across modules), the architecture was refined to use **a single generic event (`ActivityOccurredEvent`) and a queueable listener (`RecordActivityLogListener`)**.
  - All audit events capture actor and request metadata (user ID, email, role, IP, User-Agent) synchronously in the constructor before queuing.
- **Architectural & Technical Solution**:
  - **Single Generic Event**:
    - Created [`ActivityOccurredEvent`](modules/System/src/Events/ActivityOccurredEvent.php) in `Modules\System\Events`: encapsulates action, module, record details, diff snapshots, and instantly captures actor context from the HTTP request.
  - **Queueable Listener**:
    - Created [`RecordActivityLogListener`](modules/System/src/Listeners/RecordActivityLogListener.php) in `Modules\System\Listeners` (`implements ShouldQueue`): delegates database persistence strictly to [`ActivityLogRepositoryInterface`](modules/System/src/Repositories/Interfaces/ActivityLogRepositoryInterface.php).
    - Registered listener binding in [`SystemServiceProvider::boot`](modules/System/src/Providers/SystemServiceProvider.php).
  - **Lean Service Layer in `System`**:
    - Streamlined [`ActivityLogger`](modules/System/src/Services/ActivityLogger.php): dispatches `ActivityOccurredEvent` cleanly and returns the created log in synchronous environments.
    - Simplified [`ActivityLogService`](modules/System/src/Services/ActivityLogService.php) to be a thin facade over `ActivityLogger`.
    - Removed empty directory `modules/System/database/seeders/`.
  - **100% Automatic Event Logging in Model `User` (Zero Logging in `UserService`)**:
    - Attached [`LogsActivity`](modules/System/src/Traits/LogsActivity.php) to [`User`](modules/User/src/Models/User.php) with `$activityModule = 'USER_MANAGEMENT'` and automated filtering of sensitive attributes (`password`, `remember_token`).
    - Handled many-to-many pivot sync auditing (`ROLE_CHANGE` and `PERMISSION_CHANGE`) natively inside `User::syncRoles()` and `User::syncPermissions()` via `ActivityOccurredEvent::dispatch()`.
    - Completely stripped all manual logging, diffing, and audit methods from [`UserService`](modules/User/src/Services/UserService.php), achieving 100% pure business logic.
- **Touched Files**:
  - [`modules/System/src/Events/ActivityOccurredEvent.php`](modules/System/src/Events/ActivityOccurredEvent.php)
  - [`modules/System/src/Listeners/RecordActivityLogListener.php`](modules/System/src/Listeners/RecordActivityLogListener.php)
  - [`modules/System/src/Providers/SystemServiceProvider.php`](modules/System/src/Providers/SystemServiceProvider.php)
  - [`modules/System/src/Services/ActivityLogger.php`](modules/System/src/Services/ActivityLogger.php)
  - [`modules/System/src/Services/ActivityLogService.php`](modules/System/src/Services/ActivityLogService.php)
  - [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`tests/Feature/SystemAuditAndDiagnosticTest.php`](tests/Feature/SystemAuditAndDiagnosticTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - `composer dump-autoload` $\rightarrow$ 8189 classes cleanly generated.
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 7/7 passed (98 assertions) — includes new `test_activity_occurred_event_is_handled_by_queue_listener`.
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - Total: 32/32 passed (245 assertions, 100%).

---

### 43. Business Logic Refactoring in Crawler Module: Service Layer Extraction & Thin Controllers
- **Context & Architecture Decision**:
  - Previously, `CrawlJobController` contained raw business logic in `store()`, `update()`, and `destroy()`:
    - Normalization of `data_crawl` (JSON decoding, array casting).
    - Calculation of `total_accounts` based on `source_type` (`match ($sourceType)`).
    - Hardcoded initial crawl job state mutations (`'status' => 'pending'`, counts initialized to 0).
    - Invariant validation checks directly inside the controller (`$job->status !== 'pending'`, `$job->status === 'running'`).
    - Direct calls to `CrawlResultRepository` and `CrawlJobRepository` for query aggregation.
  - Additionally, `CrawlerResultController` in `modules/API` handled complex result processing and account persistence inside private controller methods.
  - In accordance with the Ureka Modular Architecture and Core standards, controllers MUST remain thin (HTTP request mapping, Form Request validation, dispatching to Service layer, and formatting responses via `ApiResponseTrait`). All business invariants, calculations, normalization, and mutations belong in dedicated Service classes.
- **Architectural & Technical Solution**:
  - **Enhanced `CrawlJobService`** ([`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)):
    - `create(array $data): CrawlJob`: parses & normalizes `data_crawl`, calculates `total_accounts` from `source_type`, and creates the job in default `pending` state.
    - `update(int $id, array $data): ?CrawlJob`: enforces business rule that only `pending` jobs can be modified (throws `\DomainException`), recalculates accounts and updates data crawls.
    - `delete(int $id): bool`: enforces business rule that running jobs cannot be deleted (throws `\DomainException`).
    - `getStatisticsSummary(): array`: encapsulates KPI aggregation query.
    - `getJobResults(int $jobId, int $perPage, array $filters)`: encapsulates job result retrieval with domain existence check.
  - **Created `CrawlResultService`** ([`modules/Crawler/src/Services/CrawlResultService.php`](modules/Crawler/src/Services/CrawlResultService.php)):
    - `getByJobId(int $jobId, int $perPage, array $filters)`: retrieves paginated results for a job.
    - `handleWebhookEvent(int $jobId, array $data)`: orchestrates webhook transactions for `account` crawl results and `completed` job events.
    - `storeAccountResult(array $data, int $jobId)`: handles username normalization (stripping leading `@`), TikTok account lookup/creation/metric updates, and crawl result persistence.
    - `completeJob(array $data, int $jobId)`: finalizes crawl job state and updates success/failed counts.
  - **Refactored Controllers to Thin Layer**:
    - [`CrawlJobController`](modules/Crawler/src/Http/Controllers/CrawlJobController.php): thin controller injecting only `CrawlJobService`. Dispatches all actions (`store`, `update`, `destroy`, `start`, `retry`, `getStatisticsSummary`, `results`) to the service layer.
    - [`CrawlResultController`](modules/Crawler/src/Http/Controllers/CrawlResultController.php): thin controller injecting `CrawlResultService`.
    - [`CrawlerResultController`](modules/API/src/Http/Controllers/CrawlerResultController.php): thin webhook controller delegating to `CrawlResultService::handleWebhookEvent`.
- **Touched Files**:
  - [`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)
  - [`modules/Crawler/src/Services/CrawlResultService.php`](modules/Crawler/src/Services/CrawlResultService.php)
  - [`modules/Crawler/src/Http/Controllers/CrawlJobController.php`](modules/Crawler/src/Http/Controllers/CrawlJobController.php)
  - [`modules/Crawler/src/Http/Controllers/CrawlResultController.php`](modules/Crawler/src/Http/Controllers/CrawlResultController.php)
  - [`modules/API/src/Http/Controllers/CrawlerResultController.php`](modules/API/src/Http/Controllers/CrawlerResultController.php)
  - [`tests/Feature/CrawlerArchitectureTest.php`](tests/Feature/CrawlerArchitectureTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `CrawlerArchitectureTest`: 12/12 passed (59 assertions) — includes new tests for `CrawlJobService` CRUD domain rules and `CrawlResultService` webhook operations.
    - `CrawlJobRetryTest`: 7/7 passed (37 assertions).
    - `CrawlerResultWebhookTest`: 3/3 passed (11 assertions).
    - Total: 22/22 passed (107 assertions, 100%).

---

### 44. System-Wide Audit & Event-Driven Hardening: Transaction Safety, Double-Logging Prevention, and Crawler Exception Auditing
- **Context & Key Hardening Goals**:
  - Addressed 3 critical technical edge cases in event-driven auditing:
    1. **Double-Logging Prevention**: Ensuring ignored attributes (e.g., `updated_at`, `password`, `remember_token`) do not trigger redundant `UPDATE` audit logs when only timestamp or role changes occur.
    2. **Transaction-Safe Event Dispatching (`DB::afterCommit`)**: Enforcing that audit events are dispatched ONLY after surrounding database transactions commit successfully, preventing phantom logs on transaction rollbacks.
    3. **Crawler Exception Auditing (`CRAWL_FAILED`)**: Ensuring worker/external engine crashes (timeout, 500 error) are captured as failed audit logs before worker halt.
    4. **System-Wide Audit Refactoring**: Eliminating all remaining manual controller auditing and standardizing on event-driven architecture across all modules.
- **Architectural & Technical Solution**:
  - **Double-Logging Prevention in `LogsActivity`**:
    - [`LogsActivity`](modules/System/src/Traits/LogsActivity.php): verified `isActivityAttributeIgnored` excludes `updated_at`, `password`, `remember_token`, `two_factor_secret`. Added strict guard `if (empty($newData)) { return; }` ensuring no `UPDATE` log is dispatched if only ignored attributes changed.
  - **Transaction-Safe Dispatching via `DB::afterCommit`**:
    - In [`LogsActivity`](modules/System/src/Traits/LogsActivity.php): wrapped `created`, `updated`, `deleted` dispatches in `DB::transactionLevel() > 0 ? DB::afterCommit($dispatch) : $dispatch()`.
    - In [`User::syncRoles`](modules/User/src/Models/User.php) and [`User::syncPermissions`](modules/User/src/Models/User.php): wrapped `ROLE_CHANGE` and `PERMISSION_CHANGE` in `DB::afterCommit`.
    - In [`Role::syncPermissions`](modules/Role/src/Models/Role.php): wrapped role permission change audit in `DB::afterCommit`.
  - **Crawler Module Audit Refactoring**:
    - Transferred crawl audit responsibility from [`CrawlJobController`](modules/Crawler/src/Http/Controllers/CrawlJobController.php) into [`CrawlJobService`](modules/Crawler/src/Services/CrawlJobService.php):
      - Dispatches `ActivityOccurredEvent(action: 'CRAWL')` on start.
      - Dispatches `ActivityOccurredEvent(action: 'RETRY_CRAWL')` on retry.
      - Dispatches `ActivityOccurredEvent(action: 'CRAWL_FAILED', status: 'FAILED')` inside `markCrawlJobAsFailed` whenever engine dispatch fails or throws `\Throwable`.
    - Removed manual `ActivityLogger::log(...)` from `CrawlJobController`.
- **Touched Files**:
  - [`modules/System/src/Traits/LogsActivity.php`](modules/System/src/Traits/LogsActivity.php)
  - [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php)
  - [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php)
  - [`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)
  - [`modules/Crawler/src/Http/Controllers/CrawlJobController.php`](modules/Crawler/src/Http/Controllers/CrawlJobController.php)
  - [`tests/Feature/SystemAuditAndDiagnosticTest.php`](tests/Feature/SystemAuditAndDiagnosticTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 8/8 passed (100 assertions) — includes new `test_crawl_job_failure_dispatches_crawl_failed_activity_log`.
    - `CrawlJobRetryTest`: 7/7 passed (37 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - Total: 40/40 passed (277 assertions, 100%).

---

### 45. Centralized Core System Options & Global Module Configuration
- **Context & Motivation**:
  - Previously, multiple modules (`System`, `User`, `Crawler`, `TiktokAccount`, `Permission`, `Core`) maintained duplicate inline arrays and hardcoded `select` options (e.g. audit log action lists `['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'CRAWL', 'RETRY_CRAWL', 'PERMISSION_CHANGE', 'ROLE_CHANGE']`, audit module filter options, status dropdowns, permission action matrices, user statuses, and crawler statuses).
  - Adding a new module or system action required hunting across individual files and components.
  - Required centralizing all system-wide options, module metadata, and status configs into `@core/configs/systemOptions.tsx` as the single source of truth.
- **Architectural & Technical Solution**:
  - **Created Central Config Source of Truth** ([`modules/Core/resources/js/configs/systemOptions.tsx`](modules/Core/resources/js/configs/systemOptions.tsx)):
    - `SYSTEM_MODULES`: Comprehensive registry of all application modules (`crawler`, `tiktokaccount`, `user`, `role`, `permission`, `system`, `dashboard`, `auth`, `api`, `core`) with localized labels, Ant Design icons, and color tokens.
    - `getModuleConfig(modKey)`: Safe lookup helper returning module configuration with fallback for arbitrary modules.
    - `ACTIVITY_ACTION_CONFIG` & `getActivityActionConfig(action)`: Maps audit actions (`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `CRAWL`, `RETRY_CRAWL`, `CRAWL_FAILED`, `PERMISSION_CHANGE`, `ROLE_CHANGE`) to colors, labels, and icons.
    - `ACTIVITY_ACTION_OPTIONS`, `ACTIVITY_MODULE_OPTIONS`, `ACTIVITY_STATUS_OPTIONS`, `LOGIN_STATUS_OPTIONS`: Standardized options arrays for filter bars.
    - `BASIC_PERMISSION_ACTIONS` & `COMMON_PERMISSION_ACTIONS`: Centralized CRUD and extended permission actions.
    - `USER_STATUS_FILTER_OPTIONS`, `USER_STATUS_CHANGE_OPTIONS`, `USER_FORM_STATUS_OPTIONS`, `USER_ROLE_FILTER_OPTIONS`: Centralized User options.
    - `CRAWL_JOB_STATUS_FILTER_OPTIONS`: Centralized Crawler job statuses.
    - `TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS`, `TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS`: Centralized TikTok account statuses.
    - `GLOBAL_STATUS_CONFIG`: Unified status tag color and badge dictionary.
  - **Refactored Module Consumers**:
    - [`ActivityLogsPage`](modules/System/resources/js/pages/ActivityLogsPage.tsx): Replaced inline `action`, `module`, and `status` option arrays with `ACTIVITY_ACTION_OPTIONS`, `ACTIVITY_MODULE_OPTIONS`, and `ACTIVITY_STATUS_OPTIONS`.
    - [`ActivityLogTable`](modules/System/resources/js/components/ActivityLogTable.tsx) & [`ActivityLogDetailModal`](modules/System/resources/js/components/ActivityLogDetailModal.tsx): Replaced 10 repetitive `if/else` ladders with `getActivityActionConfig(action)`.
    - [`LoginLogsPage`](modules/System/resources/js/pages/LoginLogsPage.tsx): Standardized on `LOGIN_STATUS_OPTIONS`.
    - [`UserListPage`](modules/User/resources/js/pages/UserListPage.tsx) & [`UserFormPage`](modules/User/resources/js/pages/UserFormPage.tsx): Standardized on `USER_STATUS_FILTER_OPTIONS`, `USER_ROLE_FILTER_OPTIONS`, and `USER_STATUS_CHANGE_OPTIONS`.
    - [`CrawlJobsPage`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx): Standardized on `CRAWL_JOB_STATUS_FILTER_OPTIONS`.
    - [`TiktokAccountPage`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx): Standardized on `TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS` and `TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS`.
    - [`CreateModuleModal`](modules/Permission/resources/js/components/CreateModuleModal.tsx) & [`CreatePermissionModal`](modules/Permission/resources/js/components/CreatePermissionModal.tsx): Standardized on `BASIC_PERMISSION_ACTIONS` and `COMMON_PERMISSION_ACTIONS`.
    - [`PermissionMatrix`](modules/Core/resources/js/components/PermissionMatrix.tsx): Uses `getModuleConfig(modKey)` dynamically.
    - [`StatusTag`](modules/Core/resources/js/components/StatusTag.tsx): Uses `GLOBAL_STATUS_CONFIG`.
- **Touched Files**:
  - [`modules/Core/resources/js/configs/systemOptions.tsx`](modules/Core/resources/js/configs/systemOptions.tsx)
  - [`modules/System/resources/js/pages/ActivityLogsPage.tsx`](modules/System/resources/js/pages/ActivityLogsPage.tsx)
  - [`modules/System/resources/js/pages/LoginLogsPage.tsx`](modules/System/resources/js/pages/LoginLogsPage.tsx)
  - [`modules/System/resources/js/components/ActivityLogTable.tsx`](modules/System/resources/js/components/ActivityLogTable.tsx)
  - [`modules/System/resources/js/components/ActivityLogDetailModal.tsx`](modules/System/resources/js/components/ActivityLogDetailModal.tsx)
  - [`modules/User/resources/js/pages/UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx)
  - [`modules/User/resources/js/pages/UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)
  - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx)
  - [`modules/Permission/resources/js/components/CreateModuleModal.tsx`](modules/Permission/resources/js/components/CreateModuleModal.tsx)
  - [`modules/Permission/resources/js/components/CreatePermissionModal.tsx`](modules/Permission/resources/js/components/CreatePermissionModal.tsx)
  - [`modules/Core/resources/js/components/PermissionMatrix.tsx`](modules/Core/resources/js/components/PermissionMatrix.tsx)
  - [`modules/Core/resources/js/components/StatusTag.tsx`](modules/Core/resources/js/components/StatusTag.tsx)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npx.cmd tsc --noEmit` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Laravel Mix build `node scripts/mix-module.cjs Core` $\rightarrow$ Compiled successfully.

---

### 46. Domain-Driven Configuration Architecture: Shared Core vs. Domain-Isolated Module Configs
- **Context & Motivation**:
  - While centralizing options eliminated repetitive inline definitions, placing domain-specific options (e.g. audit activity actions, crawler statuses, TikTok account statuses, user roles, permission CRUD lists) directly inside `modules/Core/resources/js/configs/systemOptions.tsx` broke modular boundaries.
  - Per the user's architectural requirement:
    - **Shared/Global configs** (Module Registry `SYSTEM_MODULES`, `getModuleConfig`, `GLOBAL_STATUS_CONFIG`, and generic `SelectOption<T>` interface) MUST reside in `Core`.
    - **Domain-specific configs** MUST reside strictly in their respective module's `configs/` directory to preserve high cohesion, low coupling, and autonomous module ownership.
- **Architectural & Technical Solution**:
  - **Pruned Core Config to Shared Primitives Only** ([`modules/Core/resources/js/configs/systemOptions.tsx`](modules/Core/resources/js/configs/systemOptions.tsx)):
    - `SelectOption<T>`: Universal option type for select/filter dropdowns.
    - `ModuleConfigItem` & `SYSTEM_MODULES`: Canonical registry of all CMS modules with labels, icons, and theme colors.
    - `getModuleConfig(mod)`: Safe module lookup helper.
    - `GLOBAL_STATUS_CONFIG`: Cross-module status tag styling dictionary for `StatusTag.tsx`.
  - **Extracted Module-Specific Configurations**:
    - **System Module** ([`modules/System/resources/js/configs/activityLogConfig.ts`](modules/System/resources/js/configs/activityLogConfig.ts)):
      - `ACTIVITY_ACTION_CONFIG` & `getActivityActionConfig(action)`
      - `ACTIVITY_ACTION_OPTIONS`, `ACTIVITY_MODULE_OPTIONS`, `ACTIVITY_STATUS_OPTIONS`, `LOGIN_STATUS_OPTIONS`
      - Refactored `ActivityLogsPage.tsx`, `ActivityLogTable.tsx`, `ActivityLogDetailModal.tsx`, `LoginLogsPage.tsx` to consume local config.
    - **User Module** ([`modules/User/resources/js/configs/userConstants.ts`](modules/User/resources/js/configs/userConstants.ts)):
      - `USER_STATUS_FILTER_OPTIONS`, `USER_STATUS_CHANGE_OPTIONS`, `USER_FORM_STATUS_OPTIONS`, `USER_ROLE_FILTER_OPTIONS`
      - Refactored `UserListPage.tsx` and `UserFormPage.tsx` to consume local config.
    - **Crawler Module** ([`modules/Crawler/resources/js/configs/crawlerOptions.ts`](modules/Crawler/resources/js/configs/crawlerOptions.ts)):
      - `CRAWL_JOB_STATUS_FILTER_OPTIONS`
      - Refactored `CrawlJobsPage.tsx` to consume local config.
    - **TiktokAccount Module** ([`modules/TiktokAccount/resources/js/configs/accountOptions.ts`](modules/TiktokAccount/resources/js/configs/accountOptions.ts)):
      - `TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS`, `TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS`
      - Refactored `TiktokAccountPage.tsx` to consume local config.
    - **Permission Module** ([`modules/Permission/resources/js/configs/permissionOptions.ts`](modules/Permission/resources/js/configs/permissionOptions.ts)):
      - `BASIC_PERMISSION_ACTIONS`, `COMMON_PERMISSION_ACTIONS`
      - Refactored `CreateModuleModal.tsx` and `CreatePermissionModal.tsx` to consume local config.
- **Touched Files**:
  - [`modules/Core/resources/js/configs/systemOptions.tsx`](modules/Core/resources/js/configs/systemOptions.tsx)
  - [`modules/System/resources/js/configs/activityLogConfig.ts`](modules/System/resources/js/configs/activityLogConfig.ts)
  - [`modules/User/resources/js/configs/userConstants.ts`](modules/User/resources/js/configs/userConstants.ts)
  - [`modules/Crawler/resources/js/configs/crawlerOptions.ts`](modules/Crawler/resources/js/configs/crawlerOptions.ts)
  - [`modules/TiktokAccount/resources/js/configs/accountOptions.ts`](modules/TiktokAccount/resources/js/configs/accountOptions.ts)
  - [`modules/Permission/resources/js/configs/permissionOptions.ts`](modules/Permission/resources/js/configs/permissionOptions.ts)
  - [`modules/System/resources/js/pages/ActivityLogsPage.tsx`](modules/System/resources/js/pages/ActivityLogsPage.tsx)
  - [`modules/System/resources/js/components/ActivityLogTable.tsx`](modules/System/resources/js/components/ActivityLogTable.tsx)
  - [`modules/System/resources/js/components/ActivityLogDetailModal.tsx`](modules/System/resources/js/components/ActivityLogDetailModal.tsx)
  - [`modules/System/resources/js/pages/LoginLogsPage.tsx`](modules/System/resources/js/pages/LoginLogsPage.tsx)
  - [`modules/User/resources/js/pages/UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx)
  - [`modules/User/resources/js/pages/UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)
  - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx)
  - [`modules/Permission/resources/js/components/CreateModuleModal.tsx`](modules/Permission/resources/js/components/CreateModuleModal.tsx)
  - [`modules/Permission/resources/js/components/CreatePermissionModal.tsx`](modules/Permission/resources/js/components/CreatePermissionModal.tsx)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `node node_modules/typescript/bin/tsc --noEmit` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Laravel Mix build `node scripts/mix-module.cjs System` $\rightarrow$ Compiled successfully in 10.6s.

---

### 47. Password Reset Security Auditing: Event-Driven Logging for Token Resets and Email Requests
- **Context & Security Requirement**:
  - Previously, password reset operations were not tracked in `activity_logs`.
  - Because `password` is intentionally excluded from `LogsActivity::isActivityAttributeIgnored` (to prevent storing raw or hashed passwords in audit logs), updating a user's password did not trigger any model audit event.
  - Resetting passwords and initiating reset emails are critical security events that require transparent audit logging.
- **Architectural & Technical Solution**:
  - **Audit Logging in `AuthService::resetPassword`**:
    - Dispatches [`ActivityOccurredEvent`](modules/System/src/Events/ActivityOccurredEvent.php) upon successful password reset (`action: 'RESET_PASSWORD'`, `module: 'AUTH'`, `recordId: (string) $user->id`, `status: 'SUCCESS'`).
    - Dispatches [`ActivityOccurredEvent`](modules/System/src/Events/ActivityOccurredEvent.php) upon invalid/expired token or validation failure (`action: 'RESET_PASSWORD'`, `module: 'AUTH'`, `recordId: $credentials['email']`, `status: 'FAILED'`, `errorMessage: $status`).
  - **Audit Logging in `UserService::sendMailResetPassword`**:
    - Dispatches [`ActivityOccurredEvent`](modules/System/src/Events/ActivityOccurredEvent.php) when an administrator requests a reset password link for a user (`action: 'REQUEST_RESET_PASSWORD'`, `module: 'USER_MANAGEMENT'`, `recordId: (string) $user->id`, `status: 'SUCCESS'`).
    - Dispatches failure audit log with `errorMessage` if email dispatch encounters an exception.
  - **Automated Feature Verification**:
    - Added `test_reset_password_dispatches_activity_log` and `test_send_mail_reset_password_dispatches_activity_log` in [`SystemAuditAndDiagnosticTest`](tests/Feature/SystemAuditAndDiagnosticTest.php).
- **Touched Files**:
  - [`modules/Auth/src/Services/AuthService.php`](modules/Auth/src/Services/AuthService.php)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)
  - [`tests/Feature/SystemAuditAndDiagnosticTest.php`](tests/Feature/SystemAuditAndDiagnosticTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `SystemAuditAndDiagnosticTest`: 10/10 passed (106 assertions) — includes new tests for `RESET_PASSWORD` and `REQUEST_RESET_PASSWORD`.
    - `CrawlJobRetryTest`: 7/7 passed (37 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - Total: 42/42 passed (283 assertions, 100%).

---

### 48. Universal Audit Architecture: Anti-Bloat Decoupling Across Model, Service, and Controller
- **Context & Bloat Pain Point**:
  - Direct dispatching of `ActivityOccurredEvent` inside Service methods required 10-15 lines of raw schema boilerplate per action, violating SRP and bloating services.
  - Model relationship syncs (`User::syncRoles`, `User::syncPermissions`, `Role::syncPermissions`) duplicated 40+ lines of diffing and transaction logic.
  - The repository needed a universal, multi-module auditing mechanism that prevents layer bloat while remaining 100% DRY and reusable for all 9 modules and future modules.
- **Architectural & Technical Solution**:
  1. **Tiers Decoupling & Zero-Audit Controller Standard**:
     - Controllers remain strictly "Zero-Audit", handling only HTTP validation, calling services/repositories, and returning standardized API responses.
  2. **Model Layer (`LogsActivity::auditSync`)**:
     - Added `auditSync(string $relation, array $ids, string $identifierColumn = 'slug', ?string $action = null)` to [`LogsActivity`](modules/System/src/Traits/LogsActivity.php).
     - Reduced `User::syncRoles`, `User::syncPermissions`, and `Role::syncPermissions` from 40+ lines to a single clean line each.
     - Added `safeDispatchActivity` ensuring `DB::afterCommit` transaction safety.
  3. **Universal Service Helper (`Audit` Facade & `Auditor`)**:
     - Added [`Auditor`](modules/System/src/Services/Auditor.php) and [`Audit`](modules/System/src/Facades/Audit.php) in `Modules\System`.
     - `Audit::record(...)`: Auto-resolves `recordId`, `recordType`, `module`, and `user` directly from passed Eloquent models or explicit strings.
     - `Audit::track(...)`: Automates execution boundaries with try/catch, recording `SUCCESS` or `FAILED` with error messages while re-throwing exceptions intact.
  4. **Contract-Driven Auditable Domain Events (`AuditableEvent`)**:
     - Created [`AuditableEvent`](modules/System/src/Contracts/AuditableEvent.php) interface.
     - Updated [`RecordActivityLogListener`](modules/System/src/Listeners/RecordActivityLogListener.php) to automatically handle both `AuditableEvent` and `ActivityOccurredEvent` asynchronously via background queues.
  5. **Refactored Services & Models**:
     - Replaced bloated event dispatches in [`CrawlJobService`](modules/Crawler/src/Services/CrawlJobService.php), [`AuthService`](modules/Auth/src/Services/AuthService.php), and [`UserService`](modules/User/src/Services/UserService.php).
     - Decoupled [`User`](modules/User/src/Models/User.php) and [`Role`](modules/Role/src/Models/Role.php) models by removing direct DB and event imports.
  6. **Comprehensive Architectural Documentation**:
     - Created dedicated guide [`docs/AUDIT_LOGGING_GUIDE.md`](docs/AUDIT_LOGGING_GUIDE.md) detailing standards, code examples, and anti-patterns for all AI agents and developers.
- **Touched Files**:
  - [`modules/System/src/Contracts/AuditableEvent.php`](modules/System/src/Contracts/AuditableEvent.php)
  - [`modules/System/src/Services/Auditor.php`](modules/System/src/Services/Auditor.php)
  - [`modules/System/src/Facades/Audit.php`](modules/System/src/Facades/Audit.php)
  - [`modules/System/src/Traits/LogsActivity.php`](modules/System/src/Traits/LogsActivity.php)
  - [`modules/System/src/Listeners/RecordActivityLogListener.php`](modules/System/src/Listeners/RecordActivityLogListener.php)
  - [`modules/System/src/Providers/SystemServiceProvider.php`](modules/System/src/Providers/SystemServiceProvider.php)
  - [`modules/User/src/Models/User.php`](modules/User/src/Models/User.php)
  - [`modules/Role/src/Models/Role.php`](modules/Role/src/Models/Role.php)
  - [`modules/User/src/Services/UserService.php`](modules/User/src/Services/UserService.php)
  - [`modules/Auth/src/Services/AuthService.php`](modules/Auth/src/Services/AuthService.php)
  - [`modules/Crawler/src/Services/CrawlJobService.php`](modules/Crawler/src/Services/CrawlJobService.php)
  - [`tests/Feature/AuditorPipelineTest.php`](tests/Feature/AuditorPipelineTest.php)
  - [`docs/AUDIT_LOGGING_GUIDE.md`](docs/AUDIT_LOGGING_GUIDE.md)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature Tests:
    - `AuditorPipelineTest`: 5/5 passed (8 assertions) — validates `Audit::record`, `Audit::track` (success/failed), `AuditableEvent` listener, and `auditSync`.
    - `SystemAuditAndDiagnosticTest`: 10/10 passed (106 assertions).
    - `UserModuleTest`: 15/15 passed (64 assertions).
    - `UserRolePermissionDecouplingTest`: 5/5 passed (55 assertions).
    - `CrawlJobRetryTest`: 7/7 passed (37 assertions).
    - `AuthLoginLogTest`: 5/5 passed (28 assertions).
    - Total: 47/47 passed (291 assertions, 100%).

---

### 49. Comprehensive Full-Stack Architecture Refactoring: Anti-Bloat, Core Promotion, and Modular Decoupling
- **Context & Audit Goals**:
  - Full codebase audit across both Frontend (React 19, TypeScript, Ant Design) and Backend (Laravel, Repositories, Controllers).
  - Eliminate duplicate code, prevent module bloating, adhere strictly to the Core Reusability Matrix, and enforce clean modular boundaries.
- **Architectural & Technical Solution**:
  1. **Core Table Component Action Promotion**:
     - Upgraded [`TableComponent`](modules/Core/resources/js/components/Table.tsx) with native action props: `onEdit`, `onDelete`, `canEdit`, `canDelete`, `deleteConfirmTitle`, `extraActions`, and `permissionModule`.
     - Upgraded [`ListLayout`](modules/Core/resources/js/components/ListLayout.tsx) to automatically forward all native action props to embedded tables.
     - Refactored [`RoleTableList`](modules/Role/resources/js/components/RoleTableList.tsx) and [`PermissionTableList`](modules/Permission/resources/js/components/PermissionTableList.tsx), removing 60+ lines of duplicate Popconfirm/Tooltip boilerplate.
  2. **Strict Import Standardization (Direct `@core/` Imports)**:
     - Eradicated all non-standard `@/components` and `@/hooks` alias imports in `CrawlJobsPage`, `TiktokAccountPage`, `UserFormPage`, `UserListPage`, `PermissionGate`, and `registry.ts`.
     - Enforced canonical direct `@core/components/` and relative imports across all modules.
  3. **Modular Inversion of Controllers**:
     - Relocated canonical [`PermissionController`](modules/Permission/src/Http/Controllers/PermissionController.php) into `Modules\Permission` and canonical [`RoleController`](modules/Role/src/Http/Controllers/RoleController.php) into `Modules\Role`.
     - Inverted the legacy coupling: `Modules\User\Http\Controllers\PermissionController` and `RoleController` now cleanly extend the canonical controllers for backward compatibility.
     - Removed 200+ lines of redundant controller code from `Modules\User`.
  4. **Model Lifecycle Audit Guarantee in Repositories**:
     - Updated `UserRepository::syncRoles` and `syncPermissions` to delegate directly to `$user->syncRoles` and `$user->syncPermissions`, guaranteeing `auditSync` execution.
     - Updated `RoleRepository::syncPermissions` to delegate to `$role->syncPermissions`.
  5. **Auth Module Expansion & Feature Completeness**:
     - Added `forgotPassword`, `changePassword`, and `profile` methods to [`AuthService`](modules/Auth/src/Services/AuthService.php) and [`AuthController`](modules/Auth/src/Http/Controllers/AuthController.php) with automatic `Audit::record` audit logging.
- **Touched Files**:
  - [`modules/Core/resources/js/components/Table.tsx`](modules/Core/resources/js/components/Table.tsx)
  - [`modules/Core/resources/js/components/ListLayout.tsx`](modules/Core/resources/js/components/ListLayout.tsx)
  - [`modules/Core/resources/js/components/PermissionGate.tsx`](modules/Core/resources/js/components/PermissionGate.tsx)
  - [`modules/Core/resources/js/routes/registry.ts`](modules/Core/resources/js/routes/registry.ts)
  - [`modules/Role/resources/js/components/RoleTableList.tsx`](modules/Role/resources/js/components/RoleTableList.tsx)
  - [`modules/Permission/resources/js/components/PermissionTableList.tsx`](modules/Permission/resources/js/components/PermissionTableList.tsx)
  - [`modules/System/resources/js/components/ActivityLogTable.tsx`](modules/System/resources/js/components/ActivityLogTable.tsx)
  - [`modules/Crawler/resources/js/pages/CrawlJobsPage.tsx`](modules/Crawler/resources/js/pages/CrawlJobsPage.tsx)
  - [`modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx`](modules/TiktokAccount/resources/js/pages/TiktokAccountPage.tsx)
  - [`modules/User/resources/js/pages/UserFormPage.tsx`](modules/User/resources/js/pages/UserFormPage.tsx)
  - [`modules/User/resources/js/pages/UserListPage.tsx`](modules/User/resources/js/pages/UserListPage.tsx)
  - [`modules/Permission/src/Http/Controllers/PermissionController.php`](modules/Permission/src/Http/Controllers/PermissionController.php)
  - [`modules/Role/src/Http/Controllers/RoleController.php`](modules/Role/src/Http/Controllers/RoleController.php)
  - [`modules/User/src/Http/Controllers/PermissionController.php`](modules/User/src/Http/Controllers/PermissionController.php)
  - [`modules/User/src/Http/Controllers/RoleController.php`](modules/User/src/Http/Controllers/RoleController.php)
  - [`modules/User/src/Repositories/UserRepository.php`](modules/User/src/Repositories/UserRepository.php)
  - [`modules/Role/src/Repositories/RoleRepository.php`](modules/Role/src/Repositories/RoleRepository.php)
  - [`modules/Auth/src/Http/Controllers/AuthController.php`](modules/Auth/src/Http/Controllers/AuthController.php)
  - [`modules/Auth/src/Services/AuthService.php`](modules/Auth/src/Services/AuthService.php)
  - [`modules/System/src/Services/ActivityLogService.php`](modules/System/src/Services/ActivityLogService.php)
  - [`tests/Feature/CoreDynamicRoutingTest.php`](tests/Feature/CoreDynamicRoutingTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - Automated PHP Feature & Unit Tests:
    - Entire application test suite: **133/133 passed (718 assertions, 100%)**.
    - All 19 test suites across Core, Auth, User, Role, Permission, Crawler, TiktokAccount, and System passed without any regressions.

---

### 50. Core Dashboard Growth Analytics: Followers Growth and Likes Growth Integration with Recharts
- **Context & Feature Request**:
  - The Core Dashboard needed two visual time series analytics charts: **Followers Growth** and **Likes Growth**.
  - Rather than writing hundreds of lines of manual SVG path calculations and geometry math, integrated the standard `recharts` library for declarative, concise, and responsive charting.
- **Architectural & Technical Solution**:
  - **Backend Analytics Engine (`DashboardService::getGrowthTrends`)**:
    - Created `getGrowthTrends(int $days = 30)` in [`DashboardService`](modules/Core/src/Services/DashboardService.php).
    - Queries daily aggregates from `crawl_results` table combined with total snapshots from `tiktok_accounts`.
    - Computes continuous daily trajectories (`buildTrendSeries`) with `current_value`, `previous_value`, `net_change`, and `growth_rate` percentage.
    - Added `GET /core/dashboard/growth?days=30` and supported optional `days` parameter in `GET /core/dashboard` within [`DashboardController`](modules/Core/src/Http/Controllers/DashboardController.php).
  - **Recharts Library Integration (`recharts`)**:
    - Installed `recharts` (`^2.15.1`) natively compatible with React 19.
    - Created compact, reusable [`GrowthChart.tsx`](modules/Core/resources/js/components/GrowthChart.tsx) (~150 lines) utilizing `ResponsiveContainer`, `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, and `Tooltip`.
    - Features: smooth monotone curves, gradient area fills (`#1677ff` for followers, `#eb2f96` for likes), formatted numbers, interactive tooltips, and time-range segmented buttons (`7D`, `30D`, `90D`).
  - **Dashboard Layout Integration (`DashboardGrowthCharts`)**:
    - Created [`DashboardGrowthCharts.tsx`](modules/Core/resources/js/pages/ui/DashboardGrowthCharts.tsx) rendering both charts side-by-side in responsive grid columns.
    - Integrated seamlessly into [`DashboardPage.tsx`](modules/Core/resources/js/pages/DashboardPage.tsx) with dynamic period switching and auto-refresh.
- **Touched Files**:
  - [`package.json`](package.json)
  - [`modules/Core/src/Services/DashboardService.php`](modules/Core/src/Services/DashboardService.php)
  - [`modules/Core/src/Http/Controllers/DashboardController.php`](modules/Core/src/Http/Controllers/DashboardController.php)
  - [`modules/Core/resources/js/pages/ui/types.ts`](modules/Core/resources/js/pages/ui/types.ts)
  - [`modules/Core/resources/js/Action/dashboard.ts`](modules/Core/resources/js/Action/dashboard.ts)
  - [`modules/Core/resources/js/components/GrowthChart.tsx`](modules/Core/resources/js/components/GrowthChart.tsx)
  - [`modules/Core/resources/js/pages/ui/DashboardGrowthCharts.tsx`](modules/Core/resources/js/pages/ui/DashboardGrowthCharts.tsx)
  - [`modules/Core/resources/js/pages/DashboardPage.tsx`](modules/Core/resources/js/pages/DashboardPage.tsx)
  - [`tests/Feature/DashboardOverviewTest.php`](tests/Feature/DashboardOverviewTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `node node_modules/typescript/bin/tsc --noEmit` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - `php artisan test --filter DashboardOverviewTest` $\rightarrow$ 5/5 passed (54 assertions, 100%).

---

### 51. System Module Settings Submenu & Dynamic Scheduled Log Pruning Worker
- **Context & Feature Request**:
  - The System module required a dedicated **Settings** submenu (`/system/settings`) to configure background workers and automated maintenance tasks (log retention policies, scheduled cron intervals, and safe chunked deletions).
  - The scheduling mechanism needed to be **dynamic**: Quản trị viên can adjust retention thresholds (activity logs, login logs) and cron frequency directly from the React UI without requiring server restarts or code changes.
  - The console routes and scheduled task needed to be encapsulated directly inside the module (`modules/System/routes/console.php`).
- **Architectural & Technical Solution**:
  - **Modular Console Route Discovery (`ModuleServiceProvider`)**:
    - Enhanced [`ModuleServiceProvider`](modules/Core/src/Providers/ModuleServiceProvider.php) to automatically discover and load `routes/console.php` for any module when running in console (`$this->app->runningInConsole()`).
    - Created [`modules/System/routes/console.php`](modules/System/routes/console.php) registering `system:prune-logs` scheduled task with `->when(fn() => app(SystemSettingService::class)->shouldRunCleanupNow())`.
  - **Dynamic Schedule Evaluation (`SystemSettingService`)**:
    - Created `SystemSettingService` evaluating cron expressions dynamically at runtime using `Cron\CronExpression::isDue(now())` and cached database settings (`Cache::rememberForever`).
    - Implemented safe, chunked deletion (`executeChunkedPrune`) with micro-sleeps (`usleep`) between batches (`cleanup_chunk_size`, default 500) to prevent InnoDB table locks and out-of-memory errors.
    - Enforced strict safety guardrails: Minimum 7 days floor for activity logs and 14 days floor for login logs to prevent accidental log wipes.
    - Maintained an execution history array (`last_cleanup_history`) tracking the last 10 executions (timestamp, trigger type, purged counts, duration, and status).
  - **Database & Model Layer**:
    - Created migration `2026_01_01_000009_create_system_settings_table.php` with default seeded values for worker configuration.
    - Created `SystemSetting` model with automatic type casting (`boolean`, `integer`, `json`, `string`) and `LogsActivity` trait for audit logging.
    - Created `SystemSettingRepository` implementing `SystemSettingRepositoryInterface` and extending `BaseRepository`.
  - **Artisan Command & Queue Job**:
    - Console command: `PruneSystemLogsCommand` (`php artisan system:prune-logs`) with optional `--activity-days=`, `--login-days=`, and `--chunk=` flags.
    - Background queue job: `PruneExpiredLogsJob` implementing `ShouldQueue` for asynchronous processing.
  - **Frontend UI & State Management (`modules/System/resources/js`)**:
    - Registered route `/system/settings` with `SettingOutlined` icon under parent `/system` in [`route.ts`](modules/System/resources/js/routes/route.ts).
    - Created [`SystemSettingsPage.tsx`](modules/System/resources/js/pages/SystemSettingsPage.tsx) utilizing Core components: `ListLayout`, `CardKPI`, `TableComponent`, `StatusTag`, and `useAction`.
    - Tab 1: Worker & Retention Settings form with auto-cleanup switch, preset cron selector (Daily 2AM, Daily Midnight, Weekly Sunday, Custom), numeric inputs, and an on-demand "Run Cleanup Now" action card with `Popconfirm`.
    - Tab 2: Execution History table showing detailed logs of the 10 most recent cleanup passes.
    - Extended Redux slice `systemSlice` and thunks (`fetchWorkerSettings`, `saveWorkerSettings`, `triggerManualCleanup`, `fetchCleanupHistory`).
- **Touched Files**:
  - [`modules/Core/src/Providers/ModuleServiceProvider.php`](modules/Core/src/Providers/ModuleServiceProvider.php)
  - [`modules/System/database/migrations/2026_01_01_000009_create_system_settings_table.php`](modules/System/database/migrations/2026_01_01_000009_create_system_settings_table.php)
  - [`modules/System/src/Models/SystemSetting.php`](modules/System/src/Models/SystemSetting.php)
  - [`modules/System/src/Repositories/Interfaces/SystemSettingRepositoryInterface.php`](modules/System/src/Repositories/Interfaces/SystemSettingRepositoryInterface.php)
  - [`modules/System/src/Repositories/SystemSettingRepository.php`](modules/System/src/Repositories/SystemSettingRepository.php)
  - [`modules/System/src/Services/SystemSettingService.php`](modules/System/src/Services/SystemSettingService.php)
  - [`modules/System/src/Jobs/PruneExpiredLogsJob.php`](modules/System/src/Jobs/PruneExpiredLogsJob.php)
  - [`modules/System/src/Console/Commands/PruneSystemLogsCommand.php`](modules/System/src/Console/Commands/PruneSystemLogsCommand.php)
  - [`modules/System/src/Providers/SystemServiceProvider.php`](modules/System/src/Providers/SystemServiceProvider.php)
  - [`modules/System/src/Http/Requests/UpdateSystemSettingRequest.php`](modules/System/src/Http/Requests/UpdateSystemSettingRequest.php)
  - [`modules/System/src/Http/Controllers/SystemSettingController.php`](modules/System/src/Http/Controllers/SystemSettingController.php)
  - [`modules/System/routes/api.php`](modules/System/routes/api.php)
  - [`modules/System/routes/console.php`](modules/System/routes/console.php)
  - [`modules/System/resources/js/Action/systemSetting.ts`](modules/System/resources/js/Action/systemSetting.ts)
  - [`modules/System/resources/js/store/system/systemThunks.ts`](modules/System/resources/js/store/system/systemThunks.ts)
  - [`modules/System/resources/js/store/system/systemSlice.ts`](modules/System/resources/js/store/system/systemSlice.ts)
  - [`modules/System/resources/js/pages/SystemSettingsPage.tsx`](modules/System/resources/js/pages/SystemSettingsPage.tsx)
  - [`modules/System/resources/js/routes/route.ts`](modules/System/resources/js/routes/route.ts)
  - [`routes/console.php`](routes/console.php)
  - [`tests/Feature/SystemSettingTest.php`](tests/Feature/SystemSettingTest.php)
  - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)
- **Verification**:
  - `npm.cmd run check-types` $\rightarrow$ 0 compilation errors (100% strict TypeScript).
  - `php artisan test --filter SystemSettingTest` $\rightarrow$ 7/7 passed (33 assertions, 100%).
  - Total application test suite: **142/142 passed (779 assertions, 100%)**.
  - `php artisan schedule:list` properly detects `modules/System/routes/console.php` with command `php artisan system:prune-logs`.

---

### 52. Automated CI/CD Deployment with GitHub Actions, Render Cloud Blueprint & Worktree Protocol
- **Context & Feature Request**:
  - Required complete automated CI/CD setup via GitHub Actions deploying to Render.com covering all 4 core services:
    1. **Web Service**: Backend Laravel API + React SPA frontend.
    2. **Crawler Service**: Python FastAPI + Playwright TikTok crawler engine.
    3. **Queue Worker**: Asynchronous queue worker processing background tasks (`PruneExpiredLogsJob`, crawler result ingest).
    4. **Cron Scheduler**: Periodic scheduler running `schedule:run` every minute.
  - Automated release and pre-release versioning pipeline triggered by Git tags (`v*.*.*`).
  - Automated Git Worktree routing script for AI Agents ensuring strict compliance with `AGENTS.md`.
- **Architectural & Technical Solution**:
  - **Render Cloud Infrastructure Blueprint (`render.yaml`)**:
    - Created root [`render.yaml`](render.yaml) defining all 4 independent services with isolated resource plans, health check probes (`/api/health`), and environment variable bindings.
    - Added container definitions in `docker/`:
      - [`Dockerfile.web`](docker/Dockerfile.web): Multi-stage build (Node 20 frontend compilation $\rightarrow$ PHP 8.3 FPM + Nginx alpine runtime).
      - [`Dockerfile.worker`](docker/Dockerfile.worker): PHP 8.3 CLI container running `php artisan queue:work`.
      - [`Dockerfile.crawler`](docker/Dockerfile.crawler): Python 3.12 container with Playwright Chromium headless engine running `app/main.py`.
      - Supporting configurations: [`nginx.conf`](docker/nginx.conf), [`php.ini`](docker/php.ini), [`start-web.sh`](docker/start-web.sh).
  - **GitHub Actions CI/CD Pipeline (`.github/workflows/`)**:
    - [`ci.yml`](.github/workflows/ci.yml): Strict TypeScript type check (`npm run check-types`) and full PHP test suite execution (`php artisan test`) on Pull Requests and pushes to `main`, `develop`, `worktree-*`.
    - [`deploy.yml`](.github/workflows/deploy.yml): Automated deployment trigger via Render Deploy Webhooks across `production` (`main`) and `staging` (`develop`).
    - [`release.yml`](.github/workflows/release.yml): Automated release packaging when pushing tags (`v*.*.*`). Automatically distinguishes Pre-Releases (`-alpha`, `-beta`, `-rc`) from Official Releases, generates changelogs from conventional commits, and publishes release archives.
  - **AI Agent Worktree Automation Protocol (`scripts/agent-worktree.ps1`)**:
    - Author script [`agent-worktree.ps1`](cms-tiktok-crawler/scripts/agent-worktree.ps1) managing persistent worktrees (`project1-worktree-1` to `project1-worktree-5`).
    - Enforces idle anchor root protocol, automated branch creation, and environment verification.
- **Touched Files**:
  - [`render.yaml`](render.yaml)
  - [`docker/Dockerfile.web`](docker/Dockerfile.web)
  - [`docker/Dockerfile.worker`](docker/Dockerfile.worker)
  - [`docker/Dockerfile.crawler`](docker/Dockerfile.crawler)
  - [`docker/nginx.conf`](docker/nginx.conf)
  - [`docker/php.ini`](docker/php.ini)
  - [`docker/start-web.sh`](docker/start-web.sh)
  - [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  - [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
  - [`.github/workflows/release.yml`](.github/workflows/release.yml)
  - [`cms-tiktok-crawler/routes/api.php`](cms-tiktok-crawler/routes/api.php)
  - [`cms-tiktok-crawler/scripts/agent-worktree.ps1`](cms-tiktok-crawler/scripts/agent-worktree.ps1)
  - [`cms-tiktok-crawler/PROJECT_SUMMARY.md`](cms-tiktok-crawler/PROJECT_SUMMARY.md)
- **Verification**:
  - Strict TypeScript check: `npm.cmd run check-types` $\rightarrow$ 0 errors.
  - PHP Feature & Unit Tests: `php artisan test --filter SystemSettingTest` $\rightarrow$ 10/10 passed (40 assertions).
  - Health check endpoint `/api/health` added to `routes/api.php` for Render container probing.



---

### 53. Enterprise AI Development Workflow, Git Worktree Protocol, Quality CI/CD Gates, Semantic Versioning Draft Releases & Controlled Render Deployment
- **Context & Operational Objective**:
  - Implemented the complete end-to-end development-to-production workflow requested in the Master Prompt:
    1. Multi-agent concurrency and persistent Git Worktree isolation with strict branch naming conventions (`feature/`, `fix/`, `hotfix/`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`).
    2. Repository-level AI Operating Instructions (`AGENTS.md`) enforcing zero direct push to `main`, Conventional Commits, Core reusability, and PR review gates.
    3. Production-grade CI/CD pipeline in GitHub Actions with concurrency cancellation, strict TypeScript checks, PHP 8.3 Pest test suite, Pint code formatting, SQLite migration verification, and dependency security audits (`composer audit`, `npm audit`).
    4. Controlled Pull Request workflow via `.github/pull_request_template.md` with strict pre-merge validation gates.
    5. Semantic Versioning (SemVer 2.0.0) draft release lifecycle: bumping version in `package.json` generates an automated **GitHub Draft Release** with package archive assets and changelog without deploying to production.
    6. Controlled Render deployment: production deployment triggers **exclusively** upon publishing an approved release or via authenticated `workflow_dispatch` with confirmation, followed by automated post-deployment health check probing (`/api/health`) and explicit rollback guidance.
- **Architectural & Technical Solution**:
  - **Git Worktree Isolation & Automation (`scripts/agent-worktree.ps1`)**:
    - Created/upgraded standard PowerShell worktree manager supporting actions: `List`, `Status`, `Switch`, and `Clean`.
    - Integrated branch naming regex validation matching allowed prefixes: `^(feature|fix|hotfix|refactor|test|docs|chore|ci)/[a-zA-Z0-9._-]+$`.
    - Added safety locks preventing branch switching or worktree cleaning if uncommitted/unstashed changes are detected.
    - Integrated port mapping guidance across 5 persistent slots (`8010-8050` for Laravel, `5181-5185` for Vite Dev).
  - **Repository-Level AI Instructions (`AGENTS.md`)**:
    - Placed authoritative instructions at repository root `AGENTS.md` and synchronized `cms-tiktok-crawler/AGENTS.md`.
    - Codified the non-negotiable invariants: Step 0 worktree protocol, strict English, 100% strict TypeScript (`npm.cmd run check-types`), Windows PowerShell execution, Core Reusability Matrix, PR review gate, Draft Release lifecycle, and Render deployment security.
  - **Continuous Integration Pipeline (`.github/workflows/ci.yml`)**:
    - Enhanced triggers covering all standard branch patterns (`feature/**`, `fix/**`, `hotfix/**`, etc.) and PRs to `main`/`develop`.
    - Three orchestrated jobs:
      - `typecheck-and-frontend`: Node 20, strict typecheck, and frontend build verification.
      - `backend-tests-and-migrations`: PHP 8.3, Composer validate, Pint format check, in-memory SQLite migrations, and full Pest test suite.
      - `security-audit`: Dependency vulnerability scanning via `composer audit` and `npm audit`.
  - **Pull Request Template (`.github/pull_request_template.md`)**:
    - Structured PR template enforcing task ID references, worktree isolation, strict English, TypeScript/test passing checkboxes, and zero secret leak confirmation.
  - **Semantic Versioning & Draft Release Pipeline (`.github/workflows/auto-draft-release.yml`)**:
    - Detects version bumps in `package.json` on `main`.
    - Generates release archive asset (`dist/cms-tiktok-crawler-vX.Y.Z.tar.gz`) and changelog.
    - Creates a GitHub Draft Release (`draft: true`). Enforces invariant: Draft release **never** deploys to production.
  - **Controlled Render Deployment & Health Verification (`.github/workflows/deploy.yml`)**:
    - Triggered **strictly** when a GitHub Release is published (`on: release: types: [published]`) or manually via `workflow_dispatch` requiring release tag, target commit SHA, and explicit `"DEPLOY"` confirmation.
    - Triggers Render deploy webhooks for Web, Crawler Worker, and Queue Worker.
    - Probes `https://cms-tiktok-web.onrender.com/api/health` in a loop (up to 20 retries / 5 minutes) verifying HTTP 200 and `"status": "healthy"`.
    - Provides instant failure alerting, audit logging, and documented/automated rollback procedures.
  - **Documentation Architecture**:
    - [`cms-tiktok-crawler/docs/development/git-worktree-workflow.md`](cms-tiktok-crawler/docs/development/git-worktree-workflow.md)
    - [`cms-tiktok-crawler/docs/deployment/ci-cd-architecture.md`](cms-tiktok-crawler/docs/deployment/ci-cd-architecture.md)
    - [`cms-tiktok-crawler/docs/deployment/release-management.md`](cms-tiktok-crawler/docs/deployment/release-management.md)
    - [`cms-tiktok-crawler/docs/deployment/render-deployment.md`](cms-tiktok-crawler/docs/deployment/render-deployment.md)
    - [`cms-tiktok-crawler/docs/GIT_WORKFLOW.md`](cms-tiktok-crawler/docs/GIT_WORKFLOW.md)
    - [`README.md`](README.md) & [`cms-tiktok-crawler/README.md`](cms-tiktok-crawler/README.md)
  - **Automated Verification Test Suite (`scripts/verify-workflow.ps1`)**:
    - 22 automated assertions covering branch naming regex, conventional commits, workflow gate safety, worktree manager execution, TypeScript verification, and backend test execution.
- **Touched Files**:
  - `AGENTS.md`
  - `README.md`
  - `scripts/agent-worktree.ps1`
  - `scripts/verify-workflow.ps1`
  - `.github/pull_request_template.md`
  - `.github/workflows/ci.yml`
  - `.github/workflows/auto-draft-release.yml`
  - `.github/workflows/release.yml`
  - `.github/workflows/deploy.yml`
  - `cms-tiktok-crawler/AGENTS.md`
  - `cms-tiktok-crawler/README.md`
  - `cms-tiktok-crawler/scripts/agent-worktree.ps1`
  - `cms-tiktok-crawler/docs/development/git-worktree-workflow.md`
  - `cms-tiktok-crawler/docs/deployment/ci-cd-architecture.md`
  - `cms-tiktok-crawler/docs/deployment/release-management.md`
  - `cms-tiktok-crawler/docs/deployment/render-deployment.md`
  - `cms-tiktok-crawler/docs/GIT_WORKFLOW.md`
  - `render.yaml`
  - `cms-tiktok-crawler/app/Providers/AppServiceProvider.php`
  - `cms-tiktok-crawler/bootstrap/app.php`
  - `docker/Dockerfile.web`
  - `docker/start-web.sh`
  - `cms-tiktok-crawler/PROJECT_SUMMARY.md`
- **Verification & Test Results**:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1`: **22/22 tests passed (100%)**.
  - `npm.cmd run check-types`: **0 errors**.
  - `php artisan test`: **145/145 tests passed (786 assertions, 100%)**.

---

### 54. Release Branch Protocol, Zero Direct Push to Main, Automated PR Creation, and Human-Gated Production Release
- **Context & Operational Objective**:
  - Enforced the strict branching and release lifecycle requested by the user: Zero direct push to `main`.
  - Development and release staging are conducted strictly on dedicated branches: `release/v<version>` (e.g. `release/v1.0.0`), `feature/*`, `fix/*`.
  - The AI agent pushes changes strictly to the release branch (`git push -u origin release/v<version>`), generates a Pull Request targeting `main`, and halts.
  - The human repository owner reviews the PR code diff on GitHub and manually merges the PR into `main`.
  - Merging into `main` automatically triggers `.github/workflows/auto-draft-release.yml` to package `dist/*.tar.gz` and create/update the **GitHub Draft Release**.
  - Production deployment to Render remains strictly protected: The human User manually reviews the Draft Release and clicks **Publish release**.
- **Architectural & Technical Solution**:
  - **Release Branch Support in Worktree Manager (`scripts/agent-worktree.ps1` & `cms-tiktok-crawler/scripts/agent-worktree.ps1`)**:
    - Expanded allowed branch regex to include `release/`: `^(feature|fix|hotfix|release|refactor|test|docs|chore|ci)/[a-zA-Z0-9._-]+$`.
  - **Agent PR Preparation Script (`scripts/agent-pr.ps1` & `cms-tiktok-crawler/scripts/agent-pr.ps1`)**:
    - Runs strict TypeScript pre-verification (`npm.cmd run check-types`).
    - Pushes the active branch to remote `origin` (never directly to `main`).
    - Emits the GitHub Pull Request creation link targeting `main`.
    - Enforces human handoff for code review and PR merging.
  - **Continuous Integration Pipeline (`.github/workflows/ci.yml`)**:
    - Added `'release/**'` to push triggers and PR triggers against `main`.
  - **Updated Authoritative Agent Protocols (`AGENTS.md`)**:
    - Embedded the two-gate protocol:
      - **Gate 1 (Code Integration)**: Human reviews PR and merges `release/v<version>` into `main`.
      - **Gate 2 (Production Deployment)**: Human reviews Draft Release notes on GitHub Releases and clicks **Publish release**.
- **Touched Files**:
  - `AGENTS.md`
  - `.github/workflows/ci.yml`
  - `.github/workflows/auto-draft-release.yml`
  - `scripts/agent-worktree.ps1`
  - `scripts/agent-pr.ps1`
  - `scripts/verify-workflow.ps1`
  - `cms-tiktok-crawler/AGENTS.md`
  - `cms-tiktok-crawler/scripts/agent-worktree.ps1`
  - `cms-tiktok-crawler/scripts/agent-pr.ps1`
  - `render.yaml`
  - `cms-tiktok-crawler/app/Providers/AppServiceProvider.php`
  - `cms-tiktok-crawler/bootstrap/app.php`
  - `docker/Dockerfile.web`
  - `docker/start-web.sh`
  - `cms-tiktok-crawler/PROJECT_SUMMARY.md`
- **Verification & Test Results**:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1`: **23/23 tests passed (100%)**.

---

### 56. Product-Centric Root README Consolidation and Subdirectory README Removal
- **Context & Operational Objective**:
  - Transformed the root `README.md` into an enterprise, customer-facing product overview detailing platform capabilities, architecture, tech stack, modular business domains, and quick start instructions.
  - Stripped out all internal Git flows, worktree manager instructions, and development lifecycle invariants from `README.md` (which are properly encapsulated in `AGENTS.md` and `docs/`).
  - Removed redundant `cms-tiktok-crawler/README.md` to prevent duplicate maintenance and keep documentation centralized.
- **Touched Files**:
  - `README.md`
  - `cms-tiktok-crawler/README.md` (deleted)
  - `cms-tiktok-crawler/PROJECT_SUMMARY.md`
- **Verification & Test Results**:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1`: **23/23 tests passed (100%)**.

---

### 55. Token Optimization & Streamlining of Agent Operating Guidelines
- **Context & Operational Objective**:
  - Addressed token inefficiency caused by dual bloated `AGENTS.md` files (one at root and one in `cms-tiktok-crawler/`).
  - Streamlined instructions into a high-density, action-oriented format, reducing token overhead by ~75% while fully preserving all workflow rules and safety gates.
- **Architectural & Technical Solution**:
  - **Authoritative Root Manual (`AGENTS.md`)**:
    - Compacted from 124 lines with heavy diagrams down to 43 lines of dense, unambiguous rules.
    - Preserved 100% of: Worktree isolation (`.\scripts\agent-worktree.ps1`), standardized branch naming, Zero direct push to `main`, PR review gate (`.\scripts\agent-pr.ps1`), automated Draft Release generation (`auto-draft-release.yml`), Mandatory Human Approval Gate for Render deployment, strict TypeScript (`npm.cmd run check-types`), and Core Reusability Matrix.
  - **Module Reference File (`cms-tiktok-crawler/AGENTS.md`)**:
    - Reduced to a 2-line pointer directing agents to root `../AGENTS.md`, completely eliminating duplicate rule injection into prompt context.
  - **Mandatory Documentation Rule (`AGENTS.md`)**:
    - Codified mandatory documentation update rule upon completing any task: update `README.md` (for new capabilities, commands, or architecture changes) and update `PROJECT_SUMMARY.md` (for milestone records).
- **Touched Files**:
  - `AGENTS.md`
  - `README.md`
  - `cms-tiktok-crawler/AGENTS.md`
  - `cms-tiktok-crawler/PROJECT_SUMMARY.md`
- **Verification & Test Results**:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1`: **23/23 tests passed (100%)**.

---

### 56. Product-Centric Root README Consolidation and Subdirectory README Removal
- **Context & Operational Objective**:
  - Transformed the root `README.md` into an enterprise, customer-facing product overview detailing platform capabilities, architecture, tech stack, modular business domains, and quick start instructions.
  - Stripped out all internal Git flows, worktree manager instructions, and development lifecycle invariants from `README.md` (which are properly encapsulated in `AGENTS.md` and `docs/`).
  - Removed redundant `cms-tiktok-crawler/README.md` to prevent duplicate maintenance and keep documentation centralized.
- **Touched Files**:
  - `README.md`
  - `cms-tiktok-crawler/README.md` (deleted)
  - `cms-tiktok-crawler/PROJECT_SUMMARY.md`
- **Verification & Test Results**:
  - `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1`: **23/23 tests passed (100%)**.

---

## Milestone: AI Agent Worktree & Release-Only Deployment Architecture
- **Date**: 2026-10-29
- **Author**: Antigravity AI Assistant
- **Branch**: `configure_agent_worktree_workflow`

### 1. Objectives & Delivered Solution
Configured a multi-agent worktree concurrency architecture with dedicated roles and a release-only deployment gate:
1. **Dedicated Worktree Role Matrix**:
   - **Slot 1 (`feature`)**: Port 8010/5181 — New feature development (`feature/*`).
   - **Slot 2 (`fix`)**: Port 8020/5182 — Defect fixes and bug repairs (`fix/*`).
   - **Slot 3 (`hotfix`)**: Port 8030/5183 — Emergency production hotfixes (`hotfix/*`).
   - **Slot 4 (`refactor` / `test`)**: Port 8040/5184 — Code refactoring, optimization, test automation (`refactor/*`, `test/*`).
   - **Slot 5 (`release` / `docs` / `chore`)**: Port 8050/5185 — Release candidate preparation, documentation, dependencies (`release/*`, `chore/*`, `docs/*`, `ci/*`).
2. **Dynamic Repository & Worktree Path Discovery**:
   - Replaced all hardcoded paths (`E:\Urekamedia\project1`) with dynamic git anchor root discovery using `git rev-parse --git-common-dir`.
   - Worktree path dynamically targets `$ParentDir\$RepoName-worktree-$Slot`.
3. **Release-Only Deployment Safety Invariant**:
   - Merging PR into `main` creates an automated **Draft Release** (`draft: true`) via `.github/workflows/auto-draft-release.yml`.
   - **Zero automated deploy on push/merge to `main`**: Production deployment is locked behind the **Mandatory Human Release Gate**.
   - Only when a Human User reviews and clicks **"Publish release"** on GitHub Releases (or pushes `v*.*.*` tags), `.github/workflows/deploy.yml` triggers the Render deployment hooks and executes post-deployment `/api/health` verification with automated rollback instructions.

### 2. Files Modified & Created
- `AGENTS.md`: Full operating rules, 5-slot worktree matrix, PR gates, and release lifecycle.
- `scripts/agent-worktree.ps1`: Dynamic root detection, `-Role` and `-Slot` parameter handling, slot role matrix inspection, and branch role matching.
- `cms-tiktok-crawler/scripts/agent-worktree.ps1`: Synced worktree manager script.
- `scripts/agent-pr.ps1`: Dynamic repository detection, role-aware pre-PR validation, and PR link generation.
- `cms-tiktok-crawler/scripts/agent-pr.ps1`: Synced PR manager script.
- `scripts/verify-workflow.ps1`: Automated 32-check test suite verifying branch regex, conventional commits, worktree role mapping, release-only deploy gates, and quality structures.
- `.github/pull_request_template.md`: Updated checklist with worktree slots 1–5 and release gate notifications.
- `README.md`: Documented AI Agent Worktree Matrix, CLI usage examples, and release-only deployment workflow.

### 3. Verification Test Results
- Ran `.\scripts\verify-workflow.ps1`:
  - **Total Tests**: 32
  - **Passed**: 32 / 32 (100%)
  - **Failed**: 0

## Milestone: Playwright Headless Dynamic Resolution & Render Crawler Config
- **Date**: 2026-10-29
- **Author**: Antigravity AI Assistant
- **Branch**: `feature/CRAWL-101-crawler-headless-env`

### 1. Objectives & Delivered Solution
Resolved Docker container / Linux headless execution constraints and aligned Render Blueprint IaC for free/standard tier crawler deployment:
1. **Dynamic Headless Detection (`config.py`)**:
   - Implemented `_resolve_headless_mode()` to read the `HEADLESS` environment variable (`true`/`false`).
   - Automatically falls back to `HEADLESS=True` in non-GUI Linux environments (containers lacking `$DISPLAY`), preventing `Missing X server or $DISPLAY` crash in production while maintaining local GUI debugging flexibility on Windows.
2. **Container Launch Arguments (`crawler.py`)**:
   - In headless mode, Playwright launches Chromium with container-optimized stability flags: `["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]`.
   - Greatly reduces memory footprint to fit within Render Free (512MB RAM) and standard Docker containers.
3. **Docker Environment Default (`Dockerfile.crawler`)**:
   - Added `ENV HEADLESS=true` and `PYTHONUNBUFFERED=1` to guarantee headless operation inside containers by default.
4. **Render Blueprint Harmonization (`render.yaml`)**:
   - Aligned crawler service environment variable keys (`CRAWLER_HOST`, `CRAWLER_PORT`, `HEADLESS`, `BACKEND_CALLBACK_URL`).
   - Aligned Web service crawler endpoint to `CRAWLER_SERVICE_URL`.

### 2. Files Modified
- `ProcessData/tiktok-crawler/app/config.py`: Added `_resolve_headless_mode()` and `HEADLESS` export.
- `ProcessData/tiktok-crawler/app/crawler.py`: Imported `HEADLESS` and added container-safe launch flags.
- `docker/Dockerfile.crawler`: Added `HEADLESS=true` and `PYTHONUNBUFFERED=1` environment variables.
- `render.yaml`: Updated crawler service config and environment keys.
- `PROJECT_SUMMARY.md`: Recorded milestone details and verification evidence.

### 3. Verification Test Results
- **TypeScript**: `npm.cmd run check-types` (0 errors).
- **Backend Tests**: `php artisan test` (145 passed / 145 tests, 786 assertions, 100%).
- **Python Syntax Check**: `python -m py_compile` passed for `config.py` and `crawler.py`.


## Milestone: Project-Wide Refactoring of .agents, docs, and PROJECT_SUMMARY.md
- **Date**: 2026-10-29
- **Author**: Antigravity AI Assistant
- **Branch**: `main`

### 1. Objectives & Delivered Solution
Centralized project assets previously confined inside `cms-tiktok-crawler/` subfolder so that all modules, microservices, and AI agents operate seamlessly from the root workspace:
1. **Centralized Agent Skills (`.agents/`)**:
   - Promoted `.agents/skills/` to the repository root (`E:\Urekamedia\TIKTOK-CRAWLER\.agents`).
   - Updated skills (`git-workflow`, `project-summary-updater`, `core-reusability-promoter`, `self-evolution-guide`, `ureka-module-scaffolder`) to point to project-level paths and enforce direct branch protocol.
2. **Centralized Documentation (`docs/`)**:
   - Promoted `docs/` to the repository root (`E:\Urekamedia\TIKTOK-CRAWLER\docs`).
   - Cleaned up obsolete worktree references and aligned internal links to root workspace.
3. **Consolidated `PROJECT_SUMMARY.md`**:
   - Merged full historical architecture (3300+ lines) with recent crawler and workflow milestones into the root `PROJECT_SUMMARY.md`.
   - Removed duplicate files inside `cms-tiktok-crawler/`.
4. **Clean Root `.gitignore`**:
   - Removed `.agents/` exclusion from root `.gitignore` to allow agent skills to be tracked in repository version control.

### 2. Files Modified & Relocated
- `.agents/`: Moved to repository root; updated skill runbooks.
- `docs/`: Moved to repository root; updated guides and removed deprecated worktree doc.
- `PROJECT_SUMMARY.md`: Consolidated at root; removed subfolder duplicate.
- `.gitignore`: Updated root and subfolder ignore rules.

### 3. Verification Test Results
- **TypeScript**: `npm.cmd --prefix cms-tiktok-crawler run check-types` (0 errors).
- **Backend Tests**: `php artisan test` (145 passed / 145 tests, 786 assertions, 100%).
