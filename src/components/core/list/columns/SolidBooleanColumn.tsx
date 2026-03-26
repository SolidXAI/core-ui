import { Column } from "../SolidDataTable";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { getExtensionComponent } from "../../../../helpers/registry";

const SolidBooleanColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {

    const header = column.attrs.label ?? fieldMetadata.displayName;


    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            // className="text-sm"
            sortable={column.attrs.sortable}
            body={
                (rowData) => {
                    let viewWidget = column.attrs.viewWidget;
                    if (!viewWidget) {
                        viewWidget = 'DefaultBooleanListWidget';
                    }
                    let DynamicWidget = getExtensionComponent(viewWidget);
                    const widgetProps: SolidListFieldWidgetProps = {
                        rowData,
                        solidListViewMetaData,
                        fieldMetadata,
                        column
                    }
                    return (
                        <>
                            {DynamicWidget && <DynamicWidget {...widgetProps} />}
                        </>
                    )
                }
            }
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );
};

export default SolidBooleanColumn;

export const DefaultBooleanListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const fieldKey = column.attrs.label ?? fieldMetadata.name;
    const trueLabel = column.attrs.trueLabel ?? 'Yes';
    const falseLabel = column.attrs.falseLabel ?? 'No';
    // console.log(`rendering boolean column ${fieldKey} with value ${rowData[fieldKey]}, trueLabel=${trueLabel}, falseLabel=${falseLabel}`);
    const value = rowData[fieldKey];
    if (value === true) {
        return trueLabel;
    }
    if (value === false) {
        return falseLabel;
    }
    return '';
}
