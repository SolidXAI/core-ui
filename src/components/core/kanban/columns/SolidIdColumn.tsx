import React from 'react';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { FilterMatchMode } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';

const SolidIdColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN },
    ];
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

export default SolidIdColumn;