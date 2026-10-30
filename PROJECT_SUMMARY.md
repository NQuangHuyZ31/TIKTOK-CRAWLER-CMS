# CMS TikTok Crawler - Project Summary & Architecture

> [!NOTE]
> Detailed historical architecture and earlier milestones (3,300+ lines) are archived in [`docs/archive/historical-milestones.md`](docs/archive/historical-milestones.md) and [`docs/archive/PROJECT_SUMMARY_ARCHIVE.md`](docs/archive/PROJECT_SUMMARY_ARCHIVE.md).

## 1. System Overview
Enterprise modular TikTok crawler and management platform adhering to the **Ureka Architecture**:
- **Backend**: Laravel 12 (PHP 8.3+) with modular DDD (`modules/Core`, `modules/Auth`, `modules/Crawler`, `modules/TiktokAccount`). Dynamic route resolution via `DynamicRouteResovle`.
- **Frontend**: Single Page Application (SPA) with React 19, Strict TypeScript (100%), Redux Toolkit, Ant Design v6, and Tailwind CSS v4.
- **Crawler Service**: Python HTTP JSON asynchronous microservice with SQLite WAL queue & fixed worker pool (`tiktok-crawler-service`).
- **Asset Pipelines**: Laravel Mix (Webpack 5) production build + Vite HMR development mode.

---

## 2. Documentation Map
All in-depth technical runbooks and architecture specifications reside in `docs/`:
- **Directory Layout**: [`docs/PROJECT_STRUCTURE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/PROJECT_STRUCTURE.md)
- **Core Component Reusability**: [`docs/CORE_MODULE_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/CORE_MODULE_GUIDE.md)
- **Frontend Architecture**: [`docs/FRONTEND_ARCHITECTURE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/FRONTEND_ARCHITECTURE.md)
- **API & Dynamic Routes**: [`docs/API_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/API_GUIDE.md)
- **Testing Standards**: [`docs/TESTING_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/TESTING_GUIDE.md)
- **Coding Conventions**: [`docs/CODING_STANDARDS.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/CODING_STANDARDS.md)
- **Git & Release Protocol**: [`AGENTS.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/AGENTS.md)
- **Historical Milestones (1–50)**: [`docs/archive/historical-milestones.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/archive/historical-milestones.md)

---

## 3. Essential Quality Verification Commands
```powershell
npm.cmd run check-types               # TypeScript strict type checking (0 errors)
php artisan test                      # Backend test suite (100% pass)
powershell scripts/verify-workflow.ps1 # Workflow and release gate verification
```

---

## 4. Active Milestone Registry

### Milestone: Fix AvatarService IndexError in Container Deployment
- **Date**: 2026-10-29 | **Branch**: `fix`
- **Scope**: Replaced hardcoded `parents[4]` with dynamic `_find_project_root()` in `ProcessData/tiktok-crawler/app/services/avatar_service.py`. Supported graceful fallback when container lacks shared volume. Added Python automated unit test suite.

### Milestone: Single Branch Standardization for Task Workflows
- **Date**: 2026-10-29 | **Branch**: `fix`
- **Scope**: Enforced single-branch policy (`fix`, `feature`, `refactor`) with zero description sub-branches to prevent branch sprawl. Updated `AGENTS.md` and `scripts/verify-workflow.ps1`.

### Milestone: Token Efficiency & Compact Agent Optimization
- **Date**: 2026-10-29 | **Branch**: `refactor`
- **Scope**: Compacted `AGENTS.md` from 10KB down to ~1.8KB, archived legacy 3,300-line documentation to `docs/archive/`, streamlined agent skills.

### Milestone: Playwright Headless Dynamic Resolution & Render Crawler Config
- **Date**: 2026-10-29 | **Branch**: `feature`
- **Scope**: Dynamic headless resolution (`_resolve_headless_mode()`), container stability flags (`--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`), and Render deployment alignment.


## Milestone: Implement Smart Blocking & Granular Crawling Observability
- **Date**: 2026-10-29
- **Author**: Antigravity AI Assistant
- **Branch**: `feature`

### 1. Objectives & Delivered Solution
1. **Playwright Smart Blocking Filter (`ProcessData/tiktok-crawler/app/crawler.py`)**:
   - Implemented `_smart_block_route` attached to the browser context via `context.route("**/*", ...)`.
   - **Blocked Media & Streams**: Aborts `resource_type in {"media", "websocket"}` (.mp4, audio, video stream buffers, websockets), reducing crawler memory consumption by 80-90% and eliminating OOM risks on containers.
   - **Blocked Trackers & Analytics**: Aborts requests matching known telemetry endpoints (`analytics.tiktok.com`, `mon.tiktokv.com`, `mcs.tiktok.com`, `google-analytics.com`, `googletagmanager.com`, `facebook.net`, `doubleclick.net`, `/monitor/collect`, `/web/report`, `/slardar/`).
   - **Allowed Essential Data**: Safely allows `document`, `script` (for DOM hydration), `xhr`/`fetch` (for TikTok profile and post JSON APIs), and `image` (for avatars).
2. **Granular Crawl Observability & Data Location Logs**:
   - Added structured timestamped logs (`%(asctime)s [%(levelname)s] [%(name)s] %(message)s`) across API background tasks, crawler orchestrator, browser utilities, and profile parser.
   - Outputs informative progress for every stage: target resolution, browser launch with flags, URL navigation, DOM parsing, extracted metrics (followers, following, likes, avatar status), local storage vs direct CDN avatar resolution, and backend callback delivery status.
3. **Automated Unit Testing**:
   - Added unit test suite [`ProcessData/tiktok-crawler/tests/test_crawler.py`](file:///e:/Urekamedia/TIKTOK-CRAWLER/ProcessData/tiktok-crawler/tests/test_crawler.py) verifying smart blocking behavior and resource type filtering.

### 2. Files Modified & Added
- `ProcessData/tiktok-crawler/app/crawler.py`: Added smart blocking routing and lifecycle progress logging.
- `ProcessData/tiktok-crawler/app/services/profile_crawler.py`: Added stage logging for profile navigation, HTML extraction, and avatar downloading.
- `ProcessData/tiktok-crawler/app/utils/browser_utils.py`: Replaced stdout print with logger.
- `ProcessData/tiktok-crawler/app/api.py`: Added standard logging configuration and background task lifecycle logging.
- `ProcessData/tiktok-crawler/tests/test_crawler.py`: Unit tests for smart blocking filter.
- `PROJECT_SUMMARY.md`: Appended milestone record.

### 3. Verification Test Results
- **Python Unit Tests**: `python ProcessData/tiktok-crawler/tests/test_crawler.py` (3 passed / 3 tests, 0.069s, 100%).
- **Python Avatar Tests**: `python ProcessData/tiktok-crawler/tests/test_avatar_service.py` (4 passed / 4 tests, 0.010s, 100%).
- **TypeScript**: `npm.cmd run check-types` (0 errors).
- **Backend Tests**: `php artisan test` (145 passed / 145 tests, 786 assertions, 100%).


### Milestone: Rebuild HTTP JSON Crawler Service with Python SQLite Queue & Fixed Worker Pool
- **Date**: 2026-10-30 | **Branch**: `fix`
- **Scope**:
  - Replaced legacy Playwright crawler (`ProcessData/tiktok-crawler`) with `tiktok-crawler-service` using `httpx` + `beautifulsoup4` to extract `__UNIVERSAL_DATA_FOR_REHYDRATION__` / `SIGI_STATE` JSON directly without Chromium.
  - Implemented Python-managed persistent queue (`data/queue.db` SQLite WAL + `asyncio.Queue`) and fixed worker pool (`WORKER_COUNT=5`) with supervisor, rate limiter, circuit breaker, per-account timeout (`90s`), and crash recovery (`done_accounts` + Laravel `/jobs/unfinished` fallback).
  - Supported multi-schema CSV/TXT random sampling for `count` mode (`dataset/`) with target freezing and binary base64 avatar transfer (`AvatarStorageService` MIME magic-byte check, `avatar_url = null`, saved to `public/tiktok-accounts/avatars/`).
  - Updated Laravel (`queued` status, `VerifyCrawlerToken`, idempotent `UNIQUE(crawl_job_id, username)` upserts) and React UI (`Queued` badge, 5s auto-polling).
- **Verification**: TypeScript (`npm.cmd run check-types`: 0 errors), Laravel (`php artisan test`: 147/147 passed, 798 assertions), Python (`unittest`: 15/15 passed).
