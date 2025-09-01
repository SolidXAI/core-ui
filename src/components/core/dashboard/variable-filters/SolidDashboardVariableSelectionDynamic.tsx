"use client";
import { Dropdown } from 'primereact/dropdown';
import { SolidDashboardVariableFilteredVariableProps } from '../SolidDashboardVariableFilter';
import { InputTypes, SolidDashboardVariableVarInputsFilterElement } from '../SolidDashboardVariableVarInputsFilterElement';
import { getNumberOfInputs } from '../dashboard-utils';
// import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidDashboardVariableSelectionDynamic = ({ rule, onChange }: SolidDashboardVariableFilteredVariableProps) => {
    // const showFilterOperator = false;
    // const columnDataType = fieldMetadata.selectionValueType === 'int' ? 'numeric' : 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" },
    ];
    const numberOfInputs = getNumberOfInputs(rule.matchMode);
    const fieldMetadata = {
        selectionDynamicValues: [], // Placeholder for dynamic selection values
        selectionValueType: 'string', // Assuming string type for dynamic selection
    };

    return (
        <div className='flex align-items-start gap-3 w-full'>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    onChange(rule.id, 'matchMode', e.value)
                    // console.warn('Match mode change not implemented for dynamic selection', e.value);
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator"
                className="w-full p-inputtext-sm"
            />
            <div className='flex flex-column gap-2 w-full'>
                <SolidDashboardVariableVarInputsFilterElement
                    values={[rule.value?.includes(":") ? rule.value.split(":")[0] : null]}
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                        // console.warn('Value change not implemented for static selection', e);
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.SelectionDynamic}
                    fieldMetadata={fieldMetadata}
                >
                </SolidDashboardVariableVarInputsFilterElement>

            </div>
        </div>
    );

};

export default SolidDashboardVariableSelectionDynamic;