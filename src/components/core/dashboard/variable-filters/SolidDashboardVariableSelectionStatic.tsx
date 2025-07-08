"use client";
import { Dropdown } from 'primereact/dropdown';
// import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { InputTypes, SolidVarInputsFilterElement } from '../../filter/SolidVarInputsFilterElement';
import { SolidDashboardVariableFilteredVariableProps } from '../SolidDashboardVariableFilter';
import { SolidDashboardVariableVarInputsFilterElement } from '../SolidDashboardVariableVarInputsFilterElement';


// Contains the selection options for the static selection filter e.g in format "value:label"
export interface SolidDashboardVariableSelectionStaticProps extends SolidDashboardVariableFilteredVariableProps {
    selectionOptions: string[];
}

const SolidDashboardVariableSelectionStatic = ({ selectionOptions, rule, onChange }: SolidDashboardVariableSelectionStaticProps) => {

    // const filterable = column.attrs.filterable;
    // const showFilterOperator = false;
    // const columnDataType = fieldMetadata.selectionValueType === 'int' ? 'numeric' : 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" },
    ];

    const fieldMetadata = {
        selectionStaticValues: selectionOptions,
        selectionValueType: 'string', // Assuming string type for static selection
    };

    return (
        <div className='flex align-items-start gap-3 w-full'>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    onChange(rule.id, 'matchMode', e.value)
                    // console.warn('Match mode change not implemented for static selection', e.value);
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator"
                className="w-full p-inputtext-sm"
            />
            <div className='flex flex-column gap-2 w-full'>
                <SolidDashboardVariableVarInputsFilterElement
                    values={[rule.value?.includes(":") ? rule.value.split(":")[0] : null] }
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                        // console.warn('Value change not implemented for static selection', e);
                    }}
                    numberOfInputs={0}
                    inputType={InputTypes.SelectionStatic}
                    fieldMetadata={fieldMetadata}
                >
                </SolidDashboardVariableVarInputsFilterElement>
            </div>
        </div>
    );
};

export default SolidDashboardVariableSelectionStatic;