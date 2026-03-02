import React, { useMemo } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { GroupableField } from "./SolidGlobalSearchElement";
import { AutoComplete } from "primereact/autocomplete";

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

  return (
    <div className="primary-filter-fieldset p-2">
      <style>{`
        .solid-mini-dropdown {
          border: none !important;
          background: transparent !important;
          border-radius: 4px !important;
          transition: background 0.2s !important;
        }
        .solid-mini-dropdown:hover {
          background: rgba(0, 0, 0, 0.1) !important;
        }
        .solid-mini-dropdown .p-dropdown-label {
          padding: 0 0.5rem !important;
          line-height: 1.5rem !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          color: var(--text-color-secondary) !important;
        }
        .solid-mini-dropdown .p-dropdown-trigger {
          width: 1.5rem !important;
        }
        .solid-chip {
           border: 1px solid var(--surface-300) !important;
           background: var(--surface-100) !important;
           box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
           transition: all 0.2s ease-in-out;
           border-radius: 100px !important; /* Made more rounded */
        }
        .solid-chip:hover {
           background: var(--surface-200) !important;
           transform: translateY(-1px);
        }
        .solid-chip .pi-times {
           border: none !important; /* Ensure no border on the x */
           background: transparent !important;
        }
      `}</style>

      {/* ========================================================= */}
      {/* A. APPLY GROUPS */}
      {/* ========================================================= */}
      <p className="mb-2 font-bold">Apply Groups</p>

      <div className="mb-3">
        <AutoComplete
          value={groupSearchValue}
          suggestions={filteredGroupingFields}
          completeMethod={searchGroupingFields}
          field="displayName"
          placeholder="Search Field to Group By"
          className="w-full"
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

      <div className="flex align-items-center gap-2 flex-wrap mb-4" style={{ minHeight: '2rem' }}>
        {groupingRules.length == 1 && groupingRules[0].fieldName === null && (
          <span className="text-sm text-400 italic">No grouping rules applied.</span>
        )}
        {groupingRules.map((rule, index) => {
          const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
          if (!fieldMeta) return null;

          const isDate = ["date", "datetime"].includes(fieldMeta.type);

          return (
            <React.Fragment key={rule.id}>
              <div
                className="flex align-items-center gap-2 px-2 py-1 solid-chip text-sm font-medium text-700"
              >
                <span>{fieldMeta.displayName}</span>

                {isDate && (
                  <Dropdown
                    value={rule.dateGrouping || "YYYY-MM-DD"}
                    options={groupedDateOptions}
                    optionLabel="label"
                    optionGroupLabel="label"
                    optionGroupChildren="items"
                    optionGroupTemplate={groupedDateItemTemplate}
                    itemTemplate={groupedDateValueTemplate}
                    placeholder="Format"
                    className="solid-mini-dropdown"
                    style={{ height: '1.5rem', fontSize: '0.75rem', padding: '0 0.25rem' }}
                    onChange={(e) => updateGroup(rule.id, "dateGrouping", e.value)}
                  />
                )}

                <i
                  className="pi pi-times cursor-pointer text-400 hover:text-red-500 transition-colors"
                  onClick={() => removeGroup(rule.id)}
                />
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
      <p className="mt-4 mb-2 font-bold">Apply Aggregations</p>

      <div className="mb-3">
        <AutoComplete
          value={aggSearchValue}
          suggestions={filteredAggregationFields}
          completeMethod={searchAggregationFields}
          field="displayName"
          placeholder="Search Field to Aggregate"
          className="w-full"
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

      <div className="flex align-items-center gap-2 flex-wrap mb-4" style={{ minHeight: '3rem' }}>
        {aggregationRules.length === 0 && (
          <span className="text-sm text-400 italic">No aggregations applied.</span>
        )}
        {aggregationRules.map((rule) => {
          const fieldMeta = fields.find((f) => f.fieldName === rule.fieldName);
          if (!fieldMeta) return null;

          return (
            <div
              key={rule.id}
              className="flex align-items-center gap-2 px-2 py-1 solid-chip text-sm font-medium text-700"
            >
              <span>{fieldMeta.displayName}</span>

              <Dropdown
                value={rule.operator}
                options={aggregateOperators}
                disabled={rule.locked}
                placeholder="Op"
                className="solid-mini-dropdown"
                style={{ height: '1.5rem', fontSize: '0.75rem', padding: '0 0.25rem' }}
                onChange={(e) => updateAggregation(rule.id, "operator", e.value)}
              />

              {!rule.locked && (
                <i
                  className="pi pi-times cursor-pointer text-400 hover:text-red-500 transition-colors"
                  onClick={() => removeAggregation(rule.id)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="flex justify-content-center gap-2 mt-4 pt-3 surface-border">
        <Button
          label="Apply"
          icon="pi pi-check"
          size="small"
          onClick={() => applyGrouping(groupingRules, aggregationRules)}
        />
        <Button
          label="Cancel"
          icon="pi pi-times"
          size="small"
          outlined
          onClick={closeDialog}
        />
      </div>
    </div>
  );
};

export default GroupingComponent;
