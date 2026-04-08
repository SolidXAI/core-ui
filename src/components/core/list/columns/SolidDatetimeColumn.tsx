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
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { getExtensionComponent } from "../../../../helpers/registry";
import { DateFieldViewComponent } from "../../common/DateFieldViewComponent";
import { parseDateTime } from "../../../../helpers/parseDateTime";

const SolidDatetimeColumn = ({
  solidListViewMetaData,
  fieldMetadata,
  column,
}: SolidListViewColumnParams) => {
  // ✅ DEBUG 1 — Check if component is rendered

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
        inputType={InputTypes.DateTime}
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
        // ✅ DEBUG 2 — Check row rendering

        const value = rowData[fieldMetadata.name];

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

        // ✅ DEBUG 4 — parse datetime
        const parsedDate = parseDateTime(value);

        return (
          <DateFieldViewComponent
            value={parsedDate}
            format="MM/DD/YYYY HH:mm"
          />
        );
      }}
    />
  );
};

export default SolidDatetimeColumn;
