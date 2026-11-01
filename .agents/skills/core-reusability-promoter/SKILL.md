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
2. **Promote Reusable Components to Core**: If a UI component, form control, preset selector, or widget is domain-agnostic or has potential reusability across >= 2 views/modules, place it in `modules/Core/resources/js/components/` (`@core`).
3. **Config Externalization**: Presets, constants, dictionaries, and options must always live in `configs/`, never hardcoded inline.
4. **Component Decomposition**: Never build monolithic TSX files (>150-200 lines). Decompose into focused subcomponents.
5. **Verification**: Run `npm.cmd run check-types` and `php artisan test` after changes.
