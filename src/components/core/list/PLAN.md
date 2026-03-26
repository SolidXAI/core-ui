# List View Rewrite Plan (Shadcn + Single Sort)

## Goal
- [ ] Rebuild list view UX on shadcn primitives while preserving current behavior.
- [ ] Remove PrimeReact dependencies from list flow.
- [ ] Replace multi-sort with single-sort everywhere (UI, state, query, imperative API).

## Scope
- [ ] `SolidListView.tsx`
- [ ] `SolidListViewColumn.tsx` + `columns/*`
- [ ] `SolidListViewConfigure.tsx`
- [ ] `SolidColumnSelector/SolidListColumnSelector.tsx`
- [ ] `core/common/SolidGlobalSearchElement.tsx`
- [ ] `core/common/FilterComponent.tsx`
- [ ] `core/common/SolidGenericImport/*`
- [ ] `components/common/SolidExport.tsx`

## Phase 1: Architecture Baseline
- [ ] Define target component map (shadcn): table, dropdown-menu, dialog, popover, tabs, select, checkbox, input, pagination.
- [ ] Freeze current contract of `SolidListViewHandle` and decide required signature changes for single-sort.
- [ ] Add migration notes for preserved extension points:
  - [ ] `onListLoad`
  - [ ] `onBeforeListDataLoad`
  - [ ] custom header/row buttons

## Phase 2: Sorting (Drop Multi-sort)
- [x] Replace `multiSortMeta` state with single sort state (`sortField`, `sortOrder`).
- [x] Update DataTable/table trigger logic to emit one active sort only.
- [x] Update `setQueryString()` to serialize exactly one sort expression.
- [x] Update localStorage restore/persist shape to single-sort.
- [x] Update `SolidListViewHandle.setSort(...)` to single-sort API.
- [x] Remove/cleanup all code paths referencing `event.multiSortMeta`.

## Phase 3: Core Table + Pagination
- [x] Implement shadcn table container and row rendering.
- [x] Recreate selectable rows (active + deleted split behavior).
- [x] Recreate paginator with:
  - [x] rows per page
  - [x] current page report
  - [x] next/prev controls
- [x] Preserve row click routing and session back-navigation markers.
- [ ] Preserve archived/recover flows.

## Phase 4: Filters + Search
- [ ] Keep predicate model unchanged (`custom_filter_predicate`, `search_predicate`, `saved_filter_predicate`, `predefined_search_predicate`, grouping/aggregation).
- [ ] Migrate `SolidGlobalSearchElement` dialogs/popovers to shadcn.
- [ ] Migrate `FilterComponent` rule builder UI to shadcn controls.
- [ ] Preserve saved filter URL behavior (`savedQuery`) and local cache behavior.
- [ ] Confirm relation filter hydration still works.

## Phase 5: Configure Menu + Column Selector
- [ ] Replace cog overlay/context menu with shadcn dropdown/popover.
- [ ] Rebuild "Customize Layout" panel in shadcn.
- [ ] Keep drag-reorder + checkbox visibility behavior in `SolidListColumnSelector`.
- [ ] Remove page reload after layout save; refetch/re-render list metadata instead.
- [ ] Fix permission guard checks in configure actions (`actionsAllowed.includes(...)`).

## Phase 6: Import / Export
- [ ] Migrate `SolidExport` dialog and controls to shadcn.
- [ ] Preserve template CRUD and filtered export path.
- [ ] Migrate `SolidGenericImport` stepper/dialog flow to shadcn.
- [ ] Preserve upload, mapping, sync import, and failed-record download behavior.

## Phase 7: Column Renderers
- [ ] Keep `SolidListViewColumn` type dispatch pattern.
- [ ] Migrate per-column cell UI to shadcn styling where applicable.
- [ ] Preserve widgets loaded via extension registry.
- [ ] Verify relation columns (many-to-one, one-to-many, many-to-many) behavior parity.

## Phase 8: Cleanup
- [ ] Remove unused PrimeReact imports/styles from list modules.
- [ ] Delete obsolete list-specific filter components if fully replaced.
- [ ] Consolidate duplicated filter helpers between `core/list` and `core/filter` if safe.

## Validation Checklist
- [ ] List metadata fetch works for list pages and embedded mode.
- [ ] API query contains correct: `offset`, `limit`, `filters`, `populate`, `populateMedia`, `sort`, `locale`.
- [ ] Single sort works from UI and imperative API.
- [ ] Pagination state persists/restores correctly.
- [ ] Global search + custom filters + saved filters + predefined searches work together.
- [ ] Grouping/aggregation predicates are preserved in query payload.
- [ ] Column selector save updates layout reliably.
- [ ] Import and export end-to-end succeed.
- [ ] Row actions (default + custom) still honor permissions/roles.

## Suggested Execution Order
- [ ] 1) Sorting refactor first (single-sort data model).
- [ ] 2) Table shell + pagination.
- [ ] 3) Configure menu + column selector.
- [ ] 4) Global search/filter builder.
- [ ] 5) Import/export.
- [ ] 6) Column renderer pass + cleanup.
