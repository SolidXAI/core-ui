
import { Column } from "../../SolidDataTable";
import { SolidListViewColumnParams } from '../../../../../components/core/list/SolidListViewColumn';
import { getExtensionComponent } from '../../../../../helpers/registry';
import { SolidListFieldWidgetProps } from '../../../../../types/solid-core';
import { kebabCase } from 'lodash';
import { ExternalLink } from "lucide-react";

const SolidRelationManyToOneColumn = ({ solidListViewMetaData, fieldMetadata, column, embeded, disabled }: SolidListViewColumnParams) => {

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
                    embeded,
                    disabled
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


export const DefaultRelationManyToOneListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, embeded, disabled }: SolidListFieldWidgetProps) => {
    const manyToOneFieldData = rowData[column.attrs.name];

    // This is the userkey that will be present within the rowData.
    if (manyToOneFieldData) {
        // Since this is a many-to-one field, we fetch the user key field of the associated model.
        const userKeyField = column?.attrs?.coModelFieldToDisplay ? column?.attrs?.coModelFieldToDisplay : fieldMetadata?.relationModel?.userKeyField?.name;

        const manyToOneColVal = manyToOneFieldData[userKeyField];

        if (embeded === true || disabled === true) {
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
                    const pathSegments = window.location.pathname.split('/').filter(Boolean);

                    const listIndex = pathSegments.lastIndexOf('list');

                    if (listIndex > 0) {
                        pathSegments[listIndex - 1] = kebabCase(fieldMetadata?.relationModel?.singularName);
                        pathSegments[listIndex] = `form/${manyToOneFieldData?.id}`;
                    }
                    else if (pathSegments[pathSegments.length - 2] === "form") {
                        pathSegments[pathSegments.length - 3] = kebabCase(fieldMetadata?.relationModel?.singularName);
                        pathSegments[pathSegments.length - 2] = "form";
                        pathSegments[pathSegments.length - 1] = manyToOneFieldData?.id;
                    }

                    const newPath = `/${pathSegments.join('/')}?viewMode=view`;

                    // open in new tab
                    window.open(newPath, "_blank");

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
