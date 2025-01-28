"use client";
import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { Dropdown } from 'primereact/dropdown';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidShortTextField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'Starts With', value: "$startsWithi" },
        { label: 'Contains', value: "$containsi" },
        { label: 'Not Contains', value: "$notContains" },
        { label: 'Ends With', value: "$endsWith" },
        { label: 'Equals', value: "$eqi" },
        { label: 'Not Equals', value: "$nei" },
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" }
    ];

    // const header = column.attrs.label ?? fieldMetadata.displayName;
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
                inputType={InputTypes.Text}
                fieldMetadata={fieldMetadata}
            >
            </SolidVarInputsFilterElement>
        </>
    );

};

export default SolidShortTextField;