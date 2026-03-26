import React, { useMemo } from "react";
import { GroupableField } from "./SolidGlobalSearchElement";
import { SolidAutocomplete } from "../../shad-cn-ui/SolidAutocomplete";
import { SolidSelect } from "../../shad-cn-ui/SolidSelect";
import { SolidButton } from "../../shad-cn-ui/SolidButton";

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

  // -------------------------------
  // GROUPING HANDLERS
  // -------------------------------

  const addGroup = () => {
    setGroupingRules((prev: any) => [
      ...prev,
      { id: Date.now(), fieldName: null, dateGrouping: null }
    ]);
  };

  const removeGroup = (id: any) => {
    setGroupingRules((prev: any) => prev.filter((r: any) => r.id !== id));
  };

  const updateGroup = (id: any, key: any, value: any) => {
    setGroupingRules((prev: any) =>
      prev.map((r: any) => r.id === id ? { ...r, [key]: value } : r)
    );
  };

  // -------------------------------
  // AGGREGATION HANDLERS
  // -------------------------------

  const addAggregation = () => {
    setAggregationRules((prev: any) => [
      ...prev,
      { id: Date.now(), operator: "sum", fieldName: null }
    ]);
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

  // -------------------------------
  // READONLY GROUP ORDER DISPLAY
  // -------------------------------

  const groupingSummary = groupingRules
    .filter((g: GroupingRule) => g.fieldName)
    .map((g: GroupingRule) => {
      const fieldMeta = fields.find((f: GroupableField) => f.fieldName === g.fieldName);
      if (!fieldMeta) return null;

      if (["date", "datetime"].includes(fieldMeta.type) && g.dateGrouping) {
        return `${fieldMeta.displayName} (${g.dateGrouping})`;
      }

      return fieldMeta.displayName;
    })
    .filter(Boolean)
    .join(" > ");


  const groupedDateItemTemplate = (option: any) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className={`pi ${option.label === "Year" ? "pi-calendar" :
          option.label === "Month" ? "pi-calendar-minus" :
            "pi-calendar-plus"
          }`} />
        <div>
          {option.label}
        </div>
      </div>
    );
  };

  const groupedDateValueTemplate = (option: any) => {
    return (
      <div className="pl-3">
        {option.label}
      </div>
    );
  };

  const groupedDateFlatOptions = groupedDateOptions.flatMap((group) =>
    group.items.map((item) => ({
      label: `${group.label}: ${item.label}`,
      value: item.value,
    }))
  );

  return (
    <div className="solid-grouping-builder">

      {/* ========================================================= */}
      {/* A. APPLY GROUPS */}
      {/* ========================================================= */}
      <p className="mb-2 font-bold solid-filter-section-title">Apply Groups</p>

      <div className="mb-3 solid-grouping-search-row">
        <SolidAutocomplete
          value={groupSearchValue}
          suggestions={filteredGroupingFields}
          completeMethod={searchGroupingFields}
          field="displayName"
          placeholder="Search Field to Group By"
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

      <div className="solid-grouping-chip-list">
        {groupingRules.length == 1 && groupingRules[0].fieldName === null && (
          <span className="solid-grouping-empty-state">No grouping rules applied.</span>
        )}
        {groupingRules.map((rule, index) => {
          const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
          if (!fieldMeta) return null;

          const isDate = ["date", "datetime"].includes(fieldMeta.type);

          return (
            <React.Fragment key={rule.id}>
              <div className="solid-grouping-chip">
                <span>{fieldMeta.displayName}</span>

                {isDate && (
                  <SolidSelect
                    value={rule.dateGrouping || "YYYY-MM-DD"}
                    options={groupedDateFlatOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Format"
                    className="solid-grouping-chip-select"
                    onChange={(e) => updateGroup(rule.id, "dateGrouping", e.value)}
                  />
                )}

                <button type="button" className="solid-grouping-chip-remove" onClick={() => removeGroup(rule.id)}>
                  <i className="pi pi-times" />
                </button>
              </div>
              {index < groupingRules.length - 1 && (
                <i className="pi pi-angle-double-right text-400 text-xs" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* B. APPLY AGGREGATIONS */}
      {/* ========================================================= */}
      <p className="mt-4 mb-2 font-bold solid-filter-section-title">Apply Aggregations</p>

      <div className="mb-3 solid-grouping-search-row">
        <SolidAutocomplete
          value={aggSearchValue}
          suggestions={filteredAggregationFields}
          completeMethod={searchAggregationFields}
          field="displayName"
          placeholder="Search Field to Aggregate"
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

      <div className="solid-grouping-chip-list">
        {aggregationRules.length === 0 && (
          <span className="solid-grouping-empty-state">No aggregations applied.</span>
        )}
        {aggregationRules.map((rule) => {
          const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
          if (!fieldMeta) return null;

          return (
            <div key={rule.id} className="solid-grouping-chip">
              <span>{fieldMeta.displayName}</span>

              <SolidSelect
                value={rule.operator}
                options={aggregateOperators}
                disabled={rule.locked}
                placeholder="Op"
                className="solid-grouping-chip-select"
                onChange={(e) => updateAggregation(rule.id, "operator", e.value)}
              />

              {!rule.locked && (
                <button type="button" className="solid-grouping-chip-remove" onClick={() => removeAggregation(rule.id)}>
                  <i className="pi pi-times" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="solid-grouping-footer">
        <SolidButton size="sm" variant="primary" onClick={() => applyGrouping(groupingRules, aggregationRules)}>
          <i className="pi pi-check" />
          Apply
        </SolidButton>
        <SolidButton size="sm" variant="outline" onClick={closeDialog}>
          <i className="pi pi-times" />
          Cancel
        </SolidButton>
      </div>
    </div>
  );
};

export default GroupingComponent;
