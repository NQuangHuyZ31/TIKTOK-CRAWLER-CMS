# Git Branching & Contribution Workflow

This document specifies the direct branch workflow, naming conventions, and quality gates for `TIKTOK-CRAWLER`.

---

## 1. Branch Strategy

Work directly in the project workspace on dedicated task branches.

### Branch Types:
- `feature/*`: New features (e.g. `feature/TIK-101-profile-sync`).
- `fix/*`: Bug fixes (e.g. `fix/TIK-102-null-author`).
- `hotfix/*`: Emergency production patches (e.g. `hotfix/SEC-001-api-key`).
- `refactor/*`: Code restructuring and cleanup.
- `chore/*`: Maintenance, dependencies, release preparation.

---

## 2. Standard Workflow Commands

```powershell
# 1. Update main and branch off
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Local Quality Verification
npm.cmd run check-types
php artisan test

# 3. Commit with Conventional Commits
git add .
git commit -m "feat(crawler): your descriptive commit message"

# 4. Push branch to GitHub
git push -u origin feature/your-feature-name
```

---

## 3. Pull Request & Deployment Gate

1. Push your task branch and open a Pull Request targeting `main`.
2. Merging into `main` automatically drafts a **Draft Release** (`draft: true`).
3. Production deployment to Render triggers **ONLY** when an authorized developer reviews and clicks **"Publish release"** on GitHub.
