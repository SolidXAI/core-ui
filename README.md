# @solidxai/core-ui

> The React UI framework behind every SolidX application — auth flows, metadata-driven forms and tables, dashboards, and full state management — wired up and ready to use.

`@solidxai/core-ui` is the frontend counterpart to [`@solidxai/core`](https://www.npmjs.com/package/@solidxai/core). It ships a complete set of React components, Redux slices, RTK Query API integrations, route guards, and utility hooks designed to work with the SolidX backend platform — so you can build production-grade admin and data-management interfaces without rebuilding the same infrastructure on every project.

[![npm version](https://img.shields.io/npm/v/@solidxai/core-ui)](https://www.npmjs.com/package/@solidxai/core-ui)
[![License: BSL-1.1](https://img.shields.io/badge/License-BSL--1.1-blue.svg)](https://mariadb.com/bsl11/)
[![Documentation](https://img.shields.io/badge/docs-solidxai.com-blue)](https://docs.solidxai.com/docs)
[![Discord](https://img.shields.io/badge/discord-online-brightgreen.svg)](https://discord.gg/yh4KZf8c)


## Why @solidxai/core-ui?

Building admin dashboards and data-management UIs involves the same heavy lifting every time: authentication screens, data tables with filtering and pagination, form builders for every field type, role-aware UI elements, file upload flows, and a global state layer that ties it all together.

`@solidxai/core-ui` bundles all of that into a single, cohesive package that is:

- **Metadata-driven** — point `SolidListView` or `SolidFormView` at a model name and get a fully functional table or form without writing column definitions or field components by hand.
- **Fully typed** — complete TypeScript definitions for every component, hook, slice, and utility.
- **Extensible** — register custom components and functions into the extension registry; the core engine picks them up automatically.
- **Backend-agnostic escape hatches** — pre-configured Axios instance and RTK Query base query, but nothing prevents you from calling your own endpoints alongside them.


## Core Capabilities

### Metadata-driven Views

The centrepiece of the library. Describe your data model once and get complete UI for free.

- **`SolidListView`** — data table with multi-column sorting, rich filter expressions, group-by, column visibility, row actions, import/export, and pagination; supports 15+ column types including relations, media, rich text, and computed fields.
- **`SolidFormView`** — full create/edit form rendered from model metadata; supports 15+ field types — boolean, date/time, decimal, integer, short/long text, rich text, JSON, media (single & multiple), static/dynamic selection, relation, email, password, and more.
- **`SolidFormStepper`** — multi-step wizard wrapper for any form.
- **`SolidTreeView` / `SolidTreeTable`** — hierarchical tree display, with optional table columns.
- **`SolidKanbanView`** — kanban board view backed by the same model metadata.

### Authentication

Complete auth UI with no extra wiring needed.

- Login, registration, forgot/reset password, and force-change-password screens
- OTP / passwordless flows (SMS and email)
- Google OAuth2 integration
- JWT access/refresh token management via `authSlice` and the `baseQueryWithAuth` RTK Query adapter
- `AuthGuard` and `GuestGuard` route protection components

### Layouts & Navigation

- `AdminLayout` / `Layout` — shell layouts with sidebar, header, and footer regions
- `SolidAiStudioLayout` / `SolidStudio` — studio/configuration mode for admin users
- `NavbarOne`, `NavbarTwo` — responsive top navigation bars
- `AdminSidebar`, `UserSidebar` — collapsible sidebars
- `GlobalSearch` — application-wide search component
- `FilterMenu` — slide-in advanced filter panel

### Dashboards

- `SolidDashboard` — drag-and-drop dashboard grid backed by Gridstack
- `SolidViewLayoutManager` — layout composer for arranging views
- Chart.js integration: bar, line, pie, doughnut, data table, and meter-group chart types
- Security-aware aggregates that respect the active user's role

### Redux Store & API Layer

A pre-wired Redux Toolkit store with slices and RTK Query API definitions ready to drop in.

| Slices | Purpose |
|---|---|
| `authSlice` | Token storage and logout |
| `userSlice` | Current user and authentication state |
| `themeSlice` | Light / dark theme |
| `toastSlice` | Toast notification queue |
| `popupSlice` | Modal open/close state |
| `navbarSlice` | Navbar visibility |
| `dataViewSlice` | Grid vs list view toggle |

API slices (RTK Query) cover: auth, users, roles, modules, models, fields, views, menus, media, import/export, dashboards, settings, chatter, API keys, and AI interactions.

### UI Component Library

A complete set of primitives built on Radix UI, PrimeReact, and Bootstrap, including:

- Buttons, inputs, textareas, password fields, date pickers, autocomplete
- Dialogs, popovers, tooltips, accordions, tabs, dropdowns
- Checkboxes, radio groups, switches, sliders, progress bars
- Rich text editor (Quill), code editor (Monaco / CodeMirror)
- Media lightbox, image viewer, PDF viewer
- `SolidIcon` — custom icon registry backed by Lucide React

### State, Routing & Providers

- `StoreProvider` — wraps the app with the Redux store
- `SolidThemeProvider` — theme context
- `SolidToastProvider` — toast notification context
- `SolidLayoutRegistryProvider` — layout registry context
- `getSolidRoutes` — generates the full route tree from module metadata
- `useSession`, `useRouter`, `usePathname`, `useSearchParams` — familiar routing hooks

### Utilities & Helpers

- `solidAxios` — pre-configured Axios instance with auth headers
- `solidGet`, `solidPost`, `solidPut`, `solidPatch`, `solidDelete` — typed HTTP helpers
- `signIn`, `signOut`, `getSession`, `refreshAccessToken` — auth session helpers
- `permissionExpression`, `hasAnyRole` — permission evaluation helpers
- `downloadFileWithProgress`, `downloadMediaFile`, `fetchS3Url` — file utilities
- `eventBus` / `AppEvents` — application-wide event system
- `registerExtensionComponent`, `registerExtensionFunction` — extension registry

### Chatter

- `SolidChatter` — per-record messaging thread and activity feed component, mirroring the backend Chatter feature


## Installation

```bash
npm install @solidxai/core-ui
```

### Peer dependencies

```bash
npm install react react-dom react-router-dom \
  @reduxjs/toolkit react-redux \
  bootstrap primereact primeicons primeflex
```


## Quick Setup

### 1. Create the store

```typescript
import { createSolidStore } from '@solidxai/core-ui';

export const store = createSolidStore({
  entities: ['User', 'Post'],   // your entity names
  reducers: { mySlice: myReducer },
  middlewares: [myMiddleware],
});
```

### 2. Wrap your app

```typescript
import {
  StoreProvider,
  SolidThemeProvider,
  SolidToastProvider,
} from '@solidxai/core-ui';

export default function App() {
  return (
    <StoreProvider store={store}>
      <SolidThemeProvider>
        <SolidToastProvider>
          <Router />
        </SolidToastProvider>
      </SolidThemeProvider>
    </StoreProvider>
  );
}
```

### 3. Use metadata-driven views

```typescript
import { SolidListView, SolidFormView } from '@solidxai/core-ui';

// Renders a full data table for the "users" model
<SolidListView moduleName="users" viewName="list" />

// Renders a create/edit form for the "users" model
<SolidFormView moduleName="users" viewName="create" />
```

For full configuration options — environment variables, theming, extension points, and advanced layout setup — see the [Developer Documentation](https://docs.solidxai.com/docs).


## Technology Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Routing | React Router DOM 7 |
| State management | Redux Toolkit + RTK Query |
| HTTP | Axios |
| UI primitives | Radix UI · PrimeReact · Bootstrap 5 |
| Data tables | TanStack Table 8 |
| Charts | Chart.js |
| Dashboard grid | Gridstack · React Grid Layout |
| Rich text | Quill |
| Code editor | Monaco Editor · CodeMirror |
| Forms | Formik + Yup |
| Drag and drop | @hello-pangea/dnd |
| Date/time | Day.js |
| Icons | Lucide React |

---

## Part of the SolidX Platform

`@solidxai/core-ui` is the frontend foundation of the [SolidX](https://solidxai.com) low-code development platform. It pairs with [`@solidxai/core`](https://www.npmjs.com/package/@solidxai/core) (the NestJS backend module) to form a complete full-stack framework. SolidX generates fully open-source, standards-based NestJS + React code that your team owns outright — no proprietary runtime, no lock-in.

| | |
|---|---|
| Website | [solidxai.com](https://solidxai.com) |
| Documentation | [docs.solidxai.com](https://docs.solidxai.com/docs) |
| Backend package | [@solidxai/core](https://www.npmjs.com/package/@solidxai/core) |
| Discord | [discord.gg/yh4KZf8c](https://discord.gg/yh4KZf8c) |
| Support | support@solidxai.com |

---

## License

BSL-1.1 © [Logicloop](https://logicloop.io)
