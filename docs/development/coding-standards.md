# Coding Standards & Conventions

This document establishes the code formatting, naming, and architectural conventions across PHP and TypeScript/React.

---

## 1. Universal Language Requirement (Strict English)

All code artifacts MUST be written in **English**:
- Web UI user-facing text: Titles, headers, buttons, form labels, toasts, errors, table headers.
- Code identifiers: Class names, functions, variables, database columns, route slugs.
- Documentation & Comments: Code comments, PHPDoc docstrings, JSDoc annotations, commit messages, and PR descriptions.
- Never write Vietnamese in UI code or comments. (Vietnamese is preserved in high-level business README documentation only).

---

## 2. Backend Standards (PHP 8.3+ & Laravel 13)

### 2.1. Code Style & PSR Standards
- Adhere strictly to **PSR-12** and Laravel coding guidelines.
- Automated formatting is enforced via **Laravel Pint**:
  ```powershell
  # Check style (non-destructive)
  ./vendor/bin/pint --test
  # Automatically fix style discrepancies
  ./vendor/bin/pint
  ```

### 2.2. Naming Conventions & Placement
- **Classes**: `StudlyCase` (e.g. `CrawlJobService`, `CrawlJobRepository`, `StoreCrawlJobRequest`).
- **Methods & Variables**: `camelCase` (e.g. `findJobById`, `$totalAccounts`).
- **Database Tables**: Plural `snake_case` (e.g. `crawl_jobs`, `tiktok_accounts`).
- **Database Columns & Foreign Keys**: `snake_case` (e.g. `crawl_job_id`, `created_at`).

---

## 3. Frontend Standards (TypeScript & React 19)

### 3.1. TypeScript Conventions
- **No `any`**: Write explicit interfaces for component props, API payloads, and Redux slice states. Use `unknown` with type narrowing when dealing with unstructured data.
- **Path Aliases**:
  - `@core/...` for Core modules.
  - `@modules/<Module>/...` for cross-module imports.
  - Sibling relative imports (`./`, `../`) are allowed within the same module folder.
  - Never import using `../../` or deeper relative traversals.

### 3.2. Naming Conventions
- **React Components**: `PascalCase.tsx` (e.g. `CrawlJobDetailPage.tsx`, `JobSummaryPreview.tsx`).
- **Custom Hooks**: `camelCase.ts` prefixed with `use` (e.g. `useAction.ts`, `usePermission.ts`).
- **Static Configs**: `camelCase.ts` (e.g. `tableConfig.ts`, `options.ts`).
- **Redux Files**: `<domain>Slice.ts`, `<domain>Thunks.ts`.

---

## 4. Architectural Standards & SOLID Principles

All PHP and TypeScript code must strictly adhere to **SOLID principles**:
- **Single Responsibility Principle (SRP)**: Controllers handle HTTP; Services handle domain business logic and transactions; Repositories handle database queries. React components render UI; hooks manage behavior; configs hold static data.
- **Open/Closed Principle (OCP)**: Extend behavior via composition, strategy patterns, and optional configuration rather than editing tested core classes.
- **Liskov Substitution Principle (LSP)**: Implementations must fulfill interface contracts and base class conventions without unexpected side-effects.
- **Interface Segregation Principle (ISP)**: Build lean, focused interfaces and prop contracts. Avoid monolithic 40-property objects.
- **Dependency Inversion Principle (DIP)**: Services depend on Repository Interfaces, never directly on Eloquent models. React views depend on abstracted HTTP clients (`@core/Action/api`) and hooks.
- **Anti-Pattern Prevention**: Split God Classes (>300 lines) and God Components (>150-200 lines). Avoid unnecessary abstractions and overengineering.

For comprehensive architectural specifications, examples, and review checklists, see [SOLID Principles & Architectural Standards](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/solid-principles.md).
