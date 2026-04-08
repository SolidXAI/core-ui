# Search And Filter Hierarchy

This document describes the search and filter flow by following the React component hierarchy, starting from the view components that render data and moving down into the search/filter UI components that build predicates.

The main goal is to answer:

- where metadata is loaded
- where the search and filter UI is built
- where predicates are transformed
- where API calls happen
- where those predicates are finally applied to fetch list or kanban data

## 1. Top-Level Entry Points

The search and filter UI is not a standalone page. It is mounted inside the data views.

Primary entry points:

- [SolidListView.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx)
- [SolidKanbanView.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx)
- [SolidGlobalSearchElement.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx)

### List view path

`SolidListView` fetches the view layout + metadata first, then renders `SolidGlobalSearchElement`, and later uses the predicates coming back from it to fetch records.

Relevant metadata fetch:

- [SolidListView.tsx:305](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L305)
- [SolidListView.tsx:321](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L321)

Relevant data fetch hook:

- [SolidListView.tsx:481](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L481)

Relevant apply path:

- [SolidListView.tsx:751](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L751)
- [SolidListView.tsx:833](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L833)

### Kanban view path

`SolidKanbanView` does the same pattern, but the query shape is different because kanban groups records by a swimlane field.

Relevant metadata fetch:

- [SolidKanbanView.tsx:111](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L111)
- [SolidKanbanView.tsx:117](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L117)

Relevant data fetch hook:

- [SolidKanbanView.tsx:224](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L224)

Relevant apply path:

- [SolidKanbanView.tsx:618](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L618)

## 2. What The View Components Load First

Before the search/filter UI can work, the view components need:

- the view layout
- field metadata
- relation/media populate configuration

### In `SolidListView`

`useGetSolidViewLayoutQuery(...)` fetches the list view layout and `solidFieldsMetadata`.

- [SolidListView.tsx:321](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L321)

Then `initialFilterMethod()` walks the layout and metadata to derive:

- default filter match modes
- relation fields that must be populated
- media fields that must be populated
- default page size and sort

- [SolidListView.tsx:329](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L329)

This part is important because it defines the shape of the eventual fetch query even before the global search UI is used.

### In `SolidKanbanView`

The same concept exists in kanban:

- [SolidKanbanView.tsx:122](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L122)

`initialFilterMethod()` in kanban derives:

- default match modes
- relation/media populate arrays
- records per swimlane

## 3. Where `SolidGlobalSearchElement` Fits

`SolidGlobalSearchElement` is the central orchestration component.

- [SolidGlobalSearchElement.tsx:532](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L532)

Think of it as the shell that owns all search/filter UI state:

- text search chips
- custom filter rule tree
- saved filters
- predefined searches
- grouping and aggregation

It does not fetch list data directly. Instead, it builds a `filterPredicates` object and sends it upward through `handleApplyCustomFilter(...)`.

That callback is implemented by the parent view:

- list: [SolidListView.tsx:833](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L833)
- kanban: [SolidKanbanView.tsx:618](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L618)

## 4. State Owned By `SolidGlobalSearchElement`

The most important local states are defined here:

- `filterRules`: UI tree for the custom filter dialog
- `customFilter`: transformed custom filter object
- `searchChips`: search UI chips
- `searchFilter`: transformed search predicate
- `currentSavedFilterQuery`: saved filter predicate
- `groupingRules` and `aggregationRules`

See:

- [SolidGlobalSearchElement.tsx:602](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L602)
- [SolidGlobalSearchElement.tsx:624](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L624)
- [SolidGlobalSearchElement.tsx:639](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L639)

Important distinction:

- `filterRules` is UI state
- `customFilter` is backend-facing predicate state

That same separation also exists for search:

- `searchChips` is UI state
- `searchFilter` is backend-facing predicate state

## 5. How Searchable / Filterable Fields Are Derived

Once `viewData` is available, `SolidGlobalSearchElement` derives three lists:

- `fields`: allowed in the custom filter dialog
- `searchableFields`: allowed in the quick-search overlay
- `groupableFields`: allowed in grouping

See:

- [SolidGlobalSearchElement.tsx:884](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L884)

This block reads:

- `viewData.data.solidFieldsMetadata`
- `viewData.data.solidView.layout.children`

and maps them into UI-friendly objects:

- [SolidGlobalSearchElement.tsx:904](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L904)

Current rules worth noting:

- media fields are excluded from custom filtering
  - [SolidGlobalSearchElement.tsx:920](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L920)
- only fields marked `isSearchable` are used in quick search
  - [SolidGlobalSearchElement.tsx:932](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L932)
- relation fields are only quick-searchable if a `searchField` is configured
  - [SolidGlobalSearchElement.tsx:936](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L936)

## 6. Quick Search Flow

This is the path for typing into the search input and selecting a field-based search.

### Step 1: user types in the input

The search input lives inside `SolidGlobalSearchElement`:

- [SolidGlobalSearchElement.tsx:1823](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1823)

The input updates:

- `inputValue`
- overlay visibility
- focused option index

### Step 2: overlay options are built

The overlay mixes three kinds of options:

- searchable fields
- predefined searches
- saved filters

See:

- [SolidGlobalSearchElement.tsx:1563](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1563)

### Step 3: selected search terms become `searchChips`

When a field option is chosen, `searchChips` are appended:

- [SolidGlobalSearchElement.tsx:1592](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1592)
- [SolidGlobalSearchElement.tsx:1908](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1908)

Each chip stores:

- `columnName`
- `value`
- `searchField`
- `matchMode`

### Step 4: chips are transformed into a backend predicate

On refresh, `searchChips` are converted into a lightweight intermediate object and then into a backend filter:

- [SolidGlobalSearchElement.tsx:1099](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1099)
- [SolidGlobalSearchElement.tsx:1112](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1112)

The real search transformer is:

- [SolidGlobalSearchElement.tsx:304](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L304)

Key behavior:

- multiple search values for the same field become an `$or`
- relation search fields can be nested via `searchField`
- nested search paths are expanded with `buildNestedCondition(...)`
  - [SolidGlobalSearchElement.tsx:298](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L298)

## 7. Custom Filter Dialog Flow

This is the path for the “Add Custom Filter” dialog.

### Step 1: `SolidGlobalSearchElement` opens the dialog

The dialog renders `FilterComponent` with:

- `fields`
- `filterRules`
- `setFilterRules`
- `transformFilterRules`

See:

- [SolidGlobalSearchElement.tsx:2037](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L2037)
- [SolidGlobalSearchElement.tsx:2048](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L2048)

### Step 2: `FilterComponent` owns the rule-tree UI

`FilterComponent` renders:

- top-level group operator (`AND` / `OR`)
- one or more filter rules
- nested groups

See:

- [FilterComponent.tsx:173](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/FilterComponent.tsx#L173)

Each rule row contains:

- field picker: `SolidAutocomplete`
- operator + value area: delegated to `SolidFilterFields`

See:

- [FilterComponent.tsx:102](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/FilterComponent.tsx#L102)
- [FilterComponent.tsx:106](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/FilterComponent.tsx#L106)
- [FilterComponent.tsx:128](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/FilterComponent.tsx#L128)

### Step 3: `SolidFilterFields` dispatches by field type

Once `rule.fieldName` is set, `SolidFilterFields` chooses the correct field widget based on metadata type.

See:

- [SolidFilterFields.tsx:65](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidFilterFields.tsx#L65)

Examples:

- `shortText` -> `SolidShortTextField`
- `date` -> `SolidDateField`
- `relation` -> `SolidRelationField`
- `selectionDynamic` -> `SolidSelectionDynamicField`

### Step 4: field widget chooses operator and value widget

The field widget decides:

- which operators are legal
- how many inputs are needed
- what value widget to render

That “how many inputs” logic lives in:

- [SolidFilterFields.tsx:38](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidFilterFields.tsx#L38)

This function drives:

- `0` inputs for `$null` / `$notNull`
- `1` input for simple operators
- `2` inputs for `$between`
- `null` for variable / multi-value operators like `$in` / `$notIn`

### Step 5: `SolidVarInputsFilterElement` renders the value control

This component is the shared value-input renderer.

- [SolidVarInputsFilterElement.tsx:41](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidVarInputsFilterElement.tsx#L41)

It decides whether to render:

- text input
- numeric input
- date/time input
- autocomplete-based relation picker
- autocomplete-based selection picker
- multi-autocomplete for `$in` / `$notIn`

The autocomplete-based input types are listed here:

- [SolidVarInputsFilterElement.tsx:56](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidVarInputsFilterElement.tsx#L56)

And the multi-autocomplete branch is here:

- [SolidVarInputsFilterElement.tsx:239](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidVarInputsFilterElement.tsx#L239)

## 8. Where Filter Widget API Calls Happen

Most field widgets are local-only. The API calls happen in the widgets that need remote suggestions.

### Selection dynamic

This widget fetches allowed values from the field API:

- [SolidSelectionDynamicFilterElement.tsx:3](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidSelectionDynamicFilterElement.tsx#L3)
- [SolidSelectionDynamicFilterElement.tsx:11](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidSelectionDynamicFilterElement.tsx#L11)
- [SolidSelectionDynamicFilterElement.tsx:28](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidSelectionDynamicFilterElement.tsx#L28)

API call purpose:

- fetch dynamic selection options for a field by `fieldId` and current search text

### Many-to-one relation

This widget fetches related entities from the relation model:

- [SolidManyToOneFilterElement.tsx:2](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToOneFilterElement.tsx#L2)
- [SolidManyToOneFilterElement.tsx:10](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToOneFilterElement.tsx#L10)
- [SolidManyToOneFilterElement.tsx:33](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToOneFilterElement.tsx#L33)

API call purpose:

- fetch candidate related records using the related model’s `userKeyField`

### One-to-many relation

- [SolidOneToManyFilterElement.tsx:3](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidOneToManyFilterElement.tsx#L3)
- [SolidOneToManyFilterElement.tsx:16](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidOneToManyFilterElement.tsx#L16)
- [SolidOneToManyFilterElement.tsx:34](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidOneToManyFilterElement.tsx#L34)

### Many-to-many relation

- [SolidManyToManyFilterElement.tsx:3](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToManyFilterElement.tsx#L3)
- [SolidManyToManyFilterElement.tsx:16](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToManyFilterElement.tsx#L16)
- [SolidManyToManyFilterElement.tsx:34](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidManyToManyFilterElement.tsx#L34)

### Selection static

This one is local-only. It does not call an API.

- [SolidSelectionStaticFilterElement.tsx:5](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidSelectionStaticFilterElement.tsx#L5)

It derives suggestions directly from `fieldMetadata.selectionStaticValues`.

## 9. Transforming Rule Trees Into Backend Filters

The central transform function is:

- [SolidGlobalSearchElement.tsx:169](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L169)

This walks the rule tree and converts it into backend predicates.

Important behavior:

- UI group operator `or` becomes `$or`
- UI group operator `and` becomes `$and`
- scalar rules become `{ fieldName: { operator: value } }`
- relation rules may become `{ fieldName: { id: { operator: value } } }`

This relation special-case is why many relation filters use selected objects and then map to ids during transformation.

The reverse transform also exists:

- [SolidGlobalSearchElement.tsx:74](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L74)

That path is used when:

- restoring custom filters from local storage
- opening a saved filter for editing

For relation-backed rules, hydration also happens before showing them again in the UI:

- [SolidGlobalSearchElement.tsx:816](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L816)
- [SolidGlobalSearchElement.tsx:1169](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1169)

## 10. Merging Search, Custom, Saved, And Predefined Filters

`SolidGlobalSearchElement` keeps the filter modes separate until the last step.

The merge helper is:

- [SolidGlobalSearchElement.tsx:386](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L386)

It produces a container object like:

```ts
{
  custom_filter_predicate,
  search_predicate,
  saved_filter_predicate,
  predefined_search_predicate,
  grouping_rules,
  aggregation_rules
}
```

That merged object is what gets handed back to the parent via:

- [SolidGlobalSearchElement.tsx:1119](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1119)

## 11. Where Saved Filter API Calls Happen

`SolidGlobalSearchElement` also owns saved-filter CRUD.

It creates a dedicated entity API for the `savedFilters` model:

- [SolidGlobalSearchElement.tsx:677](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L677)

### Read saved filters

Saved filters are loaded with:

- [SolidGlobalSearchElement.tsx:701](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L701)
- [SolidGlobalSearchElement.tsx:707](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L707)

API call purpose:

- fetch saved filters for the current model, view, and user

### Create saved filter

- [SolidGlobalSearchElement.tsx:1229](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1229)

### Update saved filter

- [SolidGlobalSearchElement.tsx:1203](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1203)

### Delete saved filter

- [SolidGlobalSearchElement.tsx:1183](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx#L1183)

## 12. How Predicates Are Finally Applied In List View

Once `SolidGlobalSearchElement` calls `handleApplyCustomFilter(...)`, `SolidListView` combines the predicate buckets into a single Strapi-style filter tree.

See:

- [SolidListView.tsx:833](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L833)

This code pushes each active predicate into:

```ts
{ $and: [...] }
```

Then the actual list fetch is assembled in `setQueryString()`:

- [SolidListView.tsx:751](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L751)

This query includes:

- `offset`
- `limit`
- `filters`
- `populate`
- `populateMedia`
- `locale`
- `sort`

### API call boundary

The list data request is fired here:

- [SolidListView.tsx:829](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L829)

That is the final “apply filters” boundary for list view.

### Persistence boundary

If `persistFilter` is true, the filter metadata is stored in local storage before the fetch:

- [SolidListView.tsx:820](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx#L820)

## 13. How Predicates Are Finally Applied In Kanban View

Kanban follows the same parent callback pattern, but the final request shape is grouped.

See:

- [SolidKanbanView.tsx:618](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L618)

`handleApplyCustomFilter(...)` builds:

- a top-level grouped query
- `groupBy`
- `populateGroup: true`
- a nested `groupFilter` object containing the actual record filters

### API call boundary

The final grouped entity request is fired here:

- [SolidKanbanView.tsx:690](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L690)

### Persistence boundary

Kanban persists the active filter buckets to local storage here:

- [SolidKanbanView.tsx:675](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx#L675)

## 14. Practical Mental Model

If you want to understand this system quickly, the easiest mental model is:

1. `SolidListView` / `SolidKanbanView` loads view metadata.
2. `SolidGlobalSearchElement` turns that metadata into searchable/filterable field lists.
3. Quick search creates `searchChips`, then `search_predicate`.
4. Custom filter dialog creates `filterRules`, then `custom_filter_predicate`.
5. Saved filters and predefined searches contribute their own predicate buckets.
6. `SolidGlobalSearchElement` merges those buckets.
7. Parent view converts them into the final fetch query.
8. RTK Query call fetches records with those filters applied.

## 15. Files To Read In Order

If you are debugging or extending this flow, read the files in this order:

1. [SolidListView.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/list/SolidListView.tsx)
2. [SolidKanbanView.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/kanban/SolidKanbanView.tsx)
3. [SolidGlobalSearchElement.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/SolidGlobalSearchElement.tsx)
4. [FilterComponent.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/common/FilterComponent.tsx)
5. [SolidFilterFields.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidFilterFields.tsx)
6. [SolidVarInputsFilterElement.tsx](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter/SolidVarInputsFilterElement.tsx)
7. relation / selection filter widgets in [src/components/core/filter](/Users/harishpatel/Code/javascript/solid-core-ui/src/components/core/filter)

## 16. Summary Of API Calls

Metadata reads:

- `useGetSolidViewLayoutQuery(...)` in list view
- `useGetSolidViewLayoutQuery(...)` in kanban view

Saved filter reads/writes:

- `useLazyGetSolidEntitiesQuery()` for saved filters
- `useCreateSolidEntityMutation()`
- `useUpdateSolidEntityMutation()`
- `useDeleteSolidEntityMutation()`

Runtime filter value lookups:

- `useLazyGetSelectionDynamicValuesQuery()` for dynamic selections
- `createSolidEntityApi(...).useLazyGetSolidEntitiesQuery()` for relation autocomplete widgets

Applying filters to data:

- list data fetch via `triggerGetSolidEntities(queryString)` in `SolidListView`
- kanban grouped data fetch via `triggerGetSolidEntities(queryString)` in `SolidKanbanView`
