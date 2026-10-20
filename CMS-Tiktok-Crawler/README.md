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

2. **Laravel Blade Shell (Không dùng `index.html` độc lập)**:
   - Thay thế hoàn toàn file HTML tĩnh bằng template Blade chuẩn Laravel: [`resources/views/app.blade.php`](resources/views/app.blade.php).
   - Tích hợp trực tiếp Vite qua `@viteReactRefresh` và `@vite(['resources/css/app.css', 'resources/js/app.tsx'])`.
   - Cơ chế SPA Catch-all Route tại `routes/web.php` hỗ trợ React Router điều hướng mượt mà và bảo mật CSRF Token tự động.

3. **Cấu trúc Module Backend & Route Discovery Chuẩn Ureka**:
   - Mã nguồn PHP của mỗi module đặt gọn gàng trong `Modules/<ModuleName>/src/` (Controllers, Models, Repositories, Services, Requests, Resources, Providers).
   - Route API phân tách riêng biệt tại `Modules/<ModuleName>/routes/api.php`.
   - **Xử lý Route tự động & Dynamic Routing qua Core**: Core sở hữu `ModuleRegistry` và `CoreServiceProvider` tự động phát hiện module và nạp route. Toàn bộ cơ chế dynamic routing được đóng gói trong class [`Modules\Core\Support\DynamicRouteResovle`](modules/Core/src/Support/DynamicRouteResovle.php) và kết nối qua [`modules/Core/routes/api.php`](modules/Core/routes/api.php) (tự động phân giải controller, ánh xạ action alias, inject dependency và parameter) xử lý tất cả mẫu route RESTful và custom action (`/{module}/{controller}/{id}/{action}`, `/{module}/{controller}/{action}`, `/{module}/{controller}/{id}`, `/{module}/{controller}`, `/public/...`). Tuyệt đối không đăng ký route cứng bên ngoài module tại `routes/api.php`.
   - Composer PSR-4 tự động ánh xạ class namespace chuẩn xác.

4. **Cấu trúc Module Frontend Đồng Bộ**:
   - Mỗi module frontend đặt tại `Modules/<ModuleName>/resources/js/` bao gồm:
     - `Action/`: Các hàm gọi API có định kiểu (Typed API Clients).
     - `components/`: Thành phần giao diện tái sử dụng.
     - `pages/`: Các trang tính năng.
     - `routes/`: Cấu hình route con của module.
     - `store/`: Redux slice và thunk tương ứng.

5. **Central Core API Client**:
   - Triển khai tại [`Modules/Core/resources/js/Action/api.ts`](Modules/Core/resources/js/Action/api.ts) theo kiến trúc Ureka.
   - Tự động lấy CSRF token từ thẻ `<meta name="csrf-token">`, gắn header `X-Requested-With: XMLHttpRequest`.
   - Xử lý lỗi tập trung với class `ApiError` chuẩn hóa thông báo lỗi từ server.

6. **Typed State Management**:
   - Quản trị state bằng Redux Toolkit với các hook định kiểu sẵn [`Modules/Core/resources/js/store/index.ts`](Modules/Core/resources/js/store/index.ts): `useAppDispatch`, `useAppSelector`, `useDispatch`, `useSelector`.

7. **TableComponent Dùng Chung Thuần Túy (`@core/components/Table`)**:
   - Thành phần bảng dữ liệu dùng chung thuần túy, chỉ chứa logic chung (phân trang, thêm cột, render cột tùy biến).
   - **Tách biệt nghiệp vụ**: Không nhét component giao diện riêng (như Tag, Avatar, Action) vào lõi bảng, các thành phần này được tự do render tại điểm sử dụng thông qua prop `renderColumns`.
   - **Thêm cột**: Hỗ trợ `prependColumns` (đầu bảng như STT, checkbox) và `extraColumns`/`appendColumns` (cuối bảng như Action).
   - **Cấu hình chuẩn**: Sử dụng column config Ant Design tiêu chuẩn, sạch sẽ và dễ bảo trì.
   - Đã áp dụng tinh giản toàn bộ các bảng `CrawlJobListTable`, `TiktokAccountTableList` và `CrawlResultTable`.

8. **Cơ chế Route Registry & AdminLayout Chuẩn React Router v6**:
   - **`AdminLayout`**: Cấu hình theo mô hình Layout Route chuẩn (`<Route element={<AdminLayout />}>`), các route chức năng con hiển thị qua `<Outlet />` giúp tránh re-mount layout không cần thiết khi chuyển trang.
   - **Điều hướng Sidebar theo Route Registration**: Sidebar loại bỏ cấu hình menu tĩnh (`menuConfig`), tự động đồng bộ danh sách menu từ Route Registry thông qua hook `useMenuRoutes()` dựa trên các trường metadata của route (`label`, `icon`, `order`).

8. **Nền tảng RESTful Controller Dùng Chung (`BaseController` & `CoreController`)**:
   - **`BaseController`**: Cung cấp sẵn 5 hành vi chuẩn RESTful (`index`, `show`, `store`, `update`, `destroy`), tích hợp pipeline tìm kiếm toàn văn (`?search=...`), lọc theo cột động (lọc số `_min`/`_max`/`_gte`/`_lte`/`1000..5000`, lọc ngày `_from`/`_to`, `whereIn`, wildcards), sắp xếp mặc định theo cấu hình `$defaultSort` (ví dụ: `['id', 'desc']` hoặc `['created_at', 'desc']`), phân trang và hỗ trợ tắt phân trang (`pagination=false`). Các tính năng tìm kiếm và lọc chỉ thực thi khi được khai báo tường minh (`$searchableColumns`, `$filterableColumns`).
   - **`CoreController`**: Controller cụ thể kế thừa `BaseController` xử lý các tác vụ hệ thống dùng chung (`ping`, tải lên file `upload`, xóa file `delete-uploaded-file`), đồng thời hỗ trợ truy vấn RESTful CRUD trực tiếp cho bất kỳ Model nào thông qua tham số `?model=...`.

---

## 3. Tính năng chính

### 🔄 Quản lý Crawl Jobs (`Modules/Crawler`)
- **Tạo job thu thập linh hoạt**: Hỗ trợ 4 nguồn đầu vào:
  1. *Usernames*: Nhập danh sách username TikTok (mỗi dòng một username).
  2. *URLs*: Nhập danh sách đường dẫn trang cá nhân TikTok.
  3. *Database*: Chọn các tài khoản có sẵn trong cơ sở dữ liệu hệ thống.
  4. *Count*: Thu thập tự động theo số lượng chỉ định.
- **Bảng điều khiển KPI**: Tổng số jobs, jobs hoàn thành, jobs thất bại, tổng số tài khoản đã crawl.
- **Danh sách & Bộ lọc**: Tìm kiếm, sắp xếp, phân trang và xem chi tiết tiến độ từng job.
- **Chi tiết Job**: Theo dõi kết quả từng tài khoản (avatar, trạng thái, thời gian chạy, log lỗi nếu có).
- **Thao tác nhanh**: Khởi chạy lại job (Start Job), xóa job khỏi hệ thống.

### 👥 Quản lý Tài khoản TikTok (`Modules/TiktokAccount`)
- **Danh sách tài khoản**: Bảng dữ liệu hiển thị avatar, username, số lượng followers, following, likes, trạng thái (`active` / `inactive`).
- **Tìm kiếm & Sắp xếp**: Sắp xếp đa tiêu chí theo followers, likes, trạng thái; lọc theo từ khóa.
- **Chi tiết hồ sơ**: Xem đầy đủ thông tin cá nhân và lịch sử crawl dữ liệu liên quan của tài khoản.
- **Chỉnh sửa & Tải lên Avatar**: Cập nhật thông tin tài khoản, tải lên avatar mới (tự động lưu vào storage cục bộ).
- **Xóa tài khoản**: Hỗ trợ xóa tài khoản khỏi cơ sở dữ liệu.

### 🌐 Webhook & Tích hợp Microservice (`Modules/API` & `ProcessData`)
- Tiếp nhận sự kiện webhook bất đồng bộ từ Python Crawler Service qua endpoint:
  `POST /api/public/crawler/crawl-jobs/{jobId}/events`
- Tự động lưu trữ avatar vào: `storage/app/public/tiktok-accounts/avatars/`.
- Cập nhật thời gian thực kết quả crawl vào bảng `crawl_results` và cập nhật thông số tài khoản vào bảng `tiktok_accounts`.

---

## 4. Công nghệ sử dụng

| Lĩnh vực | Công nghệ | Phiên bản / Mô tả |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel | v11 / v12 (PHP 8.2+) |
| **Kiến trúc Module** | PSR-4 Modules | `Modules/*/src/` & `Modules/*/routes/` |
| **Frontend Framework** | React | v18 |
| **Ngôn ngữ Frontend** | TypeScript | v5.8+ (Strict Type Checking) |
| **UI Component Library** | Ant Design | v5.x |
| **Styling** | Tailwind CSS + CSS Modules | v4.x |
| **Build Tool & Bundler** | Vite (via Laravel Vite Plugin) | v8.x |
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
│   └── migrations/                      # Database Schema Migrations (tiktok_accounts, crawl_jobs, crawl_results...)
├── Modules/                             # Tầng Module nghiệp vụ (Kiến trúc Ureka)
│   ├── API/                             # Module API công khai / Webhook
│   │   ├── routes/api.php               # Route webhook callback từ crawler
│   │   └── src/Controllers/, Requests/
│   ├── Core/                            # Module lõi dùng chung
│   │   ├── resources/js/
│   │   │   ├── Action/api.ts            # Central API Client (CSRF, ApiError, Typed HTTP methods)
│   │   │   ├── components/              # CardKPI, Table, CustomModal, Spin, StatusTag...
│   │   │   ├── layouts/                 # AdminLayout, Header, Sidebar
│   │   │   ├── pages/                   # DashboardPage, NotFoundPage
│   │   │   ├── store/index.ts          # Root Redux Store & Typed Hooks (useAppDispatch, useAppSelector)
│   │   │   └── utils/                   # formatCurrency, validation helpers
│   │   ├── routes/api.php               # Dynamic Module Controller routes
│   │   └── src/Controllers/, Middleware/, Providers/, Repositories/, Support/, Traits/, Utils/
│   ├── Crawler/                         # Module Quản lý Crawl Jobs
│   │   ├── resources/js/
│   │   │   ├── Action/                  # crawlJob.ts, crawlResult.ts (API calls)
│   │   │   ├── components/              # CrawlJobListTable, StatisticSummary, DeleteCrawlJobButton...
│   │   │   ├── configs/tableConfig.ts   # Cấu hình bảng dữ liệu
│   │   │   ├── pages/                   # CrawlJobsPage, CrawlJobDetailPage, Create, Edit
│   │   │   ├── routes/route.ts          # Route definitions cho Crawler
│   │   │   └── store/                   # crawlJobSlice.ts, crawlJobThunks.ts...
│   │   ├── routes/api.php               # API endpoints cho Crawler (/api/crawlers/...)
│   │   └── src/                         # Controllers, Models, Repositories, Services, Requests...
│   └── TiktokAccount/                   # Module Quản lý Tài khoản TikTok
│       ├── resources/js/
│       │   ├── Action/tiktokAccount.ts  # API calls cho tài khoản TikTok
│       │   ├── components/              # TiktokAccountTableList, AvatarUpload, DeleteAccount...
│       │   ├── configs/columnConfig.ts  # Cấu hình cột hiển thị & bộ lọc
│       │   ├── pages/                   # TiktokAccountPage, DetailPage, EditPage
│       │   ├── routes/route.ts          # Route definitions cho TiktokAccount
│       │   └── store/                   # tiktokAccountSlice.ts, tiktokAccountThunks.ts
│       ├── routes/api.php               # API endpoints cho TikTok Accounts (/api/tiktok-accounts/...)
│       └── src/                         # Controllers, Models, Repositories, Services, Requests...
├── public/
│   └── build/                           # Thư mục chứa production bundle do Vite sinh ra
├── resources/
│   ├── css/app.css                      # Global Tailwind & Ant Design Reset styles
│   ├── js/
│   │   ├── app.tsx                      # Entry point React DOM mount
│   │   ├── App.tsx                      # Root component chứa Provider & AppLayout Routing
│   │   └── vite-env.d.ts                # TypeScript declarations cho Vite
│   └── views/
│       └── app.blade.php                # Blade template duy nhất (@viteReactRefresh, @vite)
├── routes/
│   ├── api.php                          # Master API routes shell (Core tự động nạp routes từ Modules)
│   ├── web.php                          # SPA catch-all route {any?} -> view('app')
│   └── console.php
├── storage/
│   └── app/public/                      # Public storage (lưu avatar tài khoản TikTok)
├── composer.json                        # Khai báo PSR-4: "Modules\<Name>\": "Modules/<Name>/src/"
├── package.json                         # Dependencies frontend & scripts (dev, build, tsc)
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

### Chế độ phát triển (Local Development)

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
   Mở trình duyệt và truy cập vào:
   ```
   http://127.0.0.1:8000
   ```

---

### Khởi chạy Crawler Service (Python Microservice)

Nếu muốn kiểm thử tính năng crawl thực tế, điều hướng vào thư mục crawler và khởi chạy:
```bash
cd ../ProcessData/tiktok-crawler
python -m venv venv
# Windows:
venvScriptsactivate
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

### Quản lý Crawl Jobs
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/admin/api/crawler/crawl-job/all` | Lấy danh sách crawl jobs (có phân trang & bộ lọc) |
| `POST` | `/admin/api/crawler/crawl-job/add` | Tạo mới một crawl job |
| `GET` | `/admin/api/crawler/crawl-job/{id}/details` | Lấy chi tiết thông tin một crawl job |
| `GET` | `/admin/api/crawler/crawl-job/statistics-summary` | Lấy thống kê KPI tổng quan crawl jobs |

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

## 10. Kiểm thử & Kiểm tra chất lượng

### 1. Kiểm tra biên dịch TypeScript
Kiểm tra tính đúng đắn của toàn bộ kiểu dữ liệu mà không cần xuất file:
```bash
node ./node_modules/typescript/bin/tsc --noEmit
```
*(Yêu cầu: Kết quả trả về mã lỗi 0, không có bất kỳ error hay warning nào).*

### 2. Biên dịch Production Bundle (Vite Build)
Đóng gói mã nguồn frontend tối ưu cho môi trường Production:
```bash
npm run build
```
Các file bundle tối ưu được tạo ra trong thư mục `public/build/`.

### 3. Kiểm thử tự động Backend (PHP Artisan Test / Pest)
Chạy bộ test suite của Laravel (bao gồm Feature Tests cho Dynamic Routes, CORS preflight/headers, Web SPA routes, Root redirect, CoreController ping/upload/delete, BaseController 5 RESTful actions, keyword search, column filtering, sorting, pagination):
```bash
php artisan test
```
*(21 tests passed 100%, 74 assertions).*

### 4. Kiểm tra danh sách Route
Xác nhận toàn bộ routes của các module đã được đăng ký chính xác bắt đầu bằng prefix admin:
```bash
php artisan route:list
```

---

## 📝 Quy chuẩn đóng góp mã nguồn (Coding Conventions)

1. **Frontend**:
   - Mọi file logic hoặc UI đều phải dùng TypeScript (`.ts`, `.tsx`). Tuyệt đối không dùng `.js` hay `.jsx` trong thư mục `resources/` hoặc `Modules/*/resources/`.
   - Mọi lời gọi HTTP API phải đi qua các hàm định kiểu trong thư mục `Action/` của module tương ứng.
   - Luôn sử dụng typed hooks từ `@core/store`: `useDispatch`, `useSelector`, `useAppDispatch`, `useAppSelector`.
2. **Backend**:
   - Tất cả class PHP của module phải nằm trong thư mục `Modules/<ModuleName>/src/`.
   - Giữ nguyên kiến trúc phân lớp: Controller $ightarrow$ Service $ightarrow$ Repository $ightarrow$ Model.
   - Đảm bảo tuân thủ chuẩn PSR-12 và PSR-4.

---

## 📄 Bản quyền (License)

Dự án được phát triển nội bộ bởi **Ureka Media**. Mọi quyền được bảo lưu.
