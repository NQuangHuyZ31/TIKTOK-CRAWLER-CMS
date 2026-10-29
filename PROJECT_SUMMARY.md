# CMS TikTok Crawler - Project Summary & Architecture

> [!NOTE]
> Detailed historical architecture and earlier milestones (3,300+ lines) are archived in [`docs/archive/historical-milestones.md`](docs/archive/historical-milestones.md) and [`docs/archive/PROJECT_SUMMARY_ARCHIVE.md`](docs/archive/PROJECT_SUMMARY_ARCHIVE.md).

## 1. System Overview
Enterprise modular TikTok crawler and management platform adhering to the **Ureka Architecture**:
- **Backend**: Laravel 12 (PHP 8.3+) with modular DDD (`modules/Core`, `modules/Auth`, `modules/Crawler`, `modules/TiktokAccount`). Dynamic route resolution via `DynamicRouteResovle`.
- **Frontend**: Single Page Application (SPA) with React 19, Strict TypeScript (100%), Redux Toolkit, Ant Design v6, and Tailwind CSS v4.
- **Crawler Service**: Python Playwright asynchronous scraping microservice (`ProcessData/tiktok-crawler`).
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
