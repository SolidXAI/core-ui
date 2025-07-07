"use client";
import { Dropdown } from 'primereact/dropdown';
import { SolidDashboardSelectionDynamicFilterElement } from './SolidDashboardSelectionDynamicFilterElement';
// import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidDashboardVariableSelectionDynamicValue = () => {
    return (
        <SolidDashboardSelectionDynamicFilterElement value={null} updateInputs={null} index={0} variableId={null} />
    )
}

const SolidDashboardVariableSelectionDynamic = ({ }) => {
    // const showFilterOperator = false;
    // const columnDataType = fieldMetadata.selectionValueType === 'int' ? 'numeric' : 'text';
    const filterMatchModeOptions = [
        { label: 'In', value: "$in" },
        { label: 'Not In', value: "$notIn" },
    ];
    // const numberOfInputs = getNumberOfInputs(rule.matchMode);
    // const fieldMetadata = {
    //     selectionDynamicValues: [], // Placeholder for dynamic selection values
    //     selectionValueType: 'string', // Assuming string type for dynamic selection
    // };



    return (
        <div className='flex align-items-start gap-3 w-full'>
            <Dropdown
                value={null}
                onChange={(e: any) => {
                    // onChange(rule.id, 'matchMode', e.value)
                    console.warn('Match mode change not implemented for dynamic selection', e.value);
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator"
                className="w-full p-inputtext-sm"
            />
            <div className='flex flex-column gap-2 w-full'>
                <SolidDashboardVariableSelectionDynamicValue />
            </div>
        </div>
    );

};

export default SolidDashboardVariableSelectionDynamic;