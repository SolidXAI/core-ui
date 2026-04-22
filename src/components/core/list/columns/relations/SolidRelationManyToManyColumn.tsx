
import { Column } from "../../SolidDataTable";
import { SolidListViewColumnParams } from '../../../../../components/core/list/SolidListViewColumn';
import { getExtensionComponent } from '../../../../../helpers/registry';
import { SolidListFieldWidgetProps } from '../../../../../types/solid-core';


const SolidRelationManyToManyColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            sortable={column.attrs.sortable}
            body={(rowData) => {
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultRelationManyToManyListWidget';
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

export default SolidRelationManyToManyColumn;


export const DefaultRelationManyToManyListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const manyToManyFieldData = rowData[column.attrs.name];

    // This is the userkey that will be present within the rowData.
    if (manyToManyFieldData) {
        // Since this is a many-to-one field, we fetch the user key field of the associated model.
        const userKeyField = column?.attrs?.coModelFieldToDisplay ? column?.attrs?.coModelFieldToDisplay : fieldMetadata?.relationModel?.userKeyField?.name;
        const manyToManyColVal = manyToManyFieldData.map((f: any) => f[userKeyField]);

        // TODO: change this to use an anchor tag so that on click we open that entity form view. 
        return (
            <>
                {manyToManyColVal.length > 0 &&
                    <p>

                        <span style={{ backgroundColor: '#f5f5f5', padding: '7px', borderRadius: '4px' }}>{manyToManyColVal[0]}</span>
                        <span style={{ color: "#0895CD", fontWeight: 'bold' }}>{manyToManyColVal.length - 1 > 0 ? ` +${manyToManyColVal.length - 1}` : ""}</span>

                    </p >
                }
            </>
        )
    }
    else {
        return <span></span>
    }
};