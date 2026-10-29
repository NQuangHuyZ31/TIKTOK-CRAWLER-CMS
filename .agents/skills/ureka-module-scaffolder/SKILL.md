---
name: ureka-module-scaffolder
description: >-
  Scaffolds a new Ureka module or expands an existing module following the strict Ureka
  Modular Architecture pattern across Backend (Model, Repository, Service, FormRequest,
  Resource, Controller, ServiceProvider, routes/api.php) and Frontend (Action API,
  components, configs, pages, routes, store). Use this skill when asked to create a new module,
  add a major feature domain, or generate standardized architectural boilerplate.
---

# Ureka Module Scaffolder Runbook

This skill provides step-by-step instructions for scaffolding or expanding a feature module in `modules/<ModuleName>/`.

---

## 1. Pre-Flight Checklist

Before generating files:
1. **Name Format**: Choose a `PascalCase` module name (e.g., `Notification`, `Report`, `Crawler`).
2. **Namespace**: Backend code must reside under namespace `Modules\<ModuleName>\`.
3. **Core Check**: Review [`docs/CORE_MODULE_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/CORE_MODULE_GUIDE.md) to reuse existing Core components (BaseController, BaseRepository, TableComponent, CardKPI, etc.).

---

## 2. Backend Generation Sequence (`modules/<ModuleName>/src/`)

Create the directory structure:
```text
modules/<ModuleName>/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── src/
    ├── Http/
    │   ├── Controllers/
    │   ├── Middleware/
    │   └── Requests/
    ├── Models/
    ├── Providers/
    ├── Repositories/
    │   └── Interfaces/
    ├── Resources/
    └── Services/
```

### Step 2.1: Model & Migration
- Create migration in `modules/<ModuleName>/database/migrations/`.
- Create Model in `modules/<ModuleName>/src/Models/<Entity>.php`.

### Step 2.2: Repository Interface & Implementation
- Interface: `modules/<ModuleName>/src/Repositories/Interfaces/<Entity>RepositoryInterface.php`:
  Must extend `Modules\Core\Repositories\Interfaces\BaseRepositoryInterface`.
- Implementation: `modules/<ModuleName>/src/Repositories/<Entity>Repository.php`:
  Must extend `Modules\Core\Repositories\BaseRepository` and implement the interface.

### Step 2.3: Service Layer
- Create `modules/<ModuleName>/src/Services/<Entity>Service.php` for business logic.

### Step 2.4: Form Requests & API Resources
- Create Form Request in `modules/<ModuleName>/src/Http/Requests/Store<Entity>Request.php`.
- Create API Resource in `modules/<ModuleName>/src/Resources/<Entity>Resource.php`.

### Step 2.5: Controller
- Create Controller in `modules/<ModuleName>/src/Http/Controllers/<Entity>Controller.php`.
- **Must extend** `Modules\Core\Http\Controllers\BaseController`.
- Define `$modelClass`, `$resourceClass`, `$searchableColumns`, `$filterableColumns`, `$defaultSort`.

### Step 2.6: Module Service Provider
- Create `modules/<ModuleName>/src/Providers/<ModuleName>ServiceProvider.php`.
- Bind the Repository Interface to its Implementation.
- Register routes or dynamic route resolver.

### Step 2.7: Composer Autoload
Ensure `composer.json` maps:
```json
"Modules\\<ModuleName>\\": "modules/<ModuleName>/src/",
"Modules\\<ModuleName>\\Database\\Seeders\\": "modules/<ModuleName>/database/seeders/"
```
Then run:
```powershell
composer dump-autoload
```

---

## 3. Frontend Generation Sequence (`modules/<ModuleName>/resources/js/`)

Create directory structure:
```text
modules/<ModuleName>/resources/js/
├── Action/
├── components/
├── configs/
├── pages/
├── routes/
├── store/
└── index.ts
```

### Step 3.1: Typed Action API Caller
Create `modules/<ModuleName>/resources/js/Action/<entity>.ts`:
```typescript
import { api } from '@core/Action/api';

export const getItems = (params: Record<string, any> = {}) =>
    api('/<module-kebab>/<entity-kebab>', { params });

export const getItemByID = (id: string | number) =>
    api(`/<module-kebab>/<entity-kebab>/${id}`);
```

### Step 3.2: Redux Store Slices & Thunks
Create `<entity>Slice.ts` and `<entity>Thunks.ts` in `store/`.

### Step 3.3: Route Auto-Registration
Define routes in `modules/<ModuleName>/resources/js/routes/route.ts` exporting `RouteObject[]`.

### Step 3.4: Reusable UI Pages & Components
Use `TableComponent`, `ListLayout`, `PageHeader`, `CustomModal` from `@core/components`. All UI strings and labels must be in English.

---

## 4. Verification

1. Verify TypeScript types:
   ```powershell
   npm.cmd run check-types
   ```
2. Write a Feature Test in `tests/Feature/<ModuleName>Test.php`.
3. Run the test:
   ```powershell
   php artisan test --filter <ModuleName>Test
   ```
