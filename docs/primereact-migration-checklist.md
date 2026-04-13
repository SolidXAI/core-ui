# PrimeReact Migration Checklist (`solid-core-ui`)

This file contains only actionable checklist items grouped by phase and risk.

## Phase 0 — preparation

### Discovery
- [ ] Freeze baseline metrics (Prime imports, modules, `.p-*`, `pi`, PrimeFlex tokens).
- [ ] Validate inventory against current `main` (no stale counts).
- [ ] Confirm all Prime-dependent public exports in `src/index.ts`.
- [ ] Confirm `styles.ts` and theme CSS runtime wiring path in consumers.

### Decisions
- [ ] Select target primitive layer (ShadCN/Radix usage pattern).
- [ ] Select table/grid replacement.
- [ ] Select combobox/autocomplete replacement + virtualization approach.
- [ ] Select date/time picker replacement.
- [ ] Select tree/hierarchical UI replacement.

### Architecture
- [ ] Define internal UI adapter interfaces (`UiButton`, `UiDialog`, `UiInput`, etc.).
- [ ] Define normalized event contract (stop passing Prime event shapes into domain logic).
- [ ] Define icon abstraction to replace `pi` class usage.
- [ ] Define layout utility strategy to replace PrimeFlex classes.

## Phase 1 — easy wins

### Low-risk component migration
- [ ] Migrate `src/components/common/BackButton.tsx`.
- [ ] Migrate `src/components/common/CancelButton.tsx`.
- [ ] Migrate `src/components/common/CreateButton.tsx`.
- [ ] Migrate `src/components/common/SolidErrorPage.tsx`.
- [ ] Migrate `src/components/common/SolidNotFoundPage.tsx`.

### Guardrails
- [ ] Route all new primitive usage through internal `Ui*` adapters.
- [ ] Prevent new direct `primereact/*` imports in migrated areas.

## Phase 2 — controlled medium migrations

### Shared wrappers first
- [ ] Replace toast helper API behind stable adapter:
  - `src/helpers/showToast.ts`
  - `src/helpers/ToastContainer.tsx`
- [ ] Replace popup/dialog container internals:
  - `src/components/common/SolidPopupContainer.tsx`
- [ ] Replace autocomplete wrappers:
  - `src/components/common/AutoCompleteField.tsx`
  - `src/components/common/MultipleSelectAutoCompleteField.tsx`
  - *(DONE)* `SingleSelectAutoCompleteField` removed in favor of direct `SolidAutocomplete` usage.
- [ ] Replace global search shell dependencies:
  - `src/components/core/common/SolidGlobalSearchElement.tsx`
  - `src/components/core/common/SolidSearchBox.tsx`

### Coupling reduction
- [ ] Remove direct `e.value`/`e.checked` dependence in migrated wrapper consumers.
- [ ] Add adapter-level tests for value/checked/onChange normalization.

## Phase 3 — hard decisions

### High-risk surfaces (postpone until replacement stack is fixed)
- [ ] Plan/implement replacement for `src/components/core/list/SolidListView.tsx`.
- [ ] Plan/implement replacement for `src/components/core/tree/SolidTreeView.tsx`.
- [ ] Plan/implement replacement for relation autocomplete heavy fields:
  - `src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx`
  - `src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx`
- [ ] Plan/implement replacement for calendar/date/time fields:
  - `src/components/core/form/fields/SolidDateField.tsx`
  - `src/components/core/form/fields/SolidDateTimeField.tsx`
  - `src/components/core/form/fields/SolidTimeField.tsx`
- [ ] Plan/implement replacement for metadata-admin forms:
  - `src/components/core/model/FieldMetaDataForm.tsx`
  - `src/components/core/model/ModelMetaData.tsx`

### Parity criteria
- [ ] Define explicit parity matrix for list/table behavior.
- [ ] Define explicit parity matrix for tree behavior.
- [ ] Define explicit parity matrix for autocomplete and date/time behavior.

## Phase 4 — PrimeReact removal

### Dependency removal
- [ ] Remove `primereact` from `package.json`.
- [ ] Remove `primeicons` from `package.json`.
- [ ] Remove `primeflex` from `package.json`.

### Style/theme cleanup
- [ ] Remove Prime theme files:
  - `src/resources/themes/solid-light-purple/theme.css`
  - `src/resources/themes/solid-dark-purple/theme.css`
- [ ] Remove `src/resources/solid-primereact.css`.
- [ ] Remove remaining `.p-*` selectors in CSS/SCSS.
- [ ] Remove remaining `pi pi-*` icon classes.
- [ ] Remove PrimeFlex utility class usage from TSX.

### Public API cleanup
- [ ] Remove Prime-specific type imports from public types (e.g. `src/types/layout.d.ts`).
- [ ] Validate exported API compatibility or document breaking changes.

## Risk checklist

### Very High risk
- [ ] DataTable behavior regressions (sorting, filtering, lazy loading, selection, pagination).
- [ ] TreeTable behavior regressions (expansion, selection, lazy child loading).
- [ ] CSS regressions from `.p-*` selector removal.

### High risk
- [ ] Event contract breakage from `e.value/e.checked` assumptions.
- [ ] PrimeFlex layout drift during utility-class migration.
- [ ] PrimeIcons replacement drift in iconography and semantics.

### Medium risk
- [ ] Toast/overlay parity issues.
- [ ] Dialog focus-management/accessibility regressions.

## Validation / QA checklist

### Automated validation
- [ ] Add regression tests for list/table behavior parity.
- [ ] Add regression tests for tree behavior parity.
- [ ] Add regression tests for relation-field autocomplete behavior.
- [ ] Add regression tests for date/time field behavior.

### Manual validation
- [ ] Verify visual parity for major flows (auth, list, tree, form, model metadata).
- [ ] Verify light/dark theming behavior after style migration.
- [ ] Verify mobile/responsive behavior for layout-heavy pages.

### Consumer validation
- [ ] Run smoke tests in at least one consuming project against migrated package build.
- [ ] Validate that documented public API behavior remains correct.
