'use client';
import { FilterMatchMode } from 'primereact/api';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { FormEvent } from "primereact/ts-helpers";
import { SolidListViewColumnParams } from '../../SolidListViewColumn';
import { InputTypes, SolidVarInputsFilterElement } from "../../SolidVarInputsFilterElement";
import { Button } from 'primereact/button';
import { getExtensionComponent } from '@/helpers/registry';
import { Chip } from 'primereact/chip';


const RenderLabel = ({ value, widget }: any) => {
    let DynamicWidget = getExtensionComponent(widget);

    const widgetProps = {
        value: value
    }


    return (
        widget ?
            <>
                {DynamicWidget && <DynamicWidget {...widgetProps} />}
            </> :
            <p>{value}</p>

    )
}

const SolidRelationManyToManyColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const filterMatchModeOptions = [
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN },
    ];
    const columnDataType = undefined;
    const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {

        return (
            <SolidVarInputsFilterElement
                values={options.value}
                onChange={(e: FormEvent<HTMLInputElement>) => options.filterCallback(e, options.index)}
                inputType={InputTypes.RelationManyToOne}
                solidListViewMetaData={solidListViewMetaData}
                fieldMetadata={fieldMetadata}
                column={column}
            >
            </SolidVarInputsFilterElement>
        )
    };

    const bodyTemplate = (rowData: any) => {
        const manyToManyFieldData = rowData[column.attrs.name];

        // This is the userkey that will be present within the rowData.
        if (manyToManyFieldData) {
            // Since this is a many-to-one field, we fetch the user key field of the associated model.
            const userKeyField = fieldMetadata?.relationModel?.userKeyField?.name;

            const manyToManyColVal = manyToManyFieldData.map((f: any) => f[userKeyField]);

            // TODO: change this to use an anchor tag so that on click we open that entity form view. 
            return (

                <>

                    {manyToManyColVal.length > 0 &&
                        <p>
                            <RenderLabel value={manyToManyColVal[0]} widget={column.attrs.widget}> </RenderLabel>
                            <Button text className="kaban-load-more" style={{ padding: 0, paddingBottom: "3px" }} size="small"
                                onClick={() => { }}
                                label={manyToManyColVal.length - 1 > 0 ? `...${manyToManyColVal.length - 1} more` : ""}
                            />

                        </p >
                    }
                </>

            )
        }
        else {
            return <span></span>
        }
    };
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            // className="text-sm"
            sortable={column.attrs.sortable}
            // filter={filterable}
            dataType={columnDataType}
            showFilterOperator={showFilterOperator}
            filterMatchModeOptions={filterMatchModeOptions}
            filterElement={filterTemplate}
            body={bodyTemplate}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );

};

export default SolidRelationManyToManyColumn;