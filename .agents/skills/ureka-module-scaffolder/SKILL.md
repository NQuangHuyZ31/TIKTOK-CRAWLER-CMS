---
name: ureka-module-scaffolder
description: Scaffolds Ureka modular architecture boilerplate for Backend and Frontend.
---

# Ureka Module Scaffolder

## 1. Directory Structure (`modules/<ModuleName>/`)
```text
modules/<ModuleName>/
├── database/migrations/
├── routes/api.php
├── resources/js/ (Action/, components/, configs/, pages/, routes/, store/)
└── src/ (Http/Controllers/, Models/, Providers/, Repositories/Interfaces/, Services/)
```

## 2. Standards
- **Backend (Strict 3-Layer Architecture)**:
  - **Controller**: Extends `BaseController`. Exclusively handles HTTP & validation; delegates all business logic to `Service`.
  - **Service**: Domain business logic, data mutations, transactions. Calls `Repository` interfaces via Dependency Injection.
  - **Repository**: Extends `BaseRepository` and implements `<Model>RepositoryInterface`. Handles all Eloquent queries. Bound in `ServiceProvider`.
- **Frontend (Modular & Decomposed Architecture)**:
  - **Path Aliases**: ONLY use `@core/...` and `@modules/<ModuleName>/...` instead of brittle `../../..` relative paths. NEVER declare per-module aliases (e.g. `@crawler`, `@user`).
  - **Configs Externalization (`configs/`)**: All presets, select options, dictionaries, and constants MUST be placed in `configs/`. Never inline in components.
  - **Component Decomposition (`components/`)**: Never write monolithic TSX pages (>150-200 lines). Decompose complex views into focused sub-components.
  - **Core Component Reusability**: Reusable UI widgets and controls must be placed in `@core` (`modules/Core/resources/js/components/`).
  - **State & API**: Typed API client via `@core/Action/api`. State managed via Redux slice in `store/`.
- **Verification**: Run `npm.cmd run check-types` and `php artisan test`.
