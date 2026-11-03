# Monorepo Architecture Overview

This document describes the high-level system architecture, technology stack, and module interaction across the `TIKTOK-CRAWLER` platform.

---

## 1. System Topology

The platform consists of two decoupled application stacks connected via asynchronous HTTP webhooks and REST APIs:

```text
┌────────────────────────────────────────────────────────┐
│                   Web Browser (SPA)                    │
│           React 19 + TypeScript + Ant Design 6         │
└───────────────────────────┬────────────────────────────┘
                            │ JSON API (Sanctum Bearer)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 CMS Backend (Laravel 13)               │
│      Dynamic Routing · 3-Layer DDD Modules · Sanctum   │
└───────────────┬────────────────────────▲───────────────┘
                │ Dispatch Crawl Job     │ Webhook Streaming
                ▼                        │ (Account / Video / Done)
┌────────────────────────────────────────┴───────────────┐
│           Crawler Microservice (Python FastAPI)        │
│       AsyncIO · SQLite WAL Queue · Fixed 5 Workers     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / Rehydration
                            ▼
                    TikTok Web Endpoints
```

---

## 2. Technology Stacks

| Domain | Technologies | Details |
| :--- | :--- | :--- |
| **Backend CMS** | PHP ^8.3, Laravel ^13.17, Sanctum 4.0, Pest 4.7, Pint 1.27 | Modular DDD layout in `modules/`, dynamic route resolution, in-memory SQLite for tests |
| **Frontend SPA** | React 19.3, TypeScript 7.0 (`strict: false`), Ant Design 6.6, Tailwind 4.3, Redux Toolkit 2.13 | Single-page application, centralized route registry, Vite for development HMR, Laravel Mix for per-module production builds |
| **Crawler Engine** | Python 3.10+, FastAPI, `httpx`, `BeautifulSoup4`, `asyncio`, SQLite WAL | Headless HTTP client, SSR rehydration JSON extractor, local avatar downloader, rate limiter, circuit breaker |
| **Infrastructure** | Docker, Nginx, Render Web & Worker Services | Automated GitHub Actions CI/CD with Human Deploy Gate |

---

## 3. Monorepo Directory Organization

```text
TIKTOK-CRAWLER/
├── .agents/                 # AI Agent instructions, scoped rules, and skills
│   ├── rules/               # Scoped domain rules (frontend, backend, database, git)
│   └── skills/              # Reusable procedural task skills
├── cms-tiktok-crawler/      # Laravel 13 CMS backend & React 19 frontend
│   ├── app/                 # Minimal Laravel kernel boilerplate
│   ├── config/              # Laravel configuration files
│   ├── database/            # Global root migrations & seeders
│   ├── modules/             # Self-contained domain modules (API, Auth, Core, Crawler, etc.)
│   ├── public/              # Web root, avatar symlinks, entrypoints
│   ├── routes/              # Global routes (delegates to Core dynamic router)
│   └── tests/               # Pest feature and unit test suites
├── tiktok-crawler-service/  # Python crawler microservice
│   ├── app/                 # FastAPI routes, queue manager, worker engine, crawler client
│   └── tests/               # Python pytest suite
├── docker/                  # Dockerfiles for web, worker, crawler, and Nginx configs
├── docs/                    # Technical documentation & architecture manuals
└── scripts/                 # Automation scripts (worktree manager, verify workflow, PR helper)
```

---

## 4. Module Boundaries & Domain Ownership

All business domains live in `cms-tiktok-crawler/modules/`:

| Module | Responsibility | Key Endpoints / Controllers |
| :--- | :--- | :--- |
| **`API`** | External webhook ingress from the crawler microservice | `CrawlerResultController` (protected by `VerifyCrawlerToken`) |
| **`Auth`** | Authentication, token issuance, session refresh | `AuthController` (`/auth/login`, `/auth/me`, `/auth/logout`) |
| **`Core`** | Foundation infrastructure, base classes, dynamic router, shared UI | `BaseController`, `BaseRepository`, `DynamicRouteResovle`, `@core/components` |
| **`Crawler`** | Crawl job creation, monitoring, status tracking, result viewing | `CrawlJobController`, `CrawlResultController` |
| **`Permission`**| Dynamic RBAC permission management | `PermissionController` |
| **`Role`** | Role management and permission matrix assignment | `RoleController` |
| **`System`** | Audit logs, login history, system diagnostics, pruning | `ActivityLogController`, `LoginLogController`, `SystemSettingController` |
| **`TiktokAccount`** | Discovered TikTok profiles, historical metrics, videos | `TiktokAccountController` |
| **`User`** | Administrative user accounts and role assignments | `UserController` |
