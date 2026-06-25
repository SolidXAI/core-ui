
import { Column } from "../../SolidDataTable";
import { SolidListViewColumnParams } from '../../../../../components/core/list/SolidListViewColumn';
import { getExtensionComponent } from '../../../../../helpers/registry';
import { buildAdminRecordFormPath } from '../../../../../helpers/routePaths';
import { SolidListFieldWidgetProps } from '../../../../../types/solid-core';
import { ExternalLink } from "lucide-react";

const SolidRelationManyToOneColumn = ({ solidListViewMetaData, fieldMetadata, column, embeded }: SolidListViewColumnParams) => {

    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            // className="text-sm"
            sortable={column.attrs.sortable}
            body={(rowData) => {
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultRelationManyToOneListWidget';
                }
                let DynamicWidget = getExtensionComponent(viewWidget);
                const widgetProps: SolidListFieldWidgetProps = {
                    rowData,
                    solidListViewMetaData,
                    fieldMetadata,
                    column,
                    embeded
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

export default SolidRelationManyToOneColumn;


export const DefaultRelationManyToOneListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, embeded }: SolidListFieldWidgetProps) => {
    const manyToOneFieldData = rowData[column.attrs.name];
    // This is the userkey that will be present within the rowData.
    if (manyToOneFieldData) {
        // Since this is a many-to-one field, we fetch the user key field of the associated model.
        const userKeyField = column?.attrs?.coModelFieldToDisplay ? column?.attrs?.coModelFieldToDisplay : fieldMetadata?.relationModel?.userKeyField?.name;
        const manyToOneColVal = manyToOneFieldData[userKeyField];
        const relatedModuleName =
            fieldMetadata?.relationModelModuleName ||
            fieldMetadata?.relationModel?.module?.name ||
            solidListViewMetaData?.data?.solidView?.module?.name;
        const relatedModelName =
            fieldMetadata?.relationModel?.singularName ||
            fieldMetadata?.relationCoModelSingularName;
        const relationRecordPath = buildAdminRecordFormPath({
            moduleName: relatedModuleName,
            modelName: relatedModelName,
            recordId: manyToOneFieldData?.id,
            viewMode: "view",
        });

        const isDisabled = column?.attrs?.disabled === true;

        if (embeded === true || isDisabled || !relationRecordPath) {
            return (
                <span className="solid-list-external-link-text">
                    {manyToOneColVal}
                </span>
            );
        }

        return (
            <button
                type="button"
                className="solid-list-external-link"
                onClick={() => {
                    window.open(relationRecordPath, "_blank");
                }}
            >
                <span className="solid-list-external-link-text">{manyToOneColVal}</span>
                <ExternalLink size={13} strokeWidth={2} className="solid-list-external-link-icon" />
            </button>
        );
    }
    else {
        return <span></span>
    }
};
