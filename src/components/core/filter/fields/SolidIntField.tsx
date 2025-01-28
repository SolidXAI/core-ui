"use client";
import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { Dropdown } from 'primereact/dropdown';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidIntField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const filterMatchModeOptions = [
        { label: 'Equals', value: "$eqi" },
        { label: 'Not Equals', value: "$nei" },
        { label: 'Less Than', value: "$lt" },
        { label: 'Less Than Or Equal', value: "$lte" },
        { label: 'Greater Than', value: "$gt" },
        { label: 'Greater Than Or Equal', value: "$gte" },
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" },
        { label: 'Between', value: "$between" }
    ];



    // const header = column.attrs.label ?? fieldMetadata.displayName;
    const numberOfInputs = getNumberOfInputs(rule.matchMode);

    return (
        <>
                    <Dropdown
                        value={rule.matchMode}
                        onChange={(e: any) => {
                            console.log("e", e);
                            // updateEnumValues(index, 'operator', e.value)
                            onChange(rule.id, 'matchMode', e.value)
                        }}
                        options={filterMatchModeOptions}
                        optionLabel='label'
                        optionValue='value'
                        placeholder="Select Operator" className="w-full filter-small-input md:w-14rem" />
                    <SolidVarInputsFilterElement
                        values={rule.value}
                        onChange={(e: any) => {
                            console.log("e", e);
                            // updateEnumValues(index, 'value', e)
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

export default SolidIntField;