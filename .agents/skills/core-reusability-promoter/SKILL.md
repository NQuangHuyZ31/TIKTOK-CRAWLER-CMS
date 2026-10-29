---
name: core-reusability-promoter
description: Reuses and promotes shared logic into modules/Core/.
---

# Core Reusability & Promotion

## 1. Core-First Protocol
Before implementing new UI components, utilities, or queries, check existing assets:
- **Backend**: `modules/Core/src/` (`BaseController`, `BaseRepository`, `Traits/`, `Utils/FetchApi.php`).
- **Frontend**: `modules/Core/resources/js/components/` (`ListLayout`, `Table`, `useAction`, `CustomModal`, `CardKPI`).

## 2. Rules
1. **Zero Redundant Overrides**: Never re-implement `BaseRepository` methods (`all`, `paginate`, `findById`, `create`, `update`, `delete`).
2. **Promote to Core**: If a utility or UI component is domain-agnostic and used by $\ge 2$ modules, put it in `modules/Core/`.
3. **Verification**: Run `npm.cmd run check-types` and `php artisan test` after changes.
