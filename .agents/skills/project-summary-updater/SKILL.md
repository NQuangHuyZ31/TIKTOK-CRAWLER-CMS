---
name: project-summary-updater
description: >-
  Systematically updates PROJECT_SUMMARY.md at the completion of any task, recording
  architectural decisions, newly created or modified files, API endpoint updates, state changes,
  and verification test results. Use this skill at the end of any coding session, feature
  implementation, or bugfix before reporting completion to the user.
---

# Project Summary Updater Runbook

This runbook guides the agent through the mandatory process of maintaining and updating [`PROJECT_SUMMARY.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/PROJECT_SUMMARY.md) upon the conclusion of any task.

---

## 1. Why Updating `PROJECT_SUMMARY.md` Is Mandatory

`PROJECT_SUMMARY.md` is the single source of truth for the project's historical evolution, architectural decisions, and current technical state. Maintaining it guarantees:
1. Seamless context handoff between different agent sessions and developer pair programming.
2. Complete traceability of changes, bug fixes, and new features across all modules and subprojects.
3. Accurate documentation of schema changes, new endpoints, and reusable Core components.

---

## 2. Standard Update Format

Append a new numbered milestone or sub-section under the appropriate main section (or create the next sequential section at the bottom of the document):

```markdown
### <Section Number>. <Descriptive Title of Change or Feature>
- **Context & Problem**:
  - Briefly explain the motivation, user request, or issue resolved.
- **Architectural & Technical Solution**:
  - Backend changes: Controllers, Repositories, Services, Migrations, or Middleware modified.
  - Frontend changes: Pages, Components, Redux actions/slices, or Styles added.
  - Crawler engine: Changes in ProcessData/tiktok-crawler.
  - Core reusability: Any new components promoted to or reused from `modules/Core/`.
- **Created or Modified Files**:
  - List all relevant files with clickable markdown links (`file:///...`).
- **Quality & Verification**:
  - Specify the verification steps executed:
    - TypeScript check: `npm.cmd run check-types` (0 errors).
    - Automated tests: `php artisan test --filter <TestName>` (passing).
```

---

## 3. Step-by-Step Procedure

1. **Review Changed Files**: Inspect `git status` or review the list of files touched during the turn.
2. **Read Current End of `PROJECT_SUMMARY.md`**: Check the last section number and format used in `PROJECT_SUMMARY.md`.
3. **Draft the Summary Block**: Follow the standard format above. Keep descriptions factual, technical, and in English.
4. **Append or Update**: Use the `edit_file` or `write_file` tool to append the new milestone entry to `PROJECT_SUMMARY.md`.
5. **Verify**: Ensure markdown links are valid and headers maintain proper sequential hierarchy.
