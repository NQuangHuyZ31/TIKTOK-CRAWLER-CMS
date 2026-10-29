---
name: core-reusability-promoter
description: >-
  Inspects modules/Core/ before building any new component or service, checks for existing
  solutions to reuse, evaluates whether new logic should be promoted to Core, and guides
  refactoring to keep Core modular, DRY, and well-exported. Use this skill when implementing
  generic UI widgets, utilities, traits, or when refactoring duplicate logic into modules/Core/.
---

# Core Reusability & Promotion Runbook

This skill guides the agent in enforcing the Core-First architecture rule, preventing duplicate implementations, and promoting cross-cutting functionality into `modules/Core/`.

---

## 1. The Core Inspection Protocol

Whenever starting a task that introduces new logic, a utility function, a database query pattern, or a UI component:

1. **Scan Existing Core Assets**:
   - Check Backend: `modules/Core/src/Controllers/BaseController.php`, `Repositories/BaseRepository.php`, `Traits/`, `Utils/`.
   - Check Frontend: `modules/Core/resources/js/components/`, `hooks/`, `utils/`, `Action/api.ts`.
   - Consult [`docs/CORE_MODULE_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/CORE_MODULE_GUIDE.md).
2. **Reuse If Available**:
   - If a matching or adaptable asset exists, import and configure it.
   - Do **NOT** write custom table wrappers, custom modals, or custom HTTP clients when `TableComponent`, `CustomModal`, or `api.ts` already exist.
3. **Zero Redundant Overrides in Repositories & Controllers**:
   - Never override or re-implement methods provided by `BaseRepository` (`all`, `paginate`, `findById`, `findOrFail`, `create`, `update`, `delete`) unless altering domain logic with good reason.
   - Repository interfaces must extend `BaseRepositoryInterface` rather than re-declaring base methods.
   - Always query via `$this->model` (`$this->model->where(...)`, `$this->model->count()`) instead of static model calls (`Permission::where(...)`).
4. **Strict Ban on Barrel Re-Export `index.ts` Files**:
   - Never create `index.ts` files solely for re-exporting (`export * from ...`).
   - Use explicit, direct imports to specific files (`import PermissionGate from '@core/components/PermissionGate'`).

---

## 2. Promotion Assessment Matrix

Evaluate whether a new candidate asset belongs in `modules/Core/`:

| Dimension | Characteristic | Belong in Core? |
| :--- | :--- | :--- |
| **Domain Dependence** | Depends on specific database tables like `crawl_jobs` or `tiktok_accounts` | ❌ No (Keep in Module) |
| **Domain Agnostic** | Generic data handling, formatting, pagination, UI interaction, or authentication | ✅ Yes (Promote to Core) |
| **Usage Scope** | Used or likely to be used by 2 or more modules | ✅ Yes (Promote to Core) |
| **Visual / Design System**| Defines standard layout, dialog, badge, or notification behavior | ✅ Yes (Promote to Core) |

---

## 3. Step-by-Step Promotion Procedure

### Promoting a Backend Asset (Trait, Utility, Base Class):
1. Create the class or trait under `modules/Core/src/<Subdir>/` (e.g. `modules/Core/src/Traits/<TraitName>.php`).
2. Use strict types, PSR-12, and English PHPDoc blocks.
3. If necessary, write a unit test in `tests/Unit/<AssetName>Test.php`.
4. Import and use the promoted class inside the feature module.

### Promoting a Frontend Asset (Component, Hook, Utility):
1. Create the component under `modules/Core/resources/js/components/<ComponentName>.tsx` or utility in `modules/Core/resources/js/utils/<utilName>.ts`.
2. Define explicit TypeScript props interfaces (`<ComponentName>Props`).
3. Export the component and its types in [`modules/Core/resources/js/components/index.ts`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/index.ts).
4. Run `npm.cmd run check-types` to ensure zero compilation errors.
5. Replace feature module occurrences with the newly exported Core asset.

---

## 4. Post-Promotion Verification

1. Verify TypeScript compiles cleanly:
   ```powershell
   npm.cmd run check-types
   ```
2. Verify all tests pass:
   ```powershell
   php artisan test
   ```
3. Document the new Core capability in [`docs/CORE_MODULE_GUIDE.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/CORE_MODULE_GUIDE.md).
