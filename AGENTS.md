# AGENTS.md - Engineering Rulebook

Scope: Monorepo. `MUST`/`NEVER` = mandatory; `SHOULD` = default.
Hierarchy: 1. Code & runtime > 2. Manifests > 3. Tests & CI > 4. Docs (`docs/`) > 5. Rules.

## 1. Architecture Map & Scoped Navigation
- `cms-tiktok-crawler/`: Laravel 13 + React 19 SPA (AntD 6). Run `npm`/`php artisan` here.
- `tiktok-crawler-service/`: Python FastAPI microservice (SQLite WAL). Independent stack.
- Modules: `API, Auth, Core, Crawler, Permission, Role, System, TiktokAccount, User`.
- **Dynamic Routing**: `Core/src/Support/DynamicRouteResovle.php` maps `/{module}/{controller}/{id?}/{action?}`. Every `public` method is an HTTP endpoint; helpers MUST be `protected`/`private`. RBAC via `CheckModulePermission` (403).
- **Domain Rules (Load ONLY when touching domain)**:
  - Frontend: `.agents/rules/frontend.md` | Skill: `core-reusability-promoter`
  - Backend: `.agents/rules/backend.md` | Skill: `ureka-module-scaffolder`
  - Database: `.agents/rules/database.md`
  - Git & Deploy: `.agents/rules/git-workflow.md` | Skill: `git-workflow`
  - Master Docs: `docs/README.md` | SOLID: `docs/development/solid-principles.md`

## 2. Task Tiers & Context Budget
- **SMALL** (UI fix, validation): Root `AGENTS.md` + inspect touched lines.
- **NORMAL** (Tab, API, form, migration): Root `AGENTS.md` + domain rule. Search codebase first.
- **LARGE** (New module, refactor): Root `AGENTS.md` + scoped rules + scaffolder skill + domain docs.

## 3. Mandatory Workflow (Every Task)
1. **Scope**: Restate task and acceptance criteria.
2. **Git Check**: `git status` & `git branch --show-current`. Uncommitted unrelated work: **STOP and ask a human**.
3. **Analyze**: Read ONLY relevant scoped rules. Search codebase (`rg`/`Select-String`). Apply SOLID.
4. **REUSE > EXTEND > CREATE**: Reuse existing code > Extend with optional props > Create novel code only (justify in report).
5. **Implement & Verify**: Minimal safe change, preserve contracts/docstrings, run quality gates (Section 5), report work (Discovered, Reused/Extended, Created, Refactored).

## 4. Universal Invariants
- **SOLID Principles**: Mandatory across PHP and React (SRP, OCP, LSP, ISP, DIP). Apply in all designs, changes, and refactoring. Details: `docs/development/solid-principles.md`.
- **UI Language**: 100% English for all UI text. Never Vietnamese. Rule: `.agents/rules/frontend.md`.
- **Backend (Strict 3-Layer)**: Rule: `.agents/rules/backend.md`.
  - **Controller**: Extends `BaseController`. Handles HTTP/validation, delegates to Service. NEVER inject Repositories/Models in custom actions.
  - **Service**: Business logic & transactions (`DB::transaction`). Depends ONLY on Repository Interfaces. **STRICTLY FORBIDDEN from direct Model queries/calls** (never `Model::where()`, `Model::create()`, `$modelClass::...`, `DB::table()`).
  - **Repository**: Extends `BaseRepository`, implements `<Model>RepositoryInterface`. Handles Eloquent queries. Bound in ServiceProvider.
- **Database & Safety**: Migrations MUST be additive (never edit merged migrations). Models declare explicit `$fillable`. Real/production data MUST NEVER be mutated or deleted. Rule: `.agents/rules/database.md`.
- **Git & Safety**: Work on category branch (`fix`, `feature`, etc.) or worktree slot (`scripts/agent-worktree.ps1`). NEVER push to `main`. Stage explicit files (no `git add .`, no build manifests). Conventional Commits in English. **Human Deploy Gate**: Merging to `main` creates Draft Release only; production deploy requires human publication. Rule: `.agents/rules/git-workflow.md`.

## 5. Quality Gates
Run from `cms-tiktok-crawler/` before committing:
- **TypeScript**: `npm.cmd run check-types` (0 errors).
- **Backend Tests**: `php artisan test --filter <TestName>` (dev); full suite before commit.
- **Workflow**: `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1` (35/35 pass).

## 6. Known Architectural Exceptions (Do Not "Fix" Silently)
1. **BaseController CRUD**: Uses `$modelClass::query()` across 9 controllers. 3-layer rule applies to custom actions/new code. Do not refactor without explicit instruction.
2. **Legacy Service Persistence**: `SystemSettingService` (`$modelClass::where()->delete()`) & `DashboardService` (`DB::table()`). Do not copy; migrate only if in scope.
3. **Repository Interface Location**: `Permission` & `Role` place interfaces in `Repositories/`; new modules use `Repositories/Interfaces/`.
4. **Manifest Discrepancies**: Trust manifests (`composer.json`: `laravel/framework ^13.17`, `tsconfig.json`: `strict: false`).
