---
name: core-reusability-promoter
description: Enforces code reusability workflow, codebase analysis, REUSE/EXTEND/CREATE strategy, and Core promotion.
---

# Code Reusability & Anti-Duplication Skill

Use this skill before creating or modifying UI components, hooks, services, or endpoints.

Component Catalog: [`docs/frontend/core-components.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/core-components.md) | Frontend Rules: [`.agents/rules/frontend.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/.agents/rules/frontend.md)

---

## 1. Step-by-Step Analysis Workflow

1. **Search Codebase**: Before writing any new UI widget or logic, search across all modules (`Select-String` / `rg`) for existing tables, filter bars, status tags, API actions, and services.
2. **Compare Implementations**: Check if sibling modules already implemented similar behavior.
3. **Select Strategy**:
   - **REUSE**: Existing component satisfies requirements with current configuration.
   - **EXTEND**: Existing component covers need with optional props/configs (must verify all existing consumers).
   - **CREATE**: Novel requirement only. Document why reuse/extend was rejected.
4. **Core Promotion**: Promote to `@core` only if the component is generic and used (or about to be used) by 2+ modules.

---

## 2. Shared Component Invariants

- Clearly defined, single responsibility.
- Configurable via props; no hardcoded page-specific values.
- Clean TypeScript types; no `any`.
- Zero domain business logic inside `@core`.

---

## 3. Pre-Completion Verification & Reporting

Before completing the task, verify:
- No unnecessary duplicates were introduced.
- Existing consumers still function without regressions.
- Types and API contracts remain consistent.

Conclude with the mandatory **Agent Report**:
1. **Discovered**: Existing implementations found (with paths).
2. **Reused / Extended**: Components and services reused or extended.
3. **Created + Rationale**: New components created and why reuse was unsuitable.
4. **Refactored**: Duplicates consolidated.
5. **Affected Scope**: Verified pages, modules, and endpoints.
