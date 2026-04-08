"use client";
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
import { dateFilterMatchModeOptions } from "./SolidDateColumn";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { DateFieldViewComponent } from "../../common/DateFieldViewComponent"; // ✅ import

const SolidTimeColumn = ({
  solidListViewMetaData,
  fieldMetadata,
  column,
}: SolidListViewColumnParams) => {
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
        inputType={InputTypes.Time}
        solidListViewMetaData={solidListViewMetaData}
        fieldMetadata={fieldMetadata}
        column={column}
      />
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
      header={() => (
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
      )}
      body={(rowData) => {
        const viewWidget = column.attrs.viewWidget;
        if (viewWidget) {
          const DynamicWidget = getExtensionComponent(viewWidget);
          const widgetProps: SolidListFieldWidgetProps = {
            rowData,
            solidListViewMetaData,
            fieldMetadata,
            column,
          };
          return <>{DynamicWidget && <DynamicWidget {...widgetProps} />}</>;
        }
        // ✅ FIX: render time-only using HH:mm:ss format
        return (
          <DateFieldViewComponent
            value={rowData[fieldMetadata.name]}
            format="HH:mm"
          />
        );
      }}
    />
  );
};

export default SolidTimeColumn;
