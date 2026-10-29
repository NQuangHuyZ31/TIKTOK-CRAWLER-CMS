# CMS TikTok Crawler - Project Summary & Architecture

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
- **Legacy Architecture Details**: [`docs/archive/legacy-architecture-details.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/archive/legacy-architecture-details.md)

---

## 3. Essential Quality Verification Commands
```powershell
npm.cmd run check-types               # TypeScript strict type checking (0 errors)
php artisan test                      # Backend test suite (100% pass)
powershell scripts/verify-workflow.ps1 # Workflow and release gate verification
```

---

## 4. Recent Milestones

### Milestone: Single Branch Standardization for Task Workflows
- **Date**: 2026-10-29 | **Branch**: `fix`
- Enforced single-branch policy (`fix`, `feature`, `refactor`) with zero description sub-branches to prevent branch sprawl.
- Updated `AGENTS.md`, `scripts/verify-workflow.ps1` (35/35 tests pass), and `scripts/agent-worktree.ps1`.

### Milestone: Fix AvatarService IndexError in Container Deployment
- **Date**: 2026-10-29 | **Branch**: `fix`
- Replaced hardcoded `parents[4]` with dynamic `_find_project_root()` in `ProcessData/tiktok-crawler/app/services/avatar_service.py`.
- Graceful avatar handling when deployed without shared volume; added automated unit tests.

### Milestone: Project-Wide Centralization of .agents, docs, and PROJECT_SUMMARY.md
- **Date**: 2026-10-29 | **Branch**: `main`
- Centralized `.agents/skills/`, `docs/`, and `PROJECT_SUMMARY.md` at repository root.
- Removed subfolder duplicates and enabled git tracking for agent skills.
