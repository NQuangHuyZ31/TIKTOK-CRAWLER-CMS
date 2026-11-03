# Frontend Engineering Rules (React 19 + TypeScript + Ant Design 6)

Scope: `cms-tiktok-crawler/modules/*/resources/js/`. Read when editing frontend code.
Detailed Architecture: [`docs/frontend/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/architecture.md) | SOLID Principles: [`docs/development/solid-principles.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/solid-principles.md) | Component Catalog: [`docs/frontend/core-components.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/core-components.md)

## 1. Component Placement & Architecture
- **Layers**: `pages/` (orchestration, route params, layout) -> feature `components/` (decomposed UI) -> `@core/components/` (generic, 2+ modules).
- **Page Responsibility**: Pages MUST NOT contain large inline SVGs, raw data transformations, or inline table column arrays (>40 lines). Extract to sub-components or `configs/`.
- **Component Decomposition**: Decompose components when exceeding ~150-200 lines or mixing layout with form logic.
- **Core First**: Generic UI components belong in `@core`. Core components MUST NOT import from feature modules or contain domain business logic.

## 2. TypeScript Invariants
- **No `any`**: New or modified code MUST NOT introduce `any`. Use strict interfaces, generics, or `unknown` with type narrowing. (`tsconfig.json` has `strict: false`; do not mass-refactor legacy types unprompted).
- **Typing Payloads**: Define request/response types in API clients (`Action/`) or module types. Do not re-declare in multiple components.
- **Component Props**: Every component MUST declare a typed interface for props with sensible defaults for optionals.

## 3. UI, Language & Ant Design Standards
- **Strict English**: 100% of all user-facing web text (titles, buttons, labels, placeholders, toasts, errors, table headers, empty states) MUST be in English. Vietnamese is strictly prohibited in web UI.
- **Design System**: Use Ant Design v6 tokens and components.
- **Reuse Core Components**: Always check [`docs/frontend/core-components.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/frontend/core-components.md) for tables (`ListLayout`, `Table`, `TiktokVideoTable`), forms (`ResourceForm`, `CustomModal`, `ConfirmDialog`), and metrics (`CardKPI`, `GrowthChart`, `StatusTag`).

## 4. State Management & API Integration
- **State Partition**:
  - **Redux Slice + Thunk** (`store/<domain>/`): Shared entity lists, server pagination, search filters, and multi-tab state.
  - **Direct API + `useAction`**: Single row mutations (delete, toggle status, submit modal, export).
  - NEVER store the exact same entity dataset in both Redux and local React state.
- **HTTP Client**: Use `http` from `@core/Action/api` (Sanctum bearer token, 401 handling). Never use raw `fetch()` or custom axios instances.
- **URL Query Parameters**: Use `useSearchParams` only when filter/pagination state must be shareable via link.

## 5. Imports & Configs
- **Path Aliases**: Use `@core/...` and `@modules/<Module>/...`. Sibling relative imports (`./`, `../`) are allowed. NEW imports MUST NOT use `../../` or deeper.
- **Static Configs**: Move column definitions, presets, and select options to `configs/` (e.g. `configs/tableConfig.ts`). Do not inline in TSX.

## 6. SOLID & God Component Prevention
- **SRP & God Components**: Decompose components exceeding ~150-200 lines into sub-components (`<Toolbar />`, `<FormDrawer />`). Separate view rendering from stateful logic (custom hooks).
- **ISP (Prop Segregation)**: Components must accept only the exact props they require. Never pass monolithic entity objects when only 2-3 fields are rendered.
- **DIP**: Rely on abstracted HTTP clients (`@core/Action/api`) and custom hooks. Never make direct fetch calls from presentation components.
- **OCP & LSP**: Extend containers via composition (`children`) and optional props. Custom UI wrappers must honor standard AntD component contracts. See [`docs/development/solid-principles.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/solid-principles.md).
