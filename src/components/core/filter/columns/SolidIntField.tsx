'use client';
import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { Dropdown } from 'primereact/dropdown';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidIntField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
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
    const numberOfInputs = getNumberOfInputs("in");

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