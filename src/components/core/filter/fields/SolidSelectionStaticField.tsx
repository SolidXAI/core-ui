"use client";
import { Dropdown } from 'primereact/dropdown';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';


const SolidSelectionStaticField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {

    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = fieldMetadata.selectionValueType === 'int' ? 'numeric' : 'text';
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
                    onChange(rule.id, 'matchMode', e.value)
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator" className="w-full md:w-14rem" />
            <SolidVarInputsFilterElement
                values={rule.value}
                onChange={(e: any) => {
                    onChange(rule.id, 'value', e)
                }}
                numberOfInputs={numberOfInputs}
                inputType={InputTypes.SelectionStatic}
                fieldMetadata={fieldMetadata}
            >
            </SolidVarInputsFilterElement>
        </>
    );
};

export default SolidSelectionStaticField;