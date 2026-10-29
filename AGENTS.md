# AGENTS.md - AI Operating Manual & Invariants

> [!IMPORTANT]
> **MANDATORY RULES FOR ALL AI AGENTS**: Adhere to worktree isolation, strict PR review gates, Draft Release lifecycle, and the **Mandatory Human Approval Gate for Production Deployment**.

## 1. Core Invariants & Workflow
1. **Worktree Protocol**: Root (`E:\Urekamedia\project1`) is an idle anchor tracking `main`. All dev, commits, tests, and branch switches MUST occur inside persistent worktree slots (`project1-worktree-1` to `5`) via `.\scripts\agent-worktree.ps1`.
2. **Branch Naming**: Allowed prefixes: `feature/`, `fix/`, `hotfix/`, `release/v<version>`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`.
3. **Strict PR Gate (ZERO Push to `main`)**:
   - Agent **MUST NEVER push directly to `main`**.
   - Push task/release branch: `git push -u origin <branch>` (e.g. `release/v1.0.0`).
   - Open PR targeting `main` via `.\scripts\agent-pr.ps1 -Branch "<branch>"`.
   - **🛑 AGENT STOPS**: Hand over PR link. **Only the human User reviews and merges PR into `main`**.
4. **Draft Release Generation**: Merging PR into `main` automatically triggers `.github/workflows/auto-draft-release.yml` to package artifacts and create a **GitHub Draft Release**.
5. **🛑 MANDATORY HUMAN RELEASE GATE**:
   - **Agent is STRICTLY FORBIDDEN from publishing a Release or triggering production deployment**.
   - Agent halts. **Only the human User reviews draft notes on GitHub Releases and clicks "Publish release"** to trigger Render deployment.
6. **Code Standards**:
   - English-only text, comments, docstrings, and Conventional Commits.
   - 100% Strict TypeScript: `npm.cmd run check-types` (0 errors). React 19. No untyped `any`.
   - Windows PowerShell: Execute via `npm.cmd` / `npx.cmd`.
   - Direct imports only: `import ListLayout from '@core/components/ListLayout'`. No barrel `index.ts`.
7. **Mandatory Documentation Update**: Upon completing any task, feature, bugfix, or workflow change:
   - **Update `README.md`**: Document newly added capabilities, commands, environment variables, or architecture changes.
   - **Update `PROJECT_SUMMARY.md`**: Append a milestone entry detailing the solution, touched files, and test results before reporting completion.

## 2. Core Reusability Matrix (DO NOT REINVENT)
| Layer | Core Asset | Usage Standard |
| :--- | :--- | :--- |
| **Listings** | `@core/components/ListLayout` | **Mandatory** for entity listing pages. No custom wrapper divs. |
| **Tables** | `@core/components/Table` | **Mandatory**. Use native `onEdit`, `onDelete`, `extraActions`. |
| **Actions** | `@core/hooks/useAction` | **Mandatory** for row actions (delete, toggle). Handles toast/loading. |
| **Forms/Modals** | `@core/components/ResourceForm`, `CustomModal` | Standard form controls and modal dialogs. |
| **KPI/Tags** | `@core/components/CardKPI`, `StatusTag`, `NumericRangeFilter` | Standard dashboard and metric cards. |
| **RBAC** | `@core/components/PermissionGate`, `usePermission` | Permission gates: `<PermissionGate module="x" action="y">`. |
| **State** | Redux (`store/<domain>/`) | All entity lists, filters, pagination MUST use Redux. No state clutter. |
| **Backend** | `BaseController`, `BaseRepository` | Thin controllers and repos strictly extending Base. Zero redundant overrides. |

## 3. Deep Documentation References
- Worktree Guide: `docs/development/git-worktree-workflow.md`
- CI/CD Architecture: `docs/deployment/ci-cd-architecture.md`
- Release Management: `docs/deployment/release-management.md`
- Render Production Playbook: `docs/deployment/render-deployment.md`
- Core Module Guide: `docs/CORE_MODULE_GUIDE.md` | Testing: `docs/TESTING_GUIDE.md`
- Agent Skills: `.agents/skills/` (`core-reusability-promoter`, `git-workflow`, etc.)
