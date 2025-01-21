import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import { Dropdown } from 'primereact/dropdown';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from '../../kanban/SolidVarInputsFilterElement';

const SolidIntColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'numeric';
    const filterMatchModeOptions = [
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
                options={filterMatchModeOptions}
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
                inputType={KanbanInputTypes.Numeric}
                solidListViewMetaData={solidKanbanViewMetaData}
                fieldMetadata={fieldMetadata}
            >
            </SolidKanbanVarInputsFilterElement>
        </>
    );
};

export default SolidIntColumn;