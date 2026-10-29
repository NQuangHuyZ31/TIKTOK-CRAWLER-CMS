# Project Directory Structure & Architecture

This document provides a detailed breakdown of the directory layout, the Ureka Modular Architecture, and the responsibilities of each layer within the `cms-tiktok-crawler` repository.

---

## 1. Architectural Overview

The project adheres to the **Ureka Modular Architecture**:
- **Backend**: Laravel 11/12 (PHP 8.3+) organized into self-contained modules under `modules/`, isolating business features completely from the default `app/` folder.
- **Frontend**: Single Page Application (SPA) built with React 19, TypeScript, Redux Toolkit, Ant Design v6, and Tailwind CSS v4, co-located in `modules/<ModuleName>/resources/js/`.
- **Dynamic Routing**: Powered by `DynamicRouteResovle` in `Core`, mapping URLs directly to module controllers without static manual route registration.
- **Dual Build Pipelines**:
  - **Laravel Mix (Webpack 5)**: Compiles each module into two predictable assets (`index.js`, `app.css`) referenced via `public/entrypoints.json`.
  - **Vite**: Provides instant Hot Module Replacement (HMR) during local development.

---

## 2. High-Level Directory Tree

```text
cms-tiktok-crawler/
├── app/                                 # Standard Laravel boilerplate (Console kernels, basic models)
├── bootstrap/                           # Laravel bootstrap routines (app.php, providers.php)
├── config/                              # Global configuration files (admin.php, auth.php, database.php...)
├── database/                            # Global database migrations & seeders
│   ├── factories/
│   ├── migrations/                      # Root migrations (users, crawl_jobs, crawl_results...)
│   └── seeders/                         # Master DatabaseSeeder
├── docs/                                # Technical Documentation & Agent Manuals (English)
│   ├── API_GUIDE.md                     # API development & dynamic route guide
│   ├── CODING_STANDARDS.md              # Coding conventions & language standards
│   ├── CORE_MODULE_GUIDE.md             # Core module capabilities & reusability manual
│   ├── FRONTEND_ARCHITECTURE.md         # React 19, TypeScript & UI standards
│   ├── GIT_WORKFLOW.md                  # Persistent worktree protocol & Git standards
│   ├── PROJECT_STRUCTURE.md             # This document
│   └── TESTING_GUIDE.md                 # Automated test guidelines & execution commands
├── modules/                             # === UREKA BUSINESS MODULES LAYER ===
│   ├── API/                             # Public API & Webhook endpoints
│   ├── Auth/                            # Authentication, Sanctum tokens, RBAC permissions
│   ├── Core/                            # Shared infrastructure, BaseController, UI components, Layouts
│   ├── Crawler/                         # TikTok data crawling orchestration & job scheduling
│   ├── Permission/                      # Granular permission management
│   ├── Role/                            # Role definitions and role-permission matrices
│   ├── System/                          # System settings & runtime parameters
│   ├── TiktokAccount/                   # Crawled TikTok creator profiles & analytics
│   └── User/                            # Internal CMS user management
├── public/                              # Public web root & asset manifests (entrypoints.json)
├── routes/                              # Laravel root route files
├── scripts/                             # Build & maintenance scripts (mix-module.cjs...)
├── storage/                             # Logs, cache, and uploaded files
├── tests/                               # Automated test suites
│   ├── Feature/                         # Integration & Feature tests
│   └── Unit/                            # Isolated Unit tests
├── AGENTS.md                            # Primary instructions and Golden Rules for AI agents
├── composer.json                        # PHP dependencies & PSR-4 autoload mapping
├── package.json                         # Node dependencies, Mix/Vite scripts, typecheck
├── phpunit.xml                          # PHPUnit test runner configuration
├── tsconfig.json                        # TypeScript compiler options
└── vite.config.ts                       # Vite configuration
```

---

## 3. Detailed Anatomy of a Module (`modules/<ModuleName>/`)

Each module encapsulates both its backend domain logic and frontend user interface:

```text
modules/<ModuleName>/
├── composer.json                        # Optional module metadata
├── database/                            # Module-specific migrations and seeders
│   ├── migrations/
│   └── seeders/
├── resources/                           # Frontend Assets & Views
│   ├── css/
│   │   └── app.css                      # Scoped module styling
│   ├── js/                              # TypeScript / React code
│   │   ├── Action/                      # Typed API client methods (e.g., crawlJob.ts)
│   │   ├── components/                  # Internal reusable components
│   │   ├── configs/                     # Table definitions, form schemas, constants
│   │   ├── pages/                       # Page components (e.g., ListPage, DetailPage)
│   │   ├── routes/                      # Route definitions for React Router (route.ts)
│   │   ├── store/                       # Redux Toolkit slice & async thunks
│   │   └── index.ts                     # Module barrel export
│   └── views/                           # Blade templates (e.g., Core's app.blade.php)
├── routes/
│   └── api.php                          # Route definitions or DynamicRouteResovle hook
└── src/                                 # === BACKEND PHP (PSR-4: Modules\<ModuleName>\) ===
    ├── Http/                            # HTTP Transport Layer
    │   ├── Controllers/                 # Controllers extending Modules\Core\Http\Controllers\BaseController
    │   ├── Middleware/                  # Custom middleware
    │   └── Requests/                    # Form Requests for input validation
    ├── Models/                          # Eloquent entity models
    ├── Providers/                       # Module Service Provider (dependency bindings)
    ├── Repositories/                    # Repository pattern
    │   ├── Interfaces/                  # Interface contracts extending BaseRepositoryInterface
    │   └── <Entity>Repository.php       # Implementation extending BaseRepository
    ├── Resources/                       # Eloquent API JSON resources
    └── Services/                        # Complex domain and business services
```

---

## 4. Key Modules Summary

| Module Name | Core Responsibility |
| :--- | :--- |
| **`Core`** | **Foundational Backbone**: Houses `BaseController`, `BaseRepository`, `ApiResponseTrait`, `DynamicRouteResovle`, shared UI components (`TableComponent`, `CardKPI`, `ResourceForm`), Admin Layout, Redux root store, and Blade Shell (`app.blade.php`). Always check this module first before writing new code. |
| **`Auth`** | **Authentication & Security**: Handles login, logout, refresh tokens, password resets, RBAC module permission gates, and login audit logs (`auth_login_logs`). |
| **`Crawler`** | **Crawling Pipeline**: Orchestrates TikTok scraping jobs by usernames, URLs, or count, tracks job statuses, and persists crawled output. |
| **`TiktokAccount`** | **Creator Data**: Manages harvested TikTok accounts, profile metadata, engagement statistics, and hashtag classification. |
| **`User`** | **CMS Accounts**: Manages internal users, role assignments, and account statuses. |
| **`Role`** | **Access Roles**: Manages roles (Super Admin, Operator, Viewer) and associates permissions. |
| **`Permission`** | **Access Matrix**: Fine-grained permissions by module and action (`view`, `create`, `edit`, `delete`). |
| **`System`** | **Configuration**: System parameters, proxy pools, and crawler runtime options. |
| **`API`** | **Public & Webhooks**: Ingestion webhooks for external crawler worker nodes. |

---

## 5. Autoloading & Namespace Conventions

Namespace mapping strictly adheres to **PSR-4** defined in root `composer.json`:
- `Modules\Core\` $\rightarrow$ `modules/Core/src/`
- `Modules\Crawler\` $\rightarrow$ `modules/Crawler/src/`
- `Modules\<ModuleName>\` $\rightarrow$ `modules/<ModuleName>/src/`
- `Modules\<ModuleName>\Database\Seeders\` $\rightarrow$ `modules/<ModuleName>/database/seeders/`

> Whenever creating a new module or updating class namespaces, run:
> ```powershell
> composer dump-autoload
> ```
