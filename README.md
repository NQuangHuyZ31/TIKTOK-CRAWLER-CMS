# CMS TikTok Crawler Platform

> **Nền tảng doanh nghiệp thu thập dữ liệu TikTok phân tán, tự động khám phá và duy trì kho 5,000 creator mới, quản lý hồ sơ tài khoản, video showcase, lọc dữ liệu theo thời gian, phân tích chỉ số KPI, bảo mật 2FA/OAuth và phân quyền quản trị ma trận chuyên sâu.**

Dự án được xây dựng theo mô hình **Monorepo** chuẩn kiến trúc doanh nghiệp **Ureka Modular Architecture**, kết hợp giữa cổng quản trị **Laravel 13 + React 19 SPA (Ant Design 6 & Tailwind CSS 4)** và microservice thu thập dữ liệu hiệu năng cao **Python 3.10+ (FastAPI + AsyncIO + SQLite WAL Queue)**.

---

## 📑 Mục lục
1. [Tổng quan Kiến trúc & Công nghệ](#-tổng-quan-kiến-trúc--công-nghệ)
2. [Cấu trúc Thư mục Monorepo](#-cấu-trúc-thư-mục-monorepo)
3. [Tính năng Nổi bật (Core Features)](#-tính-năng-nổi-bật-core-features)
   - [1. Động cơ Thu thập & Lọc Video theo Ngày](#1-động-cơ-thu-thập--lọc-video-theo-ngày-video-date-filter)
   - [2. Động cơ Khám phá Creator Tự động (Discovery Engine 5,000 Pool)](#2-động-cơ-khám-phá-creator-tự-động-discovery-engine-5000-pool)
   - [3. Quản lý Creator TikTok & Showcase Video](#3-quản-lý-creator-tiktok--showcase-video)
   - [4. Quản lý Người dùng & Ma trận Phân quyền RBAC Động](#4-quản-lý-người-dùng--ma-trận-phân-quyền-rbac-động)
   - [5. Bảo mật Đa tầng & Xác thực Nâng cao (2FA & Google OAuth2)](#5-bảo-mật-đa-tầng--xác-thực-nâng-cao-2fa--google-oauth2)
   - [6. Quản trị Hệ thống, Cấu hình Engine & Nhật ký Hoạt động](#6-quản-trị-hệ-thống-cấu-hình-engine--nhật-ký-hoạt-động)
   - [7. Cổng Tài liệu Nội bộ Tương tác (Interactive Guideline Module)](#7-cổng-tài-liệu-nội-bộ-tương-tác-interactive-guideline-module)
4. [Yêu cầu Môi trường (Prerequisites)](#-yêu-cầu-môi-trường-prerequisites)
5. [Hướng dẫn Cài đặt & Khởi chạy Chi tiết (Step-by-Step Setup)](#-hướng-dẫn-cài-đặt--khởi-chạy-chi-tiết-step-by-step-setup)
   - [Lưu ý Xác thực Hai Chiều bằng Token Dùng Chung](#-lưu-ý-bảo-mật-xác-thực-hai-chiều-bằng-token-dùng-chung)
   - [Bước 1: Thiết lập Backend & Frontend CMS (`cms-tiktok-crawler`)](#bước-1-thiết-lập-backend--frontend-cms-cms-tiktok-crawler)
   - [Bước 2: Thiết lập Microservice Python Crawler (`tiktok-crawler-service`)](#bước-2-thiết-lập-microservice-python-crawler-tiktok-crawler-service)
   - [Bước 3: Truy cập Hệ thống & Danh sách Tài khoản Mặc định](#bước-3-truy-cập-hệ-thống--danh-sách-tài-khoản-mặc-định)
6. [Kiểm thử & Đảm bảo Chất lượng (Quality Gates)](#-kiểm-thử--đảm-bảo-chất-lượng-quality-gates)
7. [Triển khai Production & Docker](#-triển-khai-production--docker)
8. [Quy chuẩn Phát triển & Đóng góp](#-quy-chuẩn-phát-triển--đóng-góp)

---

## 🏗️ Tổng quan Kiến trúc & Công nghệ

Hệ thống được chia tách rành mạch thành 2 tầng dịch vụ độc lập giao tiếp qua RESTful Webhook và kiến trúc hàng đợi phi tập trung:

```mermaid
flowchart TB
    subgraph Client["Trình duyệt Quản trị (Admin Client)"]
        UI["React 19 SPA<br>(Ant Design 6 + Tailwind CSS 4)"]
    end

    subgraph Backend["Tầng Quản trị & REST API (cms-tiktok-crawler)"]
        Laravel["Laravel 13 (PHP 8.3)<br>Ureka Modular Architecture (10 Modules)"]
        DB[(MySQL 8.0 / SQLite)]
        Redis[(Redis Cache & Queues)]
        AvatarStore["Local Avatar Storage<br>(public/tiktok-accounts/avatars)"]
    end

    subgraph CrawlerEngine["Tầng Thu thập & Khám phá (tiktok-crawler-service)"]
        FastAPI["FastAPI + Uvicorn<br>(Cổng 8001)"]
        DiscoveryMgr["Discovery Candidate Manager<br>(Kho tự động duy trì 5,000 Creator mới)"]
        QueueMgr["Queue Manager<br>(SQLite WAL FIFO Buffer)"]
        WorkerPool["Worker Pool (Fixed 5-10 Async Workers)<br>HTTP JSON Parser + Circuit Breaker"]
    end

    TikTok["Mạng xã hội TikTok<br>(tiktok.com)"]

    UI <-->|REST API + Bearer Sanctum Token| Laravel
    Laravel -->|Lưu trữ hồ sơ, video, logs| DB
    Laravel -->|Cache chỉ số & khóa phiên| Redis
    Laravel -->|Tải & phục vụ ảnh đại diện cục bộ| AvatarStore
    Laravel -->|POST /api/crawl-jobs/start (Bearer Auth)| FastAPI
    FastAPI --> QueueMgr --> WorkerPool
    FastAPI --> DiscoveryMgr
    WorkerPool -->|HTTP GET / JSON Rehydration| TikTok
    DiscoveryMgr -->|Tìm nạp creator mới| TikTok
    WorkerPool -->|Signed Webhook Streaming Event (HMAC)| Laravel
```

### Bảng Công nghệ Cốt lõi:
| Thành phần | Công nghệ chính | Vai trò & Đặc điểm kỹ thuật |
| :--- | :--- | :--- |
| **Backend CMS** | Laravel 13, PHP 8.3, Composer | Kiến trúc 3 tầng nghiêm ngặt (`Controller -> Service -> Repository`), Dynamic Route Resolver, Sanctum Token, Google2FA TOTP, Socialite Google OAuth2. |
| **Frontend Portal** | React 19, TypeScript, Ant Design 6, Redux Toolkit, Tailwind CSS 4 | Giao diện Single Page Application (SPA), 100% Strict Type, hỗ trợ Path Aliases chuẩn (`@core`, `@modules/*`). |
| **Crawler & Discovery Engine** | Python 3.10+, FastAPI, AsyncIO, SQLite WAL, httpx, BeautifulSoup4 | Bóc tách trực tiếp JSON nhúng (`__UNIVERSAL_DATA_FOR_REHYDRATION__`), RAM siêu nhẹ (50–80MB), Rate Limiter, Circuit Breaker, tự duy trì 5,000 creator mới. |
| **Cơ sở dữ liệu** | MySQL 8.0+ / SQLite, Redis | Lưu trữ tài khoản TikTok, showcase video, lịch sử cào dữ liệu, audit logs và quản lý hàng đợi Laravel. |
| **Môi trường & Deploy** | Docker, Nginx, PHP-FPM, Render Blueprint (`render.yaml`) | Đóng gói container hoàn chỉnh với Health Probe tự động `/api/health`. |

---

## 📂 Cấu trúc Thư mục Monorepo

```text
TIKTOK-CRAWLER/
├── .agents/                               # Bộ AI Assistant Skills & Engineering Rules chuẩn hóa quy trình
│   ├── rules/                             # backend.md, frontend.md, database.md, git-workflow.md
│   └── skills/                            # core-reusability-promoter, ureka-module-scaffolder,...
├── cms-tiktok-crawler/                    # ỨNG DỤNG CHÍNH: LARAVEL 13 & REACT 19 SPA
│   ├── app/                               # Khung mặc định Laravel
│   ├── config/                            # Cấu hình framework & services
│   ├── database/                          # Migrations & Seeders hệ thống (DatabaseSeeder.php)
│   ├── modules/                           # 10 MODULES NGHIỆP VỤ (Ureka Modular Layer)
│   │   ├── Core/                          # Hạ tầng dùng chung, BaseController, UI Widgets, Header, Layout
│   │   ├── Crawler/                       # Quản lý tác vụ crawl, Date Filter, tiến độ realtime
│   │   ├── TiktokAccount/                 # Hồ sơ Creator TikTok, video showcase, lịch sử cào
│   │   ├── Auth/                          # Đăng nhập Email, Google OAuth2, 2FA QR code & verify, OTP
│   │   ├── User/                          # Quản lý người dùng, Reset Password, Reset 2FA, toggle active
│   │   ├── Role/                          # Quản lý vai trò, cấu hình Ma trận phân quyền (Role Matrix)
│   │   ├── Permission/                    # Quản lý quyền hạn, Modal tạo Module & Permission động
│   │   ├── System/                        # Chẩn đoán sức khỏe hệ thống, Engine settings, Audit logs, Login logs
│   │   ├── Guideline/                     # Cổng tài liệu nội bộ song ngữ (EN/VI) với ảnh chụp thực tế
│   │   └── API/                           # Webhook tiếp nhận kết quả streaming từ Python Crawler
│   ├── public/                            # Điểm phát hành tĩnh, images/guideline/, entrypoints.json
│   ├── tests/                             # Bộ kiểm thử tự động Feature & Unit tests (Pest / PHPUnit)
│   ├── vite.config.ts                     # Cấu hình Vite & Path Aliases
│   └── package.json                       # Dependencies frontend React 19 & Ant Design 6
├── tiktok-crawler-service/                # MICROSERVICE PYTHON CRAWLER & DISCOVERY ENGINE ĐỘC LẬP
│   ├── app/
│   │   ├── api/                           # FastAPI endpoints (/api/crawl-jobs/start, /health, /api/settings)
│   │   ├── core/                          # Quản lý config (.env) & utils
│   │   ├── crawler/                       # HTTP Client, trích xuất JSON, lọc video theo ngày
│   │   ├── engine/                        # Hàng đợi SQLite WAL, Candidate Discovery Pool (5000 items)
│   │   ├── repositories/                  # CandidateRepo, QueueStore
│   │   ├── schemas/                       # Pydantic data schemas
│   │   ├── services/                      # Streaming webhook gửi về Laravel CMS
│   │   └── workers/                       # JobRunner, DiscoveryWorker
│   ├── data/                              # SQLite WAL database (queue.db, candidates.db)
│   ├── datasets/                          # Danh sách định dạng TXT/CSV cho candidate seeding
│   ├── tests/                             # Bộ kiểm thử tự động Python (pytest)
│   └── requirements.txt                   # Danh sách thư viện Python
├── docker/                                # Dockerfile.web, Dockerfile.crawler, Dockerfile.worker, Nginx
├── docs/                                  # Tài liệu kiến trúc và hướng dẫn kỹ thuật chi tiết
├── scripts/                               # Bộ script kiểm định chất lượng (verify-workflow.ps1,...)
└── render.yaml                            # Blueprint triển khai tự động lên Render.com
```

---

## 🌟 Tính năng Nổi bật (Core Features)

### 1. Động cơ Thu thập & Lọc Video theo Ngày (Video Date Filter)
- **3 Phương thức nguồn dữ liệu (Source Type)**:
  - `usernames`: Nhập danh sách username TikTok tùy ý (hỗ trợ nhập hàng loạt qua textarea phân tách bởi dấu phẩy hoặc xuống dòng).
  - `urls`: Dán trực tiếp danh sách URL profile hoặc URL video TikTok; hệ thống tự động trích xuất handle chuẩn xác.
  - `count`: Lấy tự động creator từ **Candidate Pool** trong kho khám phá liên tục mà không cần nhập thủ công.
- **2 Chế độ thu thập linh hoạt (Crawl Mode)**:
  - `account_with_videos`: Thu thập toàn diện thông tin kênh kết hợp trích xuất danh sách video đã đăng.
  - `account_only`: Thu thập nhanh các chỉ số tổng quan (Followers, Following, Likes, Bio, Verified) trong 3–8 giây/tài khoản.
- **Bộ lọc Video theo Ngày (Video Date Filter Selector)**:
  - Cho phép người dùng thu thập video chính xác theo khoảng thời gian: `All Recent Videos`, `Today Only` (tích hợp cơ chế ngắt sớm Early Exit tiết kiệm tài nguyên), `Yesterday Only`, các preset tiện lợi (`Past 7 Days`, `Past 30 Days`, `Past 90 Days`), chọn 1 ngày cụ thể (`Specific Date`), hoặc tùy chỉnh dải ngày bất kỳ bằng `Custom Date Range` (`RangePicker`).
  - Tự động chuẩn hóa mốc thời gian sang UTC khi gửi sang Python Crawler, tránh lệch mốc thời gian đăng bài do khác múi giờ giữa máy chủ và người dùng.
- **Streaming Webhook & Tiến độ Real-time**: Kết quả tài khoản và video được truyền về CMS ngay khi cào xong từng mục; thanh tiến trình hiển thị tỷ lệ hoàn thành theo thời gian thực.
- **Điều khiển tác vụ toàn diện**: Start, Pause, Resume, Stop/Cancel, Delete và tính năng **Retry Failed Targets** tự động thử lại các tài khoản gặp lỗi mạng tạm thời.

---

### 2. Động cơ Khám phá Creator Tự động (Discovery Engine 5,000 Pool)
- **Cơ chế kho đệm liên tục (Continuous Fresh Pool)**: Hệ thống luôn duy trì một kho sẵn sàng gồm **5,000 tài khoản TikTok mới chưa từng crawl**, tự động bổ sung liên tục khi số lượng trong kho giảm xuống dưới ngưỡng.
- **Batch Lease Allocation (20 items/batch)**: Khi một tác vụ crawl chọn nguồn `count`, engine sẽ "thuê" (lease) các lô 20 creator với khóa hết hạn tự động; nếu worker gặp sự cố, các tài khoản được tự động hoàn trả lại kho đệm để tránh thất thoát dữ liệu.
- **Phân luồng song song không nghẽn**: Quản lý bằng SQLite WAL độc lập, đảm bảo hiệu năng đọc/ghi cực nhanh với chi phí phần cứng tối thiểu.

---

### 3. Quản lý Creator TikTok & Showcase Video
- **Bảng tổng hợp Creator Chuyên nghiệp**:
  - Tìm kiếm nhanh theo Username, Nickname, trạng thái tài khoản.
  - Bộ lọc khoảng số lượng `NumericRangeFilter` cho Followers, Following, Heart Likes, Video count.
  - **Xuất dữ liệu tùy biến ra file Excel (.xlsx) & CSV (Cơ chế dùng chung `@core`)**:
    - Khi bấm `Export CSV`, hệ thống mở Modal tương tác cho phép cấu hình linh hoạt:
      - **Định dạng xuất (Export Format)**: Hỗ trợ cả **Excel Workbook (`.xlsx`) chuẩn OpenXML** (Khuyên dùng - hiển thị sắc nét 100% toàn bộ Emoji TikTok 👑, 🥀, chữ Ả Rập/Urdu, tiếng Việt có dấu mà không bao giờ bị lỗi font trên Microsoft Excel) và **CSV (`.csv`) UTF-8 BOM**.
      - **Khoảng thời gian (Date Range)**: Chọn toàn thời gian (All Dates) hoặc tùy chỉnh từ ngày đến ngày (`DatePicker.RangePicker`).
      - **Giới hạn số dòng (Row Quantity / Limit)**: Xuất toàn bộ bản ghi khớp bộ lọc hoặc giới hạn số lượng (Presets nhanh 100, 500, 1.000, 5.000 dòng hoặc nhập số tùy ý).
      - **Bảo toàn bộ lọc**: Tự động giữ nguyên toàn bộ điều kiện tìm kiếm và bộ lọc đang áp dụng trên bảng (search keyword, status, v.v.).
      - **Kiến trúc dùng chung (Reusable Architecture)**: Tích hợp sẵn tại `BaseController::export` (Backend) với engine `SimpleXlsxExporter` siêu nhẹ bằng `ZipArchive` thuần PHP (không phụ thuộc composer) và `<ExportButton />`, `<ExportModal />` (Frontend `@core`), giúp mọi module trong hệ thống (TiktokAccount, CrawlJob, User, ActivityLog,...) có thể tái sử dụng ngay lập tức mà không cần viết lại.
- **Creator Detail Drawer & Showcase Video Grid**:
  - Xem nhanh thẻ chỉ số KPI tổng thể (Followers, Likes, Videos, tỷ lệ tương tác).
  - Tab Tiểu sử/Bio, ảnh đại diện đã lưu cục bộ (Local Avatar) chống chặn hotlink từ TikTok CDN.
  - **Showcase Video Grid**: Lưới danh sách video với ảnh thumbnail sắc nét, lượt xem (Views), lượt thích (Likes), bình luận (Comments), chia sẻ (Shares) và liên kết mở trực tiếp trên TikTok.
  - **Tab Lịch sử cào (Crawl History)**: Theo dõi toàn bộ các phiên cập nhật dữ liệu của creator theo thời gian.

---

### 4. Quản lý Người dùng & Ma trận Phân quyền RBAC Động
- **Quản lý Nhân sự & Người dùng**:
  - Danh sách người dùng hệ thống với các chỉ số KPI trực quan trên header.
  - Tạo mới và chỉnh sửa thông tin người dùng, gắn vai trò, kiểm tra trùng lặp email.
  - Nút Switch bật/tắt trạng thái kích hoạt người dùng nhanh chóng; tài khoản bị tắt kích hoạt sẽ bị thu hồi token Sanctum ngay lập tức.
  - Chức năng Quản trị viên **Reset Mật khẩu** và **Reset Xác thực 2FA** khẩn cấp.
- **Ma trận Phân quyền Vai trò (Role Permission Matrix)**:
  - Thiết lập phân quyền dạng bảng ma trận chi tiết theo từng module cho 4 quyền chuẩn: `View`, `Create`, `Edit`, `Delete`.
  - Hỗ trợ checkbox **Select All** theo từng module để cấp toàn quyền nhanh chóng.
- **Quản lý Module & Quyền Động**:
  - Modal tạo mới Module (`CreateModuleModal`).
  - Modal tạo mới Quyền (`CreatePermissionModal`) và cơ chế xóa quyền an toàn.

---

### 5. Bảo mật Đa tầng & Xác thực Nâng cao (2FA & Google OAuth2)
- **Đăng nhập Email & Mật khẩu**: Cơ chế xác thực an toàn qua Laravel Sanctum, tự động khóa đăng nhập tạm thời (rate limit lockout) khi nhập sai mật khẩu nhiều lần.
- **Đăng nhập một chạm với Google OAuth2**: Đăng nhập nhanh chóng, tự động ánh xạ email người dùng Google vào hệ thống.
- **Xác thực 2 lớp Google Authenticator (TOTP 2FA)**:
  - Cung cấp mã QR code quét trực tiếp trên ứng dụng Google Authenticator / Authy.
  - Hiển thị Secret Key dạng Base32 dự phòng khi không thể quét mã QR.
  - Bắt buộc xác thực mã TOTP 6 chữ số khi đăng nhập từ thiết bị mới.
- **Xác thực dự phòng qua Email OTP**: Gửi mã xác thực một lần qua email khi người dùng bị mất hoặc không mang theo thiết bị Authenticator.
- **Tự khôi phục mật khẩu (Self-service Password Reset)**: Chức năng "Quên mật khẩu?" gửi liên kết xác thực có thời hạn tới email người dùng để đặt lại mật khẩu an toàn.

---

### 6. Quản trị Hệ thống, Cấu hình Engine & Nhật ký Hoạt động
- **Chẩn đoán Sức khỏe Hệ thống (System Diagnostics)**:
  - Bảng kiểm tra trạng thái thời gian thực: Phiên bản PHP 8.3, Laravel 13, Kết nối Database MySQL/SQLite, Trạng thái Redis Cache, Dung lượng lưu trữ đĩa.
  - Kiểm tra nhịp tim (Heartbeat) và cổng kết nối tới microservice Python Crawler (Port 8001).
- **Cấu hình Thông số Engine (Engine Settings)**:
  - Tùy chỉnh quy mô kho fresh creator (mặc định: 5,000 accounts).
  - Tùy chỉnh kích thước lô thuê (Batch Lease Size: 20) và giới hạn luồng xử lý song song.
- **Dọn dẹp Hàng đợi Khẩn cấp (Purge Worker Queue)**: Cho phép dọn dẹp hàng đợi và giải phóng các lease bị treo khi có sự cố mạng bất thường.
- **Nhật ký Hoạt động (Activity Logs)**: Ghi vết toàn bộ hành vi tạo, sửa, xóa với **Modal so sánh Before / After Diff** chi tiết.
- **Nhật ký Đăng nhập (Login Logs)**: Giám sát toàn bộ các phiên đăng nhập thành công và thất bại kèm địa chỉ IP, User Agent và dấu thời gian.

---

### 7. Cổng Tài liệu Nội bộ Tương tác (Interactive Guideline Module)
- Được tích hợp trực tiếp trong CMS tại `/guideline` hỗ trợ chuyển đổi song ngữ mượt mà (**English** và **Tiếng Việt**).
- **Trụ cột 1: Kiến thức & Nguyên lý (LEARN)**: Giải thích chi tiết kiến trúc tổng thể, mô hình topology, nguyên lý hàng đợi SQLite WAL và cơ chế defense-in-depth của hệ thống.
- **Trụ cột 2: Quy trình Vận hành Chuẩn (FOLLOW SOP)**: Hướng dẫn chi tiết từng bước cho mọi tác vụ nghiệp vụ, giải thích rõ từng trường nhập liệu, kiểu dữ liệu, giới hạn validation.
- **Tích hợp 50+ Ảnh Chụp Thực Tế (Live Screenshots)**: Toàn bộ hình ảnh minh họa đều được chụp trực tiếp từ giao diện CMS đang vận hành thực tế với đầy đủ dữ liệu mẫu và các modal xác nhận.

---

## 💻 Yêu cầu Môi trường (Prerequisites)

Trước khi tiến hành cài đặt, hãy đảm bảo máy tính/máy chủ của bạn đã có sẵn các thành phần sau:

- **PHP** >= `8.3` (các extension bắt buộc: `pdo_mysql`, `mbstring`, `bcmath`, `zip`, `intl`, `gd`, `fileinfo`, `curl`)
- **Composer** >= `2.6`
- **Node.js** >= `20.x` & **NPM** >= `10.x`
- **Python** >= `3.10` & **Pip**
- **Cơ sở dữ liệu**: MySQL `>= 8.0` (khuyên dùng cho môi trường production) hoặc SQLite (cho môi trường phát triển nhanh)
- **Hệ điều hành**: Linux (Ubuntu 22.04+), macOS hoặc Windows (PowerShell)

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Chi tiết (Step-by-Step Setup)

> [!IMPORTANT]
> ### ⚠️ LƯU Ý BẢO MẬT: XÁC THỰC HAI CHIỀU BẰNG TOKEN DÙNG CHUNG
> Hai dịch vụ **Laravel CMS** và **Python Crawler Service** giao tiếp qua REST API được bảo vệ bởi **một chuỗi token bảo mật dùng chung (Shared Secret Token)**:
>
> | Phía Laravel CMS (`cms-tiktok-crawler/.env`) | Phía Python Crawler (`tiktok-crawler-service/.env`) | Yêu cầu bắt buộc |
> | :--- | :--- | :--- |
> | `CRAWLER_SERVICE_TOKEN` | `CRAWLER_TOKEN` | **BẮT BUỘC PHẢI TRÙNG NHAU 100%**. Dùng để xác thực 2 chiều khi CMS gọi crawler và khi crawler streaming kết quả về CMS. |
>
> *CMS tự động sử dụng `CRAWLER_SERVICE_TOKEN` cho cả kiểm tra Bearer token lẫn đối soát chữ ký số Webhook HMAC nếu có (không cần khai báo thêm biến chữ ký ở CMS).*
>
> **Tạo token an toàn cho Production**: Bạn có thể tạo một chuỗi ngẫu nhiên bảo mật bằng lệnh terminal:
> ```bash
> openssl rand -hex 32
> ```
> Sau đó sao chép chuỗi sinh ra và điền vào cả 2 tệp `.env` của CMS (`CRAWLER_SERVICE_TOKEN`) và Crawler Service (`CRAWLER_TOKEN`).
>
> *Nếu hai bên không khớp nhau, Laravel CMS sẽ từ chối toàn bộ kết quả cào với mã lỗi `401 Unauthorized`, khiến thanh tiến trình bị treo ở 0%.*

---

### Bước 1: Thiết lập Backend & Frontend CMS (`cms-tiktok-crawler`)

1. Mở cửa sổ dòng lệnh tại thư mục gốc và di chuyển vào thư mục CMS:
   ```bash
   cd cms-tiktok-crawler
   ```

2. Tạo tệp cấu hình môi trường từ mẫu:
   ```bash
   cp .env.example .env
   ```

3. Mở tệp `.env` vừa tạo và kiểm tra các thông số cơ bản:
   ```ini
   APP_NAME="CMS Tiktok Crawler"
   APP_ENV=local
   APP_KEY=
   APP_DEBUG=true
   APP_URL=http://localhost:8000

   # Cấu hình kết nối Cơ sở dữ liệu (MySQL)
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=cms_tiktok_crawler
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password

   # ==============================================================================
   # KẾT NỐI & XÁC THỰC VỚI PYTHON CRAWLER SERVICE (BẮT BUỘC KHỚP VỚI CRAWLER SERVICE)
   # ==============================================================================
   CRAWLER_SERVICE_URL=http://127.0.0.1:8001
   CRAWLER_SERVICE_TOKEN=your_shared_crawler_secret_token

   # Two-Factor Authentication (Google Authenticator)
   AUTH_2FA_ENABLED=true
   AUTH_EMAIL_OTP_ENABLED=true

   # Cấu hình xác thực Google OAuth (tùy chọn)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/admin/api/auth/google/callback
   ```

4. Cài đặt các thư viện PHP và tạo khóa mã hóa ứng dụng:
   ```bash
   composer install
   php artisan key:generate
   ```

5. Tạo liên kết lưu trữ công khai cho ảnh đại diện (Avatars):
   ```bash
   php artisan storage:link
   ```

6. Chạy migration và nạp dữ liệu khởi tạo mặc định (Users, Roles, Permissions):
   ```bash
   php artisan migrate --seed
   ```

7. Cài đặt các gói thư viện Frontend (React 19, Ant Design 6, Tailwind CSS 4):
   ```bash
   npm install
   ```

8. Khởi chạy máy chủ Backend và Frontend:
   ```bash
   # Terminal 1: Khởi chạy máy chủ Laravel Backend (Cổng 8000)
   php artisan serve --port=8000

   # Terminal 2: Khởi chạy máy chủ Vite Frontend Dev Server (Cổng 5173 - hỗ trợ HMR)
   npm run mix                       # Build toàn bộ modules
   npm run mix:crawler               # Chỉ build module Crawler
   npm run mix:tiktokaccount         # Chỉ build module TiktokAccount
   npm run mix:core                  # Chỉ build module Core
   npm run mix:module <Name>         # Build module tùy chọn (vd: npm run mix:module Crawler)
   npm run mix:prod                  # Build production
   ```

   > **Ghi chú đóng gói Frontend**: Để biên dịch toàn bộ asset giao diện cho production, bạn chạy lệnh `npm run mix:all`.

---

### Bước 2: Thiết lập Microservice Python Crawler (`tiktok-crawler-service`)

1. Mở một cửa sổ terminal mới từ thư mục gốc dự án:
   ```bash
   cd tiktok-crawler-service
   ```

2. Khởi tạo và kích hoạt môi trường ảo Python (Virtual Environment):
   ```bash
   # Tạo virtual environment
   python -m venv venv

   # Kích hoạt trên Linux/macOS:
   source venv/bin/activate

   # Kích hoạt trên Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```

3. Cài đặt các thư viện Python cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

4. Tạo tệp cấu hình môi trường từ mẫu:
   ```bash
   cp .env.example .env
   ```

5. **Nội dung cấu hình chuẩn sản xuất của `tiktok-crawler-service/.env`**:
   Tệp `.env.example` đã bao gồm đầy đủ 8 nhóm thông số chuẩn được tối ưu sẵn. Bạn chỉ cần kiểm tra các thông số chính sau:

   ```ini
   # ==============================================================================
   # 1. SERVER & NETWORK BINDING
   # ==============================================================================
   CRAWLER_HOST=0.0.0.0
   CRAWLER_PORT=8001
   WORKER_COUNT=10
   QUEUE_DB_PATH=data/queue.db
   DATASETS_DIR=datasets

   # ==============================================================================
   # 2. LARAVEL CMS INTEGRATION & SECURITY AUTH (BẮT BUỘC TRÙNG KHỚP VỚI CMS)
   # ==============================================================================
   LARAVEL_BASE_URL=http://127.0.0.1:8000
   LARAVEL_API_URL=http://127.0.0.1:8000/admin/api/public/crawler
   CRAWLER_TOKEN=your_shared_crawler_secret_token
   CRAWLER_HMAC_SECRET=your_shared_crawler_secret_token
   CRAWLER_KEY_ID=key_v1
   OUTBOX_BATCH_SIZE=25
   OUTBOX_DISPATCH_TIMEOUT=5.0

   # ==============================================================================
   # 3. JOB SCHEDULER & CONCURRENCY CONTROL
   # ==============================================================================
   CRAWLER_MAX_ACTIVE_JOBS=10
   CRAWLER_MAX_ACTIVE_JOBS_PER_OWNER=3
   CRAWLER_CHUNK_SIZE=25
   CRAWLER_CHUNK_LEASE_MS=60000
   CRAWLER_MAX_CHUNK_CRASHES=3
   CRAWLER_MAX_TARGET_ATTEMPTS=3
   CRAWLER_GLOBAL_RATE_LIMIT_RPS=2.0

   # ==============================================================================
   # 4. TIMEOUTS & RETRY LIMITS
   # ==============================================================================
   REQUEST_TIMEOUT=20
   ACCOUNT_TIMEOUT=90
   MAX_RETRIES=3
   MAX_JOB_RESUMES=3
   REQUEUE_DELAY_SECONDS=60

   # ==============================================================================
   # 5. ANTI-BAN RATE LIMITING & CIRCUIT BREAKER (CHỐNG CHẶN IP TIKTOK)
   # ==============================================================================
   RATE_LIMIT_PER_SEC=1.5
   REQUEST_DELAY_MIN=0.6
   REQUEST_DELAY_MAX=1.5
   CIRCUIT_BREAKER_THRESHOLD=10
   CIRCUIT_BREAKER_COOLDOWN=15

   # ==============================================================================
   # 6. RESOURCE & DATA BOUNDS
   # ==============================================================================
   MAX_ACCOUNTS_PER_JOB=2000
   QUEUE_MAX_SIZE=5000
   AVATAR_MAX_BYTES=2097152
   MAX_HTML_BYTES=5242880
   USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36

   # ==============================================================================
   # 7. DISCOVERY REFILL WORKER & CANDIDATE POOL (KHO TỰ DUY TRÌ 5,000 CREATOR)
   # ==============================================================================
   CRAWLER_DISCOVERY_ENABLED=true
   DISCOVERY_WORKER_COUNT=3
   DISCOVERY_INTERVAL_SECONDS=10.0
   CRAWLER_CANDIDATE_POOL_TARGET_SIZE=5000
   CRAWLER_CANDIDATE_POOL_LOW_WATERMARK=1000
   CRAWLER_DISCOVERY_SCAN_VIDEOS_PER_SEED=20
   ALLOW_BOOTSTRAP_FALLBACK=true
   DISCOVERY_RATE_LIMITED=false
   DISCOVERY_MAX_BATCH_SIZE=50
   DISCOVERY_FRONTIER_THRESHOLD=100
   SHARED_RATE_LIMIT_PROFILE_WEIGHT=4

   # ==============================================================================
   # 8. SAFEGUARDS & DISK STORAGE
   # ==============================================================================
   CRAWLER_MIN_FREE_DISK_GB=5.0
   CRAWLER_MAX_WAL_BYTES=1048576000
   ```

6. Khởi chạy microservice crawler:
   ```bash
   # Cách 1 (Khuyên dùng - chạy module FastAPI trực tiếp):
   python -m uvicorn app.api.routes:app --host 0.0.0.0 --port 8001

   # Cách 2 (Chạy qua entrypoint main.py):
   python app/main.py
   ```

   Dịch vụ Crawler sẽ khởi động tại địa chỉ: `http://localhost:8001`. Bạn có thể mở **`http://localhost:8001/docs`** trên trình duyệt để kiểm tra Swagger API Documentation.

7. **Kiểm tra trạng thái thời gian thực của Crawler (Optional)**:
   Mở một terminal khác trong thư mục `tiktok-crawler-service`:
   ```bash
   python scripts/status.py --watch
   ```
   Lệnh này sẽ hiển thị bảng dashboard trực tiếp số lượng workers đang chạy, số job trong hàng đợi, trạng thái Circuit Breaker và dung lượng kho ứng viên Discovery.

---

### Bước 3: Truy cập Hệ thống & Danh sách Tài khoản Mặc định

Sau khi hoàn tất khởi chạy cả 2 dịch vụ trên:
- **Cổng Quản trị CMS**: **[http://localhost:8000/admin](http://localhost:8000/admin)**
- **Cổng Tài liệu Hướng dẫn Guideline**: **[http://localhost:8000/guideline](http://localhost:8000/guideline)**
- **Kiểm tra Sức khỏe API**: **[http://localhost:8000/api/health](http://localhost:8000/api/health)**

#### Bảng tài khoản mẫu được khởi tạo sẵn (Seeder):
| Email đăng nhập | Mật khẩu | Vai trò (Role) | Phạm vi Quyền hạn |
| :--- | :--- | :--- | :--- |
| `admin@cms.com` | `password` | **Super Admin** | Toàn quyền kiểm soát hệ thống, quản lý người dùng, phân quyền ma trận, cấu hình engine. |
| `manager@cms.com` | `password` | **Operations Manager** | Quản lý tác vụ crawl, duyệt dữ liệu creator, xem báo cáo thống kê KPI. |
| `editor@cms.com` | `password` | **Crawler Specialist** | Tạo mới và khởi chạy các phiên cào dữ liệu TikTok, lọc video theo ngày. |
| `viewer@cms.com` | `password` | **Guest Auditor** | Chỉ có quyền xem danh sách dữ liệu creator, video và nhật ký, không được chỉnh sửa. |

---

## 🧪 Kiểm thử & Đảm bảo Chất lượng (Quality Gates)

Dự án tuân thủ nghiêm ngặt các quy chuẩn kiểm thử tự động trên toàn bộ các tầng mã nguồn:

### 1. Kiểm tra Kiểu dữ liệu TypeScript (Frontend)
Đảm bảo 100% strict type safety, không có lỗi kiểu dữ liệu:
```bash
cd cms-tiktok-crawler
npm run check-types
```

### 2. Kiểm thử Tự động Backend Laravel
Chạy bộ kiểm thử Feature & Unit tests cho các modules:
```bash
cd cms-tiktok-crawler
php artisan test
```

### 3. Kiểm thử Tự động Microservice Python
Chạy bộ kiểm thử cho JSON parser, SQLite WAL queue, candidate allocation và bộ lọc video theo ngày:
```bash
cd tiktok-crawler-service
pytest tests/
```

### 4. Kiểm thử Toàn diện Quy trình Làm việc (Monorepo Workflow Gate)
Chạy script kiểm tra 35/35 tiêu chí an toàn (branch regex, conventional commits, quyền hạn và release gate):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1
```

---

## 🐳 Triển khai Production & Docker

Hệ thống được đóng gói sẵn sàng cho môi trường container hóa chuyên nghiệp (Docker, Kubernetes hoặc PaaS như Render/AWS/DigitalOcean):

- **Web Container (`docker/Dockerfile.web`)**: Đóng gói Nginx, PHP 8.3 FPM và bộ asset React 19 SPA đã biên dịch tối ưu.
- **Crawler Container (`docker/Dockerfile.crawler`)**: Đóng gói Python FastAPI và môi trường thực thi SQLite WAL.
- **Queue Worker Container (`docker/Dockerfile.worker`)**: Chạy các worker ngầm xử lý hàng đợi sự kiện của Laravel (`php artisan queue:work`).
- **Render.com Blueprint (`render.yaml`)**: Khai báo trọn gói cụm dịch vụ tự động kèm cơ chế health probe tự động tại `/api/health`.

---

## 📐 Quy chuẩn Phát triển & Đóng góp

Để đảm bảo chất lượng mã nguồn đồng nhất khi có nhiều kỹ sư và AI Agent cùng tham gia:

1. **Quy chuẩn Nhánh Ngắn (Category Branch Protocol)**:
   - Sử dụng các nhánh ngắn chuẩn hóa: `fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`.
   - **Tuyệt đối không** push trực tiếp lên nhánh `main`. Luôn mở Pull Request (PR) về `main`.
2. **Quy tắc 3 Tầng Nghiêm ngặt (Strict 3-Layer Architecture)**:
   - **Controller**: Chỉ tiếp nhận HTTP request, validate qua FormRequest và gọi duy nhất sang **Service**.
   - **Service**: Đảm nhiệm 100% business logic và quản lý transaction `DB::transaction`, chỉ phụ thuộc vào Repository Interface.
   - **Repository**: Kế thừa `BaseRepository`, thực thi các truy vấn Eloquent thuần túy.
3. **Quy chuẩn Frontend (React 19 & Ant Design 6)**:
   - Đưa mọi cấu hình, options, preset vào thư mục `configs/` của module.
   - Tối đa độ dài component không vượt quá 150–200 dòng, phân tách component con rõ ràng.
   - Sử dụng thống nhất Path Aliases chuẩn: `@core/...` và `@modules/<ModuleName>/...`.
4. **Cổng Duyệt Phát hành An toàn (Mandatory Human Deploy Gate)**:
   - Merge PR vào `main` chỉ tự động tạo **Draft Release** trên GitHub.
   - Chỉ khi người có thẩm quyền nhấn **"Publish release"**, pipeline triển khai lên production mới chính thức được kích hoạt.

---

## 📄 Bản quyền
Dự án được bảo hộ và phát triển bởi **Ureka Media**. Sử dụng cho mục đích nội bộ và khách hàng doanh nghiệp.
