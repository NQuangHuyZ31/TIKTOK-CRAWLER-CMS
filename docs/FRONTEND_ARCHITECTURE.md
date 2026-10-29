# Frontend Architecture & UI Guidelines

This document outlines the frontend architectural patterns, state management, routing, component hierarchy, and user interface standards for the `cms-tiktok-crawler` application.

---

## 1. Technology Stack

- **Framework**: **React 19**
- **Language**: **TypeScript** (Strict mode enabled, zero untyped `any`)
- **UI Component Library**: **Ant Design (antd v6)**
- **CSS Utility**: **Tailwind CSS v4** + PostCSS
- **State Management**: **Redux Toolkit (RTK)** + `react-redux`
- **Routing**: **React Router DOM v7** (with dynamic route auto-registration)
- **HTTP Client**: **Axios** (wrapped in `@core/Action/api`)
- **Date Utility**: **Day.js**

---

## 2. Directory Structure of a Frontend Module

Each module under `modules/<ModuleName>/resources/js/` follows a standardized structure:

```text
modules/<ModuleName>/resources/js/
├── Action/                              # Typed API caller functions (e.g., crawlJob.ts)
├── components/                          # UI components internal to this module
├── configs/                             # Table columns, form schema configs, constants
├── pages/                               # Page-level components mounted by router
├── routes/                              # Route declarations for React Router
│   └── route.ts                         # Exports RouteItem[] registered into SPA
├── store/                               # Redux slices and async thunks
│   ├── <entity>Slice.ts                 # Reducers & synchronous actions
│   └── <entity>Thunks.ts                # Async API thunks
└── index.ts                             # Public barrel export of the frontend module
```

---

## 3. Strict English Requirement for UI & Code

> [!IMPORTANT]
> **All UI text, labels, messages, comments, and identifiers MUST be in English.**
> 
> - **UI Elements**: Page titles, button labels, table headers, form inputs, placeholders, modal messages, toast alerts, and error feedback must strictly use clear, professional English.
> - **Code Comments & Docstrings**: All inline comments, JSDoc/PHPDoc blocks, and file headers must be written in English.
> - **Commit Messages**: Conventional commits written exclusively in English.

### Standard Vocabulary Reference:
| UI Context | Standard English | Avoid (Non-English / Inconsistent) |
| :--- | :--- | :--- |
| Create Action | `Create Crawl Job` / `Add Account` | *Tạo mới*, *Thêm mới* |
| Edit Action | `Edit Record` / `Update` | *Chỉnh sửa*, *Cập nhật* |
| Delete Action | `Delete` / `Remove` | *Xóa*, *Gỡ bỏ* |
| Confirmation | `Are you sure you want to delete this job?` | *Bạn có chắc chắn muốn xóa không?* |
| Empty State | `No data available` / `No jobs found` | *Không có dữ liệu* |
| Loading State | `Loading data...` / `Processing...` | *Đang tải...* |
| Success Toast | `Crawl job started successfully` | *Khởi động job thành công* |
| Error Toast | `Failed to fetch crawl job details` | *Lấy thông tin thất bại* |

---

## 4. Route Registration Pattern

Each module declares its frontend routes in `modules/<ModuleName>/resources/js/routes/route.ts`:

```typescript
import React from 'react';
import type { RouteObject } from 'react-router-dom';

const CrawlJobsPage = React.lazy(() => import('../pages/CrawlJobsPage'));
const CrawlJobDetailPage = React.lazy(() => import('../pages/CrawlJobDetailPage'));

export const crawlRoutes: RouteObject[] = [
    {
        path: '/crawler/crawl-jobs',
        element: <CrawlJobsPage />,
    },
    {
        path: '/crawler/crawl-jobs/:id',
        element: <CrawlJobDetailPage />,
    },
];

export default crawlRoutes;
```

Routes are collected and mounted automatically by `modules/Core/resources/js/routes/autoRegister.tsx`.

---

## 5. State Management: Redux Toolkit

### 5.1. Global State vs Local State
- **Local State (`useState`, `useReducer`)**: Form inputs before submission, modal visibility, active tab, row selection.
- **Redux Global State**: Cached server entities, user profile, permissions, system notification counters.

### 5.2. Async Thunks Pattern
```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getCrawlJobs } from '../../Action/crawlJob';

export const fetchCrawlJobs = createAsyncThunk(
    'crawler/fetchCrawlJobs',
    async (params: Record<string, any> = {}, { rejectWithValue }) => {
        try {
            const response = await getCrawlJobs(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch crawl jobs.');
        }
    }
);
```

---

## 6. Component Reusability & Guidelines

1. **Always Check Core First**:
   - Use [`TableComponent`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/Table.tsx) instead of wrapping `antd.Table` manually.
   - Use [`CardKPI`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/CardKPI.tsx) for metrics widgets.
   - Use [`ListLayout`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/ListLayout.tsx) for standard admin list views.
   - Use [`CustomModal`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/CustomModal.tsx) and [`ConfirmDialog`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/resources/js/components/ConfirmDialog.tsx) for modals.
2. **Strict Type Safety**:
   - Always define explicit interfaces for component Props.
   - Never use `any` unless integrating with untyped legacy libraries (with mandatory comment).
3. **Responsive & Modern Styling**:
   - Combine Ant Design components with Tailwind CSS utility classes for margins, padding, and layout flexbox/grid.

---

## 7. Standardized Table Base Actions

`TableComponent` in `@core/components/Table` provides out-of-the-box base action column rendering, eliminating repetitive Popconfirm, Tooltip, and Button boilerplate across feature modules:

- **Built-in Props**:
  - `onEdit?: (record: T, index: number) => any`: Automatically renders an Edit button with tooltip.
  - `onDelete?: (record: T, index: number) => any`: Automatically renders a Delete button wrapped with Popconfirm.
  - `onView?: (record: T, index: number) => any`: Automatically renders a View detail button.
  - `canDelete?: (record: T) => boolean`: Dynamically enables/disables the delete action (e.g. `(r) => r.slug !== 'admin'`).
  - `deleteTooltip?: string | ((record: T) => string)`: Tooltip message for delete button.
  - `extraActions?: (record: T, index: number) => React.ReactNode`: Injects module-specific action buttons alongside base Edit/Delete.
  - `customActions?: TableActionConfig<T>[]`: Declarative array of custom actions.

---

## 8. Universal Action Execution Hook (`useAction`)

The `useAction` hook in `@core/hooks/useAction` standardizes asynchronous mutations (delete, status update, toggle, export):

```typescript
import useAction from '@core/hooks/useAction';

// Clean, 1-line action handler with auto loading, notification, error extraction & store refresh:
const { execute: handleDelete, loading: isDeleting } = useAction(
    (role: RoleItem) => deleteRole(role.id),
    {
        successMessage: (_, role) => `Role '${role.name}' deleted successfully.`,
        errorMessage: 'Failed to delete role',
        onSuccess: () => dispatch(fetchRoles(params)),
    }
);
```

---

## 9. Redux Slice & Thunk Architecture Rule

> [!IMPORTANT]
> **Avoid Sprawling `useState` in Page Components**:
> 
> - When a module manages entity lists, pagination, filtering, search keywords, or modal forms, the agent **MUST author a dedicated Redux Slice (`store/<domain>/<domain>Slice.ts`) and Thunks (`store/<domain>/<domain>Thunks.ts`)** and register the reducer in Core `store/index.ts`.
> - Never pollute page components with 5+ `useState` hooks for data, loading, error, pagination, and search with manual `useCallback(loadData)` try-catch boilerplate. Use Redux + `useAction` + `TableComponent` base actions for clean, maintainable architecture.
