# CMS TikTok Crawler Platform

> **An enterprise-grade distributed TikTok data extraction and intelligence platform featuring automated creator discovery (maintaining a 5,000 fresh candidate pool), video catalog showcase, publication date range filtering, real-time KPI metrics, dynamic RBAC permission matrix, and multi-factor authentication (Google Authenticator 2FA & Google OAuth2).**

Built as a standardized **Ureka Modular Architecture** monorepo, connecting an administrative portal powered by **Laravel 13 + React 19 SPA (Ant Design 6 & Tailwind CSS 4)** with a high-performance scraping microservice powered by **Python 3.10+ (FastAPI + AsyncIO + SQLite WAL Queue)**.

---

## 📑 Table of Contents
1. [Architecture & Technology Stack](#-architecture--technology-stack)
2. [Monorepo Directory Structure](#-monorepo-directory-structure)
3. [Core Operating Mechanisms](#-core-operating-mechanisms)
   - [1. HTTP JSON Rehydration vs. Headless Browsers](#1-http-json-rehydration-vs-headless-browsers)
   - [2. Shared Host Rate Limiter with 4:1 Weighted Schedule](#2-shared-host-rate-limiter-with-41-weighted-schedule)
   - [3. Continuous Discovery Engine & Candidate Pool Refill](#3-continuous-discovery-engine--candidate-pool-refill)
   - [4. Signed Webhook Ingestion & Strict Token Verification](#4-signed-webhook-ingestion--strict-token-verification)
4. [Key Features & Capabilities](#-key-features--capabilities)
   - [1. Crawl Job Engine & Video Date Filter Selector](#1-crawl-job-engine--video-date-filter-selector)
   - [2. TikTok Creator Directory & Video Showcase Grid](#2-tiktok-creator-directory--video-showcase-grid)
   - [3. Universal OpenXML Excel (.xlsx) & CSV Export](#3-universal-openxml-excel-xlsx--csv-export)
   - [4. User Management & Dynamic RBAC Permission Matrix](#4-user-management--dynamic-rbac-permission-matrix)
   - [5. Multi-Layer Security & Multi-Factor Authentication](#5-multi-layer-security--multi-factor-authentication)
   - [6. System Diagnostics, Live Engine Probes & Audit Logs](#6-system-diagnostics-live-engine-probes--audit-logs)
   - [7. Interactive Bilingual Guideline Portal](#7-interactive-bilingual-guideline-portal)
5. [Prerequisites](#-prerequisites)
6. [Step-by-Step Installation & Run Guide (Beginner-Friendly)](#-step-by-step-installation--run-guide-beginner-friendly)
   - [CRITICAL SECURITY NOTE: Shared Secret Token](#-critical-security-note-shared-secret-token)
   - [Step 1: Setting Up the Backend & Frontend CMS (`cms-tiktok-crawler`)](#step-1-setting-up-the-backend--frontend-cms-cms-tiktok-crawler)
   - [Step 2: Setting Up the Python Crawler Service (`tiktok-crawler-service`)](#step-2-setting-up-the-python-crawler-service-tiktok-crawler-service)
   - [Step 3: Accessing the Application & Default Credentials](#step-3-accessing-the-application--default-credentials)
   - [Step 4: Troubleshooting Common Issues](#step-4-troubleshooting-common-issues)
7. [Quality Gates & Automated Verification](#-quality-gates--automated-verification)
8. [Production Deployment & Docker](#-production-deployment--docker)
9. [Development Standards & Contribution Rules](#-development-standards--contribution-rules)

---

## 🏗️ Architecture & Technology Stack

The platform is cleanly decoupled into two autonomous service layers communicating via authenticated RESTful endpoints, signed webhooks, and distributed queuing:

```mermaid
flowchart TB
    subgraph Client["Admin Web Browser"]
        UI["React 19 SPA<br>(Ant Design 6 + Tailwind CSS 4)"]
    end

    subgraph Backend["Management Portal & REST API (cms-tiktok-crawler)"]
        Laravel["Laravel 13 (PHP 8.3)<br>Ureka Modular Architecture (10 Modules)"]
        DB[(MySQL 8.0 / SQLite)]
        Redis[(Redis Cache & Queues)]
        AvatarStore["Local Avatar Storage<br>(public/tiktok-accounts/avatars)"]
    end

    subgraph CrawlerEngine["Scraping & Discovery Service (tiktok-crawler-service)"]
        FastAPI["FastAPI + Uvicorn<br>(Port 8001)"]
        DiscoveryMgr["Discovery Candidate Manager<br>(Maintains 5,000 Fresh Creator Pool)"]
        RateLimiter["Shared Host Rate Limiter<br>(4:1 Weighted Schedule · 2.0 RPS Ceiling)"]
        QueueMgr["Queue Manager<br>(SQLite WAL FIFO Buffer)"]
        WorkerPool["Worker Pool (5–10 Async Workers)<br>HTTP Protocol Parser + Circuit Breaker"]
    end

    TikTok["TikTok Network<br>(tiktok.com)"]

    UI <-->|REST API + Bearer Sanctum Token| Laravel
    Laravel -->|Store accounts, videos, logs| DB
    Laravel -->|Cache metrics & session locks| Redis
    Laravel -->|Download & serve avatars locally| AvatarStore
    Laravel -->|POST /api/crawl-jobs/start (Bearer Auth)| FastAPI
    FastAPI --> QueueMgr --> WorkerPool
    FastAPI --> DiscoveryMgr
    WorkerPool <-->|Acquire Permit (4 Profile : 1 Discovery)| RateLimiter
    DiscoveryMgr <-->|Acquire Permit| RateLimiter
    WorkerPool -->|HTTP GET / JSON Rehydration| TikTok
    DiscoveryMgr -->|Scan seed mentions & comments| TikTok
    WorkerPool -->|Streaming Event Webhook (HMAC / Bearer)| Laravel
```

### Core Technology Stack:
| Layer | Technologies | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Backend CMS** | Laravel 13, PHP 8.3, Composer | Strict 3-layer architecture (`Controller -> Service -> Repository`), Dynamic Route Resolver, Sanctum Token, Google2FA TOTP, Socialite Google OAuth2, signed webhook validation. |
| **Frontend Portal** | React 19, TypeScript, Ant Design 6, Redux Toolkit, Tailwind CSS 4 | Single Page Application (SPA), 100% strict type safety, standardized path aliases (`@core`, `@modules/*`), responsive layout. |
| **Crawler & Discovery Engine** | Python 3.10+, FastAPI, AsyncIO, SQLite WAL, httpx, BeautifulSoup4 | Direct script tag parsing (`__UNIVERSAL_DATA_FOR_REHYDRATION__`), minimal memory footprint (50–80MB per worker), Shared Host Rate Limiter, Circuit Breaker, automated 5,000 creator candidate pool. |
| **Database & Cache** | MySQL 8.0+ / SQLite, Redis | Persistent storage for creator profiles, video catalogs, crawl execution history, audit logs, and cache locks. |
| **Packaging & CI/CD** | Docker, Nginx, PHP-FPM, Render Blueprint (`render.yaml`) | Modular multi-container compose, automated health probes at `/api/health`, zero-downtime rolling restart compatibility. |

---

## 📂 Monorepo Directory Structure

```text
TIKTOK-CRAWLER/
├── .agents/                               # AI Assistant Skills & Engineering Rules
│   ├── rules/                             # backend.md, frontend.md, database.md, git-workflow.md
│   └── skills/                            # core-reusability-promoter, ureka-module-scaffolder,...
├── cms-tiktok-crawler/                    # PRIMARY APPLICATION: LARAVEL 13 & REACT 19 SPA
│   ├── app/                               # Default Laravel application shell
│   ├── config/                            # Framework & services configuration
│   ├── database/                          # Migrations & system seeders (DatabaseSeeder.php)
│   ├── modules/                           # 10 BUSINESS MODULES (Ureka Modular Layer)
│   │   ├── Core/                          # Shared infrastructure, BaseController, UI widgets, Layout
│   │   ├── Crawler/                       # Crawl job orchestrator, Date Filter, progress tracking
│   │   ├── TiktokAccount/                 # Creator profiles, video showcase, crawl history
│   │   ├── Auth/                          # Email login, Google OAuth2, 2FA QR code & OTP
│   │   ├── User/                          # User accounts, Password reset, 2FA reset, Active toggles
│   │   ├── Role/                          # Role management, Dynamic Permission Matrix
│   │   ├── Permission/                    # Permission definitions, Create Module & Permission modals
│   │   ├── System/                        # System diagnostics, Engine settings, Audit & Login logs
│   │   ├── Guideline/                     # Interactive bilingual documentation portal (EN/VI)
│   │   └── API/                           # Webhook controller receiving streaming events from Crawler
│   ├── public/                            # Static assets, images/guideline/, entrypoints.json
│   ├── tests/                             # Automated Feature & Unit test suites (Pest / PHPUnit)
│   ├── vite.config.ts                     # Vite bundler & Path Aliases configuration
│   └── package.json                       # Frontend dependencies (React 19 & Ant Design 6)
├── tiktok-crawler-service/                # INDEPENDENT PYTHON CRAWLER & DISCOVERY SERVICE
│   ├── app/
│   │   ├── api/                           # FastAPI route handlers (/api/crawl-jobs/start, /health)
│   │   ├── core/                          # Configuration management (.env) & system logging
│   │   ├── crawler/                       # HTTP Client, JSON extractor, date range filter logic
│   │   ├── engine/                        # SQLite WAL queue, Candidate Discovery Pool (5,000 items)
│   │   ├── repositories/                  # CandidateRepo, QueueStore, FrontierRepo
│   │   ├── schemas/                       # Pydantic request/response schemas
│   │   ├── services/                      # Streaming webhook dispatch to Laravel CMS
│   │   └── workers/                       # JobRunner, DiscoveryWorker, OutboxDispatcher
│   ├── data/                              # SQLite WAL databases (queue.db, candidates.db)
│   ├── datasets/                          # Initial bootstrap CSV seeds for discovery
│   ├── tests/                             # Automated Python test suites (pytest)
│   └── requirements.txt                   # Python dependencies manifest
├── docker/                                # Dockerfile.web, Dockerfile.crawler, Dockerfile.worker, Nginx
├── docs/                                  # In-depth architectural specifications & guides
├── scripts/                               # Workflow quality verification scripts (verify-workflow.ps1)
└── render.yaml                            # Cloud deployment blueprint for Render.com
```

---

## ⚙️ Core Operating Mechanisms

### 1. HTTP JSON Rehydration vs. Headless Browsers
Traditional web scrapers rely on headless Chromium browsers (e.g., Puppeteer, Selenium, Playwright), requiring 1.5–3.0 GB of RAM per instance and consuming heavy CPU cycles executing JavaScript.
- **Protocol-Level Parsing**: When a TikTok profile is loaded, TikTok embeds a server-side pre-rendered state within an HTML script tag (`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">`).
- **Resource Efficiency**: This platform fetches raw HTML via asynchronous HTTP requests (`httpx`) and parses the JSON dictionary directly using BeautifulSoup4 and standard libraries.
- **Footprint**: A single worker consumes only **50–80 MB of RAM**, allowing a modest server to run 10+ concurrent workers without browser crashes.

### 2. Shared Host Rate Limiter with 4:1 Weighted Schedule
To prevent IP bans, CAPTCHA challenges, and HTTP 429 errors from TikTok's anti-scraping systems, all network calls pass through a centralized **`SharedHostRateLimiter`**:
- **Sustained Rate Ceiling**: Strictly enforces a global ceiling of **2.0 RPS (Requests Per Second)** with a minimum interval of 500ms between consecutive network dispatches.
- **4:1 Weighted Interleaving**: The schedule rotates permits using the pattern:
  ```python
  WEIGHTED_SCHEDULE = ["profile", "profile", "profile", "profile", "discovery"]
  ```
  Every 4 request permits granted to active profile crawl jobs are balanced with 1 permit allocated to background candidate discovery.
- **Idle Slot Borrowing**: If the Discovery pool is full or idle, its allocated slot is **immediately borrowed by Profile workers**, ensuring zero throughput wastage.
- **Circuit Breaker**: Detects consecutive HTTP 429 responses. If triggered, it temporarily trips open and enforces exponential backoff with `Retry-After` adherence before resuming requests safely.

### 3. Continuous Discovery Engine & Candidate Pool Refill
When crawl jobs request creator accounts using the `count` mode, they draw from an automated internal pool rather than manual inputs:
- **Hysteresis Watermarks**: The engine maintains a target capacity of **5,000 fresh candidates**. If the fresh candidate count falls below the **Low Watermark (1,000 accounts)**, dedicated background `DiscoveryWorker` processes wake up automatically.
- **Mention & Comment Harvesting**: Workers scan unexhausted seed creators, extracting `@username` mentions from video descriptions and commenters from video discussion threads (`/api/comment/list/`).
- **Frontier Validation**: Discovered usernames are queued in `discovery_frontier`, sanitized, checked against exclusion blacklists, and promoted into the `fresh_discovery` pool.
- **Batch Lease Allocation (20 items/batch)**: When jobs draw candidates, accounts are leased in chunks of 20 with lease expirations. If a worker crashes, leased accounts automatically return to the pool.

### 4. Signed Webhook Ingestion & Strict Token Verification
As scraping progress occurs in Python, results are streamed incrementally to Laravel CMS via `POST /admin/api/public/crawler/webhook/batch` and `/events`:
- **Mandatory Header Verification**: Every inbound webhook request **must** provide either an authenticated HMAC signature (`X-Crawler-Signature`) or a matching Bearer token in the `Authorization: Bearer <token>` header. Unauthenticated or misconfigured requests are rejected immediately with **HTTP 401 Unauthorized**.
- **Chronological Guards**: Events include high-precision ISO-8601 `observed_at` timestamps. If network latency delivers an older snapshot after a newer one, the older event is acknowledged as an idempotent no-op without overwriting recent metrics.
- **Deterministic Event Deduplication**: Event IDs are computed using SHA-256 hashes of the canonical envelope. Retried webhook events are safely acknowledged without creating duplicate records.

---

## 🌟 Key Features & Capabilities

### 1. Crawl Job Engine & Video Date Filter Selector
- **3 Source Input Types**:
  - `Usernames`: Enter TikTok handles manually (supports bulk pasting with comma or newline separators; automatically strips `@` symbols).
  - `URLs`: Paste direct TikTok profile or video web links; the engine extracts the clean handle automatically.
  - `Account Count`: Automatically draws the requested quantity of creators from the continuous discovery pool.
- **2 Crawl Modes**:
  - `Account With Videos`: Captures full profile metrics and extracts every published video.
  - `Account Only`: Captures profile statistics (Followers, Following, Likes, Bio, Verification) in 2–3 seconds per account.
- **Video Date Range Filter Selector**:
  - Restricts video collection to specific publication boundaries: `All Recent Videos`, `Today Only` (with early exit parsing), `Yesterday Only`, preset intervals (`Past 7 Days`, `Past 30 Days`, `Past 90 Days`), `Specific Date`, or a fully custom interval using `RangePicker`.
  - Normalizes timestamps to UTC using the target timezone (default: `Asia/Ho_Chi_Minh` UTC+7).
- **Comprehensive Job Controls**: Start, Pause, Resume, Cancel/Stop, Delete, and **Smart Retry** for targets with temporary network failures.

### 2. TikTok Creator Directory & Video Showcase Grid
- **Search & Multi-Facet Filtering**: Filter creators by username, nickname, verified status, and numeric ranges (`NumericRangeFilter`) for followers, following, likes, and video counts.
- **Detail Inspector Drawer**:
  - Displays primary KPI cards: Followers, Following, Total Likes, and Total Videos.
  - Creator biography, external link, and local avatar image cache (preventing TikTok CDN hotlink expiration).
- **Showcase Video Grid**: Visual grid display with video cover thumbnails, duration format (mm:ss), play views, like hearts, comment counts, and direct deep-links to original TikTok videos.
- **Crawl History Tab**: Comprehensive historical log of previous crawl executions and metric snapshots for each creator.

### 3. Universal OpenXML Excel (.xlsx) & CSV Export
- Built into the shared infrastructure layer (`@core`) and available across all modules:
  - **OpenXML Excel Workbook (`.xlsx`)**: Native PHP `ZipArchive` engine with **zero Composer dependencies**. Fully supports Unicode, Vietnamese diacritics, Arabic/Urdu scripts, and **all TikTok Emojis** (👑, 🥀, 🔥) without character corruption in Microsoft Excel.
  - **Standard CSV (`.csv`)**: Export with UTF-8 BOM encoding.
  - **Interactive Export Modal**: Configure date ranges, row limits (All, 100, 500, 1,000, 5,000), and preserve active table filters.

### 4. User Management & Dynamic RBAC Permission Matrix
- **Personnel Administration**: Manage operator and analyst accounts with email uniqueness validation and active/inactive status switches (deactivating an account terminates sessions and revokes Sanctum tokens immediately).
- **Dynamic Role Permission Matrix**: Visual grid mapping modules to standard CRUD actions: `View`, `Create`, `Edit`, `Delete`. Supports "Select All" per module.
- **Emergency Resets**: Administrators can trigger **Password Resets** and **2FA Credential Resets** directly from the user roster.

### 5. Multi-Layer Security & Multi-Factor Authentication
- **Sanctum Authentication**: Secure bearer tokens with brute-force rate-limiting and temporary IP lockouts.
- **Single Sign-On (Google OAuth2)**: One-click sign-in mapped to corporate Google Workspace email domains.
- **Two-Factor Authentication (2FA TOTP)**: Compatible with Google Authenticator, Microsoft Authenticator, and Authy. Includes QR code scanner and Base32 Secret Key fallback.
- **Self-Service Password Reset**: Secure expiring email tokens allowing users to safely reset forgotten passwords.

### 6. System Diagnostics, Live Engine Probes & Audit Logs
- **Infrastructure Heartbeat Probes**: Real-time status cards checking PHP version, Laravel 13 health, Database connectivity, Redis cache latency, and HTTP communication with the Python Crawler service (Port 8001).
- **Audit Activity Logs**: Detailed chronological log capturing every user mutation (Job created, Account updated, Role modified) with **Before vs. After Diff Modals**.
- **Login Logs**: Audits every successful and failed login attempt with IP address, browser User-Agent, and timestamps.

### 7. Interactive Bilingual Guideline Portal
- Built-in documentation portal accessible at `/guideline` supporting instant language toggling (**English** & **Tiếng Việt**).
- **LEARN Pillar**: Deep architectural explanations of system topology, state machines, and operational principles.
- **FOLLOW SOP Pillar**: Step-by-step Standard Operating Procedures for every daily operational workflow.
- **Production-Ready**: Sanitized of low-level database table names and internal schema details.

---

## 💻 Prerequisites

Ensure your host environment meets the following requirements before installation:

| Requirement | Minimum Version | Notes / Required Extensions |
| :--- | :--- | :--- |
| **PHP** | `^8.3` | Extensions: `pdo_mysql`, `pdo_sqlite`, `mbstring`, `bcmath`, `zip`, `intl`, `gd`, `fileinfo`, `curl` |
| **Composer** | `^2.6` | PHP dependency manager |
| **Node.js** | `^20.x` | JavaScript runtime environment |
| **NPM** | `^10.x` | Package manager for frontend dependencies |
| **Python** | `^3.10` | Python runtime with `pip` and `venv` |
| **Database** | MySQL `8.0+` or SQLite | SQLite is supported out of the box for quick setup |
| **Operating System** | Windows, Linux, macOS | Commands are provided for both PowerShell and Bash |

---

## 🚀 Step-by-Step Installation & Run Guide (Beginner-Friendly)

> [!IMPORTANT]
> ### ⚠️ CRITICAL SECURITY NOTE: SHARED SECRET TOKEN
> The **Laravel CMS** and the **Python Crawler Service** communicate through authenticated REST APIs and signed webhooks. They **MUST share the exact same secret token**:
>
> | Laravel CMS (`cms-tiktok-crawler/.env`) | Python Crawler (`tiktok-crawler-service/.env`) | Requirement |
> | :--- | :--- | :--- |
> | `CRAWLER_SERVICE_TOKEN` | `CRAWLER_TOKEN` | **MUST BE 100% IDENTICAL** |
> | `CRAWLER_HMAC_SECRET` | `CRAWLER_HMAC_SECRET` | **MUST BE 100% IDENTICAL** |
>
> *Generate a secure token using this terminal command:*
> ```bash
> openssl rand -hex 32
> ```
> *If the tokens do not match, the CMS will reject all webhook updates with `401 Unauthorized`, and crawl progress bars will remain stuck at 0%.*

---

### Step 1: Setting Up the Backend & Frontend CMS (`cms-tiktok-crawler`)

Open a terminal window and navigate to the `cms-tiktok-crawler` directory:

```bash
cd cms-tiktok-crawler
```

#### 1.1. Create Environment File
Copy the example environment configuration:

- **Linux / macOS**:
  ```bash
  cp .env.example .env
  ```
- **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```

#### 1.2. Configure `.env` Settings
Open `.env` in any text editor. For a quick local setup using **SQLite** (no MySQL installation required), configure:

```ini
APP_NAME="CMS Tiktok Crawler"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Quick setup with SQLite:
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Shared token matching the Python crawler service:
CRAWLER_SERVICE_URL=http://127.0.0.1:8001
CRAWLER_SERVICE_TOKEN=your_shared_crawler_secret_token
CRAWLER_HMAC_SECRET=your_shared_crawler_secret_token

# Security toggles:
AUTH_2FA_ENABLED=true
AUTH_EMAIL_OTP_ENABLED=false
```

*(If using SQLite, create the empty file: `touch database/database.sqlite` on Linux/macOS or `New-Item -ItemType File -Path database/database.sqlite` on PowerShell).*

#### 1.3. Install PHP Dependencies & Generate Key
```bash
composer install
php artisan key:generate
```

#### 1.4. Create Public Storage Symlink
```bash
php artisan storage:link
```

#### 1.5. Run Database Migrations & Seed Default Data
```bash
php artisan migrate --seed
```
*This provisions all database tables and seeds default user roles, permissions, and administrator accounts.*

#### 1.6. Install Frontend Dependencies & Compile Assets
```bash
npm install
npm run mix
```

#### 1.7. Start the Laravel CMS Server
```bash
php artisan serve --port=8000
```
*Leave this terminal running. The CMS is now live at **`http://localhost:8000`**.*

---

### Step 2: Setting Up the Python Crawler Service (`tiktok-crawler-service`)

Open a **second terminal window** and navigate to `tiktok-crawler-service`:

```bash
cd tiktok-crawler-service
```

#### 2.1. Create & Activate Python Virtual Environment
- **Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
  *(If PowerShell displays a script execution error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and retry).*

#### 2.2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### 2.3. Create Environment File
- **Linux / macOS**:
  ```bash
  cp .env.example .env
  ```
- **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```

#### 2.4. Verify `.env` Configuration
Open `.env` in your text editor and ensure the secret token matches the CMS:

```ini
CRAWLER_HOST=0.0.0.0
CRAWLER_PORT=8001
WORKER_COUNT=10
QUEUE_DB_PATH=data/queue.db

# CMS Integration (MUST match cms-tiktok-crawler/.env):
LARAVEL_BASE_URL=http://127.0.0.1:8000
LARAVEL_API_URL=http://127.0.0.1:8000/admin/api/public/crawler
CRAWLER_TOKEN=your_shared_crawler_secret_token
CRAWLER_HMAC_SECRET=your_shared_crawler_secret_token

# Discovery Candidate Pool (Maintains 5,000 creators):
CRAWLER_DISCOVERY_ENABLED=true
DISCOVERY_WORKER_COUNT=2
CRAWLER_CANDIDATE_POOL_TARGET_SIZE=5000
CRAWLER_CANDIDATE_POOL_LOW_WATERMARK=1000
```

#### 2.5. Start the Crawler Microservice
```bash
python -m uvicorn app.api.routes:app --host 0.0.0.0 --port 8001
```
*The crawler service is now listening at **`http://localhost:8001`**.*

#### 2.6. Verify Crawler Health
Open your browser and navigate to:
- Interactive API Documentation (Swagger): **[http://localhost:8001/docs](http://localhost:8001/docs)**
- Health Probe: **[http://localhost:8001/health](http://localhost:8001/health)**

---

### Step 3: Accessing the Application & Default Credentials

With both services running:
- **CMS Administration Portal**: **[http://localhost:8000/admin](http://localhost:8000/admin)**
- **Interactive Documentation Guideline**: **[http://localhost:8000/guideline](http://localhost:8000/guideline)**
- **CMS Health Probe**: **[http://localhost:8000/api/health](http://localhost:8000/api/health)**

#### Pre-seeded Default Accounts:
| Email Address | Default Password | Assigned Role | Capabilities & Scope |
| :--- | :--- | :--- | :--- |
| `admin@cms.com` | `password` | **Super Admin** | Full access to all modules, user administration, RBAC matrix, and system diagnostics. |
| `manager@cms.com` | `password` | **Operations Manager** | Manage crawl jobs, inspect creator analytics, view KPI reports. |
| `editor@cms.com` | `password` | **Crawler Specialist** | Create and execute crawl jobs, configure video date filters. |
| `viewer@cms.com` | `password` | **Guest Auditor** | Read-only access to creators, video showcases, and logs. |

---

### Step 4: Troubleshooting Common Issues

<details>
<summary><b>1. Error: "401 Unauthorized" on Webhooks or Progress Bar Stuck at 0%</b></summary>

- **Cause**: The `CRAWLER_SERVICE_TOKEN` in `cms-tiktok-crawler/.env` does not match the `CRAWLER_TOKEN` in `tiktok-crawler-service/.env`.
- **Solution**: Open both `.env` files, verify that both values are identical, restart both servers, and retry.
</details>

<details>
<summary><b>2. Error: "Port 8000 or 8001 already in use"</b></summary>

- **Solution (Windows PowerShell)**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess | Stop-Process -Force
  ```
- **Solution (Linux / macOS)**:
  ```bash
  kill -9 $(lsof -t -i:8000)
  kill -9 $(lsof -t -i:8001)
  ```
</details>

<details>
<summary><b>3. Error: "SQLSTATE[HY000] [2002] Connection refused" (MySQL)</b></summary>

- **Cause**: Local MySQL service is not running or credentials are incorrect.
- **Solution**: Switch to SQLite by setting `DB_CONNECTION=sqlite` and `DB_DATABASE=database/database.sqlite` in `cms-tiktok-crawler/.env`, create the file with `touch database/database.sqlite`, and rerun `php artisan migrate --seed`.
</details>

<details>
<summary><b>4. Error: "Script execution is disabled on this system" (Windows PowerShell)</b></summary>

- **Cause**: PowerShell execution policy blocks virtual environment activation.
- **Solution**: Run this command in PowerShell before activating:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
</details>

---

## 🧪 Quality Gates & Automated Verification

The monorepo enforces automated testing across all architectural layers. Run these commands to verify codebase integrity:

### 1. Frontend TypeScript Validation
Ensures 100% strict type safety with zero compilation errors:
```bash
cd cms-tiktok-crawler
npm run check-types
```

### 2. Backend Laravel Test Suite (Pest / PHPUnit)
Executes all 240+ Feature and Unit test cases:
```bash
cd cms-tiktok-crawler
php artisan test
```

### 3. Python Microservice Test Suite (pytest)
Tests the HTTP JSON parser, SQLite WAL queue, 4:1 rate limiter schedule, and discovery worker:
```bash
cd tiktok-crawler-service
pytest tests/
```

### 4. Monorepo Workflow Verification Script
Validates 35/35 engineering rules (branch conventions, conventional commits, deploy gate safety, worktree slots):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1
```

---

## 🐳 Production Deployment & Docker

The repository includes production-ready container configurations:

- **Web Service (`docker/Dockerfile.web`)**: Multi-stage build compiling React 19 SPA assets, served by Nginx and PHP 8.3 FPM.
- **Crawler Service (`docker/Dockerfile.crawler`)**: Lightweight Python 3.10+ container running FastAPI with persistent SQLite WAL volume storage.
- **Queue Worker (`docker/Dockerfile.worker`)**: Runs background Laravel event queue workers (`php artisan queue:work`).
- **Render.com Blueprint (`render.yaml`)**: Cloud infrastructure blueprint specifying automatic deployment with health check probes at `/api/health`.

### Running with Docker Compose:
```bash
docker compose up -d --build
```

---

## 📐 Development Standards & Contribution Rules

All contributors and AI Agents must adhere to the engineering guidelines codified in `AGENTS.md`:

1. **Short Category Branch Naming**:
   - Work on standardized category branches: `fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`.
   - **Never push directly to `main`**. All production merges must occur via Pull Requests.
2. **Strict 3-Layer Backend Architecture**:
   - `Controller`: Handles HTTP requests, delegates validation to FormRequests, calls Service.
   - `Service`: Encapsulates business logic, database transactions (`DB::transaction`), and repository calls.
   - `Repository`: Inherits `BaseRepository` for pure Eloquent and database persistence.
3. **Frontend Rules (React 19 & Ant Design 6)**:
   - All UI text must be in English.
   - Place all module configurations and options inside `configs/`.
   - Use standard path aliases (`@core/...` and `@modules/<ModuleName>/...`).
4. **Mandatory Human Deploy Gate**:
   - Merging a PR into `main` automatically creates a **Draft Release** on GitHub.
   - Production deployment is only triggered when authorized personnel click **"Publish Release"**.

---

## 📄 License & Attribution
Developed and maintained by **Ureka Media**. Internal enterprise intellectual property.
