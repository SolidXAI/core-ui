import React, { useMemo } from "react";
import { GroupableField } from "./SolidGlobalSearchElement";
import { SolidAutocomplete } from "../../shad-cn-ui/SolidAutocomplete";
import { SolidSelect } from "../../shad-cn-ui/SolidSelect";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidIcon } from "../../shad-cn-ui/SolidIcon";
import { Plus } from "lucide-react";

const groupedDateOptions = [
  {
    label: "Year",
    items: [
      { label: "Year (YYYY)", value: "YYYY" }
    ]
  },
  {
    label: "Month",
    items: [
      { label: "Month (MMM)", value: "MMM" },
      { label: "Year-Month (YYYY-MM)", value: "YYYY-MM" }
    ]
  },
  {
    label: "Day",
    items: [
      { label: "Full Date (YYYY-MM-DD)", value: "YYYY-MM-DD" }
    ]
  }
];
const aggregateOperators = [
  { label: "Count", value: "count" },
  { label: "Sum", value: "sum" },
  { label: "Avg", value: "avg" },
  { label: "Min", value: "min" },
  { label: "Max", value: "max" }
];

const allowedGroupTypes = [
  "shortText",
  "selectionStatic",
  "selectionDynamic",
  "computed",
  "int",
  "float",
  "boolean",
  "date",
  "datetime",
  "relation"
];

const numericTypes = ["int", "float"];

export type AggregationOperator =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max";

export interface AggregationRule {
  id: number;

  /**
   * Aggregate operator
   */
  operator: AggregationOperator;

  /**
   * Field on which aggregation applies
   * Example:
   *  "id"
   *  "amount"
   *  "price"
   */
  fieldName: string | null;

  /**
   * If true:
   *  - Cannot be edited
   *  - Cannot be removed
   * Used for default: count-of-id
   */
  locked?: boolean;
}

export type DateGroupingFormat =
  | "YYYY"
  | "MMM"
  | "YYYY-MM"
  | "YYYY-MM-DD";

export interface GroupingRule {
  id: number;

  /**
   * Actual field selected by user.
   * Example:
   *  "state"
   *  "city"
   *  "createdAt"
   *  "author.name"   // many-to-one resolved key
   */
  fieldName: string | null;

  /**
   * Only used when field type is date or datetime.
   * Null for non-date fields.
   */
  dateGrouping?: DateGroupingFormat | null;
}

const GroupingComponent = ({
  viewData,
  fields,
  groupingRules,
  setGroupingRules,
  aggregationRules,
  setAggregationRules,
  applyGrouping,
  closeDialog
}: { viewData: any, fields: GroupableField[], groupingRules: GroupingRule[], setGroupingRules: any, aggregationRules: AggregationRule[], setAggregationRules: any, applyGrouping: any, closeDialog: any }) => {


  const [groupSearchValue, setGroupSearchValue] = React.useState<any>(null);
  const [aggSearchValue, setAggSearchValue] = React.useState<any>(null);

  const [filteredGroupingFields, setFilteredGroupingFields] = React.useState<GroupableField[]>([]);

  const searchGroupingFields = (event: any) => {
    const query = event.query.toLowerCase();
    const selectedFields = groupingRules.map(r => r.fieldName);

    const filtered = groupableFields.filter((field) =>
      field.displayName.toLowerCase().includes(query) && !selectedFields.includes(field.fieldName)
    );

    setFilteredGroupingFields(filtered);
  };

  const [filteredAggregationFields, setFilteredAggregationFields] = React.useState<GroupableField[]>([]);

  const searchAggregationFields = (event: any) => {
    const query = event.query.toLowerCase();

    const filtered = numericFields.filter((field) =>
      field.displayName.toLowerCase().includes(query)
    );
    setFilteredAggregationFields(query ? filtered : numericFields);
  };

  // -------------------------------
  // FILTER GROUPABLE FIELDS
  // -------------------------------
  const groupableFields: GroupableField[] = useMemo(() => {
    return fields.filter(f =>
      allowedGroupTypes.includes(f.type)
    );
  }, [fields]);

  const numericFields: GroupableField[] = useMemo(() => {
    return fields.filter((f: any) =>
      numericTypes.includes(f.type) ||
      (f.type === "computed" && f.computedFieldValueType === "int") ||
      (f.type === "computed" && f.computedFieldValueType === "float")
    );
  }, [fields]);

  const removeGroup = (id: any) => {
    setGroupingRules((prev: any) => prev.filter((r: any) => r.id !== id));
  };

  const updateGroup = (id: any, key: any, value: any) => {
    setGroupingRules((prev: any) =>
      prev.map((r: any) => r.id === id ? { ...r, [key]: value } : r)
    );
  };

  const removeAggregation = (id: any) => {
    setAggregationRules((prev: any) =>
      prev.filter((a: any) => a.id !== id || a.locked)
    );
  };

  const updateAggregation = (id: any, key: any, value: any) => {
    setAggregationRules((prev: any) =>
      prev.map((a: any) => a.id === id ? { ...a, [key]: value } : a)
    );
  };

  const groupedDateFlatOptions = groupedDateOptions.flatMap((group) =>
    group.items.map((item) => ({
      label: `${group.label}: ${item.label}`,
      value: item.value,
    }))
  );

  const visibleGroupingRules = groupingRules.filter((rule) => rule.fieldName);
  const visibleAggregationRules = aggregationRules.filter((rule) => rule.fieldName);

  return (
    <div className="solid-grouping-builder">
      <section className="solid-grouping-section-card">
        <div className="solid-grouping-section-head">
          <div>
            <p className="m-0 solid-filter-section-title">Grouping Rules</p>
            <p className="m-0 solid-grouping-section-copy">
              Add fields in the order you want the tree to grow. The first rule becomes the top level.
            </p>
          </div>
        </div>

        <div className="solid-grouping-search-row">
          <SolidAutocomplete
            value={groupSearchValue}
            suggestions={filteredGroupingFields}
            completeMethod={searchGroupingFields}
            field="displayName"
            placeholder="Search field to group by"
            className="w-full solid-filter-compact-control"
            dropdown
            onChange={(e) => setGroupSearchValue(e.value)}
            onSelect={(e) => {
              if (typeof e.value === "object" && e.value.fieldName) {
                const isDate = ["date", "datetime"].includes(e.value.type);
                setGroupingRules((prev: any) => [
                  ...prev,
                  { id: Date.now(), fieldName: e.value.fieldName, dateGrouping: isDate ? "YYYY-MM-DD" : null }
                ]);
              }
              setGroupSearchValue(null);
            }}
          />
        </div>

        <div className="solid-grouping-list">
          {visibleGroupingRules.length === 0 && (
            <div className="solid-grouping-empty-panel">
              <Plus size={14} />
              <span>No grouping rules applied yet.</span>
            </div>
          )}
          {visibleGroupingRules.map((rule, index) => {
            const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
            if (!fieldMeta) return null;

            const isDate = ["date", "datetime"].includes(fieldMeta.type);

            return (
              <div key={rule.id} className="solid-grouping-rule-row">
                <div className="solid-grouping-order-badge">{index + 1}</div>
                <div className="solid-grouping-rule-main">
                  <div className="solid-grouping-rule-title-row">
                    <div className="solid-grouping-rule-title">{fieldMeta.displayName}</div>
                    <div className="solid-grouping-rule-caption">
                      {index === 0 ? "Top-level grouping" : `Then group within level ${index}`}
                    </div>
                  </div>
                  {isDate ? (
                    <div className="solid-grouping-rule-controls">
                      <span className="solid-grouping-inline-label">Group by</span>
                      <SolidSelect
                        value={rule.dateGrouping || "YYYY-MM-DD"}
                        options={groupedDateFlatOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Format"
                        className="solid-grouping-row-select"
                        onChange={(e) => updateGroup(rule.id, "dateGrouping", e.value)}
                      />
                    </div>
                  ) : (
                    <div className="solid-grouping-rule-summary">Groups by exact value of this field.</div>
                  )}
                </div>
                <button type="button" className="solid-grouping-row-remove" onClick={() => removeGroup(rule.id)}>
                  <SolidIcon name="si-times" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="solid-grouping-section-card">
        <div className="solid-grouping-section-head">
          <div>
            <p className="m-0 solid-filter-section-title">Aggregations</p>
            <p className="m-0 solid-grouping-section-copy">
              Add rollups to show counts or numeric summaries for each group.
            </p>
          </div>
        </div>

        <div className="solid-grouping-search-row">
          <SolidAutocomplete
            value={aggSearchValue}
            suggestions={filteredAggregationFields}
            completeMethod={searchAggregationFields}
            field="displayName"
            placeholder="Search field to aggregate"
            className="w-full solid-filter-compact-control"
            dropdown
            onChange={(e) => setAggSearchValue(e.value)}
            onSelect={(e) => {
              if (typeof e.value === "object" && e.value.fieldName) {
                setAggregationRules((prev: any) => [
                  ...prev,
                  { id: Date.now(), operator: "count", fieldName: e.value.fieldName }
                ]);
              }
              setAggSearchValue(null);
            }}
          />
        </div>

        <div className="solid-grouping-list solid-grouping-list-compact">
          {visibleAggregationRules.length === 0 && (
            <div className="solid-grouping-empty-panel">
              <Plus size={14} />
              <span>No aggregations applied yet.</span>
            </div>
          )}
          {visibleAggregationRules.map((rule) => {
            const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
            if (!fieldMeta) return null;

            return (
              <div key={rule.id} className="solid-aggregation-row">
                <div className="solid-aggregation-row-main">
                  <div className="solid-aggregation-row-title">{fieldMeta.displayName}</div>
                  <div className="solid-aggregation-row-caption">
                    {rule.locked ? "Default aggregation" : "Applied to each group"}
                  </div>
                </div>

                <div className="solid-aggregation-row-controls">
                  <span className="solid-grouping-inline-label">Operation</span>
                  <SolidSelect
                    value={rule.operator}
                    options={aggregateOperators}
                    disabled={rule.locked}
                    placeholder="Op"
                    className="solid-grouping-row-select solid-aggregation-row-select"
                    onChange={(e) => updateAggregation(rule.id, "operator", e.value)}
                  />
                </div>
                {!rule.locked ? (
                  <button type="button" className="solid-grouping-row-remove solid-aggregation-row-remove" onClick={() => removeAggregation(rule.id)}>
                    <SolidIcon name="si-times" />
                  </button>
                ) : (
                  <span className="solid-aggregation-row-remove-spacer" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <div className="solid-grouping-footer">
        <SolidButton size="sm" variant="outline" onClick={closeDialog}>
          <SolidIcon name="si-times" />
          Cancel
        </SolidButton>
        <SolidButton size="sm" variant="primary" onClick={() => applyGrouping(groupingRules, aggregationRules)}>
          <SolidIcon name="si-check" />
          Apply
        </SolidButton>
      </div>
    </div>
  );
};

export default GroupingComponent;
