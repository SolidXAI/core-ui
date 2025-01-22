'use client';
import React from 'react';
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { FilterMatchMode } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidIdField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN },
    ];
    const numberOfInputs = getNumberOfInputs("in");


    return (
       <>
                  <Dropdown
                      value={rule.operator}
                      onChange={(e: any) => {
                          console.log("e", e);
                          onChange(index, 'operator', e.value)
                      }}
                      options={filterMatchModeOptions}
                      optionLabel='label'
                      optionValue='value'
                      placeholder="Select Operator" className="w-full md:w-14rem" />
                  <SolidVarInputsFilterElement
                      values={rule.value}
                      onChange={(e: any) => {
                          console.log("e", e);
                          onChange(rule.id, 'value', e)
                        }}
                      numberOfInputs={numberOfInputs}
                      inputType={InputTypes.Numeric}
                      fieldMetadata={fieldMetadata}
                  >
                  </SolidVarInputsFilterElement>
              </>
    );

};

export default SolidIdField;