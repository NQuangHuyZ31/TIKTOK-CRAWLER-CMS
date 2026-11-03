---
name: git-workflow
description: Branch management, Conventional Commits, worktree slot allocation, and pre-commit checks.
---

# Git Workflow Skill

Use this skill when staging changes, committing, switching branches, or managing worktrees.

Rules: [`.agents/rules/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/git-workflow.md) | Documentation: [`docs/development/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/git-workflow.md)

---

## 1. Workflow A: Single-Workspace Base Branch (Sequential Tasks)

```powershell
# 1. Inspect state; STOP and ask human if uncommitted unrelated work exists
git status --short
git branch --show-current
git fetch origin

# 2. Switch to base category branch (fix, feature, refactor, hotfix, test, chore)
git checkout fix            # or: git checkout -b fix origin/main
# NEVER use git checkout -B, reset --hard, clean -fd, or force-push

# 3. Develop & run validation
npm.cmd --prefix cms-tiktok-crawler run check-types
php cms-tiktok-crawler/artisan test --filter <TargetTest>

# 4. Commit (stage explicit files only; no build manifests or .env)
git add <explicit files only>
git commit -m "fix(scope): clear description in english"

# 5. Push to category branch and open PR targeting main
git push -u origin fix
```

---

## 2. Workflow B: Parallel Git Worktree Slots (Concurrent Tasks)

```powershell
# List all active slots and their assigned roles:
powershell -ExecutionPolicy Bypass -File scripts/agent-worktree.ps1 -Action List

# Create worktree for a slot (1: feature/*, 2: fix/*, 3: hotfix/*, 4: refactor/*, 5: release/*):
powershell -ExecutionPolicy Bypass -File scripts/agent-worktree.ps1 -Action Create -WorktreeIndex 1 -Branch "feature/proxy-pool"

# Remove worktree after merge:
powershell -ExecutionPolicy Bypass -File scripts/agent-worktree.ps1 -Action Remove -WorktreeIndex 1
```

---

## 3. Pre-Commit Verification Checklist

1. `git status`: Ensure no `.env`, tokens, or build manifests (`entrypoints.json`, `mix-manifest.json`) are staged.
2. `npm.cmd run check-types` in `cms-tiktok-crawler/`: 0 errors.
3. `php artisan test`: 100% pass.
4. `powershell scripts/verify-workflow.ps1`: 35/35 pass.
5. Push to category branch only; never push directly to `main`.
