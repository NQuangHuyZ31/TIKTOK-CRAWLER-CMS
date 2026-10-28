# CMS TikTok Crawler Platform

Enterprise Monorepo Platform for distributed TikTok account data aggregation, analytics, and administrative management.

Built with **Laravel 11/13 + React 19 SPA (Ant Design 5 & Tailwind CSS)** and an asynchronous **Python FastAPI + Playwright** crawling engine, orchestrated for automated deployment on **Render.com**.

---

## 🏗️ Repository Architecture

The monorepo encompasses three primary components:
1. **`cms-tiktok-crawler/`**: Backend REST API (Modular PHP 8.3 Ureka Architecture) and compiled React 19 Admin SPA.
2. **`ProcessData/tiktok-crawler/`**: High-performance Python FastAPI crawler service utilizing Playwright.
3. **`docker/` & `render.yaml`**: Multi-container Docker deployment architecture supporting web, queue worker, crawler worker, and cron scheduler on Render.com.

---

## 🚀 Development Workflow & CI/CD Standards

Development follows strict quality, concurrency, and release security controls:

### 1. Isolated Git Worktree Protocol
The root repository is strictly an **idle anchor** tracking `main`. All tasks, feature branches, and test executions run inside persistent worktree slots:
```powershell
# List available slots and port mappings
.\scripts\agent-worktree.ps1 -Action List

# Allocate a slot and branch off origin/main
.\scripts\agent-worktree.ps1 -WorktreeIndex 1 -Branch "feature/PROJ-101-proxy-rotation" -CreateBranch
```
👉 Read the [Git Worktree Architecture Manual](cms-tiktok-crawler/docs/development/git-worktree-workflow.md).

### 2. Standard Branch Naming & Conventional Commits
- Branches: `<type>/<task-id>-<description>` (`feature/`, `fix/`, `hotfix/`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`).
- Commits: Conventional Commits in clear English (`feat:`, `fix:`, `chore:`, etc.).
- Direct pushes to `main` are strictly forbidden; all integration requires Pull Requests with passing CI status checks.

### 3. CI/CD Quality Gates (`.github/workflows/ci.yml`)
Every push and PR undergoes automated validation:
- **Strict TypeScript Verification**: `npm.cmd run check-types` (0 errors required).
- **Backend Test Suite**: `php artisan test` (100% passing required).
- **PHP Code Style**: `vendor/bin/pint --test`.
- **Database Migration Validation**: SQLite in-memory test migrations.
- **Security Audits**: Automated Composer and NPM vulnerability scanning.
👉 Read the [CI/CD Pipeline Architecture](cms-tiktok-crawler/docs/deployment/ci-cd-architecture.md).

### 4. Semantic Versioning & Draft Release Automation (`auto-draft-release.yml`)
- Bumping the version in `cms-tiktok-crawler/package.json` and merging into `main` automatically prepares a **GitHub Draft Release** with packaged archive assets and conventional commits changelog.
- **A Draft Release NEVER deploys to production.**
👉 Read the [Release Management Manual](cms-tiktok-crawler/docs/deployment/release-management.md).

### 5. Controlled Render Production Deployment (`deploy.yml`)
- Production deployment activates **exclusively** upon publishing an approved GitHub Release (`vX.Y.Z`) or through an authorized `workflow_dispatch`.
- Triggers deploy hooks across `cms-tiktok-web`, `cms-tiktok-crawler`, and `cms-tiktok-queue`.
- Post-deployment automated health check loop probes `https://cms-tiktok-web.onrender.com/api/health` verifying HTTP 200 and healthy status.
- Automated rollback procedures are provided if health checks fail.
👉 Read the [Render Production Deployment Playbook](cms-tiktok-crawler/docs/deployment/render-deployment.md).

---

## 📚 Complete Documentation Index

| Documentation Guide | Scope |
| :--- | :--- |
| [AI Agent Manual (`AGENTS.md`)](AGENTS.md) | Mandatory agent operating instructions and core reusability rules |
| [Worktree Workflow Manual](cms-tiktok-crawler/docs/development/git-worktree-workflow.md) | Multi-agent concurrency, persistent worktrees, and branch lifecycle |
| [CI/CD Architecture](cms-tiktok-crawler/docs/deployment/ci-cd-architecture.md) | GitHub Actions workflows, quality checks, and branch protection |
| [Release Management](cms-tiktok-crawler/docs/deployment/release-management.md) | Semantic Versioning, Draft Releases, changelog generation |
| [Render Deployment Playbook](cms-tiktok-crawler/docs/deployment/render-deployment.md) | Infrastructure as Code, health checks, rollback procedures |
| [Core Module Guide](cms-tiktok-crawler/docs/CORE_MODULE_GUIDE.md) | Inventory of Core reusable components, hooks, and traits |
| [Coding Standards](cms-tiktok-crawler/docs/CODING_STANDARDS.md) | TypeScript, PSR-12, architectural standards |
| [Testing Guide](cms-tiktok-crawler/docs/TESTING_GUIDE.md) | PHPUnit, Pest, and frontend testing practices |
