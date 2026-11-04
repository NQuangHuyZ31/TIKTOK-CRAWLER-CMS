# Coding Standards & Conventions

This document establishes the code formatting, naming, and architectural conventions across PHP and TypeScript/React.

---

## 1.Universal Language Requirement

All source code and technical artifacts MUST use English.

### 1.1. Code
- Class, interface, method, function, variable, constant, and database identifiers MUST use English.
- API routes, route names, configuration keys, and enum values MUST use English.
- Code comments and docblocks MUST use English.
- Never use Vietnamese identifiers or comments in source code.

### 1.2. User Interface
- UI labels, titles, buttons, placeholders, validation messages, notifications, and error messages MUST use English by default.
- Vietnamese UI text is allowed only when explicitly required by localization or business requirements.

### 1.3. Documentation
- Technical documentation, API documentation, PR descriptions, and development guides MUST use English.
- High-level business documentation and business README files MAY use Vietnamese.
- Test fixtures and sample data MAY use Vietnamese when required to represent real business scenarios.

### 1.4. Consistency
- Do not mix English and Vietnamese arbitrarily within the same technical artifact.
- Follow the existing language conventions of the relevant file and project.

### 1.5. Comment & PHPDoc Standards

Minimize unnecessary comments across the entire codebase.

1. PHPDoc is **not mandatory** for every method, property, or function. simple comment
2. Do NOT comment on every step or operation in Controllers, Services, or Repositories. Code should be self-explanatory through clear naming and structure.
3. Do NOT add comments for routine CRUD operations or obvious code behavior.
4. Do NOT add vague `TODO` comments without specific context or an actionable follow-up.
5. Keep comments accurate and up to date. Remove or update outdated comments whenever the related code is refactored.
6. Do NOT remove comments that explain important business rules, security constraints, or technical workarounds merely to reduce comment count.

**General Rule:** Comments must be concise, necessary, and simple. Prefer self-explanatory code over explanatory comments. Do not add comments unless they provide context that cannot be easily understood from the implementation itself.

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
