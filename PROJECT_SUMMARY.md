# Project Summary & Active Milestone Registry

> [!NOTE]
> Detailed historical architecture and earlier milestones (3,300+ lines) are archived in [`docs/archive/PROJECT_SUMMARY_ARCHIVE.md`](docs/archive/PROJECT_SUMMARY_ARCHIVE.md).

## 1. System Architecture Overview

The **CMS TikTok Crawler** platform follows a unified Ureka modular architecture:
- **Frontend**: React 19 + TypeScript + Ant Design v5 SPA served via Laravel Blade (`@moduleCss`, `@moduleJs`). Redux Toolkit for state.
- **Backend**: Laravel 11/12 REST API under `cms-tiktok-crawler/modules/` (`Core`, `Auth`, `System`, `Role`, `Permission`, `User`, `TiktokAccount`, `Crawler`, `API`).
- **Crawler Engine**: Python 3.12 FastAPI + Playwright Chromium (`ProcessData/tiktok-crawler/app/`) running on port 8001.
- **Infrastructure**: Render.com Web Services (Singapore region) + MySQL 8.0 + Redis Cache/Queue.

---

## 2. Active Milestone Registry

### Milestone: Token Efficiency & Compact Agent Optimization
- **Date**: 2026-10-29
- **Branch**: `refactor`
- **Scope**: Reduced token burn by 70%:
  - Compacted `AGENTS.md` from 10KB down to ~1.8KB (saving ~2,000 tokens on every AI turn).
  - Archived legacy 3,300-line documentation to `docs/archive/PROJECT_SUMMARY_ARCHIVE.md` (saving ~85,000 tokens per read).
  - Streamlined `.agents/skills/` to concise, single-purpose runbooks with 1-line YAML descriptions.

### Milestone: Fixed Category Branch Workflow & Zero Push to Main
- **Date**: 2026-10-29
- **Branch**: `refactor`
- **Scope**: Replaced worktree isolation and dynamic branch suffixes with 6 fixed category branches (`feature`, `fix`, `refactor`, `hotfix`, `test`, `chore`). Zero direct pushes to `main`. Added safety guard in `agent-pr.ps1`.

### Milestone: Centralization of .agents, docs, and PROJECT_SUMMARY at Root Level
- **Date**: 2026-10-29
- **Branch**: `refactor`
- **Scope**: Promoted `.agents/skills/`, `docs/`, and `PROJECT_SUMMARY.md` from `cms-tiktok-crawler/` subfolder to root workspace (`E:\Urekamedia\TIKTOK-CRAWLER\`).

### Milestone: Playwright Headless Dynamic Resolution & Render Crawler Config
- **Date**: 2026-10-29
- **Branch**: `feature`
- **Scope**: Implemented dynamic headless resolution (`_resolve_headless_mode()` in `config.py`), container stability flags (`--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`), and Render Free Web Service deployment alignment.

---

## 3. Core Tech Stack & Standards
- **TypeScript**: Strict React 19, zero compilation errors (`npm.cmd run check-types`).
- **Backend Tests**: 100% test pass rate (`php artisan test`).
- **Reusability**: Mandatory use of `@core/components` (`ListLayout`, `Table`, `useAction`) and `BaseController`/`BaseRepository`.
