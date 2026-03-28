# 0. Internal mapping (PrimeReact → local abstraction → major usage)

| PrimeReact area | Local abstraction(s) | Major usage files |
|---|---|---|
| Button (`primereact/button`) | Some thin wrappers (`CreateButton`, `CancelButton`, `BackButton`), but broad direct usage | `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx`, `src/components/core/form/SolidFormView.tsx`, `src/components/core/model/FieldMetaDataForm.tsx`, `src/components/layout/user-profile-menu.tsx` |
| Dialog (`primereact/dialog`) | `SolidPopupContainer`, many direct dialogs in features/forms | `src/components/common/SolidPopupContainer.tsx`, `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx`, `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx` |
| OverlayPanel (`primereact/overlaypanel`) | No single adapter; used in config/actions/menus | `src/components/core/list/SolidListViewConfigure.tsx`, `src/components/layout/user-profile-menu.tsx`, `src/components/core/form/SolidFormActionHeader.tsx`, `src/components/core/kanban/KanbanCard.tsx` |
| Toast (`primereact/toast`) | `showToast` helper + global `ToastContainer` pattern | `src/helpers/showToast.ts`, `src/helpers/ToastContainer.tsx`, `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx` |
| AutoComplete (`primereact/autocomplete`) | `AutoCompleteField`, `SingleSelectAutoCompleteField`, `MultipleSelectAutoCompleteField`; relation-field widgets | `src/components/common/AutoCompleteField.tsx`, `src/components/common/SingleSelectAutoCompleteField.tsx`, `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx`, `src/components/core/form/fields/SolidSelectionDynamicField.tsx` |
| DataTable / Column (`primereact/datatable`, `primereact/column`) | No true adapter; list architecture built on Prime APIs | `src/components/core/list/SolidListView.tsx`, `src/components/core/field/FieldListViewData.tsx`, `src/components/core/model/ModelListViewData.tsx`, `src/components/core/module/ModuleListViewData.tsx`, `src/components/core/users/UserListView.tsx` |
| TreeTable (`primereact/treetable`) | No adapter; tree logic directly coupled | `src/components/core/tree/SolidTreeView.tsx` |
| TabView (`primereact/tabview`) | Used in auth and metadata forms, mostly direct imports | `src/components/auth/SolidLogin.tsx`, `src/components/auth/SolidRegister.tsx`, `src/components/core/model/CreateModel.tsx`, `src/components/core/model/FieldMetaDataForm.tsx` |
| Calendar / Date-time (`primereact/calendar`) | No shared adapter for all date/time fields | `src/components/core/form/fields/SolidDateField.tsx`, `src/components/core/form/fields/SolidDateTimeField.tsx`, `src/components/core/form/fields/SolidTimeField.tsx`, `src/components/core/dashboard/DashboardFilter.tsx` |
| Prime theme + `.p-*` selectors | Global style layer and theme files heavily target Prime classes/DOM | `src/resources/solid-primereact.css`, `src/resources/globals.css`, `src/resources/themes/solid-light-purple/theme.css`, `src/resources/themes/solid-dark-purple/theme.css`, `src/resources/stylesheets/_config.scss` |

# 1. Executive summary

PrimeReact removal is feasible, but this repository is deeply coupled across component APIs, event shapes, and styling contracts. A direct full swap would carry high regression risk.

## Measured footprint (from repository scan)

- TSX files in `src/`: **344**
- Files importing `primereact/*`: **137**
- Prime import statements: **536**
- Unique Prime modules used: **50**
- `.p-*` selector matches in CSS/SCSS: **3453 lines** across **10 files**
- `pi pi-*` usages in TSX: **345 hits** across **89 files**
- PrimeFlex-like utility token occurrences (approx): **2595 hits** across **163 files**
- Prime-dependent files that appear on public export surface (`src/index.ts` direct path-match method): **82 files**

## Feasibility and strategy

- Overall feasibility of removing PrimeReact: **Yes, with phased migration**
- ShadCN fit: **Good for primitives and owned UI**, insufficient alone for advanced data widgets
- Recommended strategy: **Partial migration / hybrid approach first**, then full removal when high-risk surfaces are replaced

## Top 5 migration risks

1. **List/grid architecture tightly coupled to Prime DataTable** (`lazy`, `multiSortMeta`, filter model, selection, paginator behaviors) in `src/components/core/list/SolidListView.tsx`
2. **Tree/hierarchical UI coupled to TreeTable contracts** (`TreeNode`, `expandedKeys`, `selectionKeys`, lazy node loading) in `src/components/core/tree/SolidTreeView.tsx`
3. **Large CSS coupling to Prime DOM/class names** via `.p-*` selectors in `src/resources/globals.css` and `src/resources/solid-primereact.css`
4. **Widespread event model coupling** to `e.value` / `e.checked` and Prime event types across form/list/model components
5. **PrimeFlex + PrimeIcons vocabulary deeply embedded** in JSX/class naming and style assumptions

# 2. PrimeReact usage inventory

Full detailed inventory is captured in `docs/primereact-usage-inventory.md`.

# 3. Component category assessment

## Easy replacements

| Found in repo | Why in this category | Difficulty | Is ShadCN alone enough? |
|---|---|---:|---|
| Basic buttons and action controls (`Button` in common/auth pages) | Mostly UI primitive replacement with light behavior | Low | Yes |
| Basic text inputs/textarea (`InputText`, `InputTextarea`) | Standard input behavior; mostly straightforward mapping | Low | Yes |
| Checkbox/radio/switch in simple forms | Mostly value binding and visual replacement | Low-Med | Yes |
| Simple dialogs in isolated pages/components | Common modal patterns without heavy table integration | Low-Med | Yes |
| Static messages/cards/simple tabs | Mostly presentational | Low | Yes |

Representative files: `src/components/common/BackButton.tsx`, `src/components/common/CancelButton.tsx`, `src/components/common/SolidErrorPage.tsx`, `src/components/common/SolidNotFoundPage.tsx`.

## Medium complexity replacements

| Found in repo | Why in this category | Difficulty | Is ShadCN alone enough? |
|---|---|---:|---|
| Toast patterns (`showToast`, `ToastContainer`) | Centralized but Prime `Toast` API is embedded in helpers/types | Medium | Not by itself; needs adapter |
| Overlay/popover usage (`OverlayPanel`) | Many overlays with custom content/actions | Medium | Usually via Radix primitives |
| Metadata-driven simple field widgets | Field abstraction helps, but widget internals often Prime-specific | Medium | ShadCN + custom wrappers |
| Dropdown/select with custom usage | Repeated patterns with event-shape coupling | Medium | Often yes; sometimes helper lib |
| Tooltip/menu wrappers | Moderate spread, mostly replaceable with primitive APIs | Medium | Yes with Radix |

Representative files: `src/helpers/showToast.ts`, `src/helpers/ToastContainer.tsx`, `src/components/common/SolidPopupContainer.tsx`, `src/components/core/common/SolidGlobalSearchElement.tsx`.

## High-risk / expensive replacements

| Found in repo | Why in this category | Difficulty | Is ShadCN alone enough? |
|---|---|---:|---|
| `DataTable`/`Column` list stack | Core list behavior relies on Prime table model and events | High | No |
| `TreeTable` stack | Hierarchical loading + selection/expansion contracts bound to Prime | High | No |
| Autocomplete with lazy virtualization | Uses Prime `AutoComplete` complete/lazy methods and value contracts | High | No |
| Date/time/calendar fields | Prime calendar interactions and overlay logic embedded | High | No |
| Large metadata-admin forms (`FieldMetaDataForm`) | Heavy component density + Prime events + complex workflows | High | No |

Representative files: `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx`, `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx`, `src/components/core/form/fields/SolidDateField.tsx`, `src/components/core/model/FieldMetaDataForm.tsx`.

# 4. Hidden coupling analysis

1. **Prime class/DOM selectors are a major blocker**
- `src/resources/globals.css` and `src/resources/solid-primereact.css` contain extensive `.p-*` selectors that assume Prime DOM structure.
- Examples include `.p-datatable`, `.p-paginator`, `.p-overlaypanel`, `.p-tabview`, `.p-dialog-content`, `.p-password`, `.p-panelmenu`.

2. **Theme system is Prime-oriented**
- Prime-themed CSS assets are first-class resources:
  - `src/resources/themes/solid-light-purple/theme.css` (~6262 lines)
  - `src/resources/themes/solid-dark-purple/theme.css` (~6207 lines)
  - `src/resources/solid-primereact.css` (~2985 lines)
- Theme switching currently uses `PrimeReactContext.changeTheme` in `src/components/layout/user-profile-menu.tsx` and references theme link id `theme-css`.

3. **Event signatures and types are Prime-shaped**
- Repeated `onChange={(e) => ... e.value}` and `e.checked` assumptions across fields/forms/model screens.
- Prime event/type imports (e.g., `AutoCompleteCompleteEvent`, `DataTableStateEvent`, `DropdownChangeEvent`, `TreeNode`).

4. **Public API includes Prime-dependent components**
- `src/index.ts` exports many components that import Prime directly (82 files by direct path-match method), so migration can affect library consumers.

5. **PrimeIcons and PrimeFlex are deeply embedded**
- `pi pi-*` icon classes are widespread in JSX.
- PrimeFlex utility vocabulary (`flex`, `grid`, `col-*`, `align-items-*`, `justify-content-*`) is heavily used in component markup.

6. **Potential uncertainty to validate in prep phase**
- `src/styles.ts` defines global style imports, but `src/index.ts` does not explicitly import `./styles`; final runtime style wiring should be validated in build/consumption paths before migration decisions.

# 5. ShadCN fit assessment

ShadCN is a good fit for this codebase’s primitive component layer, especially if the goal is long-term ownership and composability of UI primitives. The repository already has partial abstraction seams (field classes, common wrappers, extension registries) that can support incremental migration.

Where ShadCN is strong in this repo:
- buttons/inputs/checkbox/radio/dialog/tabs/tooltip/popover primitives
- wrapper-first migration strategy (`UiButton`, `UiDialog`, `UiInput`, etc.)
- incremental replacement of common/auth/simple settings views

Where ShadCN is insufficient by itself for this repo:
- advanced data grid behavior currently implemented with Prime DataTable
- tree/hierarchical table behavior implemented with TreeTable
- autocomplete with lazy virtualized loading
- date/time picker behavior parity

Companion libraries likely needed (based on current patterns, not assumptions of immediate adoption):
- table/grid: TanStack Table (or equivalent)
- combobox/autocomplete: Radix+cmdk/react-aria/downshift + virtualization helper
- date/time: dedicated date/time picker library
- tree/hierarchical UI: specialized tree-grid library or custom hierarchical table implementation

# 6. Recommended migration strategy

## Phase 0 — preparation

- Dependency audit from `package.json` and transitive consumers
- Validate and lock inventory counts (Prime imports, styles, exports)
- Public API review using `src/index.ts` exports (identify breaking-change surfaces)
- Define event normalization layer to remove direct `e.value/e.checked` coupling from app logic
- Validate style/theme loading path (`src/styles.ts`, theme link usage, consumer wiring)
- Decide target libraries for hard widgets before coding migrations:
  - data table
  - tree/hierarchy
  - autocomplete/combobox
  - date/time controls

## Phase 1 — easy wins

Migrate low-risk primitive consumers first (minimal architectural coupling):
- `src/components/common/BackButton.tsx`
- `src/components/common/CancelButton.tsx`
- `src/components/common/CreateButton.tsx`
- `src/components/common/SolidErrorPage.tsx`
- `src/components/common/SolidNotFoundPage.tsx`
- simple auth/static pages where Prime usage is mostly visual

Introduce internal primitives before mass edits:
- `UiButton`, `UiInput`, `UiTextarea`, `UiCheckbox`, `UiRadio`, `UiDialog`, `UiTabs`.

## Phase 2 — controlled medium migrations

Migrate wrappers and shared interaction patterns:
- Toast layer: `src/helpers/showToast.ts`, `src/helpers/ToastContainer.tsx`
- Popup/modal container: `src/components/common/SolidPopupContainer.tsx`
- Autocomplete wrappers: 
  - `src/components/common/AutoCompleteField.tsx`
  - `src/components/common/SingleSelectAutoCompleteField.tsx`
  - `src/components/common/MultipleSelectAutoCompleteField.tsx`
- Overlay/filter shell components:
  - `src/components/core/common/SolidGlobalSearchElement.tsx`
  - `src/components/core/common/SolidSearchBox.tsx`

Prerequisite: establish normalized onChange contracts so internals stop depending on Prime event payloads.

## Phase 3 — hard decisions

Postpone until replacement libraries and parity criteria are finalized:
- List/grid core: `src/components/core/list/SolidListView.tsx` and column/filter ecosystem
- Tree core: `src/components/core/tree/SolidTreeView.tsx`
- Complex relation/autocomplete fields:
  - `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx`
  - `src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx`
- Date/time-heavy field widgets:
  - `src/components/core/form/fields/SolidDateField.tsx`
  - `src/components/core/form/fields/SolidDateTimeField.tsx`
  - `src/components/core/form/fields/SolidTimeField.tsx`
- Large metadata admin forms:
  - `src/components/core/model/FieldMetaDataForm.tsx`
  - `src/components/core/model/ModelMetaData.tsx`

## Phase 4 — PrimeReact removal

Remove only after parity and QA pass:
- dependencies: `primereact`, `primeicons`, `primeflex` from `package.json`
- Prime theme and layer files:
  - `src/resources/themes/solid-light-purple/theme.css`
  - `src/resources/themes/solid-dark-purple/theme.css`
  - `src/resources/solid-primereact.css`
- leftover `.p-*` selectors in CSS/SCSS
- leftover `pi pi-*` classes in TSX/CSS
- PrimeFlex utility class usage in JSX
- Prime-specific types/imports in public type files (e.g., `src/types/layout.d.ts`)

# Recommended decision

**Proceed with partial migration / hybrid approach**

The codebase is materially Prime-coupled at three levels: architecture (DataTable/TreeTable-driven core views), behavior/event contracts (`e.value`, `e.checked`, Prime event types), and styling/theme contracts (`.p-*` selectors + Prime theme assets). This makes a direct full migration high-risk.

A hybrid strategy is the most defensible path: migrate primitives and shared wrappers first (where ShadCN is a strong fit), keep advanced grid/tree/autocomplete/date surfaces on Prime temporarily, and only remove Prime after replacement libraries are chosen and behavior parity is validated.
