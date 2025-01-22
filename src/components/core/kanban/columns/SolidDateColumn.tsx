"use client";
import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from '../../kanban/SolidVarInputsFilterElement';

export const kanbanDateFilterMatchModeOptions = [
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

const SolidDateColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';


    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
    // const header = column.attrs.label ?? fieldMetadata.displayName;
    const numberOfInputs = getSolidKanbanViewNumberOfInputs("in");

    return (
        <>
            <Dropdown
                value={enumValue.operator}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'operator', e.value)
                }}
                options={kanbanDateFilterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator" className="w-full md:w-14rem" />
            <SolidKanbanVarInputsFilterElement
                values={enumValue.value}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'value', e)
                }}
                numberOfInputs={numberOfInputs}
                inputType={KanbanInputTypes.Date}
                solidListViewMetaData={solidKanbanViewMetaData}
                fieldMetadata={fieldMetadata}
            >
            </SolidKanbanVarInputsFilterElement>
        </>
    );

};

export default SolidDateColumn;