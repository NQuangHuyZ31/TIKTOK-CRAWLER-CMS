# AGENTS.md - Invariants & Rules

## 1. Branch & Git Invariants (Direct Branch Protocol)
- **Task Branches**: Always work on dedicated task branches.
- **Single Branch Policy**: Use base branch names directly (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`). NEVER create sub-branches with descriptions (e.g. do NOT use `fix/<description>` or `fix/TIK-...`).
- **No Direct Push to Main**: Always push to task branch (`git push -u origin <branch>`) and create PR targeting `main`.
- **Commits**: Strict Conventional Commits in English (`feat(scope): ...`, `fix(scope): ...`, `chore: ...`).

## 2. Quality & Deployment Gates
- **Checks**: `npm.cmd run check-types` (0 errors) & `php artisan test` (100% pass) before committing.
- **🛑 Human Deploy Gate**: Merge to `main` ONLY creates Draft Release. Production deploys ONLY when human publishes release.

## 3. Core Reusability Matrix & 3-Layer Architecture (DO NOT Reinvent)
- Listings: `@core/components/ListLayout` | Tables: `@core/components/Table`
- Actions: `@core/hooks/useAction` | Modals/Forms: `@core/components/ResourceForm`, `CustomModal`
- State: Redux (`store/<domain>/`) | RBAC: `<PermissionGate module="x" action="y">`
- **Strict 3-Layer Backend Architecture (Controller -> Service -> Repository)**:
  - **Controller Layer**: Strictly extends `BaseController`. Handles HTTP requests, input validation via FormRequests, response formatting (`respondSuccess`/`respondError`/Resource). MUST ONLY call the **Service Layer**; NEVER inject or call Repository or Model directly for business logic/queries.
  - **Service Layer**: Calls Repository ONLY. **NO direct Model usage (NEVER call `Model::where()`, `CrawlJob::...`, etc. directly; MUST delegate 100% queries and persistence to Repository)**. Encapsulates 100% of domain business logic, data mutations, transactions (`DB::transaction`), audit events, and external service calls. Calls **Repository Layer** for all persistence and data retrieval.
  - **Repository Layer**: Encapsulates all Eloquent queries, relations, filtering, and aggregations. Every repository MUST implement `<Model>RepositoryInterface` and strictly extend `BaseRepository`. Bound in `<Module>ServiceProvider` (`$this->app->bind(Interface::class, Repository::class)`).

## 4. Frontend Standards
- **Imports**: Use `@core/...` and `@modules/<Module>/...` only. No multi-level `../../..` or custom per-module aliases.
- **Configs**: Move all constants, presets, options to `configs/`. Never inline in TSX.
- **Decomposition**: No monolithic TSX (>150 lines). Split into `components/` or `ui/`.
- **Core Reusability**: Generic/shared components go to `@core`.

## 5. Token Efficiency
- **Files**: Specify `StartLine`/`EndLine`; never dump large files.
- **Commands**: Filter command outputs (`--filter`, `Select-Object -First 25`).
- **Docs**: Update `PROJECT_SUMMARY.md` ONLY for major features (never bug fixes).
- **Output**: Concise, direct, no code repetition.
