import React from 'react';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { InputTypes, SolidVarInputsFilterElement } from "../../SolidVarInputsFilterElement";
import { SolidListViewColumnParams } from '../../SolidListViewColumn';
import { FormEvent } from "primereact/ts-helpers";
import { FilterMatchMode } from 'primereact/api';

const SolidRelationManyToOneColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
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
        const manyToOneFieldData = rowData[column.attrs.name];

        // This is the userkey that will be present within the rowData.
        if (manyToOneFieldData) {
            // Since this is a many-to-one field, we fetch the user key field of the associated model.
            const userKeyField = fieldMetadata.relationModel.userKeyField.name;

            const manyToOneColVal = manyToOneFieldData[userKeyField];

            // TODO: change this to use an anchor tag so that on click we open that entity form view. 
            return <span>{manyToOneColVal}</span>;
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
            className="text-sm"
            sortable={column.attrs.sortable}
            filter={filterable}
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

export default SolidRelationManyToOneColumn;