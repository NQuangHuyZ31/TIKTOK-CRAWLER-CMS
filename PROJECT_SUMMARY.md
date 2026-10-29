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


### 3. Verification Test Results
- **TypeScript**: `npm.cmd --prefix cms-tiktok-crawler run check-types` (0 errors).
- **Backend Tests**: `php artisan test` (145 passed / 145 tests, 786 assertions, 100%).


## Milestone: Fix AvatarService IndexError in Deployed Container Environment
- **Date**: 2026-10-29
- **Author**: Antigravity AI Assistant
- **Branch**: `fix/crawler-avatar-service-index-error`

### 1. Root Cause & Solution
- **Bug**: In `ProcessData/tiktok-crawler/app/services/avatar_service.py`, `self.project_root` was hardcoded to `Path(__file__).resolve().parents[4]`. When deployed inside a Docker container (where the app root is `/app`), `/app/app/services/avatar_service.py` has only 4 parent levels (`/app/app/services`, `/app/app`, `/app`, `/`). Accessing index `[4]` raised `IndexError: 4`, causing `TikTokCrawler` and the crawl job background task to crash immediately on `/api/crawl-jobs/start`.
- **Solution**:
  1. Replaced hardcoded `parents[4]` indexing with a safe upward traversal `_find_project_root()` that searches parent directories for `cms-tiktok-crawler` without risk of `IndexError`.
  2. Supported flexible environment variable overrides (`AVATAR_DIR` and `PUBLIC_STORAGE_DIR`).
  3. Made avatar downloading gracefully optional: if deployed in an isolated container without shared storage (`avatar_dir` is `None`), `download()` returns `None`, safely preserving the original CDN `avatar_url` without throwing errors or breaking web UI avatar rendering.
  4. Added comprehensive unit tests in `ProcessData/tiktok-crawler/tests/test_avatar_service.py` to prevent regressions.

### 2. Files Modified & Added
- `ProcessData/tiktok-crawler/app/services/avatar_service.py`: Fixed `_find_project_root()` and added robust storage resolution.
- `ProcessData/tiktok-crawler/tests/test_avatar_service.py`: Added automated unit test suite.
- `PROJECT_SUMMARY.md`: Recorded milestone entry.

### 3. Verification Test Results
- **Python Unit Tests**: `python ProcessData/tiktok-crawler/tests/test_avatar_service.py` (4 passed / 4 tests, 0.013s, 100%).
- **TypeScript**: `npm.cmd run check-types` (0 errors).
- **Backend Tests**: `php artisan test` (145 passed / 145 tests, 786 assertions, 100%).

## 3. Core Tech Stack & Standards
- **TypeScript**: Strict React 19, zero compilation errors (`npm.cmd run check-types`).
- **Backend Tests**: 100% test pass rate (`php artisan test`).
- **Reusability**: Mandatory use of `@core/components` (`ListLayout`, `Table`, `useAction`) and `BaseController`/`BaseRepository`.

