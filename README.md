# @solidxai/core-ui

> Turn your data models into production-grade enterprise applications — with auth, APIs, roles, and admin views — in minutes, not months.

`@solidxai/core-ui` is the frontend library that powers every [SolidX](https://solidxai.com) admin panel. It is a React + TypeScript component library that provides a complete, metadata-driven UI — authentication flows, list views, form views, tree views, kanban boards, dashboards, and more.

[![npm version](https://img.shields.io/npm/v/@solidxai/core-ui)](https://www.npmjs.com/package/@solidxai/core-ui)
[![License: BSL-1.1](https://img.shields.io/badge/License-BSL--1.1-blue.svg)](https://opensource.org/licenses/BSL-1.1)
[![Documentation](https://img.shields.io/badge/docs-solidxai.com-blue)](https://docs.solidxai.com/docs)

## What it provides

`@solidxai/core-ui` ships a full admin panel UI as a composable React library. Rather than building list pages, form pages, filters, and permission checks from scratch on every project, you import the pre-built SolidX components and drive them entirely from the metadata your backend exposes.

The library covers:

- **Complete authentication UI** — login, register, OTP/passwordless, Google OAuth, forgot/reset password
- **Metadata-driven views** — list, form, kanban, and tree views that render themselves from your model's field metadata
- **Redux + RTK Query** — preconfigured state management and API layer for interacting with SolidX backend services
- **Layout system** — admin shell, sidebars, navbars, and auth layout, all theme-aware
- **Extensibility hooks** — registry system, route overrides, custom reducers, and component extension points

## Core Capabilities

### Authentication UI

A full set of authentication pages and the underlying session logic, ready to use out of the box.

- **Login** — password-based and OTP/passwordless flows on the same page
- **Registration** — password and OTP-based registration with email/mobile verification
- **Forgot & Reset Password** — multi-step flow with token validation
- **Google OAuth** — google redirect-based flow that lands back in your app with a JWT
- **Session management** — `signIn`, `signOut`, `getSession`, `refreshAccessToken` adapters that persist tokens and handle expiry automatically
- **Route guard** — `AuthGuard` protects all admin routes; unauthenticated users are redirected to login

### Metadata-driven Views

The heart of the library. Pass your model's metadata and the view renders itself — fields, columns, filters, actions, and pagination — without writing per-resource UI code.

**List View (`SolidListView`)**
- Paginated, sortable data table powered by PrimeReact DataTable
- Per-column filtering with type-aware filter elements (text, date, relation, selection, etc.)
- Configurable columns — users can show/hide columns and save their layout preference
- Bulk actions, row-level actions, and custom action buttons in the header
- Search, saved filters, import (Excel/CSV), and export built in

**Form View (`SolidFormView`)**
- Renders create and edit forms directly from field metadata
- Supports 20+ field types: short text, long text, rich text, date, datetime, time, boolean, integer, decimal, JSON, static/dynamic selection, media (single & multiple), and all relation types (many-to-one, one-to-many, many-to-many)
- Multi-step form support via `SolidFormStepper`
- Inline chatter and activity feed on edit forms
- Custom action buttons and form header/footer extension points

**Kanban View (`SolidKanbanView`)**
- Drag-and-drop board driven by model metadata
- Configurable grouping field, card layout, and column ordering
- Search, filter, and sort — consistent with the list view experience

**Tree View (`SolidTreeView`)**
- Displays data in grouped, hierarchical structures
- Supports nested parent–child relationships
- Uses the same metadata conventions as other views

### Dashboard

A drag-and-drop dashboard builder for composing analytical views.

- Connect widgets to SQL-based dashboard questions defined in the backend
- Variables panel for runtime filter injection into SQL queries
- Support for bar, line, pie, doughnut, data table, meter group widgets

### Chatter

A per-record activity feed and internal messaging thread (`SolidChatter`) that embeds directly into form views — useful for collaboration, approval workflows, and audit commentary.

### Redux Store & API Layer

A pre-built Redux Toolkit store with RTK Query slices covering every SolidX backend endpoint.

**26+ pre-built API slices** including:
- `authApi`, `userApi`, `roleApi` — IAM operations
- `moduleApi`, `modelApi`, `fieldsApi` — metadata management
- `solidEntityApi` — dynamically generates CRUD hooks for any resource at runtime
- `mediaApi`, `mediaStorageProviderApi` — file and storage operations
- `dashboardApi`, `dashboardQuestionApi` — dashboard data
- `solidMenuApi`, `solidViewApi`, `solidActionApi` — layout and UI configuration
- `importTransactionApi`, `exportTemplateApi` — async import/export job tracking
- `solidChatterMessageApi`, `aiInteractionApi` — chatter and AI features

**Redux state slices**: `authSlice`, `userSlice`, `themeSlice`, `navbarSlice`, `dataViewSlice`, `popupSlice`

The store is created via `createSolidStore()` which accepts custom reducers and middleware, so you can extend it with your own application state without conflicts.

### Layout System

A complete admin shell that mirrors the SolidX platform's admin panel.

- `AdminLayout` — main application shell with collapsible sidebar, top navbar, and content area
- `AuthLayout` — clean centered layout for auth pages
- `AdminSidebar` / `UserSidebar` — menu-driven navigation built from the backend's menu metadata
- `Header`, `DashboardHeader`, `ListingHeader` — contextual headers per view type
- `SolidThemeProvider` — light and dark purple themes, switchable at runtime

### Routing

A pre-built React Router v7 route tree covering all admin and auth pages, exported as `getSolidRoutes()`.

```
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password
/auth/otp-login
/auth/google
/admin
/admin/:module/:model/list
/admin/:module/:model/form/:id?
/admin/:module/:model/kanban
/admin/:module/:model/tree
/admin/settings
```

Pass `extraAdminRoutes` and `elementOverrides` to inject custom pages or swap out any built-in page component.

### Extensibility

The library is designed to be extended, not forked.

- **Registry system** — register custom field renderers, column types, and action handlers that the core views will automatically pick up
- **Route overrides** — swap any built-in page with your own implementation via `elementOverrides`
- **Store extension** — add custom reducers and middleware to `createSolidStore()`
- **Component extension** — `SolidFormFieldRenderExtension` and `listViewRegistry` allow injecting custom behaviour per model or per field

---

## Installation

```bash
npm install @solidxai/core-ui
```

### Peer dependencies

```bash
npm install react@18 react-dom@18
```

Certain features have optional peer dependencies:

```bash
# For date picker fields
npm install react-datepicker

# For chart widgets
npm install react-chartjs-2
```

---

## Quick Setup

### 1. Create the Redux store

```typescript
import { createSolidStore } from '@solidxai/core-ui';

export const store = createSolidStore({
  // Optionally extend with your own reducers and middleware
  reducers: { myFeature: myFeatureSlice.reducer },
  middlewares: [myMiddleware],
});
```

### 2. Wrap your app with providers

```typescript
import { StoreProvider, SolidThemeProvider } from '@solidxai/core-ui';
import { store } from './store';

function App() {
  return (
    <StoreProvider store={store}>
      <SolidThemeProvider>
        <RouterProvider router={router} />
      </SolidThemeProvider>
    </StoreProvider>
  );
}
```

### 3. Set up routing

```typescript
import { createBrowserRouter } from 'react-router-dom';
import { getSolidRoutes } from '@solidxai/core-ui';

const router = createBrowserRouter(
  getSolidRoutes({
    extraAdminRoutes: [
      { path: 'my-custom-page', element: <MyCustomPage /> },
    ],
    elementOverrides: {
      // Swap any built-in page component
    },
  })
);
```

### 4. Configure the API base URL

Set the `VITE_API_BASE_URL` environment variable to point at your `@solidxai/core` backend:

```bash
# .env
VITE_API_BASE_URL=https://api.yourapp.com
```

For full configuration options — theme customisation, environment variables, auth provider setup, and extending the component registry — see the [Developer Documentation](https://docs.solidxai.com/docs).

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | TypeScript compiler (`tsc`) |
| State management | Redux Toolkit + RTK Query |
| Routing | React Router v7 |
| UI components | PrimeReact + Bootstrap + PrimeFlex |
| Forms | Formik + Yup |
| Charts | Chart.js |
| Code editors | Monaco Editor + CodeMirror |
| Rich text | Quill |
| Drag and drop | @hello-pangea/dnd (kanban), GridStack (dashboards) |
| HTTP | Axios |
| Theming | SCSS + PrimeReact theme system (light & dark purple) |

---

## Part of the SolidX Platform

`@solidxai/core-ui` is the frontend counterpart to [`@solidxai/core`](https://www.npmjs.com/package/@solidxai/core), the NestJS backend module. Together they form the SolidX low-code development platform — a metadata-first engine that generates fully open-source, standards-based NestJS + React applications that your team owns outright.

No proprietary runtime. No vendor lock-in. Built on the stack your developers already know.

| | |
|---|---|
| Website | [solidxai.com](https://solidxai.com) |
| Documentation | [docs.solidxai.com](https://docs.solidxai.com/docs) |
| Backend module | [@solidxai/core](https://www.npmjs.com/package/@solidxai/core) |
| Support | support@solidxai.com |

---

## License

BSL-1.1 © [Logicloop](https://logicloop.io)
