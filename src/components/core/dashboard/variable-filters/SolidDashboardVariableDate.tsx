"use client";
import { Dropdown } from 'primereact/dropdown';
import { InputTypes, SolidVarInputsFilterElement } from '../../filter/SolidVarInputsFilterElement';
import { SolidDashboardVariableFilteredVariableProps } from '../SolidDashboardVariableFilter';
import { SolidDashboardVariableVarInputsFilterElement } from '../SolidDashboardVariableVarInputsFilterElement';

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

const SolidDashboardVariableDate: React.FC<SolidDashboardVariableFilteredVariableProps> = ({rule, onChange}) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';


    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
    // const header = column.attrs.label ?? fieldMetadata.displayName;
    // const numberOfInputs = getNumberOfInputs(rule.matchMode);

    return (
        <div className='flex align-items-start gap-3 w-full'>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    onChange(rule.id, 'matchMode', e.value)
                    // console.log('Match mode changed:', e.value);
                }}
                options={dateFilterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator"
                className="w-full p-inputtext-sm"
            />
            <div className='flex flex-column gap-2 w-full'>
                <SolidDashboardVariableVarInputsFilterElement
                    values={[rule.value]} //FIXME: This should be an array of date values, but currently it's a single value
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                        // console.log('Value changed:', e);
                    }}
                    numberOfInputs={0}
                    inputType={InputTypes.Date}
                    fieldMetadata={null}
                >
                </SolidDashboardVariableVarInputsFilterElement>
            </div>
        </div>
    );

};

export default SolidDashboardVariableDate;
