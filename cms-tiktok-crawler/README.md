# CMS TikTok Crawler

> Hệ thống quản lý, giám sát và thu thập dữ liệu tài khoản TikTok chuyên nghiệp, được xây dựng theo kiến trúc **Modular Monorepo (chuẩn Ureka)** với backend **Laravel 11/12** và frontend **React 18 + TypeScript + Ant Design 5**.

---

## 📑 Mục lục
- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Điểm nổi bật về kiến trúc](#2-điểm-nổi-bật-về-kiến-trúc)
- [3. Tính năng chính](#3-tính-năng-chính)
- [4. Công nghệ sử dụng](#4-công-nghệ-sử-dụng)
- [5. Cấu trúc thư mục dự án](#5-cấu-trúc-thư-mục-dự-án)
- [6. Yêu cầu hệ thống](#6-yêu-cầu-hệ-thống)
- [7. Hướng dẫn cài đặt](#7-hướng-dẫn-cài-đặt)
- [8. Khởi chạy dự án](#8-khởi-chạy-dự-án)
- [9. Danh sách API chính](#9-danh-sách-api-chính)
- [10. Kiểm thử & Kiểm tra chất lượng](#10-kiểm-thử--kiểm-tra-chất-lượng)

---

## 1. Giới thiệu tổng quan

**CMS TikTok Crawler** là nền tảng quản trị và điều phối thu thập thông tin tài khoản TikTok. Hệ thống cho phép:
- Lên lịch và điều phối các tác vụ crawl dữ liệu TikTok từ nhiều nguồn (danh sách username, link URL, số lượng tài khoản hoặc tài khoản có sẵn trong cơ sở dữ liệu).
- Đồng bộ hóa kết quả crawl tự động thông qua webhook callback từ Python Crawler Service.
- Quản lý hồ sơ tài khoản TikTok: thông tin cá nhân, chỉ số tương tác (followers, following, likes), trạng thái hoạt động và lưu trữ avatar về storage cục bộ.
- Báo cáo thống kê KPI trực quan và theo dõi chi tiết lịch sử thu thập dữ liệu theo thời gian thực.

---

## 2. Điểm nổi bật về kiến trúc

Hệ thống được tái cấu trúc hoàn toàn theo mô hình **Ureka Enterprise Architecture**:

1. **100% TypeScript**:
   - Toàn bộ frontend được viết bằng TypeScript (`.ts` và `.tsx`) với `tsconfig.json` cấu hình path aliases chuẩn (`@/*`, `@modules/*`, `@core/*`).
   - Kiểm tra kiểu dữ liệu tĩnh nghiêm ngặt (`npx tsc --noEmit` đạt 0 error).

2. **Laravel Blade Shell & Scoped DOM (Không dùng `index.html` độc lập)**:
   - Thay thế hoàn toàn file HTML tĩnh bằng template Blade chuẩn Laravel: [`modules/Core/resources/views/app.blade.php`](modules/Core/resources/views/app.blade.php).
   - Tích hợp linh hoạt cả hai chế độ:
     - **Chế độ Production (Laravel Mix / Webpack 5)**: Đọc manifest `entrypoints.json` và nạp Scoped DOM theo module qua Blade directives `@moduleCss($module)` và `@moduleJs($module)` với bộ nhớ cache chống render thẻ trùng lặp.
     - **Chế độ Development (Vite)**: Hỗ trợ Hot Module Replacement qua `@viteReactRefresh` và `@vite`.
   - Cơ chế SPA Catch-all Route tại [`modules/Core/routes/web.php`](modules/Core/routes/web.php) tự động xác định segment, phân giải module qua `config('modules.routes')` và truyền trực tiếp vào Blade shell.

3. **Cấu trúc Module Backend & Route Discovery Chuẩn Ureka**:
   - Mã nguồn PHP của mỗi module đặt gọn gàng trong `modules/<ModuleName>/src/` (Controllers, Models, Repositories, Services, Requests, Resources, Providers).
   - Route API phân tách riêng biệt tại `modules/<ModuleName>/routes/api.php`.
   - **Xử lý Route tự động & Dynamic Routing qua Core**: Core sở hữu `ModuleRegistry` và `CoreServiceProvider` tự động phát hiện module và nạp route. Toàn bộ cơ chế dynamic routing được đóng gói trong class [`Modules\Core\Support\DynamicRouteResovle`](modules/Core/src/Support/DynamicRouteResovle.php) và kết nối qua [`modules/Core/routes/api.php`](modules/Core/routes/api.php) (tự động phân giải controller, ánh xạ action alias, inject dependency và parameter) xử lý tất cả mẫu route RESTful và custom action (`/{module}/{controller}/{id}/{action}`, `/{module}/{controller}/{action}`, `/{module}/{controller}/{id}`, `/{module}/{controller}`, `/public/...`). Tuyệt đối không đăng ký route cứng bên ngoài module tại `routes/api.php`.
   - Composer PSR-4 tự động ánh xạ class namespace chuẩn xác: `"Modules\\<Name>\\": "modules/<Name>/src/"`.

4. **Cấu trúc Module Frontend Đồng Bộ**:
   - Mỗi module frontend đặt tại `modules/<ModuleName>/resources/js/` bao gồm:
     - `Action/`: Các hàm gọi API có định kiểu (Typed API Clients).
     - `components/`: Thành phần giao diện tái sử dụng.
     - `pages/`: Các trang tính năng.
     - `routes/`: Cấu hình route con của module.
     - `store/`: Redux slice và thunk tương ứng.

5. **Central Core API Client**:
   - Triển khai tại [`modules/Core/resources/js/Action/api.ts`](modules/Core/resources/js/Action/api.ts) theo kiến trúc Ureka.
   - Tự động lấy CSRF token từ thẻ `<meta name="csrf-token">`, gắn header `X-Requested-With: XMLHttpRequest` và `Accept: application/json`.
   - Phân giải `baseURL` trực tiếp và nghiêm ngặt từ file cấu hình `.env` (`VITE_API_URL`):
     - Trong Laravel Mix/Webpack: Nạp `.env` qua `dotenv-expand` và in-line trực tiếp qua `webpack.DefinePlugin` (`process.env.VITE_API_URL` & `import.meta.env.VITE_API_URL`).
     - Trong Vite: Được inject qua `import.meta.env.VITE_API_URL`.
     - Tuyệt đối không đọc từ URL, thẻ DOM hay biến window, triệt tiêu hoàn toàn lỗi runtime `TypeError`.
   - Xử lý lỗi tập trung với class `ApiError` chuẩn hóa thông báo lỗi và danh sách lỗi validate từ server.

6. **Typed State Management**:
   - Quản trị state bằng Redux Toolkit với các hook định kiểu sẵn [`modules/Core/resources/js/store/index.ts`](modules/Core/resources/js/store/index.ts): `useAppDispatch`, `useAppSelector`, `useDispatch`, `useSelector`.

7. **TableComponent Dùng Chung Thuần Túy (`@core/components/Table`)**:
   - Thành phần bảng dữ liệu dùng chung thuần túy, chỉ chứa logic chung (phân trang, thêm cột, render cột tùy biến).
   - **Tách biệt nghiệp vụ**: Không nhét component giao diện riêng (như Tag, Avatar, Action) vào lõi bảng, các thành phần này được tự do render tại điểm sử dụng thông qua prop `renderColumns`.
   - **Thêm cột**: Hỗ trợ `prependColumns` (đầu bảng như STT, checkbox) và `extraColumns`/`appendColumns` (cuối bảng như Action).
   - **Cấu hình chuẩn**: Sử dụng column config Ant Design tiêu chuẩn, sạch sẽ và dễ bảo trì.
   - Đã áp dụng tinh giản toàn bộ các bảng `CrawlJobListTable`, `TiktokAccountTableList` và `CrawlResultTable`.

8. **Tối Ưu Hóa State Management & Component Module Crawler**:
   - Phân định rõ ràng phạm vi dữ liệu: Chỉ đưa dữ liệu danh sách (`data`, `pagination`, `params`) và thống kê KPI (`statistics`) vào Redux Store.
   - Các tác vụ thao tác đơn lẻ (`delete`, `create`, `update`, `start`) chuyển sang gọi API trực tiếp qua Typed Client `crawlJobAPI`.
   - Xóa bỏ component `DeleteCrawlJobButton`, thay bằng `Popconfirm` gọi API xóa trực quan tại chỗ.

9. **Cơ chế Route Registry & AdminLayout Chuẩn Kiến Trúc Ureka**:
   - **`AdminLayout`**: Cấu hình theo mô hình Layout Route chuẩn (`<Route element={<AdminLayout />}>`), các route chức năng con hiển thị qua `<Outlet />` giúp tránh re-mount layout không cần thiết khi chuyển trang.
   - **Điều hướng Sidebar theo Route Registration Tự Động**:
     - **Core hoàn toàn độc lập**: `Core` chỉ sở hữu router và layout, hoàn toàn không cần duy trì danh sách page, menu hay đường dẫn của các module con (`Core has no list of pages, menu entries or paths to maintain`).
     - **Tự động đăng ký qua từng Module**: Mỗi module (`Crawler`, `TiktokAccount`...) tự đăng ký page và menu item của mình khi script thực thi thông qua `registerRoute(def)`. Danh sách route được lưu và duy trì tập trung trên `window.__CMS_ROUTES_REGISTRY__`.
     - **Không còn hiện tượng load 2 lần**: Loại bỏ hoàn toàn component tạm `createModuleLoader` và script injection thủ công lúc runtime. Trình duyệt nạp sẵn các bundle module (~180 KiB tổng cộng), chuyển trang SPA tức thì (0ms trễ, không chớp giật spinner).

10. **Nền tảng RESTful Controller Dùng Chung (`BaseController` & `CoreController`)**:
    - **`BaseController`**: Cung cấp sẵn 5 hành vi chuẩn RESTful (`index`, `show`, `store`, `update`, `destroy`), tích hợp pipeline tìm kiếm toàn văn (`?search=...`), lọc theo cột động (lọc số `_min`/`_max`/`_gte`/`_lte`/`1000..5000`, lọc ngày `_from`/`_to`, `whereIn`, wildcards), sắp xếp mặc định theo cấu hình `$defaultSort` (ví dụ: `['id', 'desc']` hoặc `['created_at', 'desc']`), phân trang và hỗ trợ tắt phân trang (`pagination=false`). Các tính năng tìm kiếm và lọc chỉ thực thi khi được khai báo tường minh (`$searchableColumns`, `$filterableColumns`).
    - **`CoreController`**: Controller cụ thể kế thừa `BaseController` xử lý các tác vụ hệ thống dùng chung (`ping`, tải lên file `upload`, xóa file `delete-uploaded-file`), đồng thời hỗ trợ truy vấn RESTful CRUD trực tiếp cho bất kỳ Model nào thông qua tham số `?model=...`.

11. **Chuẩn Hóa Phân Tầng Clean Layering: Controller - Service - Repository (`modules/Crawler`)**:
    - **Nguyên tắc "Nghiệp vụ đơn giản không cần service"**:
      - Các thao tác CRUD chuẩn (`store`, `update`, `destroy`), tổng hợp số liệu KPI (`statisticsSummary`) và truy vấn kết quả crawl (`results`) được Controller gọi trực tiếp thông qua tầng Repository (`CrawlJobRepository`, `CrawlResultRepository`).
      - Không lạm dụng tầng Service làm wrapper trung gian chuyển tiếp vô ích.
    - **Tầng Service (`CrawlJobService`)**: Chỉ phụ trách logic nghiệp vụ phức tạp thực thụ:
      - `start()`: Kiểm tra trạng thái pending, kiểm tra xung đột chạy đồng thời (`hasRunningJob`), giải mã danh sách tài khoản TikTok qua `TiktokAccountRepository`, đóng gói payload chuẩn, điều phối HTTP request sang Python Crawler Engine, cập nhật `started_at` và rollback sang `failed` kèm `error_message` khi gặp sự cố.
    - **Tầng Repository (`CrawlJobRepository` & `CrawlResultRepository`)**: Kế thừa `BaseRepository`, đảm nhận mọi truy vấn dữ liệu DB thuần túy:
      - `CrawlJobRepository`: `getStatisticsSummary()` (tổng hợp KPI dashboard), `hasRunningJob()`, `findByStatus()`, `getResults()`.
      - `CrawlResultRepository`: `getByJobId()` (chuẩn hóa tên method), `getCrawlResultsByJobId()` (alias tương thích ngược).
    - **Tầng Controller (`CrawlJobController` & `CrawlResultController`)**:
      - **Đồng bộ kế thừa `CoreController`**: Tận dụng pipeline RESTful listing (`index`), xem chi tiết (`show`), tìm kiếm từ khóa, bộ lọc động và biến đổi qua API Resource (`CrawlJobResource`, `CrawlResultResource`).
      - Chuẩn hóa tên hàm theo quy chuẩn RESTful và giữ alias tương thích ngược: `store`, `update`, `destroy`, `start`, `statisticsSummary`, `results`, `byJob`.
    - **Loại bỏ service trung gian dư thừa**: Xóa hoàn toàn file rỗng `CrawlResultService.php`.

12. **Tiện ích gọi HTTP API Dùng Chung Chuẩn Core (`Modules\Core\Utils\FetchApi`)**:
    - **Chuẩn hóa tầng Core**: Đưa toàn bộ tiện ích gọi HTTP API dùng chung vào [`modules/Core/src/Utils/FetchApi.php`](modules/Core/src/Utils/FetchApi.php).
    - **Phương thức hỗ trợ**: `FetchApi::request()`, `get()`, `post()`, `put()`, `patch()`, `delete()`, `fetch()`, `fetchAPI()`.
    - **Loại bỏ file dư thừa**: Xóa bỏ hoàn toàn `FetchAPIUtil.php` tại module Crawler sau khi chuyển toàn bộ sang `Modules\Core\Utils\FetchApi`. Xóa các file Redux Store/Action chết không sử dụng (`crawlResultSlice.ts`, `crawlResultThunks.ts`, `Action/crawlResult.ts`).

---

## 3. Tính năng chính

### 📊 Bảng Điều Khiển Tổng Quan (`modules/Core/pages/DashboardPage`)
- **Giám sát tập trung toàn hệ thống**: Hợp nhất toàn bộ chỉ số KPI từ cả 2 module Crawler và TiktokAccount vào một dashboard duy nhất.
- **4 Hero KPI Cards**: Tổng Crawl Jobs (phân loại completed/failed), Mục tiêu tài khoản thu thập (success/failed), Hồ sơ TikTok lưu trữ (active/inactive), Tổng lượt thích & followers.
- **Phân tích hiệu năng chuyên sâu**:
  - *Crawl Engine Performance*: Thanh tiến độ tỷ lệ cào thành công, lưới số liệu jobs hoàn tất, jobs thất bại, tài khoản thành công, tài khoản lỗi và số job đang xếp hàng xử lý.
  - *TikTok Social Database*: Thanh tiến độ tỷ lệ tài khoản hoạt động, số liệu followers, likes, following, và tài khoản active.
- **Bảng hoạt động crawl gần đây**: Danh sách 5 crawl job mới nhất với trạng thái, tiến độ, thời gian tạo và link truy cập chi tiết.
- **Lối tắt tác vụ nhanh**: Phím tắt tạo Crawl Job, quản lý danh sách jobs và tra cứu hồ sơ TikTok.

### 🔄 Quản lý Crawl Jobs (`modules/Crawler`)
- **Tạo job thu thập linh hoạt**: Hỗ trợ 4 nguồn đầu vào:
  1. *Usernames*: Nhập danh sách username TikTok (mỗi dòng một username).
  2. *URLs*: Nhập danh sách đường dẫn trang cá nhân TikTok.
  3. *Database*: Chọn các tài khoản có sẵn trong cơ sở dữ liệu hệ thống.
  4. *Count*: Thu thập tự động theo số lượng chỉ định.
- **Giao diện tinh gọn**: Loại bỏ khối thống kê cục bộ, tập trung toàn diện vào bảng danh sách jobs, tìm kiếm, phân trang và thao tác tạo job.
- **Chi tiết Job**: Theo dõi kết quả từng tài khoản (avatar, trạng thái, thời gian chạy, log lỗi nếu có).
- **Thao tác nhanh**: Khởi chạy lại job (Start Job), xóa job khỏi hệ thống.

### 👥 Quản lý Tài khoản TikTok (`modules/TiktokAccount`)
- **Danh sách tài khoản**: Bảng dữ liệu hiển thị avatar, username, số lượng followers, following, likes, trạng thái (`active` / `inactive`).
- **Giao diện làm việc sạch sẽ**: Loại bỏ khối summary cục bộ trên đầu trang, đưa vào bảng điều khiển Dashboard trung tâm.
- **Tìm kiếm & Sắp xếp**: Sắp xếp đa tiêu chí theo followers, likes, trạng thái; lọc theo từ khóa.
- **Chi tiết hồ sơ**: Xem đầy đủ thông tin cá nhân và lịch sử crawl dữ liệu liên quan của tài khoản.
- **Chỉnh sửa & Tải lên Avatar**: Cập nhật thông tin tài khoản, tải lên avatar mới (tự động lưu vào storage cục bộ).
- **Xóa tài khoản**: Hỗ trợ xóa tài khoản khỏi cơ sở dữ liệu.

### 🌐 Webhook & Tích hợp Microservice (`modules/API` & `ProcessData`)
- Tiếp nhận sự kiện webhook bất đồng bộ từ Python Crawler Service qua endpoint:
  `POST /admin/api/public/crawler/crawl-jobs/{jobId}/events`
- Tự động lưu trữ avatar vào: `storage/app/public/tiktok-accounts/avatars/`.
- Cập nhật thời gian thực kết quả crawl vào bảng `crawl_results` và cập nhật thông số tài khoản vào bảng `tiktok_accounts`.

---

## 4. Công nghệ sử dụng

| Lĩnh vực | Công nghệ | Phiên bản / Mô tả |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel | v11 / v12 (PHP 8.2+) |
| **Kiến trúc Module** | PSR-4 Modules | `modules/*/src/` & `modules/*/routes/` |
| **Frontend Framework** | React | v18 |
| **Ngôn ngữ Frontend** | TypeScript | v5.8+ (Strict Type Checking) |
| **UI Component Library** | Ant Design | v5.x |
| **Styling** | Tailwind CSS + CSS Modules | v4.x |
| **Build Tool (Production)** | Webpack 5 & Laravel Mix | v6.x (Kiến trúc đóng gói Module Ureka) |
| **Build Tool (Development)** | Vite (via Laravel Vite Plugin) | v8.x (HMR dev server) |
| **State Management** | Redux Toolkit & React-Redux | v2.x & v9.x |
| **Router** | React Router DOM | v6.x |
| **Icons** | Ant Design Icons | v5.x |
| **Cơ sở dữ liệu** | MySQL / MariaDB | v8.0+ |
| **Crawler Engine** | Python (Playwright / FastAPI) | v3.10+ (Thư mục `ProcessData/tiktok-crawler`) |

---

## 5. Cấu trúc thư mục dự án

```
cms-tiktok-crawler/
├── app/                                 # Laravel Core Framework code
├── bootstrap/
│   ├── app.php                          # Bootstrap Laravel 11/12 (Routing, Middleware, Exceptions)
│   └── providers.php                    # Service Providers đăng ký
├── config/                              # Cấu hình hệ thống (app, database, cors, services...)
├── database/
│   ├── migrations/                      # Bảng hạ tầng Framework (cache, jobs)
│   └── seeders/                         # Master DatabaseSeeder (gọi các module seeders)
├── modules/                             # Tầng Module nghiệp vụ (Kiến trúc Ureka)
│   ├── API/                             # Module API công khai / Webhook
│   │   ├── routes/api.php               # Route webhook callback từ crawler
│   │   └── src/Controllers/, Requests/
│   ├── Core/                            # Module lõi dùng chung
│   │   ├── configs/
│   │   │   ├── admin.php                # Cấu hình admin prefix và api path
│   │   │   └── modules.php              # Mapping URL prefix sang module
│   │   ├── database/
│   │   │   ├── migrations/              # users, roles, permissions, role_permissions, personal_access_tokens...
│   │   │   └── seeders/                 # RolePermissionSeeder, UserSeeder, CoreDatabaseSeeder
│   │   ├── resources/
│   │   │   ├── css/app.css              # Global Tailwind & Ant Design Reset styles
│   │   │   ├── js/
│   │   │   │   ├── Action/api.ts        # Central API Client (strict .env baseURL)
│   │   │   │   ├── components/          # CardKPI, Table, CustomModal, Spin, StatusTag...
│   │   │   │   ├── layouts/             # AdminLayout, Header, Sidebar
│   │   │   │   ├── pages/               # DashboardPage, NotFoundPage
│   │   │   │   │   └── ui/              # Dashboard UI subcomponents (Header, KpiCards, Overview, Table, Shortcuts)
│   │   │   │   ├── routes/              # Route registry, autoRegister
│   │   │   │   ├── store/index.ts       # Root Redux Store & Typed Hooks
│   │   │   │   └── utils/               # formatCurrency, validation helpers
│   │   │   └── views/
│   │   │       └── app.blade.php        # Blade shell duy nhất (@moduleCss, @moduleJs, Vite fallback)
│   │   ├── routes/
│   │   │   ├── api.php                  # DynamicRouteResovle::routes()
│   │   │   └── web.php                  # SPA catch-all & route-level module resolver
│   │   └── src/                         # Controllers, Repositories, Providers, Support, Traits...
│   ├── Crawler/                         # Module Quản lý Crawl Jobs
│   │   ├── database/
│   │   │   ├── migrations/              # crawl_jobs, crawl_results
│   │   │   └── seeders/                 # CrawlJobSeeder
│   │   ├── resources/js/
│   │   │   ├── Action/                  # crawlJob.ts (API calls)
│   │   │   ├── components/              # CrawlJobListTable, CrawlResultTable...
│   │   │   ├── configs/tableConfig.ts   # Cấu hình bảng dữ liệu
│   │   │   ├── pages/                   # CrawlJobsPage, CrawlJobDetailPage, Create, Edit
│   │   │   ├── routes/route.ts          # Route definitions cho Crawler
│   │   │   └── store/                   # crawlJobSlice.ts, crawlJobThunks.ts...
│   │   ├── routes/api.php               # API endpoints cho Crawler (Dynamic routing qua Core)
│   │   └── src/                         # Controllers, Models, Repositories, Services, Providers...
│   └── TiktokAccount/                   # Module Quản lý Tài khoản TikTok
│       ├── database/
│       │   ├── migrations/              # tiktok_accounts
│       │   └── seeders/                 # TiktokAccountSeeder
│       ├── resources/js/
│       │   ├── Action/tiktokAccount.ts  # API calls cho tài khoản TikTok
│       │   ├── components/              # TiktokAccountTableList, AvatarUpload, DeleteAccount...
│       │   ├── configs/columnConfig.ts  # Cấu hình cột hiển thị & bộ lọc
│       │   ├── pages/                   # TiktokAccountPage, DetailPage, EditPage
│       │   ├── routes/route.ts          # Route definitions cho TiktokAccount
│       │   └── store/                   # tiktokAccountSlice.ts, tiktokAccountThunks.ts
│       ├── routes/api.php               # API endpoints cho TikTok Accounts
│       └── src/                         # Controllers, Models, Repositories, Services, Providers...
├── public/
│   ├── entrypoints.json                 # Manifest ánh xạ bundle JS/CSS cho từng module
│   ├── modules/                         # Output bundle chuẩn Ureka (Không copy file)
│   │   ├── Core/
│   │   │   ├── vendor.js                # Shared vendor bundle duy nhất (React, Antd, Axios, Redux...)
│   │   │   ├── index.js                 # Core code bundle
│   │   │   └── app.css                  # Core CSS bundle
│   │   ├── Crawler/
│   │   │   └── index.js                 # Crawler code bundle
│   │   └── TiktokAccount/
│   │       └── index.js                 # TiktokAccount code bundle
│   └── build/                           # Thư mục chứa production bundle khi build qua Vite
├── routes/
│   ├── api.php                          # Master API routes shell (Core tự động nạp routes từ Modules)
│   ├── web.php                          # Master Web routes shell
│   └── console.php
├── scripts/
│   └── mix-module.cjs                   # Modular build runner (Production default, Terser memory optimized)
├── build/
│   ├── modules.js                       # Auto-discovery modules & Webpack aliases
│   └── EntrypointsPlugin.js             # Plugin tự động sinh public/entrypoints.json
├── webpack.mix.js                       # Tập tin cấu hình Webpack 5 / Laravel Mix 6 duy nhất
├── storage/
│   └── app/public/                      # Public storage (lưu avatar tài khoản TikTok)
├── composer.json                        # Khai báo PSR-4: "Modules\<Name>\": "modules/<Name>/src/"
├── package.json                         # Dependencies frontend & scripts build
├── tsconfig.json                        # Cấu hình TypeScript & path aliases
└── vite.config.ts                       # Cấu hình Laravel Vite Plugin
```

---

## 6. Yêu cầu hệ thống

Trước khi cài đặt, hãy đảm bảo máy chủ/môi trường phát triển đã cài đặt:
- **PHP**: `>= 8.2` (Khuyến nghị PHP 8.3) với các extensions: `pdo`, `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`.
- **Composer**: `>= 2.2`
- **Node.js**: `>= 18.x` (Khuyến nghị Node.js v20 hoặc v22+) & **npm**: `>= 9.x`
- **Cơ sở dữ liệu**: MySQL `>= 8.0` hoặc MariaDB `>= 10.4`
- *(Tùy chọn nếu chạy Crawler Service)*: **Python**: `>= 3.10`

---

## 7. Hướng dẫn cài đặt

Thực hiện các bước sau để thiết lập dự án trên môi trường cục bộ:

### Bước 1: Sao chép file cấu hình môi trường
```bash
cp .env.example .env
```

### Bước 2: Cài đặt PHP dependencies
```bash
composer install
```

### Bước 3: Tạo Application Key
```bash
php artisan key:generate
```

### Bước 4: Cấu hình cơ sở dữ liệu
Mở file `.env` và cập nhật thông tin kết nối MySQL:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cms_tiktok_crawler
DB_USERNAME=root
DB_PASSWORD=your_password

ADMIN_PATH=admin
VITE_API_URL="${APP_URL}/admin/api"

CRAWLER_SERVICE_URL=http://127.0.0.1:8001
CRAWLER_SERVICE_TOKEN=
```

Tạo cơ sở dữ liệu trong MySQL:
```sql
CREATE DATABASE cms_tiktok_crawler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 5: Chạy Database Migrations
```bash
php artisan migrate
```

### Bước 6: Tạo liên kết Symbolic Link cho Storage
Đảm bảo thư mục lưu avatar có thể truy cập qua HTTP:
```bash
php artisan storage:link
```

### Bước 7: Cài đặt JavaScript/TypeScript dependencies
```bash
npm install
```

---

## 8. Khởi chạy dự án

### Chế độ phát triển với Hot Module Replacement (Vite)

Mở **2 cửa sổ dòng lệnh (Terminal)** riêng biệt:

1. **Terminal 1 - Chạy Laravel Backend API & Web Server**:
   ```bash
   php artisan serve
   ```
   Server sẽ lắng nghe tại: `http://127.0.0.1:8000`

2. **Terminal 2 - Chạy Vite HMR Development Server**:
   ```bash
   npm run dev
   ```
   Vite server sẽ khởi chạy và tự động cập nhật giao diện mỗi khi bạn chỉnh sửa mã nguồn TypeScript/CSS.

3. **Truy cập ứng dụng**:
   Mở trình duyệt và truy cập vào: `http://127.0.0.1:8000/admin`

---

### Cơ chế Build Webpack & Laravel Mix (Chuẩn Ureka - Mặc định Production)

Hệ thống cung cấp cơ chế build frontend thông qua **Webpack 5 & Laravel Mix 6** theo chuẩn kiến trúc module của **Ureka**:
- **Cấu trúc File Output**:
  - Mỗi module sinh ra đúng **2 file**: `public/modules/<Name>/index.js` và `public/modules/<Name>/app.css`.
  - Riêng module `Core` sinh thêm **`public/modules/Core/vendor.js`**: Chứa toàn bộ thư viện dùng chung (`react`, `react-dom`, `antd`, `@ant-design/icons`, `axios`, `@reduxjs/toolkit`, `react-redux`, `dayjs`).
  - Không sinh ra các file chunk `node_modules_*` vụn vặt.
- **Chia sẻ Webpack Runtime Duy Nhất (`runtimeChunk: { name: VENDOR_CHUNK }`)**:
  - Toàn bộ runtime của Webpack và bộ nhớ cache module (`__webpack_module_cache__`) được gom duy nhất vào `public/modules/Core/vendor.js`.
  - Các bundle module (`Core/index.js`, `Crawler/index.js`, `TiktokAccount/index.js`) đều là chunk liên kết vào Webpack runtime chung và chia sẻ cùng một instance React / React Router.
  - Triệt tiêu hoàn toàn lỗi `Minified React error #520` (`TypeError: Cannot read properties of null (reading 'useContext')`) khi nạp nhiều module trên cùng một trang.
- **Manifest `entrypoints.json`**:
  - Tự động tạo và cập nhật cấu trúc file JS/CSS và route prefix của từng module để Blade DOM ra web.
- **Cơ chế Nạp Tự Động Module ra Web (`app.blade.php`) Chuẩn Kiến Trúc Ureka**:
  - Template sử dụng Blade directives `@moduleCss('all')` trong `<head>` và `@moduleJs('all')` trong `<body>`.
  - `ModuleRegistry` tự động quét toàn bộ modules có trong `public/entrypoints.json`:
    - Nạp gói dùng chung Core (`vendor.js`, `Core/index.js`, `Core/app.css`) trước tiên.
    - Tự động nạp toàn bộ các file JS/CSS của các module con (`Crawler/index.js`, `TiktokAccount/index.js`, và bất kỳ module mới nào được build trong tương lai).
    - Bộ nhớ cache (`$dommedJs`, `$dommedCss`) đảm bảo mỗi file chỉ được render 1 lần duy nhất trên DOM.
  - **Lợi ích**:
    - **Không cần cấu hình thủ công**: Khi tạo thêm module mới (như `Report`, `Settings`...), chỉ cần build module, Blade tự động nhận diện và nạp vào trang.
    - **Triệt tiêu hiện tượng load 2 lần**: Toàn bộ trang và menu được đăng ký sẵn vào `window.__CMS_ROUTES_REGISTRY__` ngay khi nạp trang, điều hướng SPA tức thì 0ms, không còn màn hình chờ hay flicker.

| Lệnh npm | Mô tả |
| :--- | :--- |
| `npm run mix` hoặc `npm run mix:all` | Quét và **build toàn bộ modules** (`Core`, `Crawler`, `TiktokAccount`) kèm gói shared vendor (mặc định Production tối ưu minified) |
| `npm run mix:core` | **Chỉ build module Core** (`vendor.js`, `index.js`, `app.css`) |
| `npm run mix:crawler` | **Chỉ build module Crawler** (`public/modules/Crawler/index.js`) |
| `npm run mix:tiktokaccount` | **Chỉ build module TiktokAccount** (`public/modules/TiktokAccount/index.js`) |
| `npm run mix:module <ModuleName>` | **Build tùy chọn một module bất kỳ** (vd: `npm run mix:module Crawler`) |
| `npm run mix:dev` | Build chế độ development khi cần giữ nguyên mã nguồn unminified để inspect |
| `npm run mix:watch` | Theo dõi thay đổi file (file watching) và tự động compile lại |

---

### Khởi chạy Crawler Service (Python Microservice)

Nếu muốn kiểm thử tính năng crawl thực tế, điều hướng vào thư mục crawler và khởi chạy:
```bash
cd ../ProcessData/tiktok-crawler
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
playwright install

# Khởi chạy crawler service
python -m uvicorn app.main:app --port 8001 --reload
```

---

## 9. Danh sách API chính

Dưới đây là tổng hợp các endpoint API chính trong hệ thống:

### Quản lý Crawl Jobs & Crawl Results
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/crawler/crawl-job` (hoặc `/all`) | Lấy danh sách crawl jobs (hỗ trợ phân trang, tìm kiếm & bộ lọc) |
| `GET` | `/admin/api/crawler/crawl-job/{id}` | Lấy chi tiết thông tin một crawl job |
| `POST` | `/admin/api/crawler/crawl-job` (hoặc `/add`) | Tạo mới một crawl job (tính toán `total_accounts`, lưu trực tiếp qua Repo) |
| `PUT` | `/admin/api/crawler/crawl-job/{id}` | Cập nhật crawl job (ràng buộc chỉ cho phép sửa khi job `pending`) |
| `DELETE` | `/admin/api/crawler/crawl-job/{id}` | Xóa crawl job (ràng buộc cấm xóa khi job đang `running`) |
| `POST` | `/admin/api/crawler/crawl-job/{id}/start` | Khởi chạy crawl job (kiểm tra xung đột running, map account và gọi crawler engine) |
| `GET` | `/admin/api/crawler/crawl-job/statistics-summary` | Lấy thống kê KPI tổng quan crawl jobs |
| `GET` | `/admin/api/crawler/crawl-job/{id}/results` | Lấy danh sách kết quả crawl của một job (sub-resource RESTful) |
| `GET` | `/admin/api/crawler/crawl-result` | Lấy danh sách kết quả crawl qua CoreController (hỗ trợ `?crawl_job_id=...`, `?status=...`) |
| `GET` | `/admin/api/crawler/crawl-result/by-job/{job_id}` | Lấy kết quả crawl theo job ID qua CrawlResultController |

### Webhook Callback từ Crawler Service
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/admin/api/public/crawler/crawl-jobs/{jobId}/events` | Webhook nhận kết quả crawl tài khoản và trạng thái hoàn thành từ Python service |

### Quản lý Tài khoản TikTok
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/tiktok-account/tiktok-account/all` | Lấy danh sách tài khoản TikTok |
| `GET` | `/admin/api/tiktok-account/tiktok-account/statistic-summary` | Thống kê tổng quan tài khoản TikTok |
| `GET` | `/admin/api/tiktok-account/tiktok-account/{id}` | Xem chi tiết thông tin hồ sơ tài khoản |
| `PUT` / `POST` | `/admin/api/tiktok-account/tiktok-account/{id}` | Cập nhật thông tin & upload avatar tài khoản |
| `DELETE` | `/admin/api/tiktok-account/tiktok-account/{id}` | Xóa tài khoản TikTok |

### Xác thực CMS & Phân quyền Role/Permission (`AuthController`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/admin/api/core/auth/login` | Đăng nhập hệ thống bằng email & password, cấp Sanctum Bearer Token & ma trận quyền |
| `POST` | `/admin/api/core/auth/logout` | Đăng xuất, hủy bỏ Bearer Token hiện tại và logout session |
| `GET` | `/admin/api/core/auth/me` | Lấy thông tin user đăng nhập hiện tại, vai trò và ma trận quyền hạn module |
| `GET` | `/admin/api/core/auth/permissions` | Lấy danh mục quyền hạn toàn hệ thống phân nhóm theo module |

### Hệ thống Core & Tác vụ dùng chung (`CoreController` & `BaseController`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/core/core/ping` | Kiểm tra trạng thái hoạt động (health check) & môi trường hệ thống |
| `POST` | `/admin/api/core/core/upload` | Tải lên file chung (hỗ trợ chỉ định folder, disk, validate ảnh) |
| `POST` | `/admin/api/core/core/delete-uploaded-file` | Xóa file khỏi storage hệ thống |
| `GET` | `/admin/api/core/core?model={ModelName}` | Truy vấn danh sách bản ghi bất kỳ Model nào (hỗ trợ search, filter cột, sort, phân trang) |
| `POST` | `/admin/api/core/core?model={ModelName}` | Tạo mới bản ghi cho Model chỉ định qua Core |
| `GET` / `PUT` / `DELETE` | `/admin/api/core/core/{id}?model={ModelName}` | Xem, cập nhật, xóa bản ghi Model chỉ định qua Core |

### Dynamic Route Resolver (`Modules\Core\Support\DynamicRouteResovle`)
| Phương thức | Endpoint Pattern | Mô tả |
| :--- | :--- | :--- |
| `ANY` | `/admin/api/{module}/{controller}/{id}/{action}/{parameters?}` | Dispatch custom action kèm ID và params phụ |
| `ANY` | `/admin/api/{module}/{controller}/{action}/{parameters?}` | Dispatch custom action không ID (VD: `all`, `statistics-summary`) |
| `ANY` | `/admin/api/{module}/{controller}/{id}` | RESTful show/update/delete theo HTTP method |
| `ANY` | `/admin/api/{module}/{controller}` | RESTful index/store theo HTTP method |

*Ghi chú: Prefix `/admin` được định cấu hình động tại `modules/Core/configs/admin.php` (`admin_path`) và có thể tùy chỉnh thông qua biến môi trường `ADMIN_PATH=admin` trong `.env`.*

---

## 10. Hệ thống Phân quyền Role & Permission theo Module (View/Edit)

Hệ thống được thiết kế theo mô hình Modular RBAC, cho phép phân quyền chi tiết theo từng module:

### 1. Phân định quyền theo Module (View & Edit)
- **Module Crawler**:
  - `crawler.view`: Quyền xem danh sách, chi tiết job cào, thống kê KPI và bảng kết quả cào.
  - `crawler.edit`: Quyền tạo mới, chỉnh sửa, xóa và kích hoạt khởi chạy cào dữ liệu (`start`).
- **Module TikTok Account**:
  - `tiktok_account.view`: Quyền xem danh sách tài khoản TikTok, chi tiết hồ sơ và lịch sử crawl.
  - `tiktok_account.edit`: Quyền thêm mới, cập nhật hồ sơ, tải lên avatar và xóa tài khoản.
- **Module Core System**:
  - `core.view`: Quyền xem Dashboard KPI, trạng thái hệ thống ping health check.
  - `core.edit`: Quyền tải lên file, xóa file lưu trữ và quản lý cấu hình hệ thống.
- **Module User & Phân quyền**:
  - `user.view`: Quyền xem danh sách người dùng, vai trò (Roles) và quyền hạn (Permissions).
  - `user.edit`: Quyền tạo mới, chỉnh sửa người dùng, phân vai trò và gán quyền trực tiếp.

### 2. Các Vai trò mặc định (Roles)
- **Super Administrator (`admin`)**: Toàn quyền View & Edit trên tất cả các module.
- **Operations Manager (`manager`)**: Quyền View & Edit cho `crawler`, `tiktok_account`, `core`; quyền View cho `user`.
- **Crawler Specialist (`editor`)**: Quyền View & Edit cho `crawler`, `tiktok_account`; quyền View cho `core`.
- **Data Viewer / Guest Auditor (`viewer`)**: Chỉ có quyền View cho `crawler`, `tiktok_account`, `core`; không có quyền Edit.

### 3. Tài khoản Demo có sẵn (Mật khẩu: `password`)
- **Admin**: `admin@cms.com` (Role: `admin`)
- **Manager**: `manager@cms.com` (Role: `manager`)
- **Editor**: `editor@cms.com` (Role: `editor`)
- **Viewer**: `viewer@cms.com` (Role: `viewer`)

### 4. Middleware Phân quyền Route
Sử dụng middleware `module.permission:{module},{action}` trong khai báo route hoặc controller:
```php
// Ví dụ bảo vệ route chỉnh sửa crawler
Route::post('/crawler/job/create', [CrawlJobController::class, 'store'])
    ->middleware('module.permission:crawler,edit');

// Ví dụ bảo vệ route xem tài khoản TikTok
Route::get('/tiktok-account/list', [TiktokAccountController::class, 'index'])
    ->middleware('module.permission:tiktok_account,view');
```

## 11. Kiểm thử & Kiểm tra chất lượng

### 1. Kiểm tra biên dịch TypeScript
Kiểm tra tính đúng đắn của toàn bộ kiểu dữ liệu tĩnh:
```bash
node ./node_modules/typescript/bin/tsc --noEmit
```
*(Yêu cầu: Kết quả trả về mã lỗi 0, 0 errors, 0 warnings).*

### 2. Biên dịch Production Bundle (Laravel Mix / Webpack 5)
Đóng gói toàn bộ modules chuẩn Ureka theo định dạng minified nhẹ nhất:
```bash
npm run mix
```
*(Kết quả: Core `index.js` ~40 KiB, vendor bundle ~1.36 MiB, modules ~65-71 KiB, `entrypoints.json` được sinh tự động).*

### 3. Kiểm thử tự động Backend (PHP Artisan Test / Pest)
Chạy bộ test suite của Laravel (bao gồm Feature Tests cho Dynamic Routes, CORS preflight/headers, Web SPA routes, Root redirect, CoreController ping/upload/delete, BaseController 5 RESTful actions, keyword search, column filtering, sorting, pagination, Scoped DOM manifest reading, duplicate prevention cache, Authentication, và Module-based RBAC View/Edit partitioning):
```bash
php artisan test
```
*(51 tests passed 100%, 228 assertions).*

### 4. Kiểm tra danh sách Route
Xác nhận toàn bộ routes của các module đã được đăng ký chính xác bắt đầu bằng prefix admin:
```bash
php artisan route:list
```

---

## 📝 Quy chuẩn đóng góp mã nguồn (Coding Conventions)

1. **Frontend**:
   - Mọi file logic hoặc UI đều phải dùng TypeScript (`.ts`, `.tsx`). Tuyệt đối không dùng `.js` hay `.jsx` trong thư mục `modules/*/resources/js/`.
   - **Ngôn ngữ Web & Chú thích (Rule 9)**: Toàn bộ văn bản hiển thị trên giao diện web (tiêu đề, nhãn, nút bấm, thông báo, placeholder, validate form) và chú thích trong code đều phải sử dụng **tiếng Anh 100%**.
   - **Chú thích Endpoint API (Rule 9)**: Mọi hàm gọi API trong `Action/` phải được viết comment mô tả cú pháp endpoint rõ ràng, ví dụ: `API: GET /crawler/crawl-job/{id}`.
   - **Layout Danh Sách Chuẩn Hóa (`ListLayout`)**: Sử dụng `<ListLayout>` từ `@core/components/ListLayout` cho toàn bộ các trang danh sách (tích hợp PageHeader, thanh tìm kiếm từ khóa, bộ lọc đa trường, thao tác hàng loạt và TableComponent).
   - **Tái sử dụng Component dùng chung (`@core/components`)**: Tuyệt đối không tạo mới hoặc bọc thêm wrapper không cần thiết nếu đã có component dùng chung:
     - `TableComponent`: Bảng dữ liệu chính, tùy biến cột qua `renderColumns`. Không tạo thêm component bọc bảng thừa (`CrawlJobListTable`, `TiktokAccountTableList` đã được xóa bỏ để gọi trực tiếp `ListLayout`).
     - `PageHeader`: Tiêu đề trang chuẩn hóa kèm `onBack`, `subtitle`, `breadcrumbs`, `extra`. Không tự dựng tiêu đề bằng `<Space><Title><Text>`.
     - `CardKPI`: Hiển thị chỉ số thống kê, tiến độ và icon trực quan.
     - `StatusTag`: Hiển thị nhãn trạng thái thống nhất cho toàn bộ modules.
     - `ConfirmDialog`: Hộp thoại xác nhận thao tác quan trọng/nguy hiểm.
     - `SpinComponent`: Trạng thái đang tải dữ liệu / Suspense fallback.
     - `EmptyState`: Trạng thái danh sách rỗng kèm nút hành động.
   - **Cột Thao Tác Bảng (Action Column)**: Luôn ghim cố định bên phải (`fixed: 'right'`, kèm chiều rộng chuẩn `width: 120`, `title: ''`). Các thao tác hiển thị dưới dạng nút Icon Ant Design kèm Tooltip (`EyeOutlined` xem chi tiết, `EditOutlined` chỉnh sửa, `DeleteOutlined` xóa an toàn với `Popconfirm`) thay vì dùng chữ link thô.
   - **Đồng Bộ Dữ Liệu & Giao Diện Các Module**: Các trang quản lý danh sách (`CrawlJobsPage`, `TiktokAccountPage`) phải duy trì sự đồng bộ tuyệt đối về cấu trúc `ListLayout` (`cardTitle`, `onAdd`, `onResetFilters`, `filters`), cột `ID` (sorter, `width: 80`), định dạng số (`formatNumber`) và thời gian (`formatDateTime`), cùng quy ước phân trang mặc định `per_page: 10`.
   - Mọi lời gọi HTTP API phải đi qua các hàm định kiểu trong thư mục `Action/` của module tương ứng.

   - Luôn sử dụng typed hooks từ `@core/store`: `useDispatch`, `useSelector`, `useAppDispatch`, `useAppSelector`.
2. **Backend**:
   - Tất cả class PHP của module phải nằm trong thư mục `modules/<ModuleName>/src/`.
   - Giữ nguyên kiến trúc phân lớp: Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Model.
   - Đảm bảo tuân thủ chuẩn PSR-12 và PSR-4.

---

## 📄 Bản quyền (License)

Dự án được phát triển nội bộ bởi **Ureka Media**. Mọi quyền được bảo lưu.
