# CMS TikTok Crawler - Project Summary & Architecture

> [!NOTE]
> Detailed historical architecture and earlier milestones (3,300+ lines) are archived in [`docs/archive/historical-milestones.md`](docs/archive/historical-milestones.md) and [`docs/archive/PROJECT_SUMMARY_ARCHIVE.md`](docs/archive/PROJECT_SUMMARY_ARCHIVE.md).

## 1. System Overview
Enterprise modular TikTok crawler and management platform adhering to the **Ureka Architecture**:
- **Backend**: Laravel 13 (PHP 8.3+) with modular DDD (`modules/Core`, `modules/Auth`, `modules/Crawler`, `modules/TiktokAccount`). Dynamic route resolution via `DynamicRouteResovle`.
- **Frontend**: Single Page Application (SPA) with React 19, TypeScript, Redux Toolkit, Ant Design v6, and Tailwind CSS v4.
- **Crawler Service**: Python HTTP JSON asynchronous microservice with SQLite WAL queue & fixed worker pool (`tiktok-crawler-service`).
- **Asset Pipelines**: Laravel Mix (Webpack 5) production build + Vite HMR development mode.

---

## 2. Documentation Map
All in-depth technical runbooks and architecture specifications reside in [`docs/`](docs/README.md):
- **Overview & Structure**: [`docs/architecture/overview.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/architecture/overview.md)
- **Frontend Architecture**: [`docs/frontend/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/architecture.md)
- **Core Component Reusability**: [`docs/frontend/core-components.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/core-components.md)
- **Backend 3-Layer DDD**: [`docs/backend/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/architecture.md)
- **Audit Logging Guide**: [`docs/backend/audit-logging.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/audit-logging.md)
- **API & Dynamic Routes**: [`docs/api/routing-and-contracts.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/api/routing-and-contracts.md)
- **Database Schema & Migrations**: [`docs/database/schema-and-migrations.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/database/schema-and-migrations.md)
- **Crawler Microservice**: [`docs/crawler/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/crawler/architecture.md)
- **Coding Conventions**: [`docs/development/coding-standards.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/coding-standards.md)
- **Testing Standards**: [`docs/development/testing-guide.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/testing-guide.md)
- **Git & Release Protocol**: [`docs/development/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/git-workflow.md)
- **CI/CD & Deployments**: [`docs/deployment/ci-cd-architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/deployment/ci-cd-architecture.md)
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

### Milestone: Comprehensive Modular Documentation & Multi-Tier Agent Governance
- **Date**: 2026-11-02 | **Branch**: `refactor`
- **Scope**: Reorganized entire documentation system into domain folders (`docs/architecture/`, `docs/frontend/`, `docs/backend/`, `docs/api/`, `docs/database/`, `docs/crawler/`, `docs/development/`). Implemented Scoped Agent Rules in `.agents/rules/` and enhanced procedural skills. Streamlined root `AGENTS.md` to ~120 lines for maximum token efficiency.

### Milestone: Monorepo Architecture Refactoring & Decoupling (Steps 1–5)
- **Date**: 2026-11-02 | **Branch**: `refactor`
- **Scope**:
  - **Core Module**: Generic `BaseRepository<T>` & `BaseRepositoryInterface<T>`, decomposed 10 oversized components so 100% of Core frontend files are <150 lines.
  - **Foundation Modules**: Permission, Role, User, Auth, System standardized with strict 3-layer architecture (`Controller -> Service -> RepositoryInterface -> Repository`). Resolved legacy Model direct queries.
  - **Business Modules**: TiktokAccount, Crawler, API refactored with component decomposition, shared `@core/components/TiktokVideoTable` reusability, and resolved circular dependencies.
  - **Cross-Module Integration**: Verified inter-module route registry, automated menu tree building with RBAC gating, container service bindings across all 9 modules, and added comprehensive end-to-end integration test (`CrossModuleIntegrationTest.php` - 166 tests passing).
