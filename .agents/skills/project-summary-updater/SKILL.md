---
name: project-summary-updater
description: Appends completed milestone entries to PROJECT_SUMMARY.md before reporting completion.
---

# Project Summary Updater

When completing a feature, bugfix, or refactor, append a milestone entry to [`PROJECT_SUMMARY.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/PROJECT_SUMMARY.md):

```markdown
### Milestone: <Descriptive Title>
- **Date**: YYYY-MM-DD
- **Branch**: <category-branch>
- **Scope**: Summary of changes across backend, frontend, crawler, or infra.
- **Verification**: TypeScript (`check-types`) and Backend tests (`php artisan test`).
```

> Keep entries concise (under 20 lines) to preserve token budget.
