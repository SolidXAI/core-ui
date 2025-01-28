"use client";
import React from 'react';
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { FilterMatchMode } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidIdField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" },
    ];
    const numberOfInputs = getNumberOfInputs(rule.matchMode);


    return (
       <>
                  <Dropdown
                      value={rule.matchMode}
                      onChange={(e: any) => {
                          console.log("e", e);
                          onChange(rule.id, 'matchMode', e.value)
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