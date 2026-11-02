---
name: core-reusability-promoter
description: Enforces code reusability workflow, codebase analysis, REUSE/EXTEND/CREATE strategy, and Core promotion.
---

# Code Reusability and Architecture Rules

## 1. General Principles

- Always prioritize reusing existing code over creating new implementations.
- Follow the existing project architecture and coding patterns.
- Do not duplicate components, hooks, services, API calls, or business logic.
- Apply DRY and Single Responsibility principles.
- Prefer extending existing components through props or configuration rather than creating similar components.
- Do not introduce unnecessary abstractions or over-engineer solutions.

## 2. Mandatory Codebase Analysis

Before implementing any feature:

1. Analyze the existing project structure.
2. Identify related pages, components, hooks, services, and API endpoints.
3. Search for existing implementations with similar functionality.
4. Check whether other modules or pages already implement the same feature.
5. Compare their UI structure, business logic, data requirements, and API behavior.

Do not create a new component before completing this analysis.

## 3. Component Reusability

When multiple pages share similar functionality:

- Identify common UI and business logic.
- Extract shared functionality into reusable components when appropriate.
- Use props, configuration objects, or composition to support page-specific requirements.
- Keep page-specific business logic outside shared components.
- Avoid duplicating filter forms, tables, pagination, sorting, and data-fetching logic.

### Decision Rules

Choose one of the following strategies:

A. **REUSE**
- Existing component already satisfies the requirements.
- Use the existing component without unnecessary modifications.

B. **EXTEND**
- Existing component covers most requirements.
- Add optional props, configuration, or composition.
- Ensure existing consumers remain backward compatible.

C. **CREATE**
- No suitable reusable component exists.
- Requirements have significantly different UI or business logic.
- Reusing the existing component would introduce excessive complexity.

When creating a new component that overlaps with an existing one, explain why reuse or extension is not appropriate.

## 4. Shared Component Design

Shared components should:

- Have clearly defined responsibilities.
- Accept configurable props instead of hardcoding page-specific values.
- Avoid dependencies on a specific page or business module.
- Keep data fetching and business logic separated where appropriate.
- Support optional features without affecting existing consumers.
- Have explicit and well-defined TypeScript types.
- Avoid excessive boolean props and deeply nested conditions.

## 5. Refactoring Existing Code

When encountering duplicated implementations:

- Identify the common functionality.
- Determine whether extraction into a shared component is beneficial.
- Refactor duplicated code when it is within the scope of the task.
- Preserve existing behavior and public interfaces.
- Do not perform unrelated large-scale refactoring.

## 6. Before Completing a Task

Verify that:

- No unnecessary duplicate components were introduced.
- Existing reusable components were considered.
- Shared components do not contain page-specific logic.
- Existing pages still work after shared component changes.
- API contracts and TypeScript types remain consistent.

## 7. Agent Reporting

At the end of implementation, report:

- Existing components and implementations discovered.
- Components reused or extended.
- New components created and the reasons.
- Duplicated code identified or refactored.
- Pages and modules affected by the changes.
