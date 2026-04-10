# PrimeReact Usage Inventory (`solid-core-ui`)

This document captures the repository-wide factual inventory used for migration assessment.

## Scope and method

- Scanned `src/` (excluding `node_modules`)
- Measured:
  - `primereact/*` imports
  - `primeicons` / `primeflex` references
  - `.p-*` selector usage in CSS/SCSS
  - `pi pi-*` classes in TSX
  - PrimeFlex-like utility tokens in TSX
  - Prime-dependent public exports via `src/index.ts`

## Baseline metrics

- `src/` files: **525**
- TSX files in `src/`: **344**
- Files importing `primereact/*`: **137**
- Prime import statements: **536**
- Unique Prime modules: **50**
- `.p-*` selector lines in CSS/SCSS: **3453** (10 files)
- `pi pi-*` usages: **345** (89 TSX files)
- PrimeFlex-like utility token hits (approx): **2595** (163 TSX files)
- Prime-dependent files exported via `src/index.ts` (direct path match): **82**

## 0. Internal mapping (PrimeReact → local abstraction → major usage)

| PrimeReact area | Local abstraction(s) | Major usage files |
|---|---|---|
| Button | `CreateButton`, `CancelButton`, `BackButton` (partial) | `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx`, `src/components/core/model/FieldMetaDataForm.tsx` |
| Dialog | `SolidPopupContainer` (partial) | `src/components/common/SolidPopupContainer.tsx`, `src/components/core/list/SolidListView.tsx`, `src/components/core/tree/SolidTreeView.tsx` |
| OverlayPanel | No central adapter | `src/components/core/list/SolidListViewConfigure.tsx`, `src/components/layout/user-profile-menu.tsx`, `src/components/core/form/SolidFormActionHeader.tsx` |
| Toast | `showToast`, `ToastContainer` | `src/helpers/showToast.ts`, `src/helpers/ToastContainer.tsx`, `src/components/core/list/SolidListView.tsx` |
| AutoComplete | `AutoCompleteField`, `MultipleSelectAutoCompleteField` *(single-select now uses `SolidAutocomplete` directly)* | `src/components/common/AutoCompleteField.tsx`, `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx` |
| DataTable/Column | No abstraction layer (direct architecture dependency) | `src/components/core/list/SolidListView.tsx`, `src/components/core/field/FieldListViewData.tsx`, `src/components/core/model/ModelListViewData.tsx` |
| TreeTable | No abstraction layer | `src/components/core/tree/SolidTreeView.tsx` |
| Theme / `.p-*` styles | `styles.ts` imports resource style stack | `src/styles.ts`, `src/resources/solid-primereact.css`, `src/resources/globals.css`, `src/resources/themes/*/theme.css` |

## 1. Direct component imports

### Most-used Prime modules (import line count)

| Module | Import lines |
|---|---:|
| `primereact/button` | 99 |
| `primereact/toast` | 41 |
| `primereact/dialog` | 40 |
| `primereact/message` | 38 |
| `primereact/column` | 29 |
| `primereact/autocomplete` | 29 |
| `primereact/inputtext` | 27 |
| `primereact/dropdown` | 27 |
| `primereact/divider` | 18 |
| `primereact/overlaypanel` | 16 |
| `primereact/datatable` | 9 |
| `primereact/tabview` | 7 |
| `primereact/calendar` | 13 |
| `primereact/treetable` | 1 |

### Prime import hotspots by file

| File | Prime import lines |
|---|---:|
| `src/components/core/model/FieldMetaDataForm.tsx` | 16 |
| `src/components/core/tree/SolidTreeView.tsx` | 10 |
| `src/components/core/module/CreateModule.tsx` | 10 |
| `src/components/core/users/CreateUser.tsx` | 9 |
| `src/components/layout/user-profile-menu.tsx` | 8 |
| `src/components/core/model/ModelMetaData.tsx` | 8 |
| `src/components/core/list/SolidListView.tsx` | 8 |
| `src/components/auth/SolidRegister.tsx` | 8 |

### Coupling severity

- Direct component import coupling: **High**

## 2. CSS/theme dependencies

### Dependencies and style entry

- `package.json` includes:
  - `primereact`
  - `primeicons`
  - `primeflex`
- `src/styles.ts` imports:
  - `src/resources/globals.css`
  - `src/resources/stylesheets/layout.scss`
  - `src/resources/solid-responsive.css`
  - `src/resources/solid-primereact.css`

### Prime theme and layer files

- `src/resources/themes/solid-light-purple/theme.css` (~6262 lines)
- `src/resources/themes/solid-dark-purple/theme.css` (~6207 lines)
- `src/resources/solid-primereact.css` (~2985 lines)
- `src/resources/globals.css` (~3611 lines)

### Prime selector spread

Top files by `.p-*` selector lines:

| File | Approx `.p-*` selector lines |
|---|---:|
| `src/resources/themes/solid-light-purple/theme.css` | 1280 |
| `src/resources/themes/solid-dark-purple/theme.css` | 1269 |
| `src/resources/solid-primereact.css` | 668 |
| `src/resources/globals.css` | 196 |
| `src/resources/solid-responsive.css` | 26 |

### Coupling severity

- Theme/CSS coupling: **Very High**

## 3. Icons

- PrimeIcons dependency in `package.json`
- direct PrimeIcons CSS import example: `src/components/core/extension/solid-core/CustomIcon/StatusIcon.tsx`
- `pi pi-*` class usage:
  - **345** hits in **89** TSX files

### Coupling severity

- Icon coupling: **Medium-High**

## 4. Layout utilities (PrimeFlex)

Evidence:
- Dependency in `package.json`
- direct stylesheet import in `src/components/core/form/SolidFormView.tsx` (`import "primeflex/primeflex.css"`)
- PrimeFlex-style utility vocabulary in TSX (approx):
  - **2595** token hits
  - **163** TSX files containing tokens

Common tokens observed: `flex`, `grid`, `col-*`, `sm:col-*`, `md:col-*`, `lg:col-*`, `align-items-*`, `justify-content-*`, `surface-*`.

### Coupling severity

- Layout utility coupling: **High**

## 5. Wrapper components / migration leverage points

Potentially helpful abstraction points:

- Toast:
  - `src/helpers/showToast.ts`
  - `src/helpers/ToastContainer.tsx`
- Dialog wrapper:
  - `src/components/common/SolidPopupContainer.tsx`
- Autocomplete wrappers:
  - `src/components/common/AutoCompleteField.tsx`
  - `src/components/common/MultipleSelectAutoCompleteField.tsx`
  - *(single-select now handled via direct `SolidAutocomplete` usage + `useSolidAutocompleteField`)*
- Form field class system:
  - `src/components/core/form/fields/ISolidField.ts` and concrete field classes

### Notes

- These wrappers exist, but do not cover all usage; direct Prime imports remain widespread.

### Coupling severity

- Wrapper leverage available: **Medium**

## 6. Implicit coupling (class names and events)

### Event-shape coupling

Frequent patterns:
- `e.value` in dropdown/autocomplete/form controls
- `e.checked` in checkboxes/toggles
- Prime event types imported in many modules (`AutoCompleteCompleteEvent`, `DataTableStateEvent`, `DropdownChangeEvent`, `TreeNode`, etc.)

Representative files:
- `src/components/core/model/FieldMetaDataForm.tsx`
- `src/components/core/list/SolidListView.tsx`
- `src/components/core/tree/SolidTreeView.tsx`
- `src/components/core/form/fields/SolidSelectionDynamicField.tsx`
- `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx`

### Prime class contract coupling in JSX and CSS

- TSX with `p-*` class usage: **184 lines** across **70 files**
- CSS/SCSS with `.p-*` selectors: **3453 lines** across **10 files**

Representative contract-dependent selectors:
- `.p-datatable`, `.p-datatable-tbody`, `.p-paginator`, `.p-dropdown`, `.p-overlaypanel`, `.p-dialog-content`, `.p-tabview-nav`, `.p-password`, `.p-panelmenu`

Representative files:
- `src/resources/globals.css`
- `src/resources/solid-primereact.css`
- `src/resources/stylesheets/_config.scss`
- `src/resources/stylesheets/_utils.scss`

### Coupling severity

- Implicit coupling: **Very High**

## 7. Core UI area snapshots

### Data table/list core

- Primary implementation in `src/components/core/list/SolidListView.tsx`
- Uses Prime DataTable lifecycle (`lazy`, `onPage`, `onSort`, `multiSortMeta`, paginator templates)

### Tree/hierarchical UI

- Primary implementation in `src/components/core/tree/SolidTreeView.tsx`
- Uses TreeTable with `expandedKeys`, `selectionKeys`, lazy node expansion, sort, checkbox selection

### Autocomplete/combobox

- Reused wrappers + relation fields
- Virtual scrolling/lazy load behavior in relation field implementation

### Date/time controls

- Date/time field classes directly use Prime `Calendar`
- Additional date handling in dashboard and filters

### Toast/notifications

- Two active patterns:
  - local `Toast` refs in components
  - global helper container (`ToastContainer`) pattern

### Dialog/modal/overlay

- Dialogs and overlay panels are used in list/tree/layout/common settings and forms

## 8. Prime-dependent public export surface (direct path match)

Prime-dependent files identified as publicly exported via `src/index.ts`: **82**.

Examples:
- `src/components/core/form/SolidFormView.tsx`
- `src/components/core/list/SolidListView.tsx`
- `src/components/core/tree/SolidTreeView.tsx`
- `src/components/core/model/FieldMetaDataForm.tsx`
- `src/components/auth/SolidLogin.tsx`
- `src/helpers/showToast.ts`

Implication: migration affects library consumers, not only internal implementation.

## 9. Uncertainty / validation note

- `src/styles.ts` clearly defines style entry imports including Prime-related styles. `src/index.ts` does not directly import `./styles`, so exact runtime style wiring should be validated in build/publish/consumer integration paths during migration prep.
