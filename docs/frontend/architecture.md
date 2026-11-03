# Frontend Architecture & UI Guidelines

This document details the Single Page Application (SPA) architecture, state management conventions, route registration, and UI component design standards.

---

## 1. Technology Stack

- **Core Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript (`strict: false` in `tsconfig.json` with ongoing strict typing for new code)
- **UI Component Library**: Ant Design v6 (`antd`, `@ant-design/icons`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@tailwindcss/postcss`)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Routing**: React Router DOM v7 (`react-router-dom`)
- **HTTP Client**: Axios with Bearer token interceptor (`@core/Action/api`)
- **Charts & Metrics**: Recharts (`recharts`)
- **Date Handling**: Day.js (`dayjs`)

---

## 2. Directory Structure of a Frontend Module

Each module in `cms-tiktok-crawler/modules/<ModuleName>/resources/js/` follows this layout:

```text
modules/<ModuleName>/resources/js/
├── Action/             # Centralized API service functions using @core/Action/api
│   └── <entity>.ts
├── components/         # Feature-specific decomposed UI components
│   ├── detail/         # Sub-tabs, metric sections, header cards
│   └── form/           # Form sections, input blocks, modal bodies
├── configs/            # Reusable static configurations
│   ├── tableConfig.ts  # Column definitions, filter presets, dictionaries
│   └── options.ts      # Select options, status tags mapping
├── pages/              # Route-level page orchestrators
│   ├── <Entity>ListPage.tsx
│   ├── <Entity>DetailPage.tsx
│   └── <Entity>FormPage.tsx
├── routes/             # Route definitions
│   └── route.ts        # Exports RouteDef[]
├── store/              # Redux domain slice and thunks (if state is shared)
│   └── <entity>/
│       ├── <entity>Slice.ts
│       └── <entity>Thunks.ts
├── utils/              # Module-specific helper functions
└── index.ts            # Entry point that registers routes upon script load
```

---

## 3. Strict English Requirement for Web UI

100% of all user-facing text on the web interface MUST be written in **English**. Never use Vietnamese or mixed languages in:
- Page titles, subtitles, headers, and breadcrumbs.
- Form labels, input placeholders, validation warnings, and helper texts.
- Table column headers, empty state text, and pagination summaries.
- Button labels, action popconfirm dialogs, and modal headings.
- Toast notifications and system alert banners.

---

## 4. Route Registration Pattern

The application uses dynamic route registration managed by `@core/routes/registry`.
Each module declares its route definitions in `routes/route.ts` and exports an array of `RouteDef` objects:

```typescript
import type { RouteDef } from '@core/routes/registry';
import { RobotOutlined } from '@ant-design/icons';
import CrawlJobsPage from '../pages/CrawlJobsPage';

const crawlerRoutes: RouteDef[] = [
    {
        path: '/crawler/crawl-job',
        component: CrawlJobsPage,
        layout: 'admin',
        title: 'Crawl Jobs',
        label: 'Crawl Jobs',
        module: 'crawler',
        action: 'view',
        icon: RobotOutlined,
        order: 10,
    },
];

export default crawlerRoutes;
```

In `resources/js/index.ts`, register the routes into the central registry:
```typescript
import { registerRoutes } from '@core/routes/registry';
import crawlerRoutes from './routes/route';

registerRoutes(crawlerRoutes);
```

### Route Authentication & Layout
- Routes configured with `layout: 'admin'` render inside `AdminLayout.tsx` (`@core/layouts/AdminLayout.tsx`).
- `AdminLayout` verifies `isAuthenticated` from Redux auth state. If unauthenticated, it immediately redirects to `/auth/login`.

---

## 5. State Management: Redux Toolkit vs. Local State

Always evaluate state scope before implementation:

### Redux Slice + Async Thunks (`store/<domain>/`)
Use Redux when:
- Data is a paginated entity list, filter set, or search query shared across tabs or views.
- Data needs to persist across navigation between detail and list views.
- Multiple independent components or sub-tabs need to read or trigger refreshes for the same entity data.

```typescript
// Example: Async Thunk pattern
export const fetchCrawlJobs = createAsyncThunk(
    'crawlJob/fetchCrawlJobs',
    async (params: any, { rejectWithValue }) => {
        try {
            return await crawlJobAPI.getCrawlJobs(params);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch crawl jobs');
        }
    }
);
```

### Direct API + `useAction` Hook
Use direct API calls with `@core/hooks/useAction` for:
- Isolated entity mutations: delete record, pause/resume job, toggle active status.
- Single modal form submissions.
- File downloads or export triggers.
- Local page view state that does not affect any other component.

---

## 6. Component Decomposition Guidelines

1. **Keep Pages Lean**: A page component should act as an orchestrator. It manages route params, triggers Redux thunks or initial fetches, and renders structured sub-components.
2. **Decompose at ~150–200 Lines**: When a TSX file approaches 200 lines or mixes layout rendering with complex form controls, split it into sub-components under `components/`.
3. **Move Constants Out of TSX**: Never define arrays of select options, filter presets, or static table column definitions inside render methods. Declare them in `configs/`.
