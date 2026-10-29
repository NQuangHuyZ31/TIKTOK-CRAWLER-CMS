---
name: git-workflow
description: Fixed category branching conventions (feature, fix, refactor, hotfix, test, chore) with zero direct push to main.
---

# Git Workflow Standards

1. **Fixed Category Branches**: Work strictly on `feature`, `fix`, `refactor`, `hotfix`, `test`, or `chore`. Never create dynamic branch names (`<type>/<description>`).
2. **Zero Push to `main`**: All commits push to category branches: `git push -u origin <branch>`.
3. **Commit Format**: Conventional Commits in English (`feat:`, `fix:`, `refactor:`, `chore:`).
4. **Validation**: Run `npm.cmd run check-types` and `php artisan test` before pushing.
5. **PR & Release**: Open PR targeting `main`. Human approval required to publish releases for Render deployment.
