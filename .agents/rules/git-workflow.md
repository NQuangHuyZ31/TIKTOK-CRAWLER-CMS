# Git Workflow & Release Safety Rules

Scope: All branches, commits, PRs, worktrees, and releases.
Detailed Workflow: [`docs/development/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/git-workflow.md) | Verification Suite: `scripts/verify-workflow.ps1`

## 1. Supported Git Workflows
- **Workflow A: Single-Workspace Base Branch (Default)**: Use base category branches directly (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`). No descriptive sub-branch suffixes. If current branch contains unrelated active work: **STOP and ask a human**.
- **Workflow B: Parallel Worktree Slots (Multi-Agent)**: When concurrent tasks run, allocate slots via `scripts/agent-worktree.ps1`:
  - Slot 1 (FEATURE): `feature/*` | Slot 2 (FIX): `fix/*` | Slot 3 (HOTFIX): `hotfix/*`
  - Slot 4 (REFACTOR): `refactor/*`, `test/*` | Slot 5 (RELEASE): `release/*`, `chore/*`, `docs/*`, `ci/*`

## 2. Invariants & Prohibitions
- **NO Direct Push to Main**: Always push to category branch (`git push -u origin <branch>`) and open PR targeting `main`.
- **NO Destructive Git**: NEVER run `git reset --hard`, `git checkout -B` over active branches, `git clean -fd`, force-push, or `git stash drop`.
- **Selective Staging**: Stage explicit file paths (`git add <file>...`). NEVER blind `git add .`.
- **No Build Manifests**: NEVER commit `cms-tiktok-crawler/public/entrypoints.json`, `mix-manifest.json`, or `build/`.

## 3. Conventional Commits (Strict English)
- Format: `type(scope): subject` (`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`).
- Language: 100% English.

## 4. Human Deploy Gate
- Merging to `main` ONLY creates a **Draft Release** (`auto-draft-release.yml`, `draft: true`).
- Production deploy to Render (`deploy.yml`) triggers ONLY when a human reviews and clicks **"Publish release"** on GitHub.
- Agents MUST NEVER publish releases or trigger production deployments.


## 5. Auto-Evaluate, Branch Switch & Commit Protocol

| Task Intent | Target Branch | Commit Prefix |
|---|---|---|
| New feature / module / API / UI | `feature` | `feat(scope): ...` |
| Bug / build / Docker / UI / API fix | `fix` | `fix(scope): ...` |
| Urgent production fix | `hotfix` | `fix(scope): ...` |
| Code restructure (no behavior change) | `refactor` | `refactor(scope): ...` |
| Tests only | `test` | `test(scope): ...` |
| Config / deps / docs / CI / tooling | `chore` | `chore\|docs\|ci(scope): ...` |

1. **Inspect & Guard**: Run `git status --short` and `git branch --show-current`. If unrelated uncommitted changes exist, **STOP and ask**.
2. **Declare in Plan**: State the evaluated target branch in the Plan (per `AGENTS.md` approval gate).
3. **Switch**: After approval, if not on target branch: `git fetch origin` -> `git checkout <branch>` (or `git checkout -b <branch> origin/main` if missing; never `git checkout -B`).
4. **Code & Verify**: Implement approved scope only; run applicable quality gates (`check-types`, `artisan test` / `pytest`, `verify-workflow.ps1`).
5. **Commit & Push**: Stage explicit files only (no `git add .`, no manifests/`.env`), commit in English, and `git push -u origin <branch>` (never `main`).
