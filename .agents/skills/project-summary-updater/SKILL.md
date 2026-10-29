---
name: project-summary-updater
description: Records major architectural milestones in PROJECT_SUMMARY.md.
---

# Project Summary Updater

When completing a major architectural milestone or significant feature, append a milestone entry to [`PROJECT_SUMMARY.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/PROJECT_SUMMARY.md):

```markdown
### Milestone: <Descriptive Title>
- **Date**: YYYY-MM-DD
- **Branch**: <category-branch>
- **Scope**: Summary of changes across backend, frontend, crawler, or infra.
- **Verification**: TypeScript (`npm.cmd run check-types`) and Backend tests (`php artisan test`).
```

> [!NOTE]
> - Update `PROJECT_SUMMARY.md` ONLY for major architectural features or milestones (never on minor bug fixes).
> - Keep entries concise (under 25 lines) to preserve token budget.
