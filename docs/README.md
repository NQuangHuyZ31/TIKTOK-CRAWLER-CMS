# Documentation Index & Architecture Map

Welcome to the `TIKTOK-CRAWLER` technical documentation system.
This directory contains architectural specifications, developer guides, database schemas, and operational runbooks.

---

## 1. Quick Navigation by Topic

### Architecture & System Overview
- [Architecture Overview](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/architecture/overview.md) — High-level system topology, technology stack, and module boundaries.

### Frontend Engineering (React 19 + TypeScript + Ant Design 6)
- [Frontend Architecture](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/architecture.md) — SPA routing, Redux Toolkit state management, and English-only UI standards.
- [Core Components Catalog](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/core-components.md) — Catalog of reusable tables, filters, modals, cards, and formatting hooks.

### Backend Engineering (Laravel 13 + PHP 8.3+)
- [Backend Architecture](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/architecture.md) — Strict 3-layer architecture (Controller -> Service -> Repository) and base classes.
- [Universal Audit Logging](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/audit-logging.md) — Automated model mutations tracking (`LogsActivity`) and business action logging (`ActivityLogger`).

### API Contracts & Routing
- [API Routing & Contracts](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/api/routing-and-contracts.md) — Dynamic route resolution (`DynamicRouteResovle`), RBAC permissions, and standardized response formats.

### Database & Schemas
- [Database Schema & Migrations](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/database/schema-and-migrations.md) — Database table specifications, index design, and soft deletes conventions.

### Crawler Microservice (Python FastAPI)
- [Crawler Service Architecture](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/crawler/architecture.md) — Asynchronous crawler engine, SQLite WAL queue, 5-worker pool, and anti-blocking defenses.

### Development Standards & Quality Assurance
- [SOLID Principles & Architecture](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/solid-principles.md) — Mandatory SOLID coding rules, God Class/Component prevention, and review checklist.
- [Coding Standards](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/coding-standards.md) — Naming conventions, PSR-12, TypeScript standards, and English-only requirement.
- [Automated Testing Guide](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/testing-guide.md) — Pest feature test templates, unit tests, and type checking commands.
- [Git Workflow & Release Management](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/git-workflow.md) — Branch strategies (single-workspace & worktree slots), Conventional Commits, and Human Deploy Gate.

### Infrastructure & Deployment
- [CI/CD Pipeline Architecture](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/deployment/ci-cd-architecture.md) — Breakdown of GitHub Actions workflows.
- [Release Management & SemVer](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/deployment/release-management.md) — Release candidate lifecycle and automated draft release generation.
- [Render Deployment Playbook](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/deployment/render-deployment.md) — Render IaC configuration (`render.yaml`), health checks, and rollback procedures.

### Historical Archives (Preserved Reference)
- [Historical Milestones 1–50](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/archive/historical-milestones.md) — Comprehensive archive of early development milestones (300+ KB).
- [Legacy Architecture Details](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/archive/legacy-architecture-details.md) — Historical reference notes (43 KB).
- [Project Summary Archive](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/archive/PROJECT_SUMMARY_ARCHIVE.md) — Complete historical milestone log (360 KB).

---

## 2. AI Agent Navigation Path

When completing tasks in this repository, follow this progressive loading path:

| Task Domain | Mandatory Rules | Relevant Skills | Deep Architecture Docs |
| :--- | :--- | :--- | :--- |
| **Frontend UI / Pages** | `.agents/rules/frontend.md` | `core-reusability-promoter` | `docs/frontend/architecture.md`<br>`docs/frontend/core-components.md`<br>`docs/development/solid-principles.md` |
| **Backend API / Service**| `.agents/rules/backend.md`<br>`.agents/rules/database.md` | `ureka-module-scaffolder` | `docs/backend/architecture.md`<br>`docs/api/routing-and-contracts.md`<br>`docs/development/solid-principles.md` |
| **Database Migration** | `.agents/rules/database.md` | `ureka-module-scaffolder` | `docs/database/schema-and-migrations.md` |
| **Git / Commits / PRs** | `.agents/rules/git-workflow.md` | `git-workflow` | `docs/development/git-workflow.md` |
