# AGENTS.md - AI Operating Rules & Invariants

> [!IMPORTANT]
> **CORE INVARIANTS FOR ALL AI AGENTS**:
> 1. **Zero Push to `main`**: Push strictly to fixed category branches (`feature`, `fix`, `refactor`, `hotfix`, `test`, `chore`). Never push or commit on `main`.
> 2. **Production Release Gate**: Merging to `main` creates a Draft Release (`draft: true`). Deploy to production ONLY when the human user clicks "Publish release".
> 3. **Validation Gates**: 100% TypeScript (`npm.cmd run check-types`, 0 errors) and Backend tests passing (`php artisan test`).
> 4. **Token Efficiency**: Keep terminal commands concise, avoid full tree dumps, and keep documentation compact.

---

## 1. Fixed Category Branch Workflow
Always checkout and push directly to the matching category branch:
- `feature`: New features, crawler workers, UI screens.
- `fix`: Bug repairs, defect resolution, query optimization.
- `refactor`: Code cleanup, modularization, structure restructuring.
- `hotfix`: Emergency live production patches.
- `test`: Test automation (Pest, PHPUnit, Vitest).
- `chore`: Dependencies, CI/CD, documentation.

### Branch Naming Conventions
> [!IMPORTANT]
> **Single Branch Policy (No Description Sub-branches)**:
> When fixing bugs, agents MUST NOT append descriptions to the branch (e.g. do NOT create `fix/<description>` or `fix/TIK-...`).
> Always checkout and push directly to branch `fix` (or `feature`, `refactor`) to prevent repository branch sprawl:
> `git checkout fix` (or `git checkout -B fix origin/main`).
| Prefix | Type | Purpose & Scope |
| :--- | :--- | :--- |
| `feature` | Feature | New features & capabilities: Ingest workflows, UI screens, crawler workers. |
| `fix` | Bug Fix | Defect repairs: Issue resolution, null checks, query optimization. Use **strictly `fix`** directly (do NOT append `/<description>` or `/<ticket>` to avoid branch proliferation). |
| `hotfix` | Hotfix | Critical production patches: Emergency fixes for live services. |
| `refactor` | Refactoring | Code cleanup, modularization, structure improvements. |
| `test` | Testing | Test automation: Pest/PHPUnit, Vitest. |
| `release/*`, `chore` | Release/Maintenance | SemVer bumping, changelog, dependencies, CI workflows. |

### Standard Git Commands for Agent
```powershell
# 1. Ensure latest main and switch to task branch (e.g. 'fix')
git checkout main
git pull origin main
git checkout -B fix origin/main

# 2. Develop and run validation checks
npm.cmd run check-types
php artisan test

# 3. Commit with Conventional Commits
git add .
git commit -m "fix(crawler): add error retry exponential backoff"

# 4. Push branch to remote
git push -u origin fix
```


## 2. Pull Request & Merging Standard
1. **Agent MUST NOT push unreviewed breaking changes directly to `main`**. Always work on task branches.
2. Push branch to remote origin:
   ```powershell
   git push -u origin <branch>
   ```
3. Create Pull Request targeting `main`.
4. Hand over the PR link to the human User, or merge after all CI/local validations pass if instructed.

---

## 3. Release Lifecycle & Controlled Deployment Gate

```mermaid
flowchart TD
    A["Agent Dev on Branch<br>(feature/*, fix/*, etc.)"] --> B["Local Checks & Tests<br>(check-types, pest/phpunit)"]
    B --> C["git push origin <branch> & Open PR to main"]
    C --> D["Human Code Review & Merge into main"]
    D --> E["GitHub Action: auto-draft-release.yml<br>(draft: true)"]
    E --> F["📦 GitHub Draft Release Created<br>(NO DEPLOYMENT)"]
    F --> G{"🛑 Human Gate:<br>User reviews Draft notes &<br>clicks 'Publish release'"}
    G -- "NO / Not ready" --> H["System remains unchanged<br>(No deployment)"]
    G -- "YES: Published (vX.Y.Z)" --> I["GitHub Action: deploy.yml triggered"]
    I --> J["Render Production Deploy Hook"]
    J --> K["Health Check: /api/health (HTTP 200)"]
    K --> L["✅ Production Live"]
    
```powershell
# Standard workflow
git checkout <category-branch> # e.g. refactor, feature, fix
git merge main
# Code, validate: npm.cmd run check-types & php artisan test
git add .
git commit -m "<type>(<scope>): <English summary>"
git push -u origin <category-branch> # NEVER push to main!
```
## 2. Code Standards & Reusability Matrix (Do Not Reinvent)
- **Language**: English-only for all code, comments, commits, and PR descriptions.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`).
- **TypeScript**: Strict React 19 / TypeScript (`noImplicitAny`, no untyped `any`).
- **Listings & Tables**: Use `@core/components/ListLayout` and `@core/components/Table`.
- **Actions & State**: Use `@core/hooks/useAction` for row actions; use Redux for state/filters.
- **Backend**: Extend `BaseController` and `BaseRepository`. Keep controllers thin.
- **Summary**: Record completed milestones in `PROJECT_SUMMARY.md` before reporting completion.