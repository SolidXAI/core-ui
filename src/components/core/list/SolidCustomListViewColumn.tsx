import { Column } from "./SolidDataTable";
import { getExtensionComponent } from "../../../helpers/registry";
import type { SolidListFieldWidgetProps } from "../../../types/solid-core";
import { applyListColumnLayoutAttrs } from "./SolidListViewColumn";

type SolidCustomListViewColumnProps = {
    solidListViewMetaData: any;
    column: any;
    embeded?: boolean;
};

export const SolidCustomListViewColumn = ({ solidListViewMetaData, column, embeded }: SolidCustomListViewColumnProps) => {
    const widgetName = column?.attrs?.widget;
    const fieldName = column?.attrs?.name ?? widgetName ?? "custom";
    const header = column?.attrs?.label ?? fieldName;
    const DynamicWidget = widgetName ? getExtensionComponent(widgetName) : null;
    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter;
    const fieldMetadata = {
        name: fieldName,
        displayName: header,
        type: column?.attrs?.fieldType ?? "shortText",
    };

    return applyListColumnLayoutAttrs(
        <Column
            key={fieldName}
            field={fieldName}
            sortable={Boolean(column?.attrs?.sortable && column?.attrs?.name)}
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
                if (!DynamicWidget) {
                    return null;
                }

                const widgetProps: SolidListFieldWidgetProps = {
                    rowData,
                    solidListViewMetaData,
                    fieldMetadata: fieldMetadata as any,
                    column,
                    embeded,
                };

                return <DynamicWidget {...widgetProps} />;
            }}
        />
        ,
        column
    );
};
