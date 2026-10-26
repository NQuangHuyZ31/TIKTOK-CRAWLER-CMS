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
   - **Giao Diện Responsive Đa Nền Tảng (`LayoutContext` & `Sidebar`)**: Tự động nhận diện thiết bị (`isMobile < 992px`), sử dụng thuần túy Ant Design `<Layout.Sider>` với chế độ thu gọn icon-only (64px) trên mobile không mở modal/drawer phức tạp, hỗ trợ mở rộng (240px) $\leftrightarrow$ thu gọn (64px) mượt mà qua nút toggle tại Header và chân Sidebar.
   - **Đồng Bộ Toàn Bộ Form Chiếm Trọn 100% Không Gian Nội Dung**: Xóa bỏ hoàn toàn giới hạn cố định hẹp ở giữa màn hình (`maxWidth: 960` và `maxWidth: 1100`), đưa [`UserFormPage`](modules/User/resources/js/pages/UserFormPage.tsx), [`ProfilePage`](modules/Auth/resources/js/pages/ProfilePage.tsx) và [`UserDetailPage`](modules/User/resources/js/pages/UserDetailPage.tsx) về chuẩn 100% chiều rộng nội dung đồng bộ cùng `CrawlJobFormPage`, `TiktokAccountEditPage` và `ListLayout`.
   - **Hệ Thống Icon Sidebar Chuyên Biệt**: Tự động phân giải fallback icon theo từ khóa route (`resolveMenuIcon`), gán icon `VideoCameraOutlined` chuyên biệt cho TikTok Accounts, phân biệt rõ ràng với Users (`TeamOutlined`).
   - **Tối Ưu Hóa Hook Điều Hướng & Trạng Thái Người Dùng**:
     - Bổ sung hook `useCurrentUser()` dùng chung tại `@core/hooks` loại bỏ trùng lặp logic user/role/logout giữa `Header` và `Sidebar`.
     - Bổ sung hook `useCurrentRoute()` tra cứu trực tiếp route hiện tại cho `Header` mà không cần re-build toàn bộ cây menu phân cấp `useMenuRoutes()`.
     - Tối ưu hóa `Sidebar`: Tận dụng cây menu đã build từ `useMenuRoutes()`, chuyển đổi quyền và Ant Design items trong một pass duy nhất, triệt tiêu double tree build.
   - **Điều hướng Sidebar theo Route Registration Tự Động**:
     - **Core hoàn toàn độc lập**: `Core` chỉ sở hữu router và layout, hoàn toàn không cần duy trì danh sách page, menu hay đường dẫn của các module con (`Core has no list of pages, menu entries or paths to maintain`).
     - **Tự động đăng ký qua từng Module**: Mỗi module (`Crawler`, `TiktokAccount`...) tự đăng ký page và menu item của mình khi script thực thi thông qua `registerRoute(def)`. Danh sách route được lưu và duy trì tập trung trên `window.__CMS_ROUTES_REGISTRY__`.
     - **Không còn hiện tượng load 2 lần**: Loại bỏ hoàn toàn component tạm `createModuleLoader` và script injection thủ công lúc runtime. Trình duyệt nạp sẵn các bundle module (~180 KiB tổng cộng), chuyển trang SPA tức thì (0ms trễ, không chớp giật spinner).

10. **ResourceForm Dùng Chung & Chuẩn Hóa Route (`/create` & `/:id/edit`)**:
    - **Component Dùng Chung Lõi (`@core/components/ResourceForm`)**: Cung cấp form chuẩn hóa thống nhất cho toàn bộ modules cả ở thao tác Thêm mới lẫn Chỉnh sửa.
    - **Bảo toàn chuẩn Route RESTful**:
      - `/create`: Tự động nhận diện chế độ Thêm mới (`isEdit = false`, `id = undefined`), gọi hàm submit `onCreate(values)`.
      - `/:id/edit` (ví dụ `/1/edit`): Tự động nhận diện chế độ Chỉnh sửa (`isEdit = true`, `id = '1'`), tự động gọi `fetchRecord(id)` nạp initial values và submit `onUpdate(id, values, record)`.
      - Tự động bỏ qua chuỗi literal `"create"` khi bị pattern route tham lam bắt (`id !== 'create'`).
      - Hỗ trợ prop ghi đè tường minh: `isEdit?: boolean` và `id?: string | number`.
      - Tự động điều hướng về `redirectUrl` hoặc fallback về `backUrl` sau khi hoàn tất.
    - **Áp dụng đồng bộ**:
      - `Crawler`: `/crawler/crawl-job/create` (tạo job) và `/crawler/crawl-job/:id/edit` (sửa job).
      - `TiktokAccount`: `/tiktok-account/create` và `/tiktok-account/:id/edit`.
      - `User`: `/user/create` và `/user/:id/edit`.

11. **Nền tảng RESTful Controller Dùng Chung (`BaseController` & `CoreController`)**:
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
      - **Đồng bộ kế thừa `BaseController`**: Tận dụng pipeline RESTful listing (`index`), xem chi tiết (`show`), tìm kiếm từ khóa, bộ lọc động và biến đổi qua API Resource (`CrawlJobResource`, `CrawlResultResource`).
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
│   │   │   └── migrations/              # Core thuần infrastructure (tự động nạp migrations từ các module)
│   │   ├── resources/
│   │   │   ├── css/app.css              # Global Tailwind & Ant Design Reset styles
│   │   │   ├── js/
│   │   │   │   ├── Action/api.ts        # Central API Client (strict .env baseURL)
│   │   │   │   ├── components/          # CardKPI, Table, CustomModal, Spin, StatusTag, UploadComponent, ResourceForm...
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
│   ├── Auth/                            # Module Xác thực & Quản lý Phiên Đăng Nhập
│   │   ├── database/migrations/         # personal_access_tokens (Sanctum tokens)
│   │   ├── resources/js/                # LoginPage, ProfilePage, ChangePasswordModal...
│   │   ├── routes/api.php               # Hướng dẫn API xác thực
│   │   └── src/                         # AuthController, AuthService, TokenRepository...
│   ├── User/                            # Module Quản lý Người Dùng
│   │   ├── database/migrations/         # users, password_reset_tokens, sessions
│   │   ├── resources/js/                # UserListPage, UserDetailPage, UserFormPage...
│   │   └── src/                         # UserController, UserRepository, UserService...
│   ├── Permission/                      # Module Quản lý Quyền Hạn
│   │   ├── database/migrations/         # permissions
│   │   ├── resources/js/                # PermissionMatrix...
│   │   └── src/                         # PermissionController, PermissionRepository...
│   ├── Role/                            # Module Quản lý Vai Trò & Bảng Pivot Phân Quyền
│   │   ├── database/migrations/         # roles, role_permissions, user_roles, user_permissions
│   │   ├── resources/js/                # RolesPage, RoleFormModal, RoleTableList...
│   │   └── src/                         # RoleController, RoleRepository...
│   ├── Crawler/                         # Module Quản lý Crawl Jobs
│   │   ├── database/
│   │   │   ├── migrations/              # crawl_jobs, crawl_results
│   │   │   └── seeders/                 # CrawlJobSeeder
│   │   ├── resources/js/
│   │   │   ├── Action/                  # crawlJob.ts (API calls)
│   │   │   ├── components/              # CrawlJobListTable, CrawlResultTable...
│   │   │   ├── configs/tableConfig.ts   # Cấu hình bảng dữ liệu
│   │   │   ├── pages/                   # CrawlJobsPage, CrawlJobDetailPage, CrawlJobFormPage (Create & Edit)
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
│       │   ├── components/              # TiktokAccountTableList, DeleteAccount...
│       │   ├── configs/columnConfig.ts  # Cấu hình cột hiển thị & bộ lọc
│       │   ├── pages/                   # TiktokAccountPage, DetailPage, EditPage
│       │   ├── routes/route.ts          # Route definitions cho TiktokAccount
│       │   └── store/                   # tiktokAccountSlice.ts, tiktokAccountThunks.ts
│       ├── routes/api.php               # API endpoints cho TikTok Accounts
│       └── src/                         # Controllers, Models, Repositories, Services, Providers...
│   ├── System/                          # Module Cấu hình Thông số & Chẩn đoán Hệ thống
│   │   ├── database/migrations/         # system_settings
│   │   ├── resources/js/                # SystemSettingsPage.tsx, settingsConfig.ts, Action/systemSetting.ts
│   │   ├── routes/api.php               # API cấu hình hệ thống
│   │   └── src/                         # SystemSettingController, SystemSetting model, Repository, Service
├── public/
│   ├── entrypoints.json                 # Manifest ánh xạ bundle JS/CSS cho từng module
│   ├── modules/                         # Output bundle chuẩn Ureka (Không copy file)
│   │   ├── Core/
│   │   │   ├── vendor.js                # Shared vendor bundle duy nhất (React, Antd, Axios, Redux...)
│   │   │   ├── index.js                 # Core code bundle
│   │   │   └── app.css                  # Core CSS bundle
│   │   ├── Crawler/
│   │   │   └── index.js                 # Crawler code bundle
│   │   ├── TiktokAccount/
│   │   │   └── index.js                 # TiktokAccount code bundle
│   │   └── System/
│   │       └── index.js                 # System code bundle (~57 KiB)
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
| `npm run mix` hoặc `npm run mix:all` | Quét và **build toàn bộ 8 modules** (`Core`, `Crawler`, `TiktokAccount`, `Auth`, `System`, `Role`, `Permission`, `User`) kèm gói shared vendor (mặc định Production tối ưu minified) |
| `npm run mix:core` | **Chỉ build module Core** (`vendor.js`, `index.js`, `app.css`) |
| `npm run mix:crawler` | **Chỉ build module Crawler** (`public/modules/Crawler/index.js`) |
| `npm run mix:tiktokaccount` | **Chỉ build module TiktokAccount** (`public/modules/TiktokAccount/index.js`) |
| `npm run mix:auth` | **Chỉ build module Auth** (`public/modules/Auth/index.js`) |
| `npm run mix:user` | **Chỉ build module User** (`public/modules/User/index.js`) |
| `npm run mix:system` | **Chỉ build module System** (`public/modules/System/index.js`) |
| `npm run mix:role` | **Chỉ build module Role** (`public/modules/Role/index.js`) |
| `npm run mix:permission` | **Chỉ build module Permission** (`public/modules/Permission/index.js`) |
| `npm run mix:module <ModuleName>` | **Build tùy chọn một module bất kỳ** (vd: `npm run mix:module User`) |
| `npm run mix:prod` | Build toàn bộ các modules ở chế độ production |
| `npm run mix:watch` | Theo dõi thay đổi file (file watching) và tự động compile lại |
| `npm run check-types` | Kiểm tra toàn diện kiểu dữ liệu TypeScript (`tsc --noEmit`) |

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

### Quản lý Tài khoản TikTok (`TiktokAccountController`)
| Phương thức | Endpoint | Mô tả | Quyền hạn yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/api/tiktok-account/tiktok-account` | Lấy danh sách tài khoản TikTok (hỗ trợ search username/nickname/bio, filter status, sort, phân trang) | `tiktok_account.view` hoặc `admin` |
| `GET` | `/admin/api/tiktok-account/tiktok-account/statistic-summary` | Thống kê tổng quan tài khoản TikTok (total, active, inactive, followers, likes) | `tiktok_account.view` hoặc `admin` |
| `GET` | `/admin/api/tiktok-account/tiktok-account/{id}` | Xem chi tiết thông tin hồ sơ tài khoản | `tiktok_account.view` hoặc `admin` |
| `POST` | `/admin/api/tiktok-account/tiktok-account` | Tạo mới tài khoản TikTok (tự động điền profile_url, upload avatar) | `tiktok_account.create` hoặc `admin` |
| `PUT` / `POST` | `/admin/api/tiktok-account/tiktok-account/{id}` | Cập nhật thông tin & upload avatar tài khoản | `tiktok_account.edit` hoặc `admin` |
| `PATCH` | `/admin/api/tiktok-account/tiktok-account/{id}/status` | Cập nhật nhanh trạng thái tài khoản (`active`, `inactive`, `banned`) | `tiktok_account.edit` hoặc `admin` |
| `GET` | `/admin/api/tiktok-account/tiktok-account/{id}/results` | Lấy lịch sử cào dữ liệu phân trang của tài khoản | `tiktok_account.view` hoặc `admin` |
| `DELETE` | `/admin/api/tiktok-account/tiktok-account/{id}` | Xóa mềm tài khoản TikTok | `tiktok_account.delete` hoặc `admin` |

### Quản lý Người dùng & Phân quyền Module User (`UserController`)
| Phương thức | Endpoint | Mô tả | Quyền hạn yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/api/user/users` | Lấy danh sách tài khoản (hỗ trợ search, filter status/role, sort, phân trang) | `user.view` hoặc `admin` |
| `GET` | `/admin/api/user/users/statistics-summary` | Thống kê KPI tổng quan người dùng (tổng số, active, inactive, blocked, roles) | `user.view` hoặc `admin` |
| `GET` | `/admin/api/user/users/roles-and-permissions` | Lấy danh mục tất cả vai trò & quyền hạn hệ thống phân theo module | `user.view` hoặc `admin` |
| `GET` | `/admin/api/user/users/{id}` | Xem chi tiết thông tin hồ sơ tài khoản, vai trò và ma trận quyền module | `user.view` hoặc `admin` |
| `POST` | `/admin/api/user/users` | Tạo mới tài khoản người dùng, băm mật khẩu và phân vai trò/quyền | `user.edit` hoặc `admin` |
| `PUT` / `PATCH` | `/admin/api/user/users/{id}` | Cập nhật thông tin tài khoản, đổi mật khẩu và cập nhật vai trò | `user.edit` hoặc `admin` |
| `DELETE` | `/admin/api/user/users/{id}` | Xóa mềm tài khoản (chặn xóa chính mình và chặn xóa admin cuối cùng) | `user.edit` hoặc `admin` |
| `PATCH` / `POST` | `/admin/api/user/users/{id}/status` | Cập nhật nhanh trạng thái tài khoản (`active`, `inactive`, `blocked`) | `user.edit` hoặc `admin` |

### Xác thực CMS & Quản lý Phiên Người Dùng (`AuthController` - Tự Động Định Tuyến Động)
| Phương thức | Endpoint | Mô tả | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/api/auth/login` | Đăng nhập hệ thống bằng email & password, cấp Sanctum Bearer Token | Public |
| `POST` | `/admin/api/auth/logout` | Đăng xuất, thu hồi Bearer Token hiện tại và xóa phiên làm việc | Bearer Token |
| `GET` | `/admin/api/auth/me` | **Endpoint duy nhất** lấy toàn bộ thông tin tài khoản, danh sách vai trò (`roles`), quyền hạn (`permissions`) và ma trận phân quyền module (`module_permissions`) | Bearer Token |
| `POST` | `/admin/api/auth/forgot-password` | Gửi yêu cầu cấp reset token đặt lại mật khẩu qua email | Public |
| `POST` | `/admin/api/auth/reset-password` | Đặt lại mật khẩu mới bằng reset token | Public |
| `POST` | `/admin/api/auth/change-password` | Đổi mật khẩu tài khoản đang đăng nhập | Bearer Token |
| `PUT` | `/admin/api/auth/profile` | Cập nhật hồ sơ cá nhân (họ tên, số điện thoại, avatar) | Bearer Token |
| `GET` | `/admin/api/auth/login-logs` | Lấy lịch sử log đăng nhập phân trang (IP, thiết bị, trạng thái thành công/thất bại, lý do) | Bearer Token |

*(Lưu ý về Định tuyến: Module `Auth` hoàn toàn **không cần khai báo route tĩnh** trong `modules/Auth/routes/api.php` vì toàn bộ các endpoint trên đều được `DynamicRouteResovle` của `Core` tự động phát hiện và dispatch vào `AuthController@{action}`. Đồng thời, `GET /admin/api/auth/me` là route duy nhất và toàn diện nhất cung cấp thông tin profile kèm quyền hạn phân quyền, không cần các route permission riêng lẻ trong module Auth. Danh mục quản lý phân quyền toàn hệ thống được phụ trách độc lập bởi module `Permission` và `Role`).*

### Hệ thống Core & Tác vụ dùng chung (`CoreController` & `BaseController`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/core/core/ping` | Kiểm tra trạng thái hoạt động (health check) & môi trường hệ thống |
| `POST` | `/admin/api/core/core/upload` | Tải lên file chung (hỗ trợ chỉ định folder, disk, validate ảnh) |
| `POST` | `/admin/api/core/core/delete-uploaded-file` | Xóa file khỏi storage hệ thống |
| `GET` | `/admin/api/core/core?model={ModelName}` | Truy vấn danh sách bản ghi bất kỳ Model nào (hỗ trợ search, filter cột, sort, phân trang) |
| `POST` | `/admin/api/core/core?model={ModelName}` | Tạo mới bản ghi cho Model chỉ định qua Core |
| `GET` / `PUT` / `DELETE` | `/admin/api/core/core/{id}?model={ModelName}` | Xem, cập nhật, xóa bản ghi Model chỉ định qua Core |

### Quản lý Vai trò, Phân quyền & Cấu hình Hệ thống (`RoleController`, `PermissionController`, `SystemSettingController`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/system/role` | Lấy danh sách vai trò hệ thống (hỗ trợ phân trang, tìm kiếm) |
| `GET` | `/admin/api/system/role/{id}` | Lấy chi tiết vai trò và danh sách quyền hạn đã gán |
| `POST` | `/admin/api/system/role` | Tạo mới vai trò và gán quyền hạn |
| `PUT` | `/admin/api/system/role/{id}` | Cập nhật tên, mô tả và đồng bộ quyền hạn của vai trò |
| `DELETE` | `/admin/api/system/role/{id}` | Xóa vai trò (có cơ chế bảo vệ chống xóa role `admin`) |
| `GET` | `/admin/api/system/role/permissions` | Lấy danh mục tất cả quyền hạn có sẵn phân nhóm theo module |
| `GET` | `/admin/api/system/permission` | Danh sách toàn bộ permissions trong hệ thống |
| `GET` | `/admin/api/system/permission/modules` | Lấy permissions nhóm theo module |
| `GET` | `/admin/api/system/system-setting` | Lấy danh sách cấu hình hệ thống (hoặc `?grouped=true`) |
| `GET` | `/admin/api/system/system-setting/group/{group}` | Lấy cấu hình theo nhóm (`general`, `crawler`, `security`) |
| `POST` | `/admin/api/system/system-setting/batch-update` | Cập nhật hàng loạt các tham số cấu hình |
| `GET` | `/admin/api/system/system-setting/info` | Kiểm tra thông số chẩn đoán runtime môi trường máy chủ |

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
*(78 tests passed 100%, 358 assertions).*

### 4. Kiểm tra danh sách Route
Xác nhận toàn bộ routes của các module đã được đăng ký chính xác bắt đầu bằng prefix admin:
```bash
php artisan route:list
```

### 5. Cơ chế Bảo vệ Route & Chặn Truy Cập Khi Bị Cấm (Strict RBAC Route Guarding)
- **Tự động nhận diện quyền theo Route**: `AuthGuard` tự động phân tích `pathname` để kiểm tra quyền module (`view` hoặc `edit`) dựa trên ma trận `module_permissions` của người dùng.
- **Chặn truy cập tuyệt đối**: Khi người dùng không có quyền truy cập, hệ thống lập tức chặn không cho mount component trang con, không gửi request API tới backend và hiển thị màn hình Ant Design `<Result status="403" ... />` cùng nút quay lại Dashboard.
- **Bảo vệ hai lớp**: Tất cả các trang quản trị (`UserListPage`, `UserFormPage`, `UserDetailPage`) đều tích hợp xử lý trả về sớm trang 403 nếu nhận phản hồi Forbidden từ API, tuyệt đối không hiển thị khung layout hoặc thao tác chức năng của trang bị cấm.

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
     - `UploadComponent`: Thành phần tải file dùng chung chuẩn hóa, hỗ trợ 4 chế độ (`avatar`, `dragger`, `button`, `picture-card`), tích hợp thẩm định dung lượng, định dạng MIME và modal xem trước.
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
