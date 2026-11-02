# Coding Standards & Conventions

This document establishes the official coding standards, architectural conventions, language requirements, and git commit guidelines for the `cms-tiktok-crawler` project.

---

## 1. Universal Language Requirement (Strict English)

> [!IMPORTANT]
> **All documentation, code comments, docstrings, variable names, commit messages, and Web UI strings MUST be in English.**
> 
> 1. **Web UI Text**: Page titles, button labels, table column headers, form inputs, placeholders, modal dialogues, validation feedback, and toast notifications must strictly be written in clear, professional English.
> 2. **Codebase Comments**: All inline comments (`//`, `/* */`), PHPDoc (`/** */`), and JSDoc blocks must be in English.
> 3. **Documentation**: All Markdown files in `docs/` and root instructions must be in English.
> 4. **Git Commits**: Conventional commit messages must be in English.

---

## 2. Backend Standards (PHP 8.3+ & Laravel)

### 2.1. Code Style & PSR Standards
- Adhere strictly to **PSR-12** standards.
- Run **Laravel Pint** to format code:
  ```powershell
  php vendor/bin/pint
  ```

### 2.2. Naming Conventions & Placement
- **Controllers**: Located in `src/Http/Controllers/`, `PascalCase` with `Controller` suffix (e.g., `CrawlJobController`), extending `Modules\Core\Http\Controllers\BaseController`.
- **Form Requests**: Located in `src/Http/Requests/`, `PascalCase` starting with action + entity + `Request` (e.g., `StoreCrawlJobRequest`).
- **Middleware**: Located in `src/Http/Middleware/`, `PascalCase` (e.g., `CheckModulePermission`).
- **Models**: Located in `src/Models/`, `PascalCase` singular noun (e.g., `CrawlJob`, `CrawlResult`, `TiktokAccount`).
- **Database Tables**: `snake_case` plural (e.g., `crawl_jobs`, `tiktok_accounts`).
- **Foreign Keys**: `snake_case` singular entity + `_id` (e.g., `crawl_job_id`, `user_id`).
- **Repositories**: Located in `src/Repositories/`, interface `PascalCase` ending with `RepositoryInterface`, implementation ending with `Repository`.
- **Resources**: Located in `src/Resources/`, `PascalCase` with `Resource` suffix (e.g., `CrawlJobResource`).
- **Methods**: `camelCase` (e.g., `findByJobId`, `startCrawlingProcess`).

### 2.3. Architectural Rules
1. **Core First & Zero Redundant Overrides**:
   - Always check `modules/Core/` before creating a new utility, trait, or repository method.
   - Never override or re-implement methods provided by `BaseRepository` (`all`, `paginate`, `findById`, `findOrFail`, `create`, `update`, `delete`).
   - Repository interfaces must extend `BaseRepositoryInterface`.
   - Always query via `$this->model` (`$this->model->where(...)`, `$this->model->count()`) instead of static model calls (`Permission::where(...)`).
2. **Controller Thinness**: Controllers must only receive requests, delegate to services/repositories, and return JSON via `ApiResponseTrait`.
3. **No Raw Queries in Controllers**: Database operations belong exclusively in Repositories.
4. **Error Handling & Logging**: Use `Log::error(...)` with structured context. Never swallow exceptions with empty catch blocks.

---

## 3. Frontend Standards (TypeScript & React 19)

### 3.1. Strict TypeScript & Direct Imports
- `strict: true` is enforced across all modules.
- **Never use `any`** unless interacting with an untyped external library, in which case a clarifying comment is mandatory.
- **Strict Ban on Barrel Re-Export `index.ts` Files**: Never create `index.ts` files solely for re-exporting (`export * from ...`). Always use direct imports targeting specific component or utility files.
- Run typecheck before finishing tasks:
  ```powershell
  npm.cmd run check-types
  ```
- Run typecheck before finishing tasks:
  ```powershell
  npm.cmd run check-types
  ```

### 3.2. Naming Conventions
- **Components & Pages**: `PascalCase.tsx` (e.g., `CrawlJobsPage.tsx`, `CrawlResultTable.tsx`).
- **Action Files**: `camelCase.ts` (e.g., `crawlJob.ts`, `tiktokAccount.ts`).
- **Redux Slices & Thunks**: `camelCase.ts` (e.g., `crawlJobSlice.ts`, `crawlJobThunks.ts`).
- **Interfaces & Types**: `PascalCase` (e.g., `CrawlJobItem`, `FilterParams`).
- **Custom Hooks**: `useCamelCase.ts` (e.g., `usePermission.ts`).

### 3.3. UI Component Construction
1. Reuse base components from `modules/Core/resources/js/components/` (`TableComponent`, `CardKPI`, `ListLayout`, `CustomModal`, `ResourceForm`).
2. If a UI pattern is needed across multiple modules, implement it inside `modules/Core/` and export it for everyone.
3. Use Tailwind CSS v4 utility classes alongside Ant Design v6.

---

## 4. Code Reusability & Architecture Rules

### 4.1. General Principles
- Always prioritize reusing existing code over creating new implementations.
- Follow the existing project architecture and coding patterns.
- Do not duplicate components, hooks, services, API calls, or business logic.
- Apply DRY and Single Responsibility principles.
- Prefer extending existing components through props or configuration rather than creating similar components.
- Do not introduce unnecessary abstractions or over-engineer solutions.

### 4.2. Mandatory Codebase Analysis
Before implementing any feature:
1. Analyze the existing project structure.
2. Identify related pages, components, hooks, services, and API endpoints.
3. Search for existing implementations with similar functionality.
4. Check whether other modules or pages already implement the same feature.
5. Compare their UI structure, business logic, data requirements, and API behavior.
*Do not create a new component before completing this analysis.*

### 4.3. Component Reusability & Decision Rules
Choose one of the following strategies:
- **A. REUSE**: Existing component already satisfies the requirements. Use it without unnecessary modifications.
- **B. EXTEND**: Existing component covers most requirements. Add optional props, configuration, or composition while preserving backward compatibility.
- **C. CREATE**: No suitable reusable component exists, or requirements have significantly different UI/business logic. Reusing would introduce excessive complexity. When creating a new component overlapping an existing one, justify why reuse/extension is not appropriate.

### 4.4. Shared Component Design
- Clearly defined single responsibility.
- Configurable props instead of hardcoding page-specific values.
- Decoupled from specific page or business module logic.
- Explicit TypeScript interfaces; avoid boolean flag explosion.

### 4.5. Agent Reporting
At the end of implementation, report:
- Existing components and implementations discovered.
- Components reused or extended.
- New components created and the reasons.
- Duplicated code identified or refactored.
- Pages and modules affected by the changes.

---

## 5. Git Commit Guidelines

Follow the **Conventional Commits** specification:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat:` | New feature or capability | `feat: add batch CSV export for crawl results` |
| `fix:` | Bug fix | `fix: resolve null pointer in crawl job status check` |
| `refactor:` | Code restructuring without behavior changes | `refactor: extract statistics calculation into repository` |
| `test:` | Adding or updating tests | `test: add feature tests for crawl job creation` |
| `docs:` | Documentation changes | `docs: add core module reusability guide` |
| `chore:` | Tooling, build scripts, dependencies | `chore: update tailwind configuration and scripts` |
