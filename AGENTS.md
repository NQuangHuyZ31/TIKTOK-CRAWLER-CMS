# AGENTS.md - AI Operating Manual & Invariants

## 1. Branch & Git Invariants (Direct Branch Protocol)
- **Task Branches**: Always work on dedicated task branches.
- **Single Branch Policy**: Use base branch names directly (`fix`, `feature`, `refactor`). NEVER create sub-branches with descriptions (e.g. do NOT use `fix/<description>` or `fix/TIK-...`).
- **No Direct Push to Main**: Always push to task branch (`git push -u origin fix`) and create PR targeting `main`.
- **Commits**: Strict Conventional Commits in English (`feat(scope): ...`, `fix(scope): ...`, `chore: ...`).

## 2. Quality & Deployment Gates
- **Local Checks**: `npm.cmd run check-types` (0 errors) & `php artisan test` (100% pass) before committing.
- **🛑 Human Deploy Gate**: Merging to `main` ONLY creates a Draft Release (`draft: true`). Agents are STRICTLY FORBIDDEN from publishing releases or triggering production deployment. Deploy triggers ONLY when human publishes a release.

## 3. Core Reusability Matrix (DO NOT Reinvent)
- Listings: `@core/components/ListLayout` | Tables: `@core/components/Table`
- Actions: `@core/hooks/useAction` | Modals/Forms: `@core/components/ResourceForm`, `CustomModal`
- State: Redux (`store/<domain>/`) | RBAC: `<PermissionGate module="x" action="y">`
- Backend: Controllers & Repos strictly extend `BaseController` / `BaseRepository`.

## 4. Token & Context Efficiency
- **Read File**: Specify `StartLine` and `EndLine` for large files; never dump full files.
- **Commands**: Filter outputs (`--filter`, `Select-Object -First 25`) to avoid log spam.
- **Docs**: Append to `PROJECT_SUMMARY.md` ONLY for major architectural features (never on bug fixes).
- **Responses**: Concise, direct, structured; no redundant code repetition.
