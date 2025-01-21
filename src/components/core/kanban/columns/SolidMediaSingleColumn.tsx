import React from 'react';
import { Column } from "primereact/column";
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from '../../kanban/SolidVarInputsFilterElement';

const SolidMediaSingleColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const filterable = false;
    // const showFilterOperator = false;
    // const columnDataType = undefined;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
        { label: 'Contains', value: FilterMatchMode.CONTAINS },
        { label: 'Not Contains', value: FilterMatchMode.NOT_CONTAINS },
        { label: 'Ends With', value: FilterMatchMode.ENDS_WITH },
        { label: 'Equals', value: FilterMatchMode.EQUALS },
        { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN }
    ];
    const numberOfInputs = getSolidKanbanViewNumberOfInputs("in");

    // const header = column.attrs.label ?? fieldMetadata.displayName;

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
                inputType={KanbanInputTypes.Text}
                solidListViewMetaData={solidKanbanViewMetaData}
                fieldMetadata={fieldMetadata}
            >
            </SolidKanbanVarInputsFilterElement>
        </>
    );

};

export default SolidMediaSingleColumn;