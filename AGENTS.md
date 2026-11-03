# AGENTS.md - Engineering Rulebook

Scope: whole monorepo. `MUST`/`NEVER` = mandatory; `SHOULD` = default unless justified.
Source of truth hierarchy: 1. Code & runtime config > 2. Manifests (`composer.json`, `package.json`) > 3. Tests & CI > 4. Docs (`docs/`) > 5. Agent rules.

## 1. Architecture Map & Scoped Navigation
- `cms-tiktok-crawler/`: Laravel 13 (PHP ^8.3, Sanctum, Pest, Pint) + React 19 SPA (AntD 6, Redux Toolkit, Tailwind 4). **Run all `npm`/`php artisan` commands from this directory.**
- `tiktok-crawler-service/`: Python crawler microservice (FastAPI, SQLite WAL, AsyncIO). Independent stack.
- Modules in `cms-tiktok-crawler/modules/`: `API, Auth, Core, Crawler, Permission, Role, System, TiktokAccount, User`.
- **Dynamic Routing Engine**: `Core/src/Support/DynamicRouteResovle.php` routes `/{module}/{controller}/{id?}/{action?}`. Every `public` controller method is an HTTP endpoint; internal helpers MUST be `protected`/`private`. RBAC via `CheckModulePermission` (403 on denial).
- **Domain Rules Navigation (Read based on task domain)**:
  - Frontend: [`.agents/rules/frontend.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/frontend.md) | Skill: `core-reusability-promoter`
  - Backend: [`.agents/rules/backend.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/backend.md) | Skill: `ureka-module-scaffolder`
  - Database: [`.agents/rules/database.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/database.md)
  - Git & Deploy: [`.agents/rules/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/git-workflow.md) | Skill: `git-workflow`
  - Master Docs Portal: [`docs/README.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/README.md)

## 2. Task Tiers & Context Budget
- **SMALL Task** (UI bug fix, validation, styling): Read root `AGENTS.md` + inspect only touched lines.
- **NORMAL Task** (New page tab, API endpoint, form, migration): Read root `AGENTS.md` + targeted scoped rule. Search codebase before coding.
- **LARGE Task** (New module, major pipeline refactor): Read root `AGENTS.md` + scoped rules + scaffolder skill + specific doc in `docs/`.

## 3. Mandatory Workflow (Every Task)
1. Restate task & acceptance criteria.
2. Check `git status` and `git branch --show-current`. If uncommitted unrelated work exists: **STOP and ask a human**.
3. **Analyze First**: Search all modules for reusable implementations (`rg` / `Select-String`).
4. **REUSE > EXTEND > CREATE**:
   - **REUSE**: Existing code satisfies need.
   - **EXTEND**: Add optional props/configs without breaking existing consumers.
   - **CREATE**: Novel requirement only. Justify why reuse/extend was rejected.
5. Implement minimal change. Preserve public interfaces and unrelated docstrings.
6. Run quality gates (Section 5).
7. Conclude with Agent Report: Discovered, Reused/Extended, Created + reasons, Refactored duplicates.

## 4. Universal Invariants
- **UI Language**: 100% English for ALL web UI text (titles, buttons, labels, toasts, errors). Never Vietnamese in web interface.
- **Frontend State**: Redux slice/thunk (`store/`) for shared entity lists, filters, pagination. Direct API + `useAction` for single mutations (delete, toggle, submit). Imports: `@core/...` and `@modules/<Module>/...` (no `../../` or deeper). Configs in `configs/`.
- **Backend (Strict 3-Layer)**:
  - **Controller**: Extends `BaseController`. Handles HTTP, FormRequest validation, delegates to Service. NEVER inject Repositories or Models in custom action methods.
  - **Service**: Business logic, transactions (`DB::transaction`), audit events. Depends ONLY on Repository Interfaces. **STRICTLY FORBIDDEN from direct Model calls** (never `Model::where()`, `Model::create()`, `$modelClass::...`, or `DB::table()`).
  - **Repository**: Extends `BaseRepository` and implements `<Model>RepositoryInterface`. Handles all Eloquent queries. Bound in module ServiceProvider.
- **Database & Security**: Migrations must be additive (never edit merged migrations). Models declare `$fillable`. Sanctum bearer auth. FormRequest validation (no raw SQL). Real/production data MUST NEVER be mutated or deleted in routine development.
- **Git & Safety**: Work on category base branch (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`) or worktree slot (`scripts/agent-worktree.ps1`). NEVER push directly to `main`. Stage explicit files (no `git add .`, no build manifests). Conventional Commits in English. **Human Deploy Gate**: Merging to `main` creates Draft Release only; production deploy requires human publication.

## 5. Quality Gates
Run from `cms-tiktok-crawler/` before committing:
- **TypeScript**: `npm.cmd run check-types` (0 errors).
- **Backend Tests**: `php artisan test --filter <TestName>` during development; full suite before commit.
- **Workflow Verification**: `powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1` (35/35 pass).

## 6. Known Architectural Exceptions (Do Not "Fix" Silently)
1. **BaseController CRUD**: Uses `$modelClass::query()`; 9 controllers define `$modelClass`. 3-layer rule applies to custom actions and new code. Do not refactor `BaseController` without explicit human instruction.
2. **Legacy Service Persistence**: `SystemSettingService` (`$modelClass::where()->delete()`) and `DashboardService` (`DB::table()`). Do not copy; migrate only if in task scope.
3. **Repository Interface Location**: `Permission` and `Role` keep interfaces in `Repositories/`; newer modules use `Repositories/Interfaces/`. Use `Interfaces/` for new code.
4. **Docs vs Manifest Discrepancies**: Trust manifests (`composer.json` has `laravel/framework ^13.17`, `tsconfig.json` has `strict: false`).
