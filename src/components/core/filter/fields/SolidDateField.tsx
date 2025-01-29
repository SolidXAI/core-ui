"use client";
import { Dropdown } from 'primereact/dropdown';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

export const dateFilterMatchModeOptions = [
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

const SolidDateField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';


    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
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
                inputType={InputTypes.Date}
                fieldMetadata={fieldMetadata}
            >
            </SolidVarInputsFilterElement>
        </>
    );

};

export default SolidDateField;