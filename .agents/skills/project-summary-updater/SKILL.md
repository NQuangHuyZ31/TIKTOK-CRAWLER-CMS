---
name: project-summary-updater
description: Records major architectural milestones in PROJECT_SUMMARY.md.
---

# Project Summary Updater Runbook

This runbook guides the agent through the process of maintaining [PROJECT_SUMMARY.md](file:///E:/Urekamedia/TIKTOK-CRAWLER/PROJECT_SUMMARY.md) upon the conclusion of significant feature milestones.

---

## 1. Scope & Token Conservation Policy

To conserve tokens and keep documentation lean:
1. **Major Milestones Only**: Update PROJECT_SUMMARY.md ONLY when completing new architectural modules, major features, or significant database/API overhauls.
2. **Skip Minor Fixes**: Do NOT invoke or update PROJECT_SUMMARY.md for routine bug fixes, trivial tweaks, or single-file patches.
3. **Keep It Lean**: Historical milestones (Milestones 1-50) are archived in docs/archive/historical-milestones.md. Keep only recent active milestones in PROJECT_SUMMARY.md.

---

## 2. Standard Update Format

Append a new milestone entry at the bottom of the document:

\\markdown
## Milestone: <Descriptive Title of Significant Feature>
- **Date**: YYYY-MM-DD
- **Author**: Antigravity AI Assistant
- **Branch**: main (or task branch)

### 1. Objectives & Delivered Solution
- Context and key architectural changes.

### 2. Files Modified & Added
- List primary modified files.

### 3. Verification Test Results
- TypeScript: npm.cmd run check-types
- Automated tests: php artisan test
\
---

## 3. Step-by-Step Procedure

1. **Check Eligibility**: Verify that the completed work represents a significant milestone (not a trivial bug fix).
2. **Read Current End**: Read only the last 30-50 lines of PROJECT_SUMMARY.md using 
ead_file with StartLine.
3. **Append Entry**: Append the concise milestone block using write_file with Append: true.
