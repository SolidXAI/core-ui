"use client";

import { SolidFilterFieldsParams, getNumberOfInputs } from '../../SolidFilterFields';
import { SolidVarInputsFilterElement, InputTypes } from '@/components/core/filter/SolidVarInputsFilterElement';
import { Dropdown } from 'primereact/dropdown';

const SolidRelationManyToManyField = ({
    fieldMetadata,
    onChange,
    index,
    rule,
}: SolidFilterFieldsParams) => {

    const filterMatchModeOptions = [
        { label: 'In', value: '$in' },
        { label: 'Not In', value: '$notIn' }
        // { label: 'Is Empty', value: '$null' },
        // { label: 'Is Not Empty', value: '$notNull' },
    ];

    const noInputOperators = ['$null', '$notNull'];
    const needsInput = !noInputOperators.includes(rule.matchMode);
    const numberOfInputs = needsInput ? getNumberOfInputs(rule.matchMode) : 0;

    return (
        <div className="flex align-items-start gap-3 w-full">
            {/* Operator */}
            <Dropdown
                value={rule.matchMode}
                onChange={(e) => {
                    onChange(rule.id, 'matchMode', e.value);
                    // Clear value if switching to no-input operator
                    if (noInputOperators.includes(e.value)) {
                        onChange(rule.id, 'value', []);
                    }
                }}
                options={filterMatchModeOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Operator"
                className="w-full p-inputtext-sm"
            />

            {/* MultiSelect input */}
            <div className="flex flex-column gap-2 w-full">
                <SolidVarInputsFilterElement
                    values={rule.value}
                    onChange={(value: any) => {
                        onChange(index, 'value', value);
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.RelationManyToMany}
                    fieldMetadata={fieldMetadata}
                />
            </div>
        </div>
    );
};

export default SolidRelationManyToManyField;