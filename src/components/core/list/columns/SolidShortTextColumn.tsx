
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import SolidTableRowCell from '../SolidTableRowCell';
import { getExtensionComponent } from '../../../../helpers/registry';
import { SolidListFieldWidgetProps, SolidMediaListFieldWidgetProps } from '../../../../types/solid-core';

const SolidShortTextColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {

    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter;
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            sortable={column.attrs.sortable}
            header={() => {
                return (<div style={{ maxWidth: truncateAfter ? `${truncateAfter}ch` : '30ch', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{header}</div>)
            }}

            body={(rowData) => {
                //add this widget to render media image in image format  - SolidShortTextFieldImageRenderModeWidget 
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultTextListWidget';
                }
                let DynamicWidget = getExtensionComponent(viewWidget);
                const widgetProps: SolidMediaListFieldWidgetProps = {
                    rowData,
                    solidListViewMetaData,
                    fieldMetadata,
                    column,
                    setLightboxUrls: setLightboxUrls,
                    setOpenLightbox: setOpenLightbox
                }
                return (
                    <>
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </>
                )
            }
            }

        ></Column >
    );

};

export default SolidShortTextColumn;



export const DefaultTextListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter;
    let displayValue = rowData[fieldMetadata.name];

    if (fieldMetadata?.selectionStaticValues && displayValue) {
        const mapping: Record<string, string> = {};

        fieldMetadata.selectionStaticValues.forEach((entry: string) => {
            const [val, label] = entry.split(":");
            mapping[val] = label;
        });

        const values = displayValue.split(",").map((v: string) => v.trim());

        displayValue = values.map((v: string) => mapping[v] || v).join(", ");
    }

    return (
        <SolidTableRowCell
            value={displayValue}
            truncateAfter={truncateAfter}
        />
    );
};
