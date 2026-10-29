---
name: git-workflow
description: Git fixed-category branching conventions, Conventional Commits formatting, strict PR review gates, and zero-push-to-main protocol.
---

# Git & GitHub Workflow Standards

## 1. Fixed Category Branch Policy (Zero Push to Main)

- **NEVER push directly to `main`**.
- Do **NOT** create dynamic branches with suffixes (e.g. `feature/xyz`, `refactor/xyz`). Use **fixed category branches** directly matching the nature of the work:
  - **`feature`**: New features, crawler workers, UI screens.
  - **`fix`**: Bug fixes and defect repairs.
  - **`refactor`**: Code cleanup, structure reorganization, centralizing assets.
  - **`hotfix`**: Emergency production patches.
  - **`test`**: Test automation.
  - **`chore`**: Maintenance, CI/CD, documentation.

```powershell
# 1. Checkout matching category branch
git checkout refactor
# or: git checkout feature, git checkout fix

# 2. Sync with latest main
git merge main

# 3. Develop & run validation checks
npm.cmd run check-types
php artisan test

# 4. Commit with Conventional Commits
git add .
git commit -m "refactor(crawler): your descriptive commit message"

# 5. Push to category branch
git push -u origin refactor
```

---

## 2. Commit Message Convention

Follow **Conventional Commits v1.0.0**:

- `feat(scope): <description>`: Introduces a new feature.
- `fix(scope): <description>`: Fixes a bug.
- `refactor(scope): <description>`: Restructuring/cleanup code.
- `chore(scope): <description>`: Maintenance, config, dependencies.
- `docs(scope): <description>`: Documentation changes only.
- `test(scope): <description>`: Tests only.

---

## 3. Pull Request & Deployment Gate

- Push the category branch to remote origin (`git push origin <category-branch>`).
- Open a Pull Request targeting `main`.
- Only the human developer reviews and merges into `main`.
- Merging into `main` creates an automated **Draft Release** (`draft: true`).
- Production deployment to Render triggers **ONLY** when the human user clicks **"Publish release"** on GitHub.
