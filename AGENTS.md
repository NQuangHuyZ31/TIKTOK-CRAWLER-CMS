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

```powershell
# Standard workflow
git checkout <category-branch> # e.g. refactor, feature, fix
git merge main
# Code, validate: npm.cmd run check-types & php artisan test
git add .
git commit -m "<type>(<scope>): <English summary>"
git push -u origin <category-branch> # NEVER push to main!
```

---

## 2. Code Standards & Reusability Matrix (Do Not Reinvent)
- **Language**: English-only for all code, comments, commits, and PR descriptions.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`).
- **TypeScript**: Strict React 19 / TypeScript (`noImplicitAny`, no untyped `any`).
- **Listings & Tables**: Use `@core/components/ListLayout` and `@core/components/Table`.
- **Actions & State**: Use `@core/hooks/useAction` for row actions; use Redux for state/filters.
- **Backend**: Extend `BaseController` and `BaseRepository`. Keep controllers thin.
- **Summary**: Record completed milestones in `PROJECT_SUMMARY.md` before reporting completion.
