# AGENTS.md - AI Operating Manual & Invariants

## 1. Branch & Git Invariants (Direct Branch Protocol)
- **Task Branches**: Always work on dedicated task branches.
- **Single Branch Policy**: Use base branch names directly (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`). NEVER create sub-branches with descriptions (e.g. do NOT use `fix/<description>` or `fix/TIK-...`).
- **No Direct Push to Main**: Always push to task branch (`git push -u origin <branch>`) and create PR targeting `main`.
- **Commits**: Strict Conventional Commits in English (`feat(scope): ...`, `fix(scope): ...`, `chore: ...`).

## 2. Quality & Deployment Gates
- **Local Checks**: `npm.cmd run check-types` (0 errors) & `php artisan test` (100% pass) before committing.
- **🛑 Human Deploy Gate**: Merging to `main` ONLY creates a Draft Release (`draft: true`). Agents are STRICTLY FORBIDDEN from publishing releases or triggering production deployment. Deploy triggers ONLY when human publishes a release.

## 3. Core Reusability Matrix & 3-Layer Architecture (DO NOT Reinvent)
- Listings: `@core/components/ListLayout` | Tables: `@core/components/Table`
- Actions: `@core/hooks/useAction` | Modals/Forms: `@core/components/ResourceForm`, `CustomModal`
- State: Redux (`store/<domain>/`) | RBAC: `<PermissionGate module="x" action="y">`
- **Strict 3-Layer Backend Architecture (Controller -> Service -> Repository)**:
  - **Controller Layer**: Strictly extends `BaseController`. Handles HTTP requests, input validation via FormRequests, response formatting (`respondSuccess`/`respondError`/Resource). MUST ONLY call the **Service Layer**; NEVER inject or call Repository or Model directly for business logic/queries.
  - **Service Layer**: Injected into Controller via DI. Encapsulates 100% of domain business logic, data mutations, transactions (`DB::transaction`), audit events, and external service calls. Calls **Repository Layer** for all persistence and data retrieval.
  - **Repository Layer**: Encapsulates all Eloquent queries, relations, filtering, and aggregations. Every repository MUST implement `<Model>RepositoryInterface` and strictly extend `BaseRepository`. Bound in `<Module>ServiceProvider` (`$this->app->bind(Interface::class, Repository::class)`).

## 4. Frontend Component & Config Invariants (DO NOT Cram or Hardcode)
- **Path Aliases (Minimal Aliases: @core & @modules only)**: ONLY use `@core/...` (for Core module assets/components) and `@modules/<ModuleName>/...` (for feature modules) instead of fragile multi-level `../../..` relative paths. NEVER declare per-module aliases (such as `@crawler`, `@tiktokaccount`, `@auth`, etc.) to keep configuration scalable for any number of modules.
- **Configs Externalization**: ALL constants, presets (e.g. `VIDEO_LIMIT_PRESETS`, count presets), select options, dictionaries, and sample data MUST be placed in dedicated files in `configs/` (e.g. `modules/<Module>/resources/js/configs/`). NEVER declare them inline inside TSX page or component files.
- **Component Decomposition**: NEVER cram entire complex views, forms, or multiple sections into a single monolithic TSX file (>150-200 lines). Break down pages into small, focused sub-components placed in `components/` or `pages/<PageName>/ui/`.
- **Core Component Reusability**: Any UI widget, control, preset selector, or display element with potential reusability across $\ge 2$ views or modules MUST be placed in `@core` (`modules/Core/resources/js/components/`). NEVER duplicate or keep generic UI logic isolated inside a feature module.

## 5. Token & Context Efficiency
- **Read File**: Specify `StartLine` and `EndLine` for large files; never dump full files.
- **Commands**: Filter outputs (`--filter`, `Select-Object -First 25`) to avoid log spam.
- **Docs**: Append to `PROJECT_SUMMARY.md` ONLY for major architectural features (never on bug fixes).
- **Responses**: Concise, direct, structured; no redundant code repetition.
