
import { Column } from "../SolidDataTable";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { SolidListFieldWidgetProps } from '../../../../types/solid-core';
import { getExtensionComponent } from '../../../../helpers/registry';

const SolidIdColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {

    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter
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
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultTextListWidget';
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
        ></Column>
    );

};

export default SolidIdColumn;
