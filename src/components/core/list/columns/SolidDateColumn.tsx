"use client";
import { FilterMatchMode } from "primereact/api";
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { FormEvent } from "primereact/ts-helpers";
import {
  getNumberOfInputs,
  SolidListViewColumnParams,
} from "../SolidListViewColumn";
import {
  InputTypes,
  SolidVarInputsFilterElement,
} from "../SolidVarInputsFilterElement";
import SolidTableRowCell from "../SolidTableRowCell";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { getExtensionComponent } from "../../../../helpers/registry";
import { DateFieldViewComponent } from "../../common/DateFieldViewComponent"; // ✅ added

export const dateFilterMatchModeOptions = [
  { label: "Equals", value: FilterMatchMode.EQUALS },
  { label: "Not Equals", value: FilterMatchMode.NOT_EQUALS },
  { label: "Less Than", value: FilterMatchMode.LESS_THAN },
  { label: "Less Than Or Equal", value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO },
  { label: "Greater Than", value: FilterMatchMode.GREATER_THAN },
  {
    label: "Greater Than Or Equal",
    value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
  },
  { label: "In", value: FilterMatchMode.IN },
  { label: "Not In", value: FilterMatchMode.NOT_IN },
  { label: "Between", value: FilterMatchMode.BETWEEN },
];

const SolidDateColumn = ({
  solidListViewMetaData,
  fieldMetadata,
  column,
}: SolidListViewColumnParams) => {
  const filterable = column.attrs.filterable;
  const showFilterOperator = false;
  const columnDataType = "date";
  const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    const numberOfInputs = getNumberOfInputs(options.filterModel.matchMode);

    return (
      <SolidVarInputsFilterElement
        values={options.value}
        onChange={(e: FormEvent<Date>) =>
          options.filterCallback(e, options.index)
        }
        numberOfInputs={numberOfInputs}
        inputType={InputTypes.Date}
        solidListViewMetaData={solidListViewMetaData}
        fieldMetadata={fieldMetadata}
        column={column}
      ></SolidVarInputsFilterElement>
    );
  };

  const truncateAfter =
    solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter;
  const header = column.attrs.label ?? fieldMetadata.displayName;

  return (
    <Column
      key={fieldMetadata.name}
      field={fieldMetadata.name}
      sortable={column.attrs.sortable}
      dataType={columnDataType}
      showFilterOperator={showFilterOperator}
      filterMatchModeOptions={dateFilterMatchModeOptions}
      filterElement={filterTemplate}
      filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
      header={() => {
        return (
          <div
            style={{
              maxWidth: truncateAfter ? `${truncateAfter}ch` : "30ch",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {header}
          </div>
        );
      }}
      body={(rowData) => {
        let viewWidget = column.attrs.viewWidget;
        if (viewWidget) {
          const DynamicWidget = getExtensionComponent(viewWidget);
          const widgetProps: SolidListFieldWidgetProps = {
            rowData,
            solidListViewMetaData,
            fieldMetadata,
            column,
          };
          if (!viewWidget) {
            viewWidget = "DefaultDateListWidget";
          }
          return <>{DynamicWidget && <DynamicWidget {...widgetProps} />}</>;
        }
        // ✅ FIX: auto-detect if value has a time component and show it
        const rawValue = rowData[fieldMetadata.name];
        const date = rawValue ? new Date(rawValue) : null;
        const hasTime =
          date &&
          (date.getHours() !== 0 ||
            date.getMinutes() !== 0 ||
            date.getSeconds() !== 0);
        const format = hasTime ? "MM/DD/YYYY HH:mm" : "MM/DD/YYYY";
        return <DateFieldViewComponent value={rawValue} format={format} />;
      }}
    ></Column>
  );
};

export default SolidDateColumn;

export const DefaultDateListWidget = ({
  rowData,
  solidListViewMetaData,
  fieldMetadata,
  column,
}: SolidListFieldWidgetProps) => {
  let displayValue = rowData[fieldMetadata.name];
  const format = solidListViewMetaData?.data?.solidView?.layout?.attrs?.format;

  return (
    <DateFieldViewComponent
      value={displayValue}
      format={format}
      fallback="-"
    ></DateFieldViewComponent>
  );
};

export const DefaultDateTimeListWidget = ({
  rowData,
  solidListViewMetaData,
  fieldMetadata,
  column,
}: SolidListFieldWidgetProps) => {
  let displayValue = rowData[fieldMetadata.name];
  const format = solidListViewMetaData?.data?.solidView?.layout?.attrs?.format;

  return (
    <DateFieldViewComponent
      value={displayValue}
      format={format}
      fallback="-"
      showTime={true}
    ></DateFieldViewComponent>
  );
};
