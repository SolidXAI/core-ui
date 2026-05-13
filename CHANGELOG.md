# Changelog

All notable changes to this project will be documented in this file.

---

## [0.1.7] - 2026-04-22

### Breaking / Major

**UI Component System Migration**
- Migrated the component library from PrimeReact to a Radix UI / shadcn-based system. All core UI primitives (dialogs, popovers, dropdowns, tooltips, accordions, etc.) are now backed by Radix UI. Icons moved to `lucide-react` and the internal `SolidIcon` system. `@tanstack/react-table` now powers the list view data table.

---

### Added

**Solid Studio**
- New studio landing page and home page (`StudioHomePage`, `StudioLandingPage`) with a dedicated AI studio layout (`SolidAiStudioLayout`) and DOM injection support.

**API Keys Management**
- New `ApiKeysTab` on the user screen with the ability to generate and reveal API keys, including dedicated modals for each flow.

**Agent Settings Screen**
- New settings page for configuring agents.

**AI / LLM Provider Settings**
- New settings section for configuring AI model providers (OpenAI, Anthropic), including per-provider component forms and a model config tab.

**Card View**
- New `card` collection view type added alongside the existing list, kanban, and tree views. Includes card grid, card item, and a card user view layout.

**Lightbox**
- New `SolidLightbox` primitive for media previewing.

**Dynamic Auth Guard**
- Auth guards are now more dynamic: dynamic token saving, configurable `AuthGuard`, plus new `GuestGuard` and `AdminGuard` route guards.

**Layout Registry**
- New `SolidLayoutRegistry` for registering and resolving layouts in a type-safe way.

**Event System**
- Event infrastructure added for solid-core, including MQ message header action events and kanban card events from message queues.

---

### Changed

**Global Search**
- Saved filters now surface in the global search overlay; added keyboard-based navigation with auto-scroll through results.

**List View**
- Refactored context menu, improved row action menu, added datetime column type support, removed shimmer loading placeholder, column selector improvements.

**Form Views**
- Improved field spacing, popup height handling, stepper layout fixes, form header action improvements. `SolidButton` in form view header now correctly forwards all button attributes.

**Kanban View**
- Scroll fix, general cleanup, new kanban card support from MQ messages.

**Tree View**
- Pagination bug fixed, layout fixes, tree table improvements.

**Chatter**
- UI polish pass, chatter message fixes, pagination fixes.

**Import / Export**
- Fixed broken import and export flows; export stepper and UI improved.

**Dark Mode**
- Improved dark mode styling across layout and component surfaces.

**Error Pages**
- New error state components and redesigned error pages.

**`SolidSelect`**
- Now accepts an `id` prop; additional shadcn components exposed; improved type safety on `Dialog` and `List` components.

**Active Menu Item**
- Active sidebar menu item is now visually highlighted.

---

### Fixed

- Fixed redirect behaviour after login in `GuestGuard`
- Fixed `DatePicker` rendering bug
- Fixed `TreeView` pagination
- Fixed JSON view mode rendering bug
- Fixed stepper rendering issues
- Fixed autocomplete field behaviour
- Fixed CodeMirror integration (now uses `SolidCodeEditor` internally)
- Fixed popover positioning and form layout popup issues

---

### Developer Experience

- README added to the repository
- Type-safe layout and component registry
- Removed unused files and legacy docs migration folder

---

## [1.5.0] - 2026-04-08

### Added

**Global toast system**
- `GlobalToast` component, `toastSlice` Redux state, and `sticky` parameter for persistent notifications. Integrated into `Layout` and exported from the library.

**Dashboard filter**
- New `DashboardFilter` component integrated into `SolidDashboard`, enabling variable-based filtering across dashboard pages.

**Dashboard layout API**
- `dashboardLayoutApi` — new RTK Query API for fetching and persisting dashboard layout data.
- `PrimeDataTableWrapper` — new shared wrapper component for data tables within dashboards.
- Extension handlers: `dashboardFormViewChangeHandler`, `dashboardQuestionFieldChangeHandler`, and `dashboardQuestionOnFormLoadHandler` — registered in `registry.ts` and exported from the library.

**`DefaultDateTimeListWidget` registration**
- `SolidDateColumn` and `SolidDatetimeColumn` now register `DefaultDateTimeListWidget` as their default view widget, enabling configurable date formatting in list views.

**Keyboard navigation in global search overlay**
- Arrow keys and Enter now navigate and select items in the global search overlay (`SolidGlobalSearchElement`).

---

### Changed

**Filter management refactored to `SolidGlobalSearchElement`**
- Active filter state has been extracted from `SolidListView` and consolidated into `SolidGlobalSearchElement`, reducing duplication and improving separation of concerns.

**`SolidListView` — back-button filter restoration**
- When navigating back, the list view now correctly reads and reapplies the previously active filters from local storage.

**`SolidListView` — default filters for embedded views**
- Embedded list views now apply their configured default filters on initial load.

**`SolidMediaSingleField` — granular disabled/readonly states**
- `disabled` and `readonly` props are now handled independently, allowing fine-grained control over field interactivity.

**`SolidChatterDateDivider` — human-readable date format**
- Date dividers in the chatter are now formatted to a human-readable string instead of a raw ISO value.

**`SolidChatterAuditMessage` — local time zone**
- Audit field values in the chatter are now displayed consistently in the user's local time zone.

**`SolidDashboard` / `SolidDashboardBody` / `SolidQuestionRenderer` — layout rework**
- Major layout restructuring; improved responsive sizing and rendering. `ChartJsRenderer` updated with better chart configuration.

**Dashboard filter UI**
- `DashboardFilter` UI redesigned; filter inputs and layout reorganised.

**Auth components — dispatch refactor**
- Standardized Redux dispatch pattern across all auth flow components: `SolidLogin`, `SolidRegister`, `SolidForgotPassword`, `SolidResetPassword`, `SolidInitialLoginOtp`, `SolidInitiateRegisterOtp`, `SolidChangeForcePassword`, `GoogleAuthChecking`, `SolidChangePassword`, `SolidNotifications`, `SolidPersonalInfo`, `GeneralSettings`, `SolidExport`, `SolidFormStepper`, `SolidImportDropzone`, `SolidImportTransaction`.

**`SolidAdmin` — layout restructure**
- Internal layout and component structure of `SolidAdmin` refactored.

**`FormPage` — remount on param change**
- `FormPage` now uses a `key` prop derived from route params, triggering a clean component remount when navigating between different form pages.

**`SolidFormView` — audit defaults to chatter**
- The audit button now navigates to the chatter tab by default.

---

### Fixed

- **Navbar path error** — corrected an incorrect path in `navbar-two-menu` that caused broken navigation from menu items.
- **Menu item highlight** — active menu item highlighting now correctly tracks the current route in `navbar-two-menu`.
- **Chatter date not displayed** — fixed chatter messages not showing their date header properly.
- **Date edge cases** — corrected boundary-value handling in date display logic.
- **Audit values in wrong timezone** — audit log field values now display in the user's local time zone.
- **Delete module action** — fixed import/usage error in `DeleteModelRowAction`.
- **M2M unsaved entity guard** — many-to-many relation widgets (`SolidRelationManyToManyField`, `RolePermissionsManyToManyFieldWidget`) now block modifications when the parent entity has not yet been saved, and display an appropriate warning message.
- **Tree view CSS** — additional `globals.css` fixes for tree table wrapper layout.

---

## [0.1.4] - 2026-03-13

### Added

**Tree view**
- `SolidTreeView` — a new hierarchical `TreeTable`-based view component supporting grouping rules, aggregation rules (count/sum/avg/min/max), multi-column sort, filter, per-node pagination, expand/collapse, and create/edit/delete via embedded form dialogs. Permissions and a `beforeTreeDataLoad` extension hook are supported.
- `treeViewRegistry` — new registry (`Map<string, SolidTreeViewHandle>`) with `registerTree`, `unregisterTree`, `getTree`, `hasTree`, and `getRegisteredTreeIds`, mirroring the existing `listViewRegistry` API.
- `TreePage` route component wrapping `SolidTreeView`; route `/admin/core/:moduleName/:modelName/tree` registered with key `"tree"`.
- Both `SolidTreeView` and `treeViewRegistry` are exported from `src/index.ts`.

**Many-to-many list view**
- `DefaultRelationManyToManyListFormEditWidget` — a new widget that renders an embedded `SolidListView` for related M2M records. Includes a "Link existing" `AutoComplete` dialog and a "save parent first" confirmation dialog. Passes `embededFieldRelationType="many-to-many"` to the list view.
- Registered in `registry.ts`; set as the new default view widget for `SolidRelationManyToManyField` (previously used the one-to-many widget).

**One-to-many filter**
- `SolidOneToManyFilterElement` — new filter element using PrimeReact `AutoComplete`, fetching suggestions via `createSolidEntityApi` with `$containsi` on `userKeyField`.
- `SolidRelationOneToManyField` (filter) — new filter field UI with `$in`/`$notIn` operator dropdown and `SolidVarInputsFilterElement` with input type `RelationOneToMany`.
- `InputTypes.RelationOneToMany` added to the `InputTypes` enum.
- `SolidRelationField` (filter) now dispatches to `SolidRelationOneToManyField` when `relationType === 'one-to-many'`.

**Multi-column sort in `SolidListView`**
- `sortField`/`sortOrder` state replaced with `multiSortMeta: { field: string; order: 1 | -1 }[]`.
- `DataTable` uses `multiSortMeta` prop with `sortMode="multiple"` (configurable via layout attrs).
- `SolidListViewHandle.setSort` now takes `nextMultiSortMeta` array; `getState` returns `multiSortMeta`.
- `removableSort` is configurable via `solidListViewLayout.attrs.removableSort` (default `true`).

**Version info panel**
- `SolidVersionInfo` component in account settings — queries `/info/versions` and displays package name, version tag, and repo type (local vs npm) for `solid-core`, `solid-core-ui`, and `solid-code-builder`.
- New RTK Query endpoint `getSolidVersionInfo` added to `solidSettingsApi`; hooks exported from `src/index.ts`.
- "About" tab added to `SolidAccountSettings`.

**Dashboard page**
- `DashboardPage` route component reads `dashboardId` and `dashboardName` from URL params and renders `SolidDashboard`.
- Route `/admin/core/:moduleName/dashboards/:dashboardId` registered with key `"dashboard"`.
- Exported as `AdminDashboardPage` from `src/index.ts`.

**`GroupingComponent`**
- New shared component for defining grouping rules (with date-format options: YYYY, MMM, YYYY-MM, YYYY-MM-DD) and aggregation rules on numeric fields. Used by `SolidTreeView` and `SolidKanbanView`.

**`DefaultDateTimeListWidget`**
- New list widget in `SolidDateColumn.tsx` that uses `DateFieldViewComponent` for configurable date formatting, replacing raw string display.
- `SolidDateColumn` and `SolidDatetimeColumn` now use `DefaultDateTimeListWidget` as their default view widget instead of `DefaultTextListWidget`.

**`modelSequenceFormViewChangeHandler`**
- New `onFieldChange` extension handler: when the `module` field changes, sets `whereClause` on both `model` and `field` fields; when `model` changes, sets `whereClause` on `field` only. Registered in `registry.ts`.

**`failedLoginAttempts` field in `CreateUser`**
- Numeric field added to the user form, visible only in edit mode. Included in both create and update payloads with Yup validation.

**`passwordlessLoginValidateWhat` setting**
- Separate "Password Less Login Method" section added to `GeneralSettings` with Email, Mobile, and Selectable options — distinct from the existing registration method setting.
- `SolidLogin` now reads `passwordlessLoginValidateWhat` (not `passwordlessRegistrationValidateWhat`) to control login flow.

---

### Changed

**M2M persistence model**
- M2M changes are now persisted immediately per-interaction via `handleRelationUpdate` / `linkItem` / `unlinkItem` (individual `PATCH` calls with `${fieldName}Ids[]` and a `"connect"` or `"disconnect"` command), instead of accumulating changes in Formik and submitting them on form save. The `updateFormData` body was disabled to prevent double-writes.
- M2M field population on form load moved from `SolidRelationManyToManyField.initialValue()` to a new `populateFormikWithRelatedEntities` async call triggered by `useEffect([formik.values.id])`, which fetches linked records from the API. This applies to all three M2M widgets (`AutoComplete`, `CheckBox`, `RolePermissions`).
- `RolePermissionsManyToManyFieldWidget` no longer uses Formik state for checkbox tracking; it uses `allOptions` + `currentValues` from `useRelationEntityHandler`.

**`SolidListView` — embedded relation API**
- `handlePopUpOpen` prop split into `handleAddClickForEmbeddedView` and `handleEditClickForEmbeddedView`. All callers updated.
- New props: `embededFieldRelationType: string` and `handleDeleteClick`. When `embededFieldRelationType === "many-to-many"`, the delete button calls `handleDeleteClick(rowData.id)` instead of the normal delete dialog.

**`SolidListView` — delete column visibility**
- Column now shows when `params.embeded === true` (always for embedded M2M), or when `showRowDeleteInContextMenu` is explicitly defined and is not `true`. Context menu delete is hidden when `params.embeded === true`.

**`SolidListView` — view modes source**
- `viewModes` now reads from `solidListViewInitialMetaData.data.viewModes` (API response) instead of mapping `solidListViewLayout.attrs.allowedViews`. `handleViewChange` navigates to the view type path and appends `menuItemId`, `menuItemName`, `actionId`, `actionName` as query params. Same change applied to `SolidKanbanView` and `SolidTreeView`.

**`SolidListView` — `ListPage` remount key**
- The `key` prop on `ListPage` changed from a concatenation of six fields to just `listId`.

**`SolidTreeView` — scrollable layout**
- `TreeTable` is now scrollable with `tableStyle={{ minWidth: "max-content" }}`, `resizableColumns`, and `columnResizeMode="expand"`. Columns get a default `minWidth: "12rem"`. CSS for `solid-treetable-wrapper` moved from inline `<style>` tags to `globals.css`.

**`SolidTreeView` — event rename**
- `onBeforeTreeLoad` renamed to `onBeforeTreeDataLoad` throughout event invocations and type definitions in `solid-core.d.ts`.

**`SolidBooleanField` — `onChange` normalisation**
- `onChange` now wraps the raw PrimeReact `CheckboxChangeEvent` in a normalised synthetic event (`{ target: { name, value, checked }, type: 'checkbox' }`) before calling `fieldContext.onChange`.
- The `useEffect` that auto-set a default value of `"false"` on mount has been removed from both the standard and checkbox-style boolean widgets.

**`buildRelationCustomFilter` — shared and explicit AND**
- Inline `buildCustomFilter` functions removed from individual widgets; replaced with a shared module-level `buildRelationCustomFilter` that uses `$and: [baseFilter, parsedWhereClause]` for explicit AND semantics, supporting an optional `whereClause` attribute.

**`DefaultRelationManyToOneListWidget` — opens in new tab**
- Clicking the many-to-one link now calls `window.open(newPath, "_blank")` instead of `router.push`. Adds a `pi-external-link` icon and a fallback path-segment detection for form pages.

**`SolidGlobalSearchElement` — seeded filter protection**
- Edit and delete buttons in `SavedFilterList` are now hidden for filters where `savedfilter.isSeeded === true`.

**`SolidDashboardVariable` — `selectionStaticValues` parsed from JSON**
- `staticValues` now uses `JSON.parse(dashboardVariable.selectionStaticValues || '[]')` to handle the field being stored as a JSON string rather than an array.

**Passwordless login — "transactional" renamed to "selectable"**
- `"transactional"` replaced with `"selectable"` throughout `SolidLogin.tsx`. The "Transactional" radio button and associated note removed from `GeneralSettings`; the `"transactional"` OTP title case removed from `SolidInitialLoginOtp`.

---

### Fixed

- **M2M field not populated on form edit** — `initialValue()` was unreliable; replaced with `populateFormikWithRelatedEntities` which fetches linked records from the API on load.
- **M2M checkbox null safety** — `handleCheckboxChange` now guards against `formik.values[fieldName]` being `undefined` with a fallback to `[]`.
- **`SolidListView` stale sort closure** — `setQueryString` previously read sort state from a closed-over variable. A `latestMultiSortMetaRef` ref is now kept in sync via `useEffect` to avoid stale values.
- **`SolidShortTextColumn` unintended date coercion** — the `parseIsoDate` function and its detection branch were silently reformatting any ISO-looking string (e.g., identifiers). Removed entirely; date columns now use `DefaultDateTimeListWidget`.
- **`SolidListView` delete toast `severity` undefined** — the `...(severity === "error" ? ...)` spread in `handleDeleteEntity` referenced an undefined `severity` variable. Fixed to use literal `life: 3000` for success and `sticky: true` for error paths.
- **`TreePage` using wrong registry** — `TreePage` was calling `registerListView`/`unregisterListView` with the tree handle; corrected to use `registerTree`/`unregisterTree`.
- **`SolidTreeView` `@/` alias imports** — all `@/` alias imports replaced with relative paths, fixing build failures in environments where the alias is not resolved (also fixed in `modelSequenceFormViewChangeHandler.tsx`, `registry.ts`, `TreePage.tsx`, `SolidRelationManyToManyField.tsx`).

---

### Removed / Cleaned Up

- **PrimeReact built-in column filters** — removed `filterElement`, `filterMatchModeOptions`, `dataType`, `showFilterOperator`, and related imports (~543 lines) from all 16 column components (`SolidBooleanColumn`, `SolidDateColumn`, `SolidDatetimeColumn`, `SolidExternalIdColumn`, `SolidIdColumn`, `SolidIntColumn`, `SolidMediaMultipleColumn`, `SolidMediaSingleColumn`, `SolidSelectionDynamicColumn`, `SolidSelectionStaticColumn`, `SolidShortTextColumn`, `SolidTimeColumn`, `SolidUuidColumn`, `SolidRelationManyToManyColumn`, `SolidRelationManyToOneColumn`, `SolidRelationOneToManyColumn`). The project uses its own custom filter panel (`FilterComponent`).
- **`parseIsoDate` from `SolidShortTextColumn`** — function and `dayjs` import deleted entirely.
- **`@ts-nocheck` from `SolidListView`** — directive removed; explicit type annotations added throughout; duplicate `onClick` prop on the bulk-delete confirm button removed.
- **`console.log` / `console.error` statements** — debug logs removed from `SolidGlobalSearchElement`, `SolidListView`, and `fetchBaseQuery`.
- **Unused imports** — `capitalize` (lodash), `InputSwitch` (primereact), `Link`, `pascalCase`, `KanbanImage`, `SolidLayoutViews`, `FilterOperator`/`FilterRule`/`FilterRuleType`, `DataTableFilterMeta` removed from `SolidListView` and related files.
- **Inline `<style>` in `SolidTreeView`** — `solid-treetable-wrapper` CSS rules moved to `src/resources/globals.css`.

---

## [0.1.3] - 2026-02-25

_(previous release — no changelog entry)_
