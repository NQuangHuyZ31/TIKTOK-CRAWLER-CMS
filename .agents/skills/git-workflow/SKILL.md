---
name: git-workflow
description: Direct branch protocol, Conventional Commits, and pre-commit checks.
---

# Git Workflow Standards

## 1. Direct Branch Protocol

Work directly in the root workspace on dedicated task branches. Worktree isolation is disabled.

> [!IMPORTANT]
> **Single Branch Policy (No Description Sub-branches)**:
> When working on bug fixes or features, do NOT create branches with descriptions such as `fix/<description>` or `fix/TIK-...`.
> Always use the direct branch name (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`) directly to avoid branch proliferation.

```powershell
# 1. Fetch latest and switch/create task branch (e.g. 'fix')
git checkout main
git pull origin main
git checkout -B fix origin/main
# or: git checkout -B feature origin/main

# 2. Develop and run validation checks
npm.cmd run check-types
php artisan test

# 3. Commit with Conventional Commits
git add .
git commit -m "fix(crawler): your descriptive commit message"

# 4. Push branch to remote origin
git push -u origin fix
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
