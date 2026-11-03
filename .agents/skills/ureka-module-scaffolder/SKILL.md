---
name: ureka-module-scaffolder
description: Scaffolds Ureka modular architecture boilerplate for Backend (Laravel 13) and Frontend (React 19).
---

# Ureka Module Scaffolder Skill

Use this skill when scaffolding a new domain module in `cms-tiktok-crawler/modules/<ModuleName>/`.

Rules: [`.agents/rules/backend.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/backend.md) | [`.agents/rules/frontend.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/frontend.md) | Architecture: [`docs/backend/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/architecture.md)

---

## 1. Directory Structure (`modules/<ModuleName>/`)
```text
modules/<ModuleName>/
├── composer.json
├── database/migrations/
├── routes/api.php
├── resources/js/ (Action/, components/, configs/, pages/, routes/, store/, index.ts)
└── src/ (Http/Controllers/, Http/Requests/, Models/, Providers/, Repositories/Interfaces/, Services/, Resources/)
```

---

## 2. Step-by-Step Scaffolding Checklist

### Step 1: Backend Layer
1. **Model & Migration**: Plural table name, explicit `$fillable` array. Attach `LogsActivity` if auditable.
2. **Repository & Interface**:
   - Interface: `src/Repositories/Interfaces/<Model>RepositoryInterface.php`.
   - Implementation: `src/Repositories/<Model>Repository.php` extending `BaseRepository`.
3. **Service Layer**: `src/Services/<Model>Service.php`. Injects repository interface. **NO Model queries in Service**. Handles `DB::transaction()`.
4. **FormRequest & Controller**:
   - `src/Http/Requests/Store<Model>Request.php`.
   - `src/Http/Controllers/<Model>Controller.php` extending `BaseController`.
5. **ServiceProvider**: `src/Providers/<ModuleName>ServiceProvider.php`. Binds repository interface to implementation.

### Step 2: System Registration
1. In `modules/Core/configs/modules.php`: Add slug to `'routes'` and module name to `'modules'`.
2. In `package.json`: Add mix build script `"mix:<module>": "node scripts/mix-module.cjs <ModuleName>"`.

### Step 3: Frontend Layer
1. **API Client**: `resources/js/Action/<name>.ts` using `http` from `@core/Action/api`.
2. **Configs**: Declare column configs and filter presets in `resources/js/configs/`.
3. **Pages**: Create page orchestrator in `resources/js/pages/`. Reuse `@core/components/{ListLayout, Table}`.
4. **Routes**: Declare `RouteDef[]` in `resources/js/routes/route.ts` and register via `registerRoutes()` in `resources/js/index.ts`.

---

## 3. Verification
```powershell
# From cms-tiktok-crawler/
npm.cmd run check-types
php artisan test --filter <ModuleName>Test
```
