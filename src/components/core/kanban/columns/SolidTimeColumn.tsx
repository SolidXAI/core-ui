import React from 'react';
import { kanbanDateFilterMatchModeOptions } from './SolidDateColumn';
import { Dropdown } from 'primereact/dropdown';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from '../../kanban/SolidVarInputsFilterElement';
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';

const SolidTimeColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
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
                inputType={KanbanInputTypes.Time}
                solidListViewMetaData={solidKanbanViewMetaData}
                fieldMetadata={fieldMetadata}
            >
            </SolidKanbanVarInputsFilterElement></>
    );

};

export default SolidTimeColumn;