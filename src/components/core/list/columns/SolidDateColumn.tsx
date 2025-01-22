'use client';
import React from 'react';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { getNumberOfInputs, SolidListViewColumnParams } from '../SolidListViewColumn';
import { FormEvent } from "primereact/ts-helpers";
import { FilterMatchMode } from 'primereact/api';

export const dateFilterMatchModeOptions = [
    { label: 'Equals', value: FilterMatchMode.EQUALS },
    { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
    { label: 'Less Than', value: FilterMatchMode.LESS_THAN },
    { label: 'Less Than Or Equal', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO },
    { label: 'Greater Than', value: FilterMatchMode.GREATER_THAN },
    { label: 'Greater Than Or Equal', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    { label: 'In', value: FilterMatchMode.IN },
    { label: 'Not In', value: FilterMatchMode.NOT_IN },
    { label: 'Between', value: FilterMatchMode.BETWEEN }
];

const SolidDateColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';
    const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        const numberOfInputs = getNumberOfInputs(options.filterModel.matchMode);

        return (
            <SolidVarInputsFilterElement
                values={options.value}
                onChange={(e: FormEvent<Date>) => options.filterCallback(e, options.index)}
                numberOfInputs={numberOfInputs}
                inputType={InputTypes.Date}
                solidListViewMetaData={solidListViewMetaData}
                fieldMetadata={fieldMetadata}
                column={column}
            >
            </SolidVarInputsFilterElement >
        )
    };

    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
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
            filterMatchModeOptions={dateFilterMatchModeOptions}
            filterElement={filterTemplate}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );

};

export default SolidDateColumn;