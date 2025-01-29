"use client";
import React, { useEffect, useState } from 'react';
import { dateFilterMatchModeOptions } from './SolidDateField';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { Dropdown } from 'primereact/dropdown';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidDatetimeField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';

    const [numberOfInputs,setNumberOfInputs] = useState<any>(null);
    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
    // const header = column.attrs.label ?? fieldMetadata.displayName;
    useEffect(()=>{
        setNumberOfInputs(getNumberOfInputs(rule.matchMode))
    },[rule])
    // const numberOfInputs = getNumberOfInputs(rule.matchMode);

    return (
        <>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    console.log("e", e);
                    onChange(rule.id, 'matchMode', e.value)
                }}
                options={dateFilterMatchModeOptions}
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
                inputType={InputTypes.DateTime}
                fieldMetadata={fieldMetadata}
            >
            </SolidVarInputsFilterElement></>
    );

};

export default SolidDatetimeField;