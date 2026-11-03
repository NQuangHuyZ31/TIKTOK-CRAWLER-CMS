# Core Frontend Components & Reusability Catalog

This catalog documents the reusable UI components, hooks, and utilities available in `modules/Core/resources/js/` (`@core`).
Always check this catalog before building new UI components.

---

## 1. UI Components Catalog (`@core/components`)

### Data Display & Tables

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`ListLayout`** | `@core/components/ListLayout` | Standard administrative page shell. Provides search bar, action buttons, filter drawer/header, and responsive table slot. |
| **`Table`** | `@core/components/Table` | Ant Design `Table` wrapper with built-in server-side pagination, sorting handlers, and responsive scroll container. |
| **`TiktokVideoTable`**| `@core/components/TiktokVideoTable` | Specialized video table with cover thumbnail preview, duration formatter, play/digg/share/comment counters, delta badges, and music info. |
| **`NumericRangeFilter`**| `@core/components/NumericRangeFilter` | Numeric range input filter (min/max) with preset chip buttons (e.g. 1K, 10K, 100K, 1M). |

### Forms & Dialogs

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`ResourceForm`** | `@core/components/ResourceForm` | Standard form wrapper binding Ant Design `Form` with submit buttons, cancel handlers, and responsive grid layouts. |
| **`CustomModal`** | `@core/components/CustomModal` | Standardized Ant Design modal with consistent header styling, footer actions, and loading spinners. |
| **`ConfirmDialog`** | `@core/components/ConfirmDialog` | Confirmation popover or modal for dangerous actions (delete, stop job). |
| **`UploadComponent`** | `@core/components/UploadComponent` | Image and avatar upload component with client-side file size and MIME-type validation. |

### Visual Feedback & Status

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`CardKPI`** | `@core/components/CardKPI` | Metric card with counter, growth rate delta tags, icon badge, and sparklines. |
| **`GrowthChart`** | `@core/components/GrowthChart` | Recharts responsive line and area chart for tracking follower/view trends over time. |
| **`StatusTag`** | `@core/components/StatusTag` | Standardized Ant Design `Tag` mapped to entity statuses (`queued`, `running`, `completed`, `failed`, `cancelled`). |
| **`StatusDropdown`** | `@core/components/StatusDropdown` | Inline status change dropdown menu with confirmation trigger. |
| **`SpinComponent`** | `@core/components/SpinComponent` | Centered loading spinner for async view loading. |
| **`EmptyState`** | `@core/components/EmptyState` | Standard Ant Design `Empty` state container with customizable description and action button. |
| **`PageHeader`** | `@core/components/PageHeader` | Page header with back button, title, subtitle, and breadcrumb slots. |

### Access Control

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`PermissionGate`** | `@core/components/PermissionGate` | Conditionally renders child elements based on user permissions (`module`, `action`). UX control only. |
| **`PermissionMatrix`**| `@core/components/PermissionMatrix` | Interactive RBAC grid table allowing bulk permission assignment across modules and actions. |
| **`AccessDeny`** | `@core/components/AccessDeny` | 403 Forbidden display screen with return-to-dashboard navigation. |

---

## 2. Reusable Hooks (`@core/hooks`)

| Hook | Path | Purpose |
| :--- | :--- | :--- |
| **`useAction`** | `@core/hooks/useAction` | Handles loading state, success toast messages, and error notifications for async API actions: `const { act, loading } = useAction();` |
| **`usePermission`**| `@core/hooks/usePermission` | Checks if current user has permission for a given module and action: `const { can } = usePermission(); if (can('crawler', 'delete')) ...` |
| **`useCurrentUser`**| `@core/hooks/useCurrentUser` | Accesses authenticated user record and profile data from Redux auth store. |

---

## 3. Formatting Utilities (`@core/utils`)

| Utility | Path | Usage |
| :--- | :--- | :--- |
| **`formatNumber`** | `@core/utils/formatNumber` | Formats integers with comma separation or compact suffixes (e.g. `1,250,000` or `1.2M`). |
| **`formatDate`** | `@core/utils/formatDate` | Formats ISO timestamps to standard date (`YYYY-MM-DD`) or datetime (`YYYY-MM-DD HH:mm:ss`) using Day.js. |
| **`formatCurrency`**| `@core/utils/formatCurrency` | Formats numbers to currency representations with configurable locale and currency symbol. |

---

## 4. Central HTTP Client (`@core/Action/api`)

The central HTTP client is exported as `http` from `@core/Action/api`.
- Base URL is resolved from environment variables (`VITE_API_URL`).
- Requests automatically attach Sanctum Bearer tokens from local storage.
- Responses automatically catch 401 Unauthorized errors and redirect to `/auth/login`.
- Exported helper methods: `getAuthToken()`, `setAuthToken(token)`, `removeAuthToken()`.
