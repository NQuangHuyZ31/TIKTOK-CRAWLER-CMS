# Git Branching & Contribution Workflow

This document specifies the fixed category branching workflow, naming conventions, and quality gates for `TIKTOK-CRAWLER`.

---

## 1. Fixed Category Branch Strategy

To avoid branch proliferation and keep repository history easily manageable, all development occurs on designated, fixed category branches (no `<description>` suffixes):

- **`feature`**: New features (crawler workers, UI pages, ingest flows).
- **`fix`**: Bug repairs and defect resolutions.
- **`refactor`**: Code cleanup, modularization, structure reorganization.
- **`hotfix`**: Emergency live production patches.
- **`test`**: Automated test additions and maintenance.
- **`chore`**: Tooling, dependencies, and CI workflows.

> [!WARNING]
> **Pushing directly to `main` is strictly prohibited**. All commits must be pushed to one of the fixed category branches above, and merged into `main` exclusively through a Pull Request.

---

## 2. Standard Workflow Commands

```powershell
# 1. Checkout matching category branch and sync
git checkout refactor
git merge main

# 2. Local Quality Verification
npm.cmd run check-types
php artisan test

# 3. Commit with Conventional Commits
git add .
git commit -m "refactor(scope): your descriptive commit message"

# 4. Push branch to GitHub
git push -u origin refactor
```

---

## 3. Pull Request & Deployment Gate

1. Push your category branch and open a Pull Request targeting `main`.
2. Merging into `main` automatically drafts a **Draft Release** (`draft: true`).
3. Production deployment to Render triggers **ONLY** when an authorized developer reviews and clicks **"Publish release"** on GitHub.
