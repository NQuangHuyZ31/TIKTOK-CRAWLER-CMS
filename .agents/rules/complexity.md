# Complexity Control Rules

## Core Principle

Implement the simplest correct solution that satisfies current requirements.

## MUST

- Follow KISS, YAGNI, DRY, and pragmatic SOLID.
- Reuse existing code before creating new components.
- Keep related logic together when it shares the same responsibility.
- Prefer existing framework features and installed libraries.
- Justify every new abstraction, dependency, or architectural layer.
- Review and remove unnecessary code before completion.

## NEVER

- Create one class per method.
- Create interfaces mechanically for every class.
- Introduce unnecessary factories, managers, wrappers, or DTOs.
- Split simple logic across multiple files without a concrete benefit.
- Build hypothetical future functionality.
- Duplicate framework or project functionality.
- Refactor unrelated code.
- Add redundant validation, transformations, or fallback logic.

## Before Creating a Component

Ask:

1. Can an existing component handle this responsibility?
2. Is the new component independently meaningful?
3. Does it reduce overall complexity?
4. Is it required by current architecture or business requirements?

If not, do not create it.

## Review Checklist

- Can any new class or file be removed?
- Is any abstraction unnecessary?
- Is logic duplicated?
- Are there redundant conditions or conversions?
- Is the implementation larger than necessary?
- Does every change serve the approved requirements?

**Quality means correctness, clarity, and maintainability — not the number of classes or lines of code.**