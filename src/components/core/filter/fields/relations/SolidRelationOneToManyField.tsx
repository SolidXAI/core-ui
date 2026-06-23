

import { SolidFilterFieldsParams, getNumberOfInputs } from '../../../../../components/core/filter/SolidFilterFields';
import { SolidVarInputsFilterElement, InputTypes } from '../../../../../components/core/filter/SolidVarInputsFilterElement';
import { SolidSelect } from "../../../../shad-cn-ui/SolidSelect";

const SolidRelationOneToManyField = ({
    fieldMetadata,
    onChange,
    index,
    rule,
}: SolidFilterFieldsParams) => {

    const filterMatchModeOptions = [
        { label: 'In', value: '$in' },
        { label: 'Not In', value: '$notIn' }
    ];

    const noInputOperators = ['$null', '$notNull'];
    const needsInput = !noInputOperators.includes(rule.matchMode);
    const numberOfInputs = needsInput ? getNumberOfInputs(rule.matchMode) : 0;

    return (
        <div className="flex flex-col items-start gap-2 md:flex-row md:gap-1">
            {/* Operator */}
            <div className="w-full md:w-1/2 px-0 md:pr-0 md:pl-0 p-0">
                <SolidSelect
                    value={rule.matchMode}
                    native={false}
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
                    className="p-inputtext-sm w-full"
                />
            </div>

            {/* MultiSelect input */}
            <div className="flex flex-col gap-2 w-full md:w-1/2 px-0 md:pl-2 md:pr-0">
                <SolidVarInputsFilterElement
                    values={rule.value}
                    onChange={(value: any) => {
                        onChange(index, 'value', value);
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.RelationOneToMany}
                    fieldMetadata={fieldMetadata}
                />
            </div>
        </div>
    );
};

export default SolidRelationOneToManyField;
