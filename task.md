# PrimeFlex To Tailwind Phase 1 Task File

## Goal

- Inventory every live PrimeFlex-backed layout, spacing, grid, and form utility before any replacement work.
- Preserve the current UI exactly; do not do textual class swaps.
- Use this file as the source of truth for phase 2 replacement work.
- Second-pass audit status: rescanned with broader class-context extraction and updated the inventory with missed conditional, fallback, width, height, padding, margin, and gap utilities.

## Current Audit Totals

- Current audited surface after second pass: `168` files with utility usage in class-related contexts.
- Current token surface after second pass: `162` distinct utility tokens.
- Second pass added `11` previously missed files and expanded `37` already-listed files.
- Third-pass verification status: completed a raw repo-wide grep cross-check against the audited file/token set and found no additional real PrimeFlex utility usage beyond the second-pass updates.

## Second-Pass Findings

- The first pass undercounted some classes embedded in conditional or template-literal `className` branches.
- The first pass also undercounted fallback strings such as `field col-12` and `field col-6` where layout defaults are assembled in code before render.
- Width and height helpers were another blind spot. Newly captured examples include `w-25rem`, `md:w-25rem`, `w-35rem`, `w-4rem`, `w-11`, `w-9`, `md:w-20rem`, `md:w-4rem`, `h-96`, `h-12`, `h-9`, and `h-2rem`.
- Spacing-related misses that are now explicitly tracked include `px-0`, `px-2`, `px-3`, `px-4`, `py-1`, `py-2`, `py-3`, `md:pt-1`, `m-20`, `mb-10`, `mt-4`, and `lg:mt-3`.
- Treat the delta section below as part of the same source of truth as the original full inventory.

## Third-Pass Cross-Check

- Cross-check method: repo-wide grep for utility-shaped class fragments, compared against the current AST-based inventory.
- Result: no new real PrimeFlex utility usage was found.
- False positives reviewed during this pass included local CSS selectors such as `solid-field-*`, CSS-module properties like `styles.field`, local layout classes such as `solid-card-view-grid`, and commented examples like `d-flex justify-content-center mt-5`.
- Current conclusion: the existing inventory and second-pass delta still stand as the working source of truth for replacement.

## Dependency Touchpoints

- `package.json`: still declares `primeflex@^3.3.1`.
- `src/styles.ts`: currently imports the shipped repo CSS, but there is no standalone replacement utility layer proving PrimeFlex can be removed yet.
- PrimeFlex layout classes are still referenced across `src/components`, `src/routes`, and generated/form field defaults in code.

## Replacement Rules

- `grid` in PrimeFlex is a flexbox grid with gutters, not CSS Grid. Do not replace it with Tailwind `grid` unless the original layout was truly CSS Grid.
- PrimeFlex spacing numbers do not match Tailwind spacing numbers after level `2`. Example: PrimeFlex `p-3` means `1rem`, so the closest Tailwind equivalent is `p-4`, not `p-3`.
- PrimeFlex breakpoints differ from Tailwind defaults. Exact replacement requires custom Tailwind screens or arbitrary breakpoints for `sm` `576px`, `md` `768px`, `lg` `992px`, and `xl` `1200px`.
- Treat `field`, `formgrid`, `grid`, `col-*`, responsive `col-*`, and fallback strings like `field col-12` as part of the same migration surface.
- Remove PrimeFlex only after every usage below has a verified Tailwind or local equivalent.

## Utility Semantics To Preserve

- Breakpoints: `sm >= 576px`, `md >= 768px`, `lg >= 992px`, `xl >= 1200px`.
- Grid gutter contract: PrimeFlex grid uses a `.5rem` gutter, with negative margins on the container and `.5rem` padding on columns.
- Form wrappers: `field` is a form-layout wrapper; `formgrid` is form-oriented grid layout.
- Width/height helpers: `w-full` = `width: 100%`, `h-full` = `height: 100%`.
- Flex helpers: `flex`, `inline-flex`, `flex-column`, `flex-wrap`, `justify-content-*`, and `align-items-*` map to flex container behavior, not visual styling.
- PrimeFlex spacing scale used by this repo: `0=0`, `1=.25rem`, `2=.5rem`, `3=1rem`, `4=1.5rem`, `5=2rem`, `6=3rem`, `7=4rem`, `8=5rem`, `auto=auto` for margins.

## Tailwind Mapping Notes

- Exact spacing examples: PrimeFlex `*-1 -> *-1`, `*-2 -> *-2`, `*-3 -> *-4`, `*-4 -> *-6`, `*-5 -> *-8`, `*-6 -> *-12`.
- `grid` usually becomes a flex-wrap container plus recreated gutter math, for example `flex flex-wrap -mx-2 -mt-2`, while child `col-*` wrappers need width plus matching padding.
- `col-12`, `col-10`, `col-8`, `col-6`, `col-3`, and `col-2` need percentage width mapping, not Tailwind CSS Grid columns.
- Responsive column helpers such as `md:col-6` or `lg:col-5` need custom responsive width utilities or arbitrary-value widths.

## Hotspots

- src/components/common/GeneralSettings.tsx — 140 class-bearing occurrences, 38 unique PrimeFlex tokens.
- src/components/core/model/FieldMetaDataForm.tsx — 112 class-bearing occurrences, 29 unique PrimeFlex tokens.
- src/components/core/form/SolidFormViewShimmerLoading.tsx — 35 class-bearing occurrences, 19 unique PrimeFlex tokens.
- src/components/core/common/SolidGlobalSearchElement.tsx — 35 class-bearing occurrences, 16 unique PrimeFlex tokens.
- src/components/core/form/fields/SolidMediaMultipleField.tsx — 32 class-bearing occurrences, 14 unique PrimeFlex tokens.
- src/components/auth/AuthLayout.tsx — 26 class-bearing occurrences, 27 unique PrimeFlex tokens.
- src/components/core/form/fields/widgets/SolidIconEditWidget.tsx — 25 class-bearing occurrences, 31 unique PrimeFlex tokens.
- src/components/core/form/fields/SolidLongTextField.tsx — 24 class-bearing occurrences, 19 unique PrimeFlex tokens.
- src/components/core/module/CreateModule.tsx — 23 class-bearing occurrences, 20 unique PrimeFlex tokens.
- src/components/core/form/SolidFormActionHeader.tsx — 22 class-bearing occurrences, 12 unique PrimeFlex tokens.
- src/components/core/tree/SolidTreeView.tsx — 21 class-bearing occurrences, 16 unique PrimeFlex tokens.
- src/components/core/users/CreateUser.tsx — 19 class-bearing occurrences, 18 unique PrimeFlex tokens.
- src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx — 19 class-bearing occurrences, 18 unique PrimeFlex tokens.
- src/components/auth/SolidRegister.tsx — 17 class-bearing occurrences, 11 unique PrimeFlex tokens.
- src/components/core/chatter/SolidChatterHeader.tsx — 17 class-bearing occurrences, 10 unique PrimeFlex tokens.
- src/components/core/list/SolidListView.tsx — 16 class-bearing occurrences, 12 unique PrimeFlex tokens.
- src/components/core/form/SolidFormView.tsx — 15 class-bearing occurrences, 20 unique PrimeFlex tokens.
- src/components/auth/SolidLogin.tsx — 15 class-bearing occurrences, 14 unique PrimeFlex tokens.
- src/components/core/chatter/SolidChatterMessageBox.tsx — 15 class-bearing occurrences, 14 unique PrimeFlex tokens.
- src/components/core/model/CreateModel.tsx — 11 class-bearing occurrences, 17 unique PrimeFlex tokens.
- src/components/core/card/SolidCardView.tsx — 14 class-bearing occurrences, 13 unique PrimeFlex tokens.
- src/components/core/form/fields/SolidMediaSingleField.tsx — 14 class-bearing occurrences, 12 unique PrimeFlex tokens.
- src/components/common/SolidSettings/LlmSettings/AiModelConfigTab.tsx — 14 class-bearing occurrences, 9 unique PrimeFlex tokens.
- src/components/auth/SolidChangeForcePassword.tsx — 13 class-bearing occurrences, 14 unique PrimeFlex tokens.
- src/components/core/users/CreateUserRole.tsx — 13 class-bearing occurrences, 14 unique PrimeFlex tokens.

## Second-Pass Delta

### New Files Missed In The First Pass

- src/components/core/common/SolidCreateButton.tsx — `lg:inline-flex`
- src/components/core/form/fields/SolidComputedField.tsx — `field`, `col-12`
- src/components/core/form/fields/SolidDecimalField.tsx — `field`, `col-12`
- src/components/core/form/fields/SolidEmailField.tsx — `field`, `col-12`
- src/components/core/form/fields/SolidRichTextField.tsx — `field`, `col-12`
- src/components/core/form/fields/SolidSelectionDynamicField.tsx — `field`, `col-12`
- src/components/core/form/fields/SolidSelectionStaticField.tsx — `field`, `col-12`
- src/components/core/form/SolidFormViewContextMenuHeaderButton.tsx — `gap-2`, `w-full`
- src/components/core/form/SolidFormViewNormalHeaderButton.tsx — `gap-2`, `w-full`
- src/components/core/list/SolidListViewHeaderButton.tsx — `gap-2`
- src/components/layout/GlobalSearch.tsx — `w-25rem`

### Existing Files Expanded In The Second Pass

- src/components/auth/AuthLayout.tsx — added `col-6`, `flex-column`, `gap-1`, `gap-3`, `justify-content-between`, `justify-content-center`, `lg:col-5`, `md:flex`, `mr-3`, `sm:flex-row`, `sm:gap-5`, `xl:col-6`
- src/components/common/SolidAdmin.tsx — added `w-4rem`
- src/components/common/SolidModuleHome.tsx — added `mt-4`, `w-35rem`
- src/components/core/chatter/SolidChatterMessageBox.tsx — added `m-0`
- src/components/core/chatter/SolidMessageComposer.tsx — added `flex-column`
- src/components/core/common/PDFViewer.tsx — added `h-96`
- src/components/core/common/SolidGlobalSearchElement.tsx — added `align-items-start`, `justify-content-start`, `py-2`
- src/components/core/extension/solid-core/listOfValues/form/SolidLovTypeChangeFormEditWidget.tsx — added `h-9`
- src/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget.tsx — added `field`, `col-12`, `gap-2`, `lg:col-6`, `lg:mt-3`
- src/components/core/field/FieldListViewData.tsx — added `md:w-20rem`
- src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx — added `field`, `col-12`, `col-6`, `m-0`, `mt-3`
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx — added `field`, `col-12`, `col-6`
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidBooleanField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidDateField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidDateTimeField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidIntegerField.tsx — added `field`, `col-12`, `h-12`
- src/components/core/form/fields/SolidJsonField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidLongTextField.tsx — added `field`, `col-12`, `flex-row`, `h-2rem`, `mb-10`, `w-2rem`
- src/components/core/form/fields/SolidMediaMultipleField.tsx — added `field`, `col-12`, `w-11`, `w-9`
- src/components/core/form/fields/SolidMediaSingleField.tsx — added `align-items-center`, `field`, `col-12`, `gap-2`, `md:gap-2`, `mt-4`, `w-full`
- src/components/core/form/fields/SolidPasswordField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidShortTextField.tsx — added `field`, `col-12`
- src/components/core/form/fields/SolidTimeField.tsx — added `field`, `col-12`
- src/components/core/form/fields/widgets/SolidAiInteractionMessageFieldFormWidget.tsx — added `p-3`
- src/components/core/form/SolidFormFieldRender.tsx — added `field`, `col-12`
- src/components/core/form/SolidFormView.tsx — added `md:p-4`, `md:pt-1`, `px-4`, `py-3`
- src/components/core/form/SolidFormViewShimmerLoading.tsx — added `md:h-1`, `md:h-2rem`, `md:w-4rem`
- src/components/core/list/columns/SolidMediaMultipleColumn.tsx — added `w-11`
- src/components/core/list/SolidColumnSelector/SolidListColumnSelector.tsx — added `align-items-center`, `gap-3`, `justify-content-between`, `px-2`, `py-2`
- src/components/core/list/SolidDataTable.tsx — added `gap-3`, `py-1`, `w-full`
- src/components/core/model/FieldMetaDataForm.tsx — added `px-0`
- src/components/core/model/ModelListViewData.tsx — added `md:w-20rem`
- src/components/core/module/ModuleListViewData.tsx — added `md:w-20rem`
- src/components/core/tree/SolidTreeTable.tsx — added `w-full`
- src/components/layout/navbar-two-menu.tsx — added `px-3`
- src/routes/pages/auth/SsoPage.tsx — added `m-20`, `md:w-25rem`

## Generated / Fallback Class Strings

- src/components/core/form/SolidFormFieldRender.tsx:16:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidDateTimeField.tsx:69:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidDateTimeField.tsx:121:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidShortTextField.tsx:153:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaMultipleField.tsx:112:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaMultipleField.tsx:164:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaMultipleField.tsx:515:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidEmailField.tsx:81:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidDecimalField.tsx:61:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidTimeField.tsx:110:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidTimeField.tsx:160:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidDateField.tsx:71:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidDateField.tsx:123:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx:83:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx:191:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx:378:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx:557:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaSingleField.tsx:98:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaSingleField.tsx:154:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidMediaSingleField.tsx:489:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx:79:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx:134:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx:185:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx:488:    const className = fieldLayoutInfo.attrs?.className || 'field col-6';
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx:579:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidRichTextField.tsx:65:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidRichTextField.tsx:116:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidSelectionDynamicField.tsx:149:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidSelectionDynamicField.tsx:201:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidLongTextField.tsx:70:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidIntegerField.tsx:71:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidIntegerField.tsx:139:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidJsonField.tsx:50:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidJsonField.tsx:101:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidJsonField.tsx:163:    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidComputedField.tsx:42:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidPasswordField.tsx:102:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidSelectionStaticField.tsx:145:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
- src/components/core/form/fields/SolidBooleanField.tsx:104:        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

## Full File Inventory

- src/components/auth/AuthLayout.tsx
  Tokens: align-items-center, col-8, flex, grid, justify-content-start, m-0, mt-0, mt-1, mx-1, mx-auto, p-4, pb-0, px-0, py-2, w-full
  Occurrences: L157 [w-full]; L158 [grid]; L159 [col-8 mx-auto]; L160 [m-0]; L161 [mt-0]; L192 [mx-1]; L198 [m-0]; L199 [m-0]; L203 [mt-1]; L204 [m-0]; L212 [mx-1]; L223 [py-2]; L223 [px-0 pb-0]; L226 [flex align-items-center justify-content-start]; L231 [m-0]; L232 [p-4]
- src/components/auth/FacebookAuthChecking.tsx
  Tokens: flex
  Occurrences: L51 [flex]; L57 [flex]
- src/components/auth/ForgotPasswordThankYou.tsx
  Tokens: mt-3, mt-4, w-full
  Occurrences: L18 [mt-3]; L22 [mt-4]; L23 [w-full]
- src/components/auth/GoogleAuthChecking.tsx
  Tokens: flex
  Occurrences: L49 [flex]; L55 [flex]
- src/components/auth/MicrosoftAuthChecking.tsx
  Tokens: flex
  Occurrences: L51 [flex]; L57 [flex]
- src/components/auth/SolidChangeForcePassword.tsx
  Tokens: align-items-center, col-6, flex, flex-column, gap-2, gap-3, grid, justify-content-center, lg:mt-4, md:mt-3, mt-1, mt-2, mt-4, pt-0, sm:mt-2, w-full
  Occurrences: L112 [flex-column gap-3]; L113 [flex flex-column gap-2 mt-2]; L123 [w-full]; L133 [flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4]; L143 [w-full]; L153 [flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4]; L163 [w-full]; L173 [mt-4]; L174 [grid]; L177 [col-6]; L178 [flex align-items-center gap-2]; L179 [flex align-items-center justify-content-center]; L192 [mt-4]; L193 [grid]; L197 [col-6 pt-0]; L198 [flex gap-2]; L204 [mt-4]; L207 [w-full]
- src/components/auth/SolidForgotPassword.tsx
  Tokens: flex, flex-column, gap-2, mt-1, mt-4, mt-5, w-full
  Occurrences: L63 [flex flex-column gap-2]; L82 [mt-4]; L85 [w-full]; L93 [w-full mt-1]; L100 [mt-5]
- src/components/auth/SolidInitialLoginOtp.tsx
  Tokens: mt-1, mt-4, mt-5, w-full
  Occurrences: L199 [mt-4]; L202 [w-full]; L210 [w-full mt-1]; L220 [mt-5]
- src/components/auth/SolidInitiateRegisterOtp.tsx
  Tokens: mt-1, mt-4, mt-5, w-full
  Occurrences: L195 [mt-4]; L198 [w-full]; L206 [w-full mt-1]; L216 [mt-5]
- src/components/auth/SolidLogin.tsx
  Tokens: align-items-center, flex, flex-column, flex-wrap, gap-1, gap-2, gap-3, gap-4, justify-content-between, md:mt-5, ml-2, mt-3, mt-4, my-4, w-full
  Occurrences: L98 [flex flex-column gap-2 mt-3]; L108 [w-full]; L119 [flex flex-column gap-1 mt-4]; L120 [flex align-items-center justify-content-between]; L130 [w-full]; L142 [flex align-items-center mt-4]; L144 [ml-2]; L146 [mt-4]; L149 [w-full]; L283 [flex flex-column gap-3 mt-3]; L296 [flex gap-4 flex-wrap]; L300 [flex flex-column gap-2 mt-3]; L310 [w-full]; L321 [mt-4]; L324 [w-full]; L373 [flex align-items-center gap-2 my-4]; L387 [mt-3 md:mt-5]
- src/components/auth/SolidRegister.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, h-full, justify-content-center, md:mt-4, mt-3, mt-4, my-4, w-full
  Occurrences: L159 [flex gap-2 mt-3]; L160 [flex flex-column w-full gap-2]; L176 [flex flex-column w-full gap-2]; L197 [flex flex-column gap-2 mt-3]; L217 [flex flex-column gap-2 mt-3]; L235 [flex flex-column gap-2 mt-3]; L243 [w-full]; L252 [mt-4]; L253 [w-full]; L343 [flex flex-column gap-2 mt-3]; L361 [flex flex-column gap-2 mt-3]; L379 [flex flex-column gap-2 mt-3]; L397 [mt-4]; L398 [w-full]; L441 [w-full h-full flex align-items-center justify-content-center]; L463 [flex align-items-center gap-2 my-4]; L477 [mt-3 md:mt-4]
- src/components/auth/SolidResetPassword.tsx
  Tokens: align-items-center, col-6, flex, flex-column, gap-1, gap-2, grid, ml-2, mt-1, mt-4, mt-5, pt-0, w-full
  Occurrences: L89 [flex flex-column gap-2]; L99 [w-full]; L108 [flex flex-column gap-1 mt-4]; L118 [w-full]; L128 [mt-4]; L129 [grid]; L133 [col-6 pt-0]; L134 [flex gap-2]; L140 [flex align-items-center mt-4]; L142 [ml-2]; L144 [mt-4]; L145 [w-full]; L146 [w-full mt-1]; L150 [mt-5]
- src/components/common/AutoCompleteField.tsx
  Tokens: w-full
  Occurrences: L39 [w-full]
- src/components/common/CancelButton.tsx
  Tokens: flex, lg:flex
  Occurrences: L56 [lg:flex]; L58 [lg:flex]; L63 [flex]
- src/components/common/DownloadProgressToast.tsx
  Tokens: mt-2
  Occurrences: L47 [mt-2]
- src/components/common/DropzoneUpload.tsx
  Tokens: mt-2
  Occurrences: L7 [mt-2]
- src/components/common/GeneralSettings.tsx
  Tokens: align-items-center, align-items-start, col-10, col-12, col-2, flex, formgrid, gap-3, grid, lg:col-10, lg:col-5, lg:col-6, lg:col-7, lg:mt-0, md:col-5, md:col-6, md:col-7, md:col-8, md:p-4, md:pb-0, md:py-0, mt-2, mt-3, mt-4, my-4, pb-2, pb-3, px-4, py-2, py-3, sm:col-10, sm:col-12, sm:col-3, sm:col-9, w-full, xl:col-5, xl:col-6, xl:col-8
  Occurrences: L436 [gap-3 flex]; L450 [px-4 py-3 md:p-4]; L453 [formgrid grid]; L454 [col-12 lg:col-10 xl:col-8]; L455 [formgrid grid]; L456 [col-12 md:col-6]; L469 [mt-2]; L502 [col-12 md:col-6]; L517 [mt-2]; L555 [formgrid grid]; L556 [col-12 lg:col-10 xl:col-8]; L557 [flex]; L570 [my-4]; L572 [formgrid grid]; L573 [col-12 lg:col-10 xl:col-8]; L574 [formgrid grid]; L575 [col-12 md:col-6]; L576 [formgrid grid align-items-center]; L577 [col-10 sm:col-9 lg:col-5 pb-2 md:pb-0]; L580 [col-2 sm:col-3 lg:col-7]; L594 [col-12 md:col-6]; L595 [formgrid grid align-items-center]; L596 [col-12 md:col-5 pb-2 md:pb-0]; L601 [col-12 md:col-7]; L608 [w-full]; L613 [col-12 md:col-6 mt-4]; L614 [formgrid grid align-items-center]; L615 [col-12 md:col-5 pb-2 md:pb-0]; L620 [col-12 md:col-7]; L627 [w-full]; L632 [col-12 md:col-6 mt-4]; L633 [formgrid grid align-items-start]; L634 [col-12 md:col-5 pb-2 md:pb-0]; L639 [col-12 md:col-7]; L646 [w-full]; L651 [col-12 md:col-6 mt-4]; L652 [formgrid grid align-items-start]; L653 [col-12 md:col-5 pb-2 md:pb-0]; L656 [col-12 md:col-7]; L663 [w-full]; L671 [my-4]; L674 [formgrid grid]; L675 [col-12 lg:col-10 xl:col-8]; L676 [formgrid grid]; L677 [col-12 md:col-6]; L678 [formgrid grid align-items-center]; L679 [col-10 sm:col-9 lg:col-5]; L682 [col-2 sm:col-3 lg:col-7]; L691 [col-12 md:col-6]; L692 [formgrid grid align-items-center]; L693 [col-12 md:col-5 py-2 md:py-0]; L698 [col-12 md:col-7]; L705 [w-full]; L710 [col-12 md:col-6 mt-3]; L711 [formgrid grid align-items-center]; L712 [col-12 md:col-5 pb-2 md:pb-0]; L717 [col-12 md:col-7]; L724 [w-full]; L732 [my-4]; L734 [formgrid grid]; L735 [col-12 lg:col-10 xl:col-8]; L736 [formgrid grid]; L737 [col-12 md:col-6]; L738 [formgrid grid align-items-center]; L739 [col-10 sm:col-10 lg:col-5]; L744 [col-2 sm:col-3 lg:col-7]; L761 [formgrid grid]; L762 [col-12 lg:col-10 xl:col-8]; L763 [formgrid grid]; L764 [col-12]; L765 [formgrid grid align-items-center]; L766 [col-10 sm:col-9 lg:col-5]; L771 [col-2 sm:col-3 lg:col-7]; L785 [col-12 mt-3]; L786 [formgrid grid align-items-center]; L787 [col-10 sm:col-9 lg:col-5]; L792 [col-2 sm:col-3 lg:col-7]; L806 [col-12 mt-3]; L807 [formgrid grid align-items-center]; L808 [col-10 sm:col-9 lg:col-5]; L813 [col-2 sm:col-3 lg:col-7]; L827 [col-12 mt-3]; L828 [formgrid grid align-items-center]; L829 [col-10 sm:col-9 lg:col-5]; L834 [col-2 sm:col-3 lg:col-7]; L850 [col-12 mt-3]; L851 [formgrid grid align-items-center]; L852 [col-10 sm:col-9 lg:col-5]; L857 [col-2 sm:col-3 lg:col-7]; L871 [col-12 mt-3]; L872 [formgrid grid align-items-center]; L873 [col-10 sm:col-9 lg:col-5]; L878 [col-2 sm:col-3 lg:col-7]; L892 [col-12 mt-3]; L893 [formgrid grid align-items-center]; L894 [col-10 sm:col-9 lg:col-5]; L899 [col-2 sm:col-3 lg:col-7]; L913 [col-12 mt-3]; L914 [formgrid grid align-items-center]; L915 [col-10 sm:col-9 lg:col-5]; L920 [col-2 sm:col-3 lg:col-7]; L934 [col-12 mt-3]; L935 [formgrid grid align-items-center]; L936 [col-10 sm:col-9 lg:col-5]; L941 [col-2 sm:col-3 lg:col-7]; L958 [col-12 mt-3]; L959 [formgrid grid align-items-center]; L960 [col-12 sm:col-12 lg:col-5 xl:col-5]; L965 [col-12 sm:col-12 lg:col-6 xl:col-6]; L967 [mt-3 lg:mt-0]; L988 [col-12 mt-3]; L989 [formgrid grid align-items-center]; L990 [col-12 sm:col-12 lg:col-5 xl:col-5]; L995 [col-12 sm:col-12 lg:col-6 xl:col-6]; L997 [mt-3 lg:mt-0]; L1023 [my-4]; L1027 [formgrid grid]; L1028 [col-12 lg:col-10 xl:col-8]; L1041 [mt-3]; L1055 [formgrid grid]; L1056 [col-12 lg:col-10 xl:col-8]; L1057 [formgrid grid]; L1058 [col-12 md:col-8 lg:col-6]; L1083 [mt-2]; L1142 [mt-2]; L1200 [mt-2]; L1236 [my-4]; L1244 [formgrid grid]; L1245 [col-12 lg:col-10 xl:col-8]; L1246 [formgrid grid]; L1247 [col-12 md:col-6 pb-3 md:pb-0]; L1248 [formgrid grid align-items-center]; L1249 [col-10 sm:col-9 lg:col-5]; L1252 [col-2 sm:col-3 lg:col-7]; L1261 [col-12 md:col-5 pb-2]; L1262 [formgrid grid align-items-center]; L1263 [col-10 sm:col-9 lg:col-5]; L1266 [col-2 sm:col-3 lg:col-7]; L1281 [formgrid grid]; L1282 [col-12 lg:col-10 xl:col-8]; L1283 [formgrid grid]; L1284 [col-12 md:col-6 pb-3 md:pb-0]; L1285 [formgrid grid align-items-center]; L1286 [col-12 md:col-5 pb-2 md:pb-0]; L1289 [col-12 md:col-7]; L1296 [w-full]; L1301 [col-12 md:col-6]; L1302 [formgrid grid align-items-center]; L1303 [col-12 md:col-5 pb-2 md:pb-0]; L1306 [col-12 md:col-7]; L1313 [w-full]
- src/components/common/MarkdownViewer.tsx
  Tokens: my-4, px-1, px-2, px-3, py-0, py-1
  Occurrences: L21 [px-1 py-0]; L29 [my-4]; L31 [px-2 py-1]; L62 [my-4]; L69 [px-3 py-1]; L74 [px-3 py-1]
- src/components/common/MultipleSelectAutoCompleteField.tsx
  Tokens: w-full
  Occurrences: L41 [w-full]
- src/components/common/SocialMediaLogin.tsx
  Tokens: mt-4
  Occurrences: L26 [mt-4]
- src/components/common/SolidAdmin.tsx
  Tokens: mb-2
  Occurrences: L133 [mb-2]
- src/components/common/SolidExport.tsx
  Tokens: m-0
  Occurrences: L447 [m-0]; L448 [m-0]
- src/components/common/SolidFormHeader.tsx
  Tokens: align-items-start, flex, flex-column, gap-2, justify-content-between, xl:align-items-center, xl:flex-row
  Occurrences: L24 [flex flex-column gap-2 align-items-start xl:flex-row xl:align-items-center justify-content-between]
- src/components/common/SolidModuleHome.tsx
  Tokens: align-items-center, col-12, flex, flex-column, gap-2, gap-4, grid, lg:pr-0, m-0, mb-0, md:col-6, md:p-5, mr-2, mt-2, p-4, pr-3, xl:col-4
  Occurrences: L39 [flex align-items-center gap-2]; L43 [m-0]; L48 [p-4 md:p-5 flex flex-column gap-4]; L50 [flex flex-column gap-2 pr-3 lg:pr-0]; L54 [m-0]; L64 [grid]; L84 [col-12 md:col-6 xl:col-4]; L89 [mb-0 mt-2 mr-2]
- src/components/common/SolidSettings/LlmSettings/AiModelConfigTab.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, gap-4, justify-content-between, mt-3, w-full
  Occurrences: L156 [flex flex-column gap-3]; L161 [w-full]; L185 [w-full]; L195 [w-full]; L206 [w-full]; L212 [flex justify-content-between w-full]; L220 [flex gap-2]; L340 [flex flex-column gap-4]; L343 [flex flex-column gap-3 mt-3]; L347 [w-full]; L360 [w-full]; L368 [flex flex-column gap-3 mt-3]; L369 [flex align-items-center gap-2]; L387 [w-full]
- src/components/common/SolidSettings/LlmSettings/AnthropicProviderComponent.tsx
  Tokens: flex, flex-column, gap-2, gap-4, mt-3, w-full
  Occurrences: L5 [flex flex-column gap-4 mt-3]; L6 [flex flex-column gap-2]; L12 [w-full]; L15 [flex flex-column gap-2]; L18 [w-full]; L24 [flex flex-column gap-2]; L30 [w-full]
- src/components/common/SolidSettings/LlmSettings/OpenAiProviderComponent.tsx
  Tokens: flex, flex-column, gap-2, gap-4, mt-3, w-full
  Occurrences: L5 [flex flex-column gap-4 mt-3]; L6 [flex flex-column gap-2]; L12 [w-full]; L15 [flex flex-column gap-2]; L18 [w-full]; L24 [flex flex-column gap-2]; L30 [w-full]
- src/components/common/SolidSettings/SettingDropzoneActivePlaceholder.tsx
  Tokens: mb-2, mt-2
  Occurrences: L10 [mt-2]; L14 [mb-2]
- src/components/common/SolidSettings/SettingsImageRemoveButton.tsx
  Tokens: mt-2
  Occurrences: L11 [mt-2]
- src/components/core/card/CardUserViewLayout.tsx
  Tokens: flex, gap-2, pt-3
  Occurrences: L53 [pt-3 flex gap-2]
- src/components/core/card/SolidCardView.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, h-full, justify-content-between, lg:flex, lg:flex-row, m-0, px-3, py-1, w-full
  Occurrences: L349 [flex h-full]; L350 [h-full flex]; L351 [flex flex-column]; L352 [flex-column lg:flex-row]; L353 [flex justify-content-between w-full]; L354 [flex gap-3 align-items-center w-full]; L360 [m-0]; L361 [lg:flex]; L373 [flex align-items-center]; L375 [flex]; L420 [flex]; L457 [flex gap-3 px-3 py-1]; L458 [flex gap-2]; L473 [flex gap-2]
- src/components/core/card/SolidCardViewConfigure.tsx
  Tokens: m-0
  Occurrences: L246 [m-0]
- src/components/core/chatter/SolidChatter.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, h-full, justify-content-center, justify-content-start, m-0, p-2, p-3, px-3
  Occurrences: L205 [flex flex-column align-items-center justify-content-center gap-2 h-full]; L214 [flex align-items-center justify-content-center h-full]; L215 [flex flex-column align-items-center gap-2 px-3]; L216 [p-2]; L219 [m-0]; L220 [m-0]; L230 [p-3]; L231 [justify-content-start]; L236 [flex flex-column gap-3]; L261 [flex justify-content-center]; L276 [h-full]
- src/components/core/chatter/SolidChatterAuditMessage.tsx
  Tokens: flex, flex-column, gap-2, m-0
  Occurrences: L63 [flex flex-column gap-2]; L65 [flex gap-2]; L66 [m-0]; L69 [m-0]; L73 [m-0]
- src/components/core/chatter/SolidChatterHeader.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, justify-content-between, m-0, md:flex-row, mt-2, w-full
  Occurrences: L116 [flex justify-content-between align-items-center]; L117 [m-0]; L120 [flex align-items-center]; L172 [mt-2]; L192 [m-0]; L198 [flex flex-column gap-3]; L199 [flex flex-column gap-2]; L209 [w-full]; L210 [w-full]; L214 [flex flex-column gap-2]; L216 [flex gap-2 flex-column md:flex-row]; L222 [w-full]; L224 [w-full]; L233 [w-full]; L235 [w-full]
- src/components/core/chatter/SolidChatterMessageBox.tsx
  Tokens: align-items-center, flex, flex-column, flex-wrap, gap-1, gap-2, inline-flex, justify-content-between, justify-content-end, px-2, py-1, py-2, w-full
  Occurrences: L269 [flex align-items-center gap-2 flex-wrap]; L285 [flex align-items-center gap-2]; L315 [flex flex-column gap-2]; L320 [w-full py-2]; L322 [flex flex-column gap-2]; L332 [flex flex-column gap-1]; L334 [flex align-items-center justify-content-between]; L350 [flex align-items-center justify-content-between gap-2 flex-wrap]; L351 [flex align-items-center gap-2]; L364 [flex align-items-center justify-content-end gap-2]; L434 [flex align-items-center gap-2]; L446 [flex align-items-center justify-content-end]; L448 [inline-flex align-items-center gap-1 px-2 py-1]; L457 [px-2 py-1]
- src/components/core/chatter/SolidMessageComposer.tsx
  Tokens: align-items-center, flex, flex-wrap, gap-1, gap-2, justify-content-between, m-0, mb-2, p-2, w-full
  Occurrences: L85 [flex align-items-center gap-1 mb-2]; L106 [flex align-items-center justify-content-between]; L107 [m-0]; L115 [w-full p-2]; L118 [flex align-items-center justify-content-between flex-wrap gap-2]; L119 [flex align-items-center gap-2]; L139 [flex align-items-center gap-2]; L143 [gap-2]
- src/components/core/common/FilterComponent.tsx
  Tokens: mt-2, px-0, w-full
  Occurrences: L108 [w-full]; L131 [w-full]; L137 [w-full]; L191 [px-0 mt-2]
- src/components/core/common/GroupingComponent.tsx
  Tokens: m-0, w-full
  Occurrences: L205 [m-0]; L206 [m-0]; L219 [w-full]; L287 [m-0]; L288 [m-0]; L301 [w-full]
- src/components/core/common/PDFViewer.tsx
  Tokens: flex, p-4, px-4, py-2, w-full
  Occurrences: L56 [flex]; L63 [flex p-4]; L65 [flex w-full]; L71 [flex w-full]; L93 [flex p-4]; L97 [px-4 py-2]; L109 [px-4 py-2]
- src/components/core/common/SolidGenericImport/SolidGenericImport.tsx
  Tokens: m-0
  Occurrences: L92 [m-0]
- src/components/core/common/SolidGenericImport/SolidImportDropzone.tsx
  Tokens: flex, justify-content-center, m-0, mt-3
  Occurrences: L77 [flex justify-content-center]; L82 [m-0]; L93 [flex justify-content-center mt-3]; L109 [m-0]; L110 [m-0]; L111 [m-0]
- src/components/core/common/SolidGenericImport/SolidImportInstructions.tsx
  Tokens: px-2
  Occurrences: L70 [px-2]
- src/components/core/common/SolidGenericImport/SolidImportTransaction.tsx
  Tokens: m-0, px-2, w-full
  Occurrences: L113 [m-0]; L143 [w-full]; L168 [px-2]
- src/components/core/common/SolidGenericImport/SolidImportTransactionStatus.tsx
  Tokens: m-0
  Occurrences: L162 [m-0]; L163 [m-0]
- src/components/core/common/SolidGlobalSearchElement.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, gap-2, justify-content-center, m-0, ml-1, my-1, p-3, px-3, py-1, w-full
  Occurrences: L1336 [flex align-items-center gap-2]; L1350 [ml-1]; L1398 [flex align-items-center gap-2]; L1424 [ml-1]; L1442 [flex align-items-center gap-2]; L1443 [flex align-items-center gap-2]; L1456 [ml-1]; L1725 [ml-1]; L1792 [flex align-items-center gap-2]; L1797 [ml-1]; L1808 [flex justify-content-center]; L1936 [w-full]; L1940 [px-3 py-1 flex flex-column]; L1941 [my-1]; L1992 [px-3 py-1 flex flex-column]; L1993 [my-1]; L2006 [flex gap-1 align-items-center]; L2019 [p-3]; L2039 [p-3]; L2051 [flex flex-column]; L2130 [m-0]; L2131 [m-0]; L2145 [m-0]; L2146 [m-0]; L2169 [m-0]; L2170 [m-0]; L2184 [m-0]; L2185 [m-0]; L2204 [justify-content-center]
- src/components/core/common/SolidLayoutViews.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, justify-content-between, ml-2, p-1, pt-2, px-3, w-full
  Occurrences: L30 [ml-2 flex align-items-center justify-content-between w-full]; L58 [p-1]; L59 [px-3 pt-2]; L60 [flex flex-column gap-1]; L64 [p-1]; L65 [px-3 pt-2]; L66 [flex flex-column gap-1]
- src/components/core/common/SolidListViewOptions.tsx
  Tokens: flex, justify-content-center, m-0, w-full
  Occurrences: L14 [flex justify-content-center]; L17 [w-full]; L18 [m-0]
- src/components/core/common/SolidPasswordHelperText.tsx
  Tokens: col-12, col-6, flex, gap-2, grid, mt-4, pt-0
  Occurrences: L14 [mt-4 grid]; L18 [col-12]; L19 [grid]; L21 [col-6 pt-0]; L22 [flex gap-2]
- src/components/core/common/SolidSearchBox.tsx
  Tokens: flex, justify-content-center
  Occurrences: L12 [flex justify-content-center]
- src/components/core/common/SolidXAiIframe.tsx
  Tokens: align-items-center, flex, h-full, mt-2, p-4
  Occurrences: L46 [flex h-full]; L55 [flex align-items-center h-full p-4]; L57 [mt-2]
- src/components/core/extension/solid-core/chatterMessage/form/SolidChatterMessageCoModelEntityIdFormViewWidget.tsx
  Tokens: mt-2
  Occurrences: L43 [mt-2]
- src/components/core/extension/solid-core/chatterMessage/list/SolidChatterMessageCoModelEntityIdListViewWidget.tsx
  Tokens: mt-2
  Occurrences: L43 [mt-2]
- src/components/core/extension/solid-core/listOfValues/form/SolidLovTypeChangeFormEditWidget.tsx
  Tokens: align-items-center, flex, gap-2, mb-2, w-full
  Occurrences: L69 [w-full]; L70 [flex align-items-center mb-2]; L96 [w-full]; L99 [flex gap-2]
- src/components/core/extension/solid-core/modelMetadata/list/DeleteModelRowAction.tsx
  Tokens: m-0
  Occurrences: L60 [m-0]
- src/components/core/extension/solid-core/modelMetadata/list/GenerateModelCodeRowAction.tsx
  Tokens: m-0
  Occurrences: L118 [m-0]; L138 [m-0]
- src/components/core/extension/solid-core/moduleMetadata/list/DeleteModuleRowAction.tsx
  Tokens: m-0
  Occurrences: L83 [m-0]
- src/components/core/extension/solid-core/moduleMetadata/list/GenerateModuleCodeRowAction.tsx
  Tokens: m-0
  Occurrences: L117 [m-0]; L137 [m-0]
- src/components/core/extension/solid-core/mqMessage/form/SolidMqMessageStageFormViewWIdget.tsx
  Tokens: mt-2
  Occurrences: L15 [mt-2]
- src/components/core/extension/solid-core/mqMessage/list/SolidMqMessageStageListViewWidget.tsx
  Tokens: mt-2
  Occurrences: L11 [mt-2]
- src/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget.tsx
  Tokens: align-items-center, flex, formgrid, gap-3, grid, justify-content-between, justify-content-start, lg:gap-0, lg:mt-4, m-0, mb-2, mt-3, w-full
  Occurrences: L65 [mb-2]; L66 [w-full justify-content-start]; L74 [flex align-items-center gap-3 justify-content-between w-full]; L98 [mt-3 lg:mt-4]; L100 [formgrid grid gap-3 lg:gap-0]; L113 [m-0]
- src/components/core/field/FieldListViewData.tsx
  Tokens: align-items-center, align-items-start, flex, flex-column, gap-2, gap-3, justify-content-center, mb-3, mb-4, md:flex-row, mt-3, my-3, w-full
  Occurrences: L175 [w-full]; L176 [flex gap-3 mb-4]; L189 [flex flex-column md:flex-row align-items-start gap-3 mb-3]; L194 [w-full]; L200 [w-full]; L202 [flex align-items-center gap-2]; L209 [flex justify-content-center my-3]; L258 [flex justify-content-center gap-3 mt-3]
- src/components/core/filter/fields/relations/SolidRelationManyToManyField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pl-2, md:pr-0, p-0, px-0, w-full
  Occurrences: L26 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L28 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L42 [w-full]; L47 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-2 md:pr-0]
- src/components/core/filter/fields/relations/SolidRelationManyToOneField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L51 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L52 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L63 [w-full]; L67 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/relations/SolidRelationOneToManyField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pl-2, md:pr-0, p-0, px-0, w-full
  Occurrences: L24 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L26 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L40 [w-full]; L45 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-2 md:pr-0]
- src/components/core/filter/fields/SolidBooleanField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L28 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L29 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L39 [w-full]; L43 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidDateField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L30 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L31 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L41 [w-full]; L44 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidDatetimeField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L22 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L23 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L33 [w-full]; L37 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidExternalIdField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L20 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L21 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L31 [w-full]; L35 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidIdField.tsx
  Tokens: align-items-start, flex, flex-column, gap-2, gap-3, w-full
  Occurrences: L24 [flex align-items-start gap-3 w-full]; L34 [w-full]; L36 [flex flex-column gap-2 w-full]
- src/components/core/filter/fields/SolidIntField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L26 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L27 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L38 [w-full]; L42 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidMediaMultipleField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L26 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L27 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L37 [w-full]; L41 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidMediaSingleField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L28 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L29 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L39 [w-full]; L43 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidSelectionDynamicField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L20 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L21 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L31 [w-full]; L35 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidSelectionStaticField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L23 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L24 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L34 [w-full]; L38 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidShortTextField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L26 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L27 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L37 [w-full]; L41 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidTimeField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L16 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L17 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L27 [w-full]; L31 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/fields/SolidUuidField.tsx
  Tokens: align-items-start, col-12, flex, flex-column, gap-2, gap-6, md:col-6, md:flex-row, md:gap-1, md:pl-0, md:pr-0, p-0, px-0, w-full
  Occurrences: L19 [flex flex-column md:flex-row align-items-start gap-6 md:gap-1]; L20 [col-12 md:col-6 px-0 md:pr-0 md:pl-0 p-0]; L30 [w-full col-12 md:col-6]; L34 [flex flex-column gap-2 col-12 md:col-6 px-0 md:pl-0 md:pr-0 p-0]
- src/components/core/filter/SolidBooleanFilterElement.tsx
  Tokens: w-full
  Occurrences: L27 [w-full]; L28 [w-full]
- src/components/core/filter/SolidManyToManyFilterElement.tsx
  Tokens: w-full
  Occurrences: L61 [w-full]; L62 [w-full]
- src/components/core/filter/SolidManyToOneFilterElement.tsx
  Tokens: w-full
  Occurrences: L58 [w-full]; L59 [w-full]
- src/components/core/filter/SolidOneToManyFilterElement.tsx
  Tokens: w-full
  Occurrences: L59 [w-full]; L60 [w-full]
- src/components/core/filter/SolidSelectionDynamicFilterElement.tsx
  Tokens: w-full
  Occurrences: L47 [w-full]; L48 [w-full]
- src/components/core/filter/SolidSelectionStaticFilterElement.tsx
  Tokens: w-full
  Occurrences: L29 [w-full]; L30 [w-full]
- src/components/core/filter/SolidVarInputsFilterElement.tsx
  Tokens: w-full
  Occurrences: L114 [w-full]; L125 [w-full]; L136 [w-full]; L147 [w-full]; L158 [w-full]
- src/components/core/form/fields/relations/SolidRelationManyToManyField.tsx
  Tokens: align-items-center, flex, flex-column, formgrid, gap-2, gap-3, grid, justify-content-end, justify-content-start, mb-2, mt-1, pt-2, w-full
  Occurrences: L208 [mb-2]; L209 [w-full justify-content-start]; L212 [flex align-items-center gap-3]; L228 [w-full]; L256 [mt-1]; L360 [flex align-items-center gap-3]; L361 [flex align-items-center gap-3]; L397 [mb-2]; L398 [w-full justify-content-start]; L403 [formgrid grid]; L613 [mb-2]; L614 [w-full justify-content-start]; L644 [flex flex-column gap-2 pt-2]; L656 [w-full]; L661 [flex gap-2 justify-content-end]
- src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx
  Tokens: align-items-center, flex, gap-3, mt-1, w-full
  Occurrences: L438 [flex align-items-center gap-3]; L460 [w-full]; L478 [mt-1]; L983 [flex align-items-center gap-3]; L1005 [w-full]; L1025 [mt-1]
- src/components/core/form/fields/relations/SolidRelationOneToManyField.tsx
  Tokens: align-items-center, justify-content-center
  Occurrences: L323 [justify-content-center align-items-center]; L475 [justify-content-center align-items-center]; L690 [justify-content-center align-items-center]
- src/components/core/form/fields/SolidBooleanField.tsx
  Tokens: align-items-center, flex, ml-2
  Occurrences: L279 [flex align-items-center]; L304 [ml-2]; L376 [flex align-items-center]; L396 [ml-2]
- src/components/core/form/fields/SolidDateField.tsx
  Tokens: mt-1
  Occurrences: L161 [mt-1]
- src/components/core/form/fields/SolidDateTimeField.tsx
  Tokens: mt-1
  Occurrences: L163 [mt-1]
- src/components/core/form/fields/SolidIntegerField.tsx
  Tokens: flex, justify-content-between, mb-2, mt-2, w-full
  Occurrences: L212 [w-full]; L214 [mb-2]; L280 [flex justify-content-between mt-2]; L294 [mt-2]
- src/components/core/form/fields/SolidJsonField.tsx
  Tokens: mt-1
  Occurrences: L149 [mt-1]
- src/components/core/form/fields/SolidLongTextField.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, gap-2, gap-3, justify-content-between, mb-3, ml-2, mt-1, mt-4, p-3, p-4
  Occurrences: L237 [mt-4]; L246 [p-4]; L248 [flex flex-column gap-2]; L257 [flex flex-column gap-1]; L405 [mt-4]; L414 [p-4]; L415 [flex justify-content-between align-items-center mb-3]; L427 [flex flex-column gap-2]; L435 [flex gap-3 align-items-center]; L437 [flex flex-column gap-1]; L450 [ml-2]; L461 [mt-4 p-3]; L485 [mt-4]; L517 [mt-1]
- src/components/core/form/fields/SolidMediaMultipleField.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, gap-2, justify-content-between, m-0, md:gap-2, mt-1, w-full
  Occurrences: L373 [mt-1]; L385 [flex align-items-center md:gap-2]; L387 [w-full flex flex-column gap-1]; L388 [flex align-items-center justify-content-between]; L389 [m-0]; L390 [flex align-items-center gap-2]; L411 [flex align-items-center gap-2]; L420 [flex align-items-center mt-1]; L421 [m-0]; L447 [flex align-items-center md:gap-2]; L449 [w-full flex flex-column gap-1]; L450 [flex align-items-center justify-content-between]; L451 [m-0]; L452 [flex align-items-center gap-2]; L473 [flex align-items-center gap-2]; L602 [flex align-items-center md:gap-2]; L604 [w-full flex flex-column gap-1]; L605 [flex align-items-center justify-content-between]; L606 [m-0]; L607 [flex align-items-center md:gap-2]; L623 [flex align-items-center gap-2]; L632 [flex align-items-center mt-1]; L633 [m-0]; L659 [flex align-items-center md:gap-2]; L661 [w-full flex flex-column gap-1]; L662 [flex align-items-center justify-content-between]; L664 [flex align-items-center md:gap-2]; L680 [flex align-items-center gap-2]
- src/components/core/form/fields/SolidMediaSingleField.tsx
  Tokens: align-items-start, flex, gap-3, justify-content-between, mt-1
  Occurrences: L385 [mt-1]; L399 [flex align-items-start justify-content-between gap-3]; L573 [flex align-items-start justify-content-between gap-3]
- src/components/core/form/fields/SolidPasswordField.tsx
  Tokens: align-items-center, flex, gap-3, mt-1, mt-5, w-full
  Occurrences: L173 [flex align-items-center gap-3]; L226 [w-full]; L264 [w-full]; L350 [mt-1]; L376 [w-full]; L393 [w-full]; L400 [mt-5]; L401 [w-full]
- src/components/core/form/fields/SolidShortTextField.tsx
  Tokens: w-full
  Occurrences: L332 [w-full]
- src/components/core/form/fields/SolidTimeField.tsx
  Tokens: mt-1
  Occurrences: L203 [mt-1]
- src/components/core/form/fields/widgets/SolidAiInteractionMessageFieldFormWidget.tsx
  Tokens: flex-column, m-0, mt-2
  Occurrences: L37 [mt-2 flex-column]; L38 [m-0]
- src/components/core/form/fields/widgets/SolidAiInteractionMetadataFieldFormWidget.tsx
  Tokens: flex, flex-column, gap-2, mt-2, p-3, pt-0, w-full
  Occurrences: L24 [flex gap-2]; L79 [flex gap-2 p-3]; L87 [p-3 pt-0]; L113 [p-3 w-full]; L126 [mt-2 flex-column]
- src/components/core/form/fields/widgets/SolidIconEditWidget.tsx
  Tokens: align-items-center, align-items-end, col-12, col-3, col-6, flex, flex-column, gap-3, grid, justify-content-between, justify-content-center, lg:col-3, lg:col-6, lg:flex, lg:p-4, lg:pt-4, lg:px-4, m-0, mb-0, mb-3, md:flex-row, ml-2, mt-1, mt-2, mt-4, p-0, p-3, pb-3, pt-3, px-3, px-4, w-full
  Occurrences: L93 [flex align-items-end gap-3 mt-2]; L106 [mb-0]; L126 [ml-2]; L137 [p-0]; L146 [p-0]; L147 [grid m-0 flex-column md:flex-row]; L148 [col-12 lg:col-3 p-0]; L149 [flex flex-column justify-content-between p-3 lg:p-4]; L157 [w-full mb-3]; L189 [col-6 p-0 flex]; L190 [p-3 lg:p-4]; L194 [flex justify-content-center]; L199 [mt-2]; L200 [mt-2]; L208 [col-12 lg:col-6 p-0]; L209 [px-3 lg:px-4 pt-3 lg:pt-4]; L217 [w-full]; L221 [px-4 pb-3 mt-4]; L222 [grid]; L225 [col-3]; L226 [w-full flex flex-column align-items-center justify-content-center gap-3]; L241 [mb-0 mt-1]; L254 [col-3 p-0 lg:flex]; L255 [p-3 lg:p-4]; L259 [flex justify-content-center]; L264 [mt-2]; L265 [mt-2]; L275 [gap-3]
- src/components/core/form/fields/widgets/SolidIconViewWidget.tsx
  Tokens: mb-0, mt-2
  Occurrences: L21 [mt-2]; L25 [mb-0]; L28 [mt-2]
- src/components/core/form/fields/widgets/SolidRelationFieldAvatarFormWidget.tsx
  Tokens: flex, flex-column, flex-wrap, gap-2, m-0, mt-2
  Occurrences: L36 [mt-2 flex-column]; L37 [m-0]; L38 [flex flex-wrap gap-2 mt-2]
- src/components/core/form/fields/widgets/SolidS3FileViewerWidget.tsx
  Tokens: flex, gap-2, gap-3, m-0, mt-2, p-0, p-1
  Occurrences: L143 [mt-2 flex gap-2]; L144 [m-0]; L147 [flex gap-3]; L215 [p-1]; L219 [p-0]
- src/components/core/form/fields/widgets/SolidShortTextFieldAvatarWidget.tsx
  Tokens: flex-column, gap-2, m-0, mt-2
  Occurrences: L38 [mt-2 flex-column gap-2]; L39 [m-0]
- src/components/core/form/SolidFormActionHeader.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, gap-2, gap-3, justify-content-between, lg:flex, lg:flex-row, m-0, md:flex, w-full
  Occurrences: L122 [flex gap-2]; L129 [md:flex]; L214 [flex flex-column gap-1]; L246 [flex-column lg:flex-row]; L247 [flex justify-content-between w-full]; L250 [flex gap-3 align-items-center]; L253 [m-0]; L267 [flex align-items-center]; L269 [lg:flex]; L295 [lg:flex]; L309 [lg:flex]; L334 [lg:flex]; L353 [lg:flex]; L389 [flex gap-3 align-items-center]; L403 [m-0]; L407 [flex align-items-center]; L409 [lg:flex]; L415 [w-full gap-2]; L451 [lg:flex]; L475 [lg:flex]; L493 [lg:flex]; L507 [lg:flex]; L526 [lg:flex]
- src/components/core/form/SolidFormFieldRender.tsx
  Tokens: mt-1
  Occurrences: L44 [mt-1]
- src/components/core/form/SolidFormFooter.tsx
  Tokens: align-items-center, flex, gap-2, justify-content-end, p-1
  Occurrences: L144 [flex justify-content-end align-items-center gap-2 p-1]
- src/components/core/form/SolidFormUserViewLayout.tsx
  Tokens: flex, gap-2, pt-3
  Occurrences: L56 [pt-3 flex gap-2]
- src/components/core/form/SolidFormView.tsx
  Tokens: align-items-center, flex, flex-column, formgrid, gap-2, gap-3, grid, justify-content-between, justify-content-center, lg:flex-row, lg:p-4, m-0, p-1, p-3, pt-0, px-0, w-full
  Occurrences: L221 [grid]; L227 [grid]; L232 [formgrid grid]; L249 [grid]; L256 [grid]; L270 [grid]; L327 [w-full]; L364 [w-full]; L1294 [flex-column lg:flex-row]; L1295 [flex justify-content-between w-full]; L1296 [flex gap-3 align-items-center]; L1297 [m-0]; L1299 [flex align-items-center]; L1813 [flex flex-column gap-2 justify-content-center p-1]; L1825 [px-0]; L1877 [p-3 pt-0 lg:p-4]; L1897 [flex]
- src/components/core/form/SolidFormViewShimmerLoading.tsx
  Tokens: align-items-center, col-6, field, flex, flex-column, formgrid, gap-2, gap-3, gap-4, grid, justify-content-end, md:flex, mt-4, p-4, pl-2, w-full
  Occurrences: L11 [pl-2]; L12 [flex align-items-center gap-3]; L14 [md:flex]; L16 [flex align-items-center gap-3]; L19 [flex]; L23 [w-full flex align-items-center justify-content-end]; L28 [p-4]; L29 [formgrid grid]; L30 [field col-6]; L31 [flex align-items-center gap-2]; L38 [formgrid grid mt-4]; L39 [field col-6 flex flex-column gap-4]; L40 [flex flex-column gap-2]; L44 [flex flex-column gap-2]; L48 [flex flex-column gap-2]; L53 [field col-6 flex flex-column gap-4]; L54 [flex flex-column gap-2]; L58 [flex flex-column gap-2]; L62 [flex flex-column gap-2]; L70 [p-4]; L71 [formgrid grid]; L72 [field col-6]; L73 [flex align-items-center gap-2]; L78 [formgrid grid mt-4]; L79 [field col-6 flex flex-column gap-4]; L80 [flex flex-column gap-2]; L84 [flex flex-column gap-2]; L88 [flex flex-column gap-2]; L93 [field col-6 flex flex-column gap-4]; L94 [flex flex-column gap-2]; L98 [flex flex-column gap-2]; L102 [flex flex-column gap-2]
- src/components/core/kanban/KanbanBoard.tsx
  Tokens: flex, gap-3, md:px-4, md:py-3, px-3, py-2
  Occurrences: L93 [flex gap-3 px-3 md:px-4 py-2 md:py-3]
- src/components/core/kanban/KanbanColumn.tsx
  Tokens: align-items-center, flex
  Occurrences: L49 [flex align-items-center]; L60 [flex align-items-center]
- src/components/core/kanban/KanbanUserViewLayout.tsx
  Tokens: flex, gap-2, pt-3
  Occurrences: L54 [pt-3 flex gap-2]
- src/components/core/kanban/SolidKanbanView.tsx
  Tokens: align-items-center, flex, flex-column, gap-3, h-full, justify-content-between, lg:flex, lg:flex-row, m-0, w-full
  Occurrences: L939 [flex h-full]; L940 [h-full flex flex-column]; L941 [flex flex-column]; L942 [flex-column lg:flex-row]; L943 [flex justify-content-between w-full]; L944 [flex gap-3 align-items-center w-full]; L951 [m-0]; L952 [lg:flex]; L958 [flex align-items-center]; L960 [flex]; L1008 [flex]
- src/components/core/kanban/SolidKanbanViewConfigure.tsx
  Tokens: m-0
  Occurrences: L247 [m-0]
- src/components/core/list/columns/SolidMediaMultipleColumn.tsx
  Tokens: align-items-center, align-items-end, flex, flex-column, gap-1, gap-2, justify-content-between, justify-content-center, m-0, mb-3, w-full
  Occurrences: L86 [flex align-items-center justify-content-center]; L182 [flex gap-2 align-items-end]; L250 [mb-3]; L251 [flex align-items-center gap-2]; L255 [w-full flex flex-column gap-1]; L256 [flex align-items-center justify-content-between]; L259 [m-0]
- src/components/core/list/columns/SolidMediaSingleColumn.tsx
  Tokens: align-items-center, flex, justify-content-center
  Occurrences: L82 [flex align-items-center justify-content-center]
- src/components/core/list/ListViewRowActionPopup.tsx
  Tokens: flex, justify-content-center
  Occurrences: L30 [flex justify-content-center]
- src/components/core/list/SolidColumnSelector/SolidListColumnSelector.tsx
  Tokens: flex, flex-column, gap-1, px-0
  Occurrences: L157 [flex flex-column gap-1 px-0]
- src/components/core/list/SolidDataTable.tsx
  Tokens: flex, gap-2, ml-auto, px-3, py-6
  Occurrences: L246 [px-3 py-6]; L311 [flex gap-2 ml-auto]; L324 [flex gap-2]
- src/components/core/list/SolidListingHeader.tsx
  Tokens: align-items-center, flex, justify-content-between, px-5
  Occurrences: L17 [flex justify-content-between align-items-center px-5]; L20 [flex align-items-center]; L28 [flex align-items-center]; L33 [flex align-items-center]
- src/components/core/list/SolidListView.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, h-full, justify-content-between, justify-content-end, lg:flex, lg:flex-row, m-0, w-full
  Occurrences: L1317 [flex h-full]; L1319 [flex flex-column]; L1321 [flex-column lg:flex-row]; L1323 [flex justify-content-between w-full]; L1324 [flex gap-3 align-items-center w-full]; L1325 [flex align-items-center gap-2]; L1331 [m-0]; L1336 [lg:flex]; L1353 [flex align-items-center]; L1356 [flex]; L1368 [lg:flex align-items-center]; L1431 [lg:flex]; L1465 [flex]; L1743 [flex justify-content-end]
- src/components/core/list/SolidListViewConfigure.tsx
  Tokens: m-0
  Occurrences: L361 [m-0]; L380 [m-0]; L381 [m-0]
- src/components/core/list/SolidSelectionDynamicFilterElement.tsx
  Tokens: w-full
  Occurrences: L45 [w-full]
- src/components/core/list/SolidSelectionStaticFilterElement.tsx
  Tokens: w-full
  Occurrences: L27 [w-full]
- src/components/core/list/SolidTableRowCell.tsx
  Tokens: align-items-center, flex
  Occurrences: L15 [flex align-items-center]
- src/components/core/list/widgets/SolidManyToManyRelationAvatarListWidget.tsx
  Tokens: align-items-center, flex, gap-2
  Occurrences: L19 [flex align-items-center gap-2]
- src/components/core/locales/SolidChatterLocaleTabView.tsx
  Tokens: h-full
  Occurrences: L134 [h-full]
- src/components/core/locales/SolidLocale.tsx
  Tokens: align-items-center, flex, flex-column, gap-2, gap-3, justify-content-between, justify-content-end, m-0, mb-2, ml-0, mt-0, mt-2, mt-6, my-2, p-0, p-2, px-2, w-full
  Occurrences: L60 [flex flex-column p-0 m-0]; L61 [flex justify-content-end gap-3]; L67 [w-full]; L71 [w-full]; L78 [flex flex-column gap-2 mt-2]; L79 [p-0 m-0]; L80 [my-2]; L82 [flex align-items-center justify-content-between gap-2 p-2]; L83 [m-0]; L84 [m-0]; L86 [flex align-items-center justify-content-between gap-2 p-2]; L87 [m-0]; L88 [m-0]; L92 [flex align-items-center justify-content-between gap-2 p-2]; L93 [m-0]; L94 [m-0]; L100 [mt-6 mb-2]; L107 [w-full]; L111 [mt-0 ml-0]; L116 [px-2]
- src/components/core/model/CreateModel.tsx
  Tokens: align-items-center, flex, flex-column, flex-wrap, gap-1, gap-2, gap-3, justify-content-between, m-0, md:p-4, mt-3, p-4, pb-0, px-0, px-4, py-2, py-3
  Occurrences: L284 [flex flex-column]; L287 [flex align-items-center gap-2]; L292 [flex align-items-center gap-2]; L371 [flex align-items-center justify-content-between gap-3 flex-wrap]; L372 [flex flex-column gap-1]; L374 [m-0]; L376 [flex align-items-center gap-2]; L395 [px-4 py-3 md:p-4]; L398 [px-0]; L448 [py-2]; L448 [px-0 pb-0]; L449 [m-0]; L450 [p-4]; L451 [m-0]; L455 [flex align-items-center gap-2 mt-3]
- src/components/core/model/FieldMetaData.tsx
  Tokens: align-items-center, flex, gap-2, justify-content-center
  Occurrences: L206 [flex align-items-center gap-2]; L235 [flex align-items-center gap-2 justify-content-center]
- src/components/core/model/FieldMetaDataForm.tsx
  Tokens: align-items-center, col-12, col-6, field, flex, flex-column, flex-wrap, formgrid, gap-2, gap-3, grid, mb-3, md:col-12, md:col-6, md:flex-nowrap, md:mb-3, md:mt-0, md:mt-2, ml-2, ml-4, mr-3, mt-0, mt-1, mt-2, mt-3, mt-4, p-3, sm:col-12, w-full
  Occurrences: L179 [flex align-items-center gap-2 mt-2]; L186 [w-full]; L194 [w-full]; L335 [flex align-items-center gap-3 mt-2 flex-wrap md:flex-nowrap]; L354 [w-full]; L379 [w-full]; L396 [mt-2]; L1775 [flex align-items-center gap-3]; L1798 [flex align-items-center ml-4]; L1803 [flex align-items-center gap-3]; L1810 [flex align-items-center gap-3]; L1836 [flex align-items-center gap-3]; L1850 [p-3]; L1853 [mb-3]; L1862 [formgrid grid]; L1864 [field col-12 md:col-6 mt-2]; L1893 [field col-12 md:col-6 mt-1 md:mt-0]; L1914 [field col-12 md:col-6 mt-1 md:mt-2]; L1937 [field col-12 md:col-6 mt-2]; L1938 [flex align-items-center gap-2]; L1960 [field col-12 gap-2 mt-4]; L1985 [md:col-6 sm:col-12]; L1986 [field col-6 gap-2]; L2039 [formgrid grid]; L2041 [field col-6 gap-2]; L2066 [field col-12 md:col-6 flex flex-column gap-2 mt-2]; L2087 [field col-12 md:col-6 flex flex-column gap-2 mt-2]; L2173 [field col-12 md:col-6 gap-2]; L2207 [w-full]; L2216 [field col-12 md:col-6 gap-2 mt-2 md:mt-0]; L2244 [field col-12 md:col-6 gap-2 mt-2]; L2262 [w-full]; L2276 [field col-12 md:col-6 gap-2 mt-2]; L2315 [field col-12 flex gap-2 mt-1 align-items-center]; L2359 [align-items-center]; L2360 [flex mt-1]; L2362 [mr-3]; L2370 [ml-2]; L2382 [field col-12 md:col-6 gap-2 mt-2]; L2415 [field col-12 md:col-6 gap-2 mt-1]; L2436 [w-full]; L2473 [field col-12 md:col-6 gap-2 mt-2]; L2494 [w-full]; L2513 [field col-12 md:col-6 gap-2 mt-2]; L2542 [field col-12 md:col-6 gap-2 mt-2]; L2563 [w-full]; L2579 [field col-12 gap-2 mt-2]; L2626 [field col-12 md:col-6 flex flex-column gap-2 mt-2]; L2630 [flex align-items-center]; L2647 [field col-12 md:col-6 gap-2 mt-2]; L2652 [field col-12 md:col-6 gap-2 mt-2]; L2689 [field col-6 gap-2 mt-2]; L2722 [field col-12 md:col-6 gap-2 mt-2]; L2751 [field col-12 md:col-6 gap-2 mt-2]; L2772 [w-full]; L2807 [field col-12 md:col-6 gap-2 mt-2]; L2843 [field col-12 md:col-6 gap-2 mt-2]; L2887 [field col-12 md:col-6 gap-2 mt-2]; L2934 [field col-12 md:col-6 gap-2 mt-2]; L2954 [w-full]; L2968 [field col-12 gap-2 mt-2]; L2971 [mb-3]; L2975 [flex align-items-center gap-2]; L2988 [ml-2]; L3016 [md:col-6 sm:col-12]; L3017 [field col-6 gap-2]; L3045 [field col-12 gap-2 mt-4]; L3057 [mt-2]; L3069 [field col-12 gap-2 mt-4]; L3081 [mt-4]; L3093 [md:col-12 sm:col-12]; L3095 [formgrid grid]; L3097 [md:col-12 sm:col-12]; L3098 [field col-6 gap-2]; L3106 [md:col-12 sm:col-12]; L3107 [field col-6 gap-2]; L3140 [formgrid grid]; L3143 [field col-12 md:col-6 gap-2 mt-2]; L3162 [w-full]; L3170 [field col-12 md:col-6 gap-2 mt-2]; L3195 [field col-12 md:col-6 gap-2 mt-2 mb-3 md:mb-3]; L3226 [field col-12 md:col-6 gap-2 mt-2]; L3265 [field col-12 md:col-6 gap-2 mt-2]; L3307 [field col-12 md:col-6 gap-2 mt-2]; L3325 [mt-0]; L3343 [formgrid grid mt-1 md:mt-0]; L3345 [field col-6 gap-2 mt-2]; L3346 [flex align-items-center]; L3363 [mt-2]; L3371 [field col-6 gap-2]; L3372 [flex align-items-center]; L3397 [mt-2]; L3405 [field col-6 gap-2 mt-2]; L3406 [flex align-items-center]; L3425 [field col-6 gap-2 mt-2]; L3426 [flex align-items-center]; L3439 [mt-2]; L3448 [field col-6 gap-2 mt-2]; L3449 [flex align-items-center gap-2]; L3469 [field col-6 gap-2 mt-2]; L3470 [flex align-items-center]; L3489 [md:col-6 sm:col-12]; L3490 [field]; L3491 [flex align-items-center]; L3513 [field col-6 gap-2 mt-2]; L3514 [flex align-items-center gap-2]; L3535 [field col-6 gap-2 mt-2]; L3536 [flex align-items-center gap-2]; L3557 [field col-6 gap-2 mt-2]; L3558 [flex align-items-center gap-2]; L3588 [formgrid grid mt-2]; L3589 [md:col-6 sm:col-12]; L3590 [field col-6 gap-2]; L3625 [w-full]; L3633 [md:col-6 sm:col-12]; L3634 [field col-6 gap-2]; L3663 [w-full]; L3675 [flex gap-3 mt-3]; L3684 [ml-4]
- src/components/core/model/ModelListViewData.tsx
  Tokens: align-items-center, align-items-start, flex, flex-column, flex-wrap, gap-2, gap-3, justify-content-center, mb-3, mb-4, md:flex-row, mt-3, my-3, p-0, w-full
  Occurrences: L189 [p-0]; L219 [w-full]; L220 [flex gap-3 mb-4 align-items-center flex-wrap]; L234 [flex flex-column md:flex-row align-items-start gap-3 mb-3]; L239 [w-full]; L245 [w-full]; L247 [flex align-items-center gap-2]; L254 [flex justify-content-center my-3]; L305 [flex justify-content-center gap-3 mt-3]; L329 [flex justify-content-center gap-3 mt-3]
- src/components/core/model/ModelMetaData.tsx
  Tokens: col-12, field, formgrid, grid, lg:col-6, lg:mt-5, lg:pl-3, lg:pr-3, mb-3, md:col-6, ml-4, mt-1, mt-2, mt-3, sm:col-12, w-full
  Occurrences: L399 [grid formgrid]; L400 [field col-12 lg:col-6 lg:pr-3]; L420 [w-full]; L444 [w-full]; L456 [mt-3 mb-3 lg:mt-5]; L457 [mt-2]; L468 [mt-1]; L475 [mt-3]; L486 [mt-1]; L512 [w-full]; L519 [mt-3]; L531 [mt-3]; L542 [mt-3]; L553 [mt-3]; L570 [ml-4 mt-2]; L580 [mt-2]; L587 [field col-12 lg:col-6 lg:pl-3]; L677 [md:col-6 sm:col-12]; L678 [field]; L699 [md:col-6 sm:col-12]; L700 [field]
- src/components/core/module/CreateModule.tsx
  Tokens: align-items-center, col-12, field, flex, flex-column, flex-wrap, formgrid, gap-1, gap-2, gap-3, grid, justify-content-between, lg:col-6, lg:pb-0, m-0, mt-2, mt-3, mt-4, pb-0, pb-3, w-full
  Occurrences: L241 [flex flex-column]; L245 [flex align-items-center gap-2]; L360 [flex align-items-center justify-content-between gap-3 flex-wrap]; L361 [flex flex-column gap-1]; L363 [m-0]; L365 [flex align-items-center gap-2]; L387 [formgrid grid mt-3]; L388 [field col-12 pb-3 lg:pb-0 lg:col-6]; L413 [field col-12 lg:col-6]; L433 [formgrid grid mt-4]; L434 [field col-12 pb-3 pb-0 lg:col-6]; L452 [field col-12 lg:col-6]; L475 [mt-4]; L476 [formgrid grid mt-3]; L477 [field col-12 pb-3 lg:pb-0 lg:col-6]; L482 [w-full]; L491 [w-full]; L499 [field col-12 lg:col-6]; L509 [mt-2]; L513 [mt-4]; L514 [flex align-items-center gap-2]; L516 [w-full flex flex-column gap-1]; L517 [flex align-items-center justify-content-between]; L528 [flex align-items-center gap-2]; L544 [flex align-items-center gap-2]; L557 [mt-2]
- src/components/core/module/ModuleListViewData.tsx
  Tokens: align-items-center, align-items-start, flex, flex-column, flex-wrap, gap-2, gap-3, justify-content-center, mb-3, mb-4, md:flex-row, mt-3, my-3, p-0, w-full
  Occurrences: L201 [p-0]; L229 [w-full]; L230 [flex gap-3 mb-4 align-items-center flex-wrap]; L245 [flex flex-column md:flex-row align-items-start gap-3 mb-3]; L250 [w-full]; L252 [flex align-items-center gap-2]; L259 [flex justify-content-center my-3]; L303 [flex justify-content-center gap-3 mt-3]; L320 [flex justify-content-center gap-3 mt-3]
- src/components/core/tree/SolidTreeTable.tsx
  Tokens: px-3
  Occurrences: L373 [px-3]
- src/components/core/tree/SolidTreeView.tsx
  Tokens: align-items-center, flex, flex-column, gap-1, gap-2, gap-3, h-full, justify-content-between, justify-content-end, lg:flex, lg:flex-row, m-0, ml-auto, px-3, py-1, w-full
  Occurrences: L1333 [w-full flex gap-3 px-3 py-1]; L1334 [flex gap-2 ml-auto]; L1349 [flex gap-2]; L1483 [flex align-items-center justify-content-end gap-1]; L1622 [flex h-full]; L1623 [h-full flex flex-column]; L1624 [flex flex-column]; L1626 [flex-column lg:flex-row]; L1627 [flex justify-content-between w-full]; L1628 [flex gap-3 align-items-center w-full]; L1629 [flex align-items-center gap-2]; L1635 [m-0]; L1639 [lg:flex]; L1652 [flex align-items-center]; L1656 [flex]; L1705 [lg:flex]; L1737 [flex]; L1951 [m-0]; L1974 [m-0]; L1997 [m-0]
- src/components/core/users/ApiKeysTab/ApiKeysTab.tsx
  Tokens: m-0
  Occurrences: L52 [m-0]; L53 [m-0]; L200 [m-0]; L201 [m-0]; L222 [m-0]; L223 [m-0]
- src/components/core/users/ApiKeysTab/GenerateApiKeyModal.tsx
  Tokens: m-0
  Occurrences: L172 [m-0]
- src/components/core/users/ApiKeysTab/RevealApiKeyModal.tsx
  Tokens: m-0, mb-2, mt-2
  Occurrences: L54 [m-0]; L59 [mb-2]; L78 [m-0 mt-2]
- src/components/core/users/CreateUser.tsx
  Tokens: align-items-center, col-12, field, flex, flex-column, flex-wrap, formgrid, gap-2, gap-3, grid, justify-content-between, m-0, md:col-6, md:p-4, mt-1, mt-3, px-4, py-3
  Occurrences: L213 [flex align-items-center justify-content-between gap-3 flex-wrap]; L214 [flex align-items-center gap-3]; L218 [m-0]; L225 [gap-3 flex flex-wrap]; L253 [px-4 py-3 md:p-4]; L348 [grid formgrid]; L349 [field col-12 md:col-6 flex flex-column gap-2]; L366 [field col-12 md:col-6 flex flex-column gap-2]; L384 [field col-12 md:col-6 flex flex-column gap-2 mt-3]; L402 [field col-12 md:col-6 flex flex-column gap-2 mt-3]; L421 [field col-12 md:col-6 flex flex-column gap-2 mt-3]; L437 [field col-12 md:col-6 flex flex-column gap-2 mt-3]; L460 [formgrid grid]; L462 [field col-12]; L464 [m-0]; L465 [m-0 mt-1]; L475 [field col-12]; L477 [m-0]; L478 [m-0 mt-1]
- src/components/core/users/CreateUserRole.tsx
  Tokens: col-12, field, flex, formgrid, gap-3, grid, justify-content-between, m-0, mb-5, md:col-6, mx-auto, sm:col-12, w-full, xl:col-10
  Occurrences: L115 [grid]; L116 [col-12 xl:col-10 mx-auto]; L121 [flex gap-3 justify-content-between mb-5]; L123 [gap-3 flex]; L130 [flex gap-3 justify-content-between mb-5]; L131 [m-0]; L132 [gap-3 flex]; L144 [grid formgrid]; L145 [md:col-6 sm:col-12]; L146 [field]; L156 [w-full]; L164 [md:col-6 sm:col-12]; L165 [field]
- src/components/core/users/UserListView.tsx
  Tokens: align-items-center, col-12, field, flex, flex-wrap, formgrid, gap-2, gap-3, grid, justify-content-center, mb-3, mb-4, md:col-3, mt-3, my-3, p-0, w-full
  Occurrences: L200 [w-full]; L201 [flex gap-3 mb-4 align-items-center flex-wrap]; L215 [grid formgrid mb-3]; L222 [field col-12 md:col-3]; L232 [field col-12 flex align-items-center gap-2]; L239 [flex justify-content-center my-3]; L292 [p-0]; L309 [flex justify-content-center gap-3 mt-3]
- src/components/layout/AdminLayout.tsx
  Tokens: mt-0
  Occurrences: L42 [mt-0]
- src/components/layout/AdminSidebar.tsx
  Tokens: mt-5, pl-4
  Occurrences: L45 [mt-5 pl-4]
- src/components/layout/CustomPagination.tsx
  Tokens: justify-content-center, mt-5
  Occurrences: L36 [justify-content-center mt-5]
- src/components/layout/FilterMenu.tsx
  Tokens: col-12, grid, lg:col-4, m-0, md:col-4
  Occurrences: L69 [grid m-0]; L71 [col-12 md:col-4 lg:col-4]; L83 [col-12 md:col-4 lg:col-4]; L95 [col-12 md:col-4 lg:col-4]
- src/components/layout/Footer.tsx
  Tokens: mt-1, pt-5, py-1
  Occurrences: L5 [py-1 pt-5]; L6 [mt-1]
- src/components/layout/ListingHeader.tsx
  Tokens: align-items-center, flex, justify-content-between, ml-2, px-5
  Occurrences: L135 [flex justify-content-between align-items-center px-5]; L138 [flex align-items-center]; L141 [ml-2]; L157 [flex align-items-center]; L176 [flex align-items-center]
- src/components/layout/Loader.tsx
  Tokens: justify-content-center
  Occurrences: L6 [justify-content-center]
- src/components/layout/navbar-one.tsx
  Tokens: align-items-center, flex, flex-column, justify-content-between, mb-3, md:flex-row, pb-3, pr-6, pt-4, px-2, px-3, py-1, w-full
  Occurrences: L71 [flex flex-column md:flex-row justify-content-between]; L120 [flex justify-content-between align-items-center pt-4 px-3 pb-3 mb-3]; L128 [px-2 py-1]; L134 [w-full]; L140 [w-full pr-6]; L172 [flex flex-column md:flex-row justify-content-between]
- src/components/layout/navbar-two-menu.tsx
  Tokens: align-items-center, flex, justify-content-between, pl-3, w-full
  Occurrences: L21 [w-full flex justify-content-between]; L22 [flex align-items-center]; L90 [w-full flex justify-content-between]; L91 [flex align-items-center]; L112 [pl-3]
- src/components/layout/UserSidebar.tsx
  Tokens: mt-5, pl-4
  Occurrences: L36 [mt-5 pl-4]
- src/routes/pages/admin/core/DashboardPage.tsx
  Tokens: w-full
  Occurrences: L671 [w-full]; L684 [w-full]; L713 [w-full]; L714 [w-full]; L743 [w-full]; L744 [w-full]
- src/routes/pages/auth/SsoPage.tsx
  Tokens: align-items-center, flex, justify-content-center
  Occurrences: L40 [flex justify-content-center align-items-center]
