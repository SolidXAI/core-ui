# Field Quality Checks And Fixes

This checklist tracks form-layer issues and logical enhancements for each field type in `solid-core-ui`.

Use it for frontend concerns only:

- field input behavior
- view and edit widget quality
- accessibility and UX improvements
- widget expansion opportunities

Backend validation, persistence, and query concerns belong in `solid-core-module`.

## `shortText`

- [ ] Review whether the form layer should expose any UX around `length`, or whether `max` should remain the only user-facing length contract for `shortText`.
- [ ] Add optional character count or remaining-character feedback when `max` is configured.
- [ ] Consider optional `inputMode`, `autoCapitalize`, `spellCheck`, and related text-input attrs for better mobile and browser ergonomics.
- [ ] Consider additional alternative edit widgets for common short-text patterns such as phone-like input, code input, formatted identifiers, or pattern-guided entry.
- [ ] Consider alternative view widgets for identifier-heavy fields such as copyable text, badge-style rendering, or compact monospace display.
- [ ] Review whether the default `shortText` edit widget should support lightweight prefix or suffix adornments for business identifiers and codes.
- [ ] Add focused test coverage for `isPrimaryKey`, `readonly`, and `disabled` interactions in the default edit widget.
- [ ] Review whether the masked edit widget should support an explicit reveal policy beyond the current password-toggle behavior.

## `longText`

- [ ] Review whether `longText` should have a dedicated default view widget instead of reusing the shared short-text read-only renderer.
- [ ] Add optional character count or remaining-character feedback when `min` or `max` is configured.
- [ ] Review whether the default textarea should support configurable row count or autoresize behavior.
- [ ] Improve the JSON editor widgets with stronger empty-state handling and clearer recovery when the stored value is not valid JSON.
- [ ] Review whether the JSON editor widgets should support richer schema-driven field labels, helper text, and validation messaging.
- [ ] Consider whether the code editor path should also have a dedicated view widget for read-only syntax-highlighted display.
- [ ] Review whether `editorLanguage` should be validated or normalized to a known set of supported editor modes.
- [ ] Add focused test coverage for default multiline behavior, JSON editor schema requirements, and code editor field updates.

## `richText`

- [ ] Review whether the editor should expose configurable toolbar presets so simple and advanced rich-text fields can use different authoring experiences.
- [ ] Consider optional layout-level attrs for editor height, placeholder text, and toolbar density.
- [ ] Review whether the default view widget should sanitize or normalize rendered HTML more explicitly before injecting it into the DOM.
- [ ] Add optional plain-text preview or source-view behavior for admin-heavy use cases.
- [ ] Add focused test coverage for read-only behavior, disabled behavior, empty rich-text values, and HTML rendering in view mode.

## `json`

- [ ] Improve form validation so invalid JSON can be surfaced earlier in the editor experience instead of relying primarily on backend validation.
- [ ] Review whether the default JSON editor should support optional schema-aware assistance, formatting, or validation hints.
- [ ] Consider optional layout-level attrs for editor height, font size, read-only formatting, and collapsed/expanded presentation.
- [ ] Review whether the default view widget should support a more compact preview mode for small JSON payloads.
- [ ] Add focused test coverage for empty values, object values, stringified JSON values, invalid JSON, and read-only rendering.

## `int`

- [ ] Fix the current `0`-value handling in the default integer widget, because the component currently feeds `formik.values[fieldName] || ''` into the input and can blur the distinction between `0` and an empty value.
- [ ] Review whether the default integer input should support stronger mobile ergonomics such as `inputMode`, step configuration, and clearer invalid-value feedback.
- [ ] Consider whether integer fields should support optional thousand-separator formatting in read-only mode without affecting the submitted value.
- [ ] Review whether the slider widget should require authored `min` and `max` values instead of silently falling back to its internal default range.
- [ ] Consider whether the slider widget should expose optional helper text, tick labels, or visible min/max markers for bounded scoring use cases.
- [ ] Add focused test coverage for integer defaults, `0` values, min/max validation, slider behavior, and read-only and disabled states.


## `bigint`

- [ ] Review whether reusing the ordinary integer widget is sufficient for `bigint`, especially when values may exceed JavaScript safe-integer boundaries.
- [ ] Decide whether bigint fields should use a text-backed input mode, a stricter parser, or a dedicated widget to avoid precision loss in the browser.
- [ ] Clarify how default values and existing values should be surfaced in forms when the stored value is serialized as a string.
- [ ] Review whether bigint fields need clearer read-only formatting or copy-friendly presentation for large identifiers.
- [ ] Add focused test coverage for large numeric strings, large persisted values, read-only and disabled behavior, and transitions between string, number, and bigint-like inputs.


## `decimal`

- [ ] Fix the current submit-path handling for `0`, because `updateFormData()` only appends the decimal field when the value is truthy and can therefore drop valid zero values.
- [ ] Review whether the default decimal widget should expose step, scale, and decimal-place guidance more explicitly for amount-oriented fields.
- [ ] Consider optional form-level support for currency-like prefixes, suffixes, and localized decimal formatting while preserving the raw submitted value.
- [ ] Review whether the current `0`-value display path should be hardened in the same way as the integer widget so empty and zero states remain distinct.
- [ ] Add focused test coverage for decimal defaults, zero values, min/max validation, fractional input, and read-only and disabled states.


## `boolean`

- [ ] Standardize the runtime value shape across boolean form widgets so checkbox, switch, segmented control, and view mode all work with the same boolean contract instead of mixing booleans with `"true"` and `"false"` strings.
- [ ] Review whether the default edit path should remain the checkbox-style widget or move to the segmented control for consistency with the dedicated boolean labels supported by `trueLabel` and `falseLabel`.
- [ ] Decide whether `checkboxLabel`, `trueLabel`, and `falseLabel` should be documented and validated more explicitly so misapplied attrs are easier to catch.
- [ ] Review whether the switch widget should avoid direct Formik state mutation and use a cleaner update path that preserves validation semantics.
- [ ] Consider whether the switch widget should support explicit on/off labels, helper text, or inline state text for more accessible binary controls.
- [ ] Add focused test coverage for required booleans, default value initialization, read-only and disabled behavior, and the value transitions across all supported boolean widgets.
- [ ] Review whether unsupported widget combinations, such as assigning an edit-only boolean widget to `viewWidget`, should fail more visibly in metadata-driven forms.

## `date`

- [ ] Review whether the default date field should support clearer placeholder, helper-text, and invalid-value states when incoming data cannot be parsed cleanly into a date.
- [ ] Consider whether date fields should support explicit min-date and max-date constraints at the form layer.
- [ ] Review whether the field-node `format` attr should remain view-only or be reflected more consistently across edit, list, and view experiences.
- [ ] Consider whether the default date picker should expose richer locale and calendar configuration where business use cases require it.
- [ ] Add focused test coverage for default values, null handling, ISO-string initialization, read-only and disabled behavior, and invalid incoming date values.

## `datetime`

- [ ] Review whether the default datetime field should support clearer timezone guidance so users understand how stored values and displayed values relate.
- [ ] Consider whether datetime fields should support explicit min-date and max-date constraints at the form layer.
- [ ] Review whether the field-node `format` attr should remain view-only or be reflected more consistently across edit, list, and view experiences.
- [ ] Consider whether the default datetime picker should expose richer timezone, locale, and stepping controls for minute-level precision.
- [ ] Add focused test coverage for default values, null handling, ISO-string initialization, UTC/local conversion behavior, read-only and disabled behavior, and invalid incoming datetime values.

## `time`

- [ ] Review whether the default time picker should support clearer placeholder, helper-text, and invalid-value states when incoming data cannot be parsed cleanly into a time value.
- [ ] Consider whether time fields should support stepping, min-time, and max-time constraints at the form layer.
- [ ] Clarify the role of the `format` attr for time fields so edit, list, and view experiences do not drift apart.
- [ ] Review whether the current form submission path should emit a pure time value instead of a date-bearing ISO timestamp for time-only fields.
- [ ] Add focused test coverage for `HH:mm:ss` strings, timestamp-like strings, default values, read-only and disabled behavior, and invalid incoming time values.

## `email`

- [ ] Add a dedicated email-aware form validation rule so the form layer does not rely primarily on authored regex patterns for email-shape validation.
- [ ] Review whether the default email input should support stronger mobile ergonomics such as optional `inputMode` or email-specific helper affordances.
- [ ] Consider whether the email field should support lightweight view enhancements such as copy-to-clipboard or mailto-style rendering without requiring a custom widget.
- [ ] Review whether `autoComplete` defaults are appropriate for sensitive admin flows versus high-convenience data-entry flows.
- [ ] Add focused test coverage for default values, max-length handling, regex overrides, read-only and disabled behavior, and invalid email input in the generated form layer.

## `password`

- [ ] Review whether the password create and edit flows should share more validation logic so create-form behavior and change-password modal behavior remain consistent.
- [ ] Consider whether the view widget should remain available by default, since even masked reveal behavior for password-like fields may need stricter usage guidance.
- [ ] Review whether password-strength feedback should be surfaced more clearly in the create widget when `min`, `max`, or regex strength rules are configured.
- [ ] Clarify whether custom `createWidget`, `editWidget`, and `viewWidget` overrides are intended as a stable extension surface for password fields.
- [ ] Add focused test coverage for create flows, update flows, confirm-password matching, read-only and disabled behavior, and empty-value behavior on existing records.

## `selectionStatic`

- [ ] Standardize the runtime value shape for `selectionStatic` across single-select and multi-select flows so autocomplete, radio, select-button, view mode, and form submission all work from one clear value contract.
- [ ] Review whether form validation should honor `selectionValueType` more explicitly, because the current validation schema is string-oriented even though the backend also supports `int`.
- [ ] Consider whether the default autocomplete widget should support searching by visible label as well as by stored value token.
- [ ] Decide whether `multiSelect` should remain a layout-level override, a field-level concern, or both, and document the precedence clearly in code and docs.
- [ ] Review whether the default autocomplete widget should expose a clearer empty state, placeholder support, and optional helper text for larger option sets.
- [ ] Add focused test coverage for default values, multi-select initialization, string versus numeric selection values, and read-only and disabled behavior.
- [ ] Review whether unsupported widget combinations, such as using radio or select-button renderers with multi-select enabled, should fail more visibly in metadata-driven forms.

## `selectionDynamic`

- [ ] Standardize the runtime value shape for `selectionDynamic` across single-select and multi-select flows so autocomplete, view mode, and form submission all work from one clear provider-backed value contract.
- [ ] Review whether form validation should honor `selectionValueType` more explicitly, because the current form schema is string-shaped even though the backend also supports `int`.
- [ ] Review whether `defaultValue` should be supported explicitly for dynamic selections, because current form initialization is primarily data-driven rather than default-driven.
- [ ] Clarify the purpose and precedence of layout-level `whereClause` filtering for the default widget and document how it interacts with provider context.
- [ ] Consider whether the default autocomplete widget should support clearer loading, empty, and provider-error states for slow or unavailable providers.
- [ ] Add focused test coverage for multi-select initialization, JSON-stringified arrays, provider-backed default display, and read-only and disabled behavior.

## `many-to-one`

- [ ] Review whether the default autocomplete widget should expose clearer empty, loading, and provider-error states when relation options are slow to resolve or heavily filtered.
- [ ] Clarify the contract for `coModelFieldToDisplay`, because it is important to default rendering but currently easy to author inconsistently across relation fields.
- [ ] Review whether `whereClause` and `autocompleteMatchMode` should be validated more visibly at the form layer when authored metadata is malformed.
- [ ] Consider whether inline-create flows should support a clearer success path, especially when `inlineCreateAutoSave` is enabled and the selected relation is injected automatically.
- [ ] Review whether the pseudo-relation widget should remain an edit-widget-only extension surface or receive tighter guardrails so it is not mistaken for an ordinary relation field.
- [ ] Add focused test coverage for id-backed selection, user-key-backed selection display, inline create flows, readonly and disabled behavior, and avatar-style view rendering.

## `one-to-many`

- [ ] Review whether the default embedded collection manager should surface clearer empty states and collection-level helper text when no child records exist yet.
- [ ] Clarify how `inlineListLayout`, `inlineCreateLayout`, and `inlineCreateAutoSave` should behave together so embedded child workflows are easier to reason about.
- [ ] Consider whether the default widget should support stronger guardrails around accidental destructive actions such as deleting child rows from within the parent form.
- [ ] Review whether the pseudo one-to-many widget should expose more deliberate pagination, sorting, or row-count limits for large child collections.
- [ ] Consider whether embedded child forms should support clearer validation summaries when multiple child rows fail validation at once.
- [ ] Add focused test coverage for inline create, inline edit, inline delete, readonly and disabled behavior, custom inline layouts, and empty collection rendering.

## `many-to-many`

- [ ] Review whether the default autocomplete widget is the right primary experience for large relation sets, or whether list-style editing should be preferred more often for discoverability.
- [ ] Clarify how `inlineCreate`, `inlineListLayout`, `inlineCreateLayout`, and `inlineCreateAutoSave` should behave across the autocomplete, checkbox, and list-style widgets.
- [ ] Review whether the checkbox widget should fail more visibly when the option set is too large for a comfortable checkbox matrix.
- [ ] Consider whether the list-style widget should also have a dedicated read-only view widget instead of reusing an edit-oriented component name in view mode.
- [ ] Review whether relation membership changes should be surfaced more explicitly in the UI, such as showing added and removed items before save.
- [ ] Add focused test coverage for autocomplete selection, checkbox selection, list-style editing, readonly and disabled behavior, inline create flows, and large option sets.

## `mediaSingle`

- [ ] Review whether the single-file upload widget should surface clearer guidance when the authored field only allows a subset of media types such as `image` or `file`.
- [ ] Consider whether the edit widget should show stronger error recovery for failed uploads, unsupported media types, or oversized files.
- [ ] Review whether the preview surface should support a more consistent fallback for documents, archives, and unknown file extensions.
- [ ] Consider optional view-level enhancements such as caption support, file metadata display, or explicit replace/remove affordances for admin workflows.
- [ ] Review whether readonly and disabled states should differ more clearly, especially when existing media is present but upload actions are not allowed.
- [ ] Add focused test coverage for image, video, audio, and document uploads; replace and delete flows; readonly and disabled behavior; and empty-state rendering.

## `mediaMultiple`

- [ ] Review whether the multi-file widget should expose clearer per-file status feedback during upload, especially when several files are being added in one action.
- [ ] Consider whether the gallery-style preview should support better ordering controls when the business meaning of attachment sequence matters.
- [ ] Review whether document-heavy collections need a clearer non-gallery presentation so the widget is not overly image-centric.
- [ ] Consider whether the form widget should support configurable limits on visible preview items before collapsing into a summary state.
- [ ] Review whether removing a single file from a larger collection should provide clearer confirmation or undo behavior for high-value attachment flows.
- [ ] Add focused test coverage for mixed media collections, repeated uploads, delete flows, readonly and disabled behavior, and empty-state rendering.

## `computed`

- [ ] Review whether computed fields should display a clearer explanatory hint in edit mode so users understand why the field is visible but not editable.
- [ ] Consider whether create flows should support an optional placeholder state for computed fields that only appear after the first save.
- [ ] Review whether the built-in computed renderer should support richer read-only presentation for numeric, date, and boolean computed values instead of always behaving like plain text.
- [ ] Consider whether `showLabel`, helper text, and tooltip behavior should differ for computed fields so generated values are easier to interpret.
- [ ] Review whether custom edit or view widget overrides for computed fields should be supported explicitly or discouraged more visibly.
- [ ] Add focused test coverage for create-mode hiding, edit-mode read-only rendering, existing-value display, null computed values, and widget override behavior.
