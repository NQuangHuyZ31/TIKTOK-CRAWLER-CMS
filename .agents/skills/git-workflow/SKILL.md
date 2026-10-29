---
name: git-workflow
description: Git branching conventions, Conventional Commits formatting, direct branch workflow, and validation checklist for the project.
---

# Git & GitHub Workflow Standards

## 1. Direct Branch Protocol

Work directly in the root workspace on dedicated task branches. Worktree isolation is disabled.

```powershell
# 1. Fetch latest and create task branch
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
