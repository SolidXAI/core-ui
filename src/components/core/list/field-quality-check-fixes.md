# Field Quality Checks And Fixes

This checklist tracks list and tree rendering issues and logical enhancements for each field type in `solid-core-ui`.

Use it for frontend concerns only:

- list and tree column behavior
- list widgets and render modes
- filtering and scanability UX
- visual density, truncation, and discoverability

Backend validation, persistence, and query concerns belong in `solid-core-module`.

## `shortText`

- [ ] Decide whether truncation should remain layout-level only through `truncateAfter`, or whether `shortText` columns should also support a per-column override.
- [ ] If per-column truncation is needed, add a field-node level attr that can override the layout default without changing the existing behavior for other columns.
- [ ] Review whether default text columns should support an explicit no-truncate mode when the list layout uses `truncateAfter`.
- [ ] Consider richer alternative widgets for identifier-heavy fields such as copyable text, badge or chip rendering, link-style rendering, or compact monospace output.
- [ ] Review whether `SolidShortTextAvatarWidget` should remain a general text widget that can also render object-shaped values, or whether that behavior should move to relation-oriented widgets only.
- [ ] Add a real-world example and a stricter rendering contract for `SolidShortTextAvatarWidget` so its intended usage is unambiguous.
- [ ] Improve `SolidShortTextFieldImageListWidget` with safe empty-state handling, broken-image fallbacks, and optional size configuration.
- [ ] Consider optional widget attrs for avatar and image-based widgets such as size, shape, fallback text, or tooltip behavior.
- [ ] Review whether masked list rendering should support a configurable mask style for high-sensitivity versus low-sensitivity secrets.

## `longText`

- [ ] Decide whether `longText` should continue to reuse the shared text-column path or receive a dedicated long-text column renderer.
- [ ] Review whether list rendering should support an expanded preview mode instead of only relying on truncation and tooltip behavior.
- [ ] If list previews are important, consider a dedicated widget for excerpt-style rendering with configurable line or character limits.
- [ ] Review whether `truncateAfter` is sufficient for multiline content or whether `longText` columns need field-node level overrides.
- [ ] Consider a dedicated read-more or modal-preview widget for verbose administrative notes and descriptions.
- [ ] Add focused coverage for how multiline text is flattened or displayed inside list and tree cells.

## `richText`

- [ ] Decide whether `richText` should continue to reuse the shared text-column path or receive a dedicated rich-text list renderer.
- [ ] Review whether list rendering should strip HTML more explicitly before truncation and search presentation.
- [ ] Consider a dedicated excerpt widget that converts rich text to clean plain text for list and tree readability.
- [ ] Review whether tooltip behavior is sufficient when rich-text content contains markup, links, or long structured blocks.
- [ ] Add focused coverage for how formatted content is flattened or displayed inside list and tree cells.

## `json`

- [ ] Add an explicit core list-column path for `json`, since JSON fields are not currently wired into list dispatch.
- [ ] Decide what the default list rendering strategy should be for JSON values: raw string, compact preview, key summary, or expandable inspector.
- [ ] Consider a dedicated widget for compact JSON previews with truncation and pretty-print affordances.
- [ ] Review whether JSON fields should participate in list search and filtering by default or require more deliberate configuration.
- [ ] Add focused coverage for how JSON fields behave when they are included in list metadata before a dedicated renderer exists.

## `int`

- [ ] Review whether `int` should continue to render through `DefaultTextListWidget`, or whether a dedicated numeric list widget would make formatting and numeric semantics clearer.
- [ ] Consider per-column numeric formatting options such as thousand separators, compact notation, or score-style emphasis without requiring a custom widget.
- [ ] Review whether integer columns should support a clearer separation between exact numeric filtering and text-style global search behavior.
- [ ] Add focused coverage for sorting, filtering, zero values, negative values, and tree-view reuse of the shared numeric column path.


## `bigint`

- [ ] Review whether `bigint` should continue to reuse the `int` list-column path, especially when values may exceed JavaScript safe-integer handling or need exact display fidelity.
- [ ] Consider a dedicated bigint renderer that preserves large values reliably and supports copy-friendly presentation for legacy IDs and external request keys.
- [ ] Review whether global search and filter behavior for bigint fields should be more deliberate, since large identifiers are often looked up exactly rather than searched fuzzily.
- [ ] Add focused coverage for very large values, sorting behavior, truncation, and tree-view reuse of the shared numeric column path.


## `decimal`

- [ ] Review whether `decimal` should continue to render through `DefaultTextListWidget`, or whether a dedicated numeric renderer should own precision-aware display.
- [ ] Consider per-column decimal formatting options such as fixed precision, compact display, currency-style rendering, or percentage-style rendering.
- [ ] Review whether decimal fields need clearer behavior for sorting and filtering when stored values arrive as numbers in some flows and strings in others.
- [ ] Add focused coverage for fractional values, zero values, sorting, filtering, and tree-view reuse of the shared numeric column path.


## `boolean`

- [ ] Fix the default boolean list widget so it always reads the row value by field name rather than falling back to the column label, which can break rendering when `label` is customized.
- [ ] Review whether `boolean` columns should support richer visual states such as badges, chips, icons, or colored status pills in addition to plain text.
- [ ] Consider whether per-column boolean styling should support explicit positive and negative tone configuration without requiring a custom widget.
- [ ] Review whether `trueLabel` and `falseLabel` should also influence filtering affordances or only the rendered cell output.
- [ ] Add focused test coverage for label overrides, empty values, nullable booleans, and tree-view reuse of the default boolean list widget.

## `date`

- [ ] Review whether `date` should continue to rely on the single default list widget or support a richer set of date-oriented render modes such as relative time, calendar badges, or status-style date indicators.
- [ ] Clarify the ownership of the `format` attr, because list formatting is currently layout-driven while form view formatting can be field-node driven.
- [ ] Consider whether date columns should support per-column format overrides without requiring a layout-wide date format.
- [ ] Add focused coverage for empty dates, invalid incoming values, sorting behavior, and tree-view reuse of the default date renderer.

## `datetime`

- [ ] Review whether `datetime` should continue to rely on the single default list widget or support richer render modes such as relative time, age indicators, or event-state styling.
- [ ] Clarify the ownership of the `format` attr, because list formatting is currently layout-driven while form view formatting can be field-node driven.
- [ ] Consider whether datetime columns should support per-column format overrides without requiring a layout-wide datetime format.
- [ ] Add focused coverage for empty datetimes, invalid incoming values, sorting behavior, and tree-view reuse of the default datetime renderer.

## `time`

- [ ] Review whether the shared text-column path is sufficient for `time`, or whether this field type should have a dedicated list widget that formats time-only values consistently.
- [ ] Clarify how `format` should behave for time fields in list and tree views, since the current list path does not use a dedicated time renderer.
- [ ] Consider whether schedule-heavy screens would benefit from compact time badges, range rendering, or more explicit time-only display modes.
- [ ] Add focused coverage for truncation, time-only formatting, invalid incoming values, and tree-view reuse of the current time renderer.

## `email`

- [ ] Review whether the shared text-column path is sufficient for `email`, or whether this field type should have a dedicated list widget for mailto links, copy actions, or privacy-aware masking.
- [ ] Consider whether long email addresses need a field-node level truncation override beyond the existing layout-wide `truncateAfter` behavior.
- [ ] Review whether searchable email columns should expose more deliberate affordances for exact lookup versus partial text search.
- [ ] Add focused coverage for truncation, null values, long addresses, and tree-view reuse of the shared email renderer.

## `password`

- [ ] Decide whether password fields should be blocked more explicitly from ordinary list and tree rendering rather than simply lacking a core renderer.
- [ ] Review whether metadata-driven lists should surface a clearer error or omit the field automatically when a password field is configured in a list layout.
- [ ] Add focused coverage for how unsupported password list rendering should behave so accidental exposure risks are easier to catch.

## `selectionStatic`

- [ ] Review whether the shared text-column path is sufficient for `selectionStatic`, or whether this field type should have a dedicated list widget that makes the label-mapping contract more explicit.
- [ ] Fix or clarify multi-select list rendering, because the current shared mapping logic looks reliable for scalar values but fragile for JSON-stringified multi-select values.
- [ ] Consider richer list presentations for status-style selection fields such as badges, chips, color-coded pills, or icon-assisted labels.
- [ ] Decide whether per-column styling for selection-like fields should be configurable without requiring a custom widget.
- [ ] Add focused coverage for single-select label mapping, multi-select display, truncation behavior, and tree-view reuse of the shared renderer.

## `selectionDynamic`

- [ ] Review whether the shared text-column path is sufficient for `selectionDynamic`, because core list rendering currently shows the row value directly and does not perform provider-backed label resolution at render time.
- [ ] Consider whether provider-backed fields need a dedicated list widget that can render resolved labels, chips, or badges more explicitly.
- [ ] Review how multi-select dynamic values should appear in list and tree cells when the stored value is an array or a JSON-stringified array.
- [ ] Add focused coverage for single-select rendering, multi-select rendering, truncation behavior, and provider-backed values that arrive in object-shaped forms.

## `many-to-one`

- [ ] Review whether the default relation column should continue opening the related record from the cell, or whether that behavior should be configurable per column for denser operational lists.
- [ ] Clarify how `disabled` should affect rendering, because it currently changes both interactivity and the user’s expectation of whether the cell is navigable.
- [ ] Consider whether `many-to-one` columns should support richer visual modes such as link-plus-subtitle, avatar-plus-label, or badge-style rendering without requiring custom widgets.
- [ ] Review whether `coModelFieldToDisplay` should support safer fallbacks when the configured related field is missing from the loaded relation payload.
- [ ] Add focused coverage for interactive versus disabled cells, missing related records, search-oriented relation columns, and tree-view reuse of the default renderer.

## `one-to-many`

- [ ] Review whether showing only the first related label plus `+N` is sufficient for collection-heavy screens, or whether a dedicated summary widget should support configurable previews.
- [ ] Consider whether one-to-many columns should support a popover, dialog, or tooltip preview of the first few related records for faster scanning.
- [ ] Clarify how `coModelFieldToDisplay` should behave when child records are partially loaded or when the configured display field is absent.
- [ ] Review whether long child labels or large child collections need better truncation and overflow behavior than the current compact summary path.
- [ ] Add focused coverage for empty collections, one-item collections, larger collections, missing child labels, and tree-view reuse of the default renderer.

## `many-to-many`

- [ ] Review whether the default membership summary should support richer previews for tag-heavy or user-heavy relationships instead of always showing one label plus `+N`.
- [ ] Consider whether many-to-many columns should support chip- or badge-based rendering for small membership sets without requiring a custom widget.
- [ ] Clarify how `coModelFieldToDisplay` should behave when relation payloads are partial, sparse, or missing the configured display field.
- [ ] Review whether the avatar widget should support configurable preview count, tooltip behavior, or overflow presentation for larger relation sets.
- [ ] Add focused coverage for empty memberships, one-item memberships, larger memberships, avatar rendering, and tree-view reuse of the default renderer.

## `mediaSingle`

- [ ] Review whether the default single-media column should support configurable preview size so media-heavy lists can trade density for visual clarity.
- [ ] Consider whether non-image files should show richer metadata such as file extension or download hint instead of only icon-driven rendering.
- [ ] Review whether lightbox and download behavior should be more explicit in the cell UI so users can predict what clicking the preview will do.
- [ ] Consider whether broken preview URLs and missing media payloads should degrade to a clearer empty or error state.
- [ ] Add focused coverage for image, video, audio, and document rendering, missing media payloads, and tree-view reuse of the default renderer.

## `mediaMultiple`

- [ ] Review whether the first-item-plus-count summary is sufficient for document-heavy attachment sets, or whether a non-gallery list preview is needed.
- [ ] Consider whether multi-media columns should support configurable preview count or a more deliberate overflow affordance for large collections.
- [ ] Review whether clicking the cell should behave differently for image-led collections versus document-led collections so the interaction stays predictable.
- [ ] Consider whether the `+N` badge should expose a hover or dialog preview of the remaining attachments for quicker scanning.
- [ ] Add focused coverage for mixed media collections, image-led collections, document-led collections, empty collections, and tree-view reuse of the default renderer.

## `computed`

- [ ] Review whether delegating entirely by `computedFieldValueType` is sufficient, or whether computed fields need a dedicated list wrapper for consistent affordances and styling.
- [ ] Consider whether computed identifier-style fields should support copyable or badge-style rendering without forcing every screen to treat them as generic text.
- [ ] Review whether computed numeric and date values should inherit all formatting options from their delegated scalar renderers or support computed-specific overrides.
- [ ] Clarify what should happen when `computedFieldValueType` is unsupported, missing, or mismatched with the actual stored value shape.
- [ ] Add focused coverage for text, int, decimal, boolean, date, and datetime computed values, unsupported value types, and tree-view reuse of delegated rendering.
