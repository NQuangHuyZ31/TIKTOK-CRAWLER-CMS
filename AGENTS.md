# AGENTS.md — Engineering Rules

**Scope:** Entire monorepo.

**Core Workflow: PLAN → APPROVAL → IMPLEMENT → REVIEW → REPORT.**

`MUST` / `NEVER` = mandatory. `SHOULD` = recommended.

---

## 1. Project Context

| Path | Stack |
|---|---|
| `cms-tiktok-crawler/` | Laravel 13, React 19, AntD 6 |
| `tiktok-crawler-service/` | Python FastAPI, SQLite WAL |

Laravel modules: `API, Auth, Core, Crawler, Permission, Role, System, TiktokAccount, User`.

- Run npm/PHP commands inside `cms-tiktok-crawler/`.
- Run Python commands inside `tiktok-crawler-service/`.
- Dynamic routing: `Core/src/Support/DynamicRouteResovle.php`.
- Every public controller method may be an HTTP endpoint. Internal helpers MUST be protected/private.
- RBAC: `CheckModulePermission`.

### Domain Rules

Read only rules relevant to the task:

| Domain | Rule |
|---|---|
| Frontend | `.agents/rules/frontend.md` |
| Backend | `.agents/rules/backend.md` |
| Database | `.agents/rules/database.md` |
| Git/Deploy | `.agents/rules/git-workflow.md` |
| Simplicity | `.agents/rules/complexity.md` |

References: `docs/README.md`, `docs/development/solid-principles.md`.

---

## 2. Mandatory Workflow

Every task MUST follow this sequence:

`UNDERSTAND → PLAN → WAIT FOR APPROVAL → IMPLEMENT → REVIEW → REPORT`

### Phase 1: Understand (Read-Only)

- Understand the request and acceptance criteria.
- Identify affected domains and files.
- Check `git status` and `git branch --show-current`.
- Inspect relevant code, existing implementations, and scoped rules.
- Search for reusable components before proposing new ones.
- If unrelated uncommitted changes exist, STOP and ask the user.

During this phase, NEVER modify files, schemas, configurations, or data.

### Phase 2: Plan

Present a plan proportional to task complexity.

The plan MUST include:

1. **Objective:** Expected behavior.
2. **Current State:** Existing implementation and relevant findings.
3. **Solution:** Simplest suitable approach.
4. **Files:** Exact expected files and Create/Modify/Delete actions.
5. **Complexity:** New classes, abstractions, or dependencies and their justification.
6. **Risks:** Potential side effects and compatibility concerns.
7. **Verification:** Tests and acceptance criteria.

Small tasks need concise plans. Large tasks need detailed plans.

### Phase 3: Approval Gate

**NO EXPLICIT APPROVAL = NO IMPLEMENTATION.**

- Present the plan and ask for approval.
- STOP and wait.
- A task request is not approval of the implementation plan.
- Silence or ambiguous responses are not approval.
- Approval applies only to the presented scope.
- If the plan changes, present the changes and obtain approval again.

Do not create, modify, or delete project files before approval.

### Phase 4: Implement

After approval:

- Follow the approved plan and scope.
- Apply existing architecture and domain rules.
- Reuse existing components before extending or creating new ones.
- Do not add unrequested features.
- Do not refactor unrelated code.
- Do not silently introduce dependencies, migrations, or architectural changes.

If unexpected changes are necessary, STOP and request approval.

### Phase 5: Review

Before completion:

- Compare actual changes against the approved plan.
- Inspect the complete Git diff.
- Check correctness, readability, security, and architecture.
- Remove unnecessary code and abstractions.
- Check for regressions and unintended modifications.
- Run relevant quality gates.
- Report tests that could not be executed.

### Phase 6: Report

Provide a concise report containing:

- Implementation summary.
- Files created, modified, and deleted.
- Existing components reused or extended.
- New abstractions and justification.
- Review findings.
- Test results.
- Remaining issues.

Never claim unverified success.

---

## 3. Universal Engineering Principles

- KISS, YAGNI, DRY, SOLID, Minimal Change.
- SOLID MUST be applied pragmatically, not mechanically.
- Prefer the simplest correct and maintainable solution.
- Do not create unnecessary classes, interfaces, DTOs, factories, managers, or abstraction layers.
- Do not split simple logic into multiple files without a clear benefit.
- Do not duplicate existing framework or library functionality.
- Do not optimize without an identified problem.
- Reuse existing code before extending or creating new components.
- New abstractions and dependencies require justification in the plan.
- Code length is not a quality metric. Never inflate implementation to satisfy architectural patterns.
- All UI text MUST be English.

Detailed rules: `.agents/rules/complexity.md`.

---

## 4. Architecture Constraints

### Backend: Strict 3-Layer

Reference: `.agents/rules/backend.md`.

`Controller → Service → Repository`

- Controller: HTTP handling and validation; delegates to Service.
- Service: Business logic and transactions; depends only on Repository Interfaces.
- Repository: Eloquent queries and persistence; extends `BaseRepository`.

Service MUST NOT directly query Models or use `DB::table()` for business persistence.

### Known Exceptions — Do Not Refactor Silently

1. `BaseController` CRUD uses `$modelClass::query()` across 9 controllers. The 3-layer rule applies to custom actions and new code.
2. `SystemSettingService` and `DashboardService` contain legacy direct persistence.
3. Permission/Role interfaces are in `Repositories/`; new modules use `Repositories/Interfaces/`.
4. Trust manifests over outdated documentation:
   - `composer.json`: Laravel `^13.17`.
   - `tsconfig.json`: `strict: false`.

### Database

- Migrations MUST be additive.
- NEVER edit merged migrations.
- Models MUST declare explicit `$fillable`.
- NEVER mutate or delete real production data.

---

## 5. Git, Security & Deployment

Reference: `.agents/rules/git-workflow.md`.

- Work on category branches or approved worktree slots.
- NEVER push directly to `main`.
- NEVER use `git add .`.
- Stage explicit files only.
- Use Conventional Commits in English.
- Do not overwrite user changes.
- Never expose secrets or credentials.
- Never deploy or publish to production without human authorization.

**Human Deploy Gate:** Merging to `main` creates a Draft Release. Production deployment requires human publication.

---

## 6. Quality Gates

Run relevant checks from `cms-tiktok-crawler/`.

**TypeScript**
```bash
npm.cmd run check-types
```

**Backend**
```bash
php artisan test --filter <TestName>
```

**Workflow**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-workflow.ps1
```

Expected workflow result: 35/35, subject to current test definitions.

For Python changes, inspect the service's existing test/lint configuration and run relevant checks.

Run only applicable checks. Report actual results, not assumptions.

---

## 7. Final Enforcement

1. PLAN BEFORE CODING.
2. WAIT FOR EXPLICIT APPROVAL.
3. IMPLEMENT ONLY APPROVED SCOPE.
4. REUSE BEFORE CREATE.
5. KEEP IMPLEMENTATION SIMPLE.
6. PRESERVE EXISTING ARCHITECTURE.
7. REVIEW ACTUAL DIFF.
8. VERIFY BEFORE REPORTING.

**Deliver the simplest correct solution, not the largest implementation or the most sophisticated architecture.**