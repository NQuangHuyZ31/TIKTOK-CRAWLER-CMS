# Git Workflow & Release Management

This document specifies the branching strategies, commit conventions, worktree slot management, and release gates for `TIKTOK-CRAWLER`.

---

## 1. Supported Git Workflows

### 1.1. Single-Workspace Fixed Category Branch Workflow
Designed for sequential tasks running directly within the root repository workspace:
- **`feature`**: New product capabilities and ingest flows.
- **`fix`**: Bug repairs and error corrections.
- **`refactor`**: Code cleanups, architectural alignment, optimization.
- **`hotfix`**: Emergency production patches.
- **`test`**: Automated test additions.
- **`chore`**: Maintenance, package dependencies, CI tooling.

> [!WARNING]
> Never create branch names with arbitrary description suffixes (e.g. `fix/issue-123`). Work directly on the designated category branch.
> **Pushing directly to `main` is strictly prohibited**. All commits must be merged into `main` exclusively through a Pull Request.

### 1.2. Parallel Git Worktree Workflow (Multi-Agent Slots)
When multiple agents or engineers collaborate concurrently on the same machine, use `scripts/agent-worktree.ps1` to prevent branch collisions. The script allocates isolated worktree slots mapped to specific roles:

- **Slot 1 (FEATURE)**: `feature/*`
- **Slot 2 (FIX)**: `fix/*`
- **Slot 3 (HOTFIX)**: `hotfix/*`
- **Slot 4 (REFACTOR)**: `refactor/*`, `test/*`
- **Slot 5 (RELEASE)**: `release/*`, `chore/*`, `docs/*`, `ci/*`

```powershell
# List active slots
powershell -ExecutionPolicy Bypass -File scripts/agent-worktree.ps1 -Action List

# Allocate a worktree
powershell -ExecutionPolicy Bypass -File scripts/agent-worktree.ps1 -Action Create -WorktreeIndex 1 -Branch "feature/proxy-pool"
```

---

## 2. Standard Development Lifecycle

```powershell
# 1. Sync category branch
git checkout fix
git pull origin main

# 2. Local verification
npm.cmd --prefix cms-tiktok-crawler run check-types
php cms-tiktok-crawler/artisan test --filter <TargetTest>

# 3. Commit with Conventional Commits (stage explicit files only)
git add <explicit files only>
git commit -m "fix(crawler): handle null author response"

# 4. Push to category branch
git push -u origin fix
```

---

## 3. Deployment Safety: Human Deploy Gate

The repository enforces a strict **Human Deploy Gate**:
1. Merging a PR into `main` automatically triggers `auto-draft-release.yml` to generate a **Draft Release** (`draft: true`).
2. Draft releases **DO NOT** trigger production deployments.
3. Production deployment (`deploy.yml`) is triggered **ONLY** when a human reviews the draft release and clicks **"Publish release"** in GitHub.
4. AI Agents are strictly forbidden from publishing production releases or bypassing deployment gates.
