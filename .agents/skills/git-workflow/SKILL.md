---
name: git-workflow
description: Fixed category branching conventions (feature, fix, refactor, hotfix, test, chore) with zero direct push to main.
---

# Git Workflow Standards

## 1. Direct Branch Protocol

Work directly in the root workspace on dedicated task branches. Worktree isolation is disabled.

> [!IMPORTANT]
> **Single Branch Policy (No Description Sub-branches)**:
> When working on bug fixes, do NOT create branches with descriptions such as `fix/<description>` or `fix/TIK-...`.
> Always use the direct branch name `fix` (or `feature`, `refactor`, `hotfix`) directly to avoid branch proliferation.

```powershell
# 1. Fetch latest and switch/create task branch (e.g. 'fix')
git checkout main
git pull origin main
git checkout -b feature/TIK-101-new-feature
# or: fix/TIK-102-bug-fix, refactor/TIK-103-clean-code

# 2. Develop and run validation checks
npm.cmd run check-types
php artisan test

# 3. Commit with Conventional Commits
git add .
git commit -m "feat(crawler): your descriptive commit message"

# 4. Push branch to remote origin
git push -u origin feature/TIK-101-new-feature
```

---

## 2. Commit Message Convention

Follow **Conventional Commits v1.0.0**:

- `feat(scope): <description>`: Introduces a new user-facing feature.
- `fix(scope): <description>`: Fixes a bug.
- `chore(scope): <description>`: Maintenance, package updates, configuration adjustments.
- `docs(scope): <description>`: Documentation changes only.
- `test(scope): <description>`: Adding or refactoring tests.
- `refactor(scope): <description>`: Code change that neither fixes a bug nor adds a feature.
- `ci(scope): <description>`: CI/CD configuration and workflow updates.

---

## 3. Pre-Commit Security Checklist

Before staging or committing:

1. **`git status` check**: Ensure no `.env`, `.env.local`, credentials, or temporary logs are staged.
2. Ensure **`npm.cmd run check-types`** passes cleanly (0 compilation errors).
3. Ensure **`php artisan test`** passes cleanly (100% passed).
4. Keep commit messages descriptive and strictly in **English**.
5. Never force-push (`git push --force`) to `main` or shared branches.

---

## 4. Pull Request & Deployment Gate

- Push the task branch and create a Pull Request targeting `main`.
- Merging into `main` creates an automated **Draft Release** (`draft: true`).
- Production deployment to Render triggers **ONLY** when the human user clicks **"Publish release"** on GitHub.
1. **Fixed Category Branches**: Work strictly on `feature`, `fix`, `refactor`, `hotfix`, `test`, or `chore`. Never create dynamic branch names (`<type>/<description>`).
2. **Zero Push to `main`**: All commits push to category branches: `git push -u origin <branch>`.
3. **Commit Format**: Conventional Commits in English (`feat:`, `fix:`, `refactor:`, `chore:`).
4. **Validation**: Run `npm.cmd run check-types` and `php artisan test` before pushing.
5. **PR & Release**: Open PR targeting `main`. Human approval required to publish releases for Render deployment.
