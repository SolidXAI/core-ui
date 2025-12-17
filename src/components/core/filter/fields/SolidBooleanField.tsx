"use client";
import { Dropdown } from 'primereact/dropdown';
import { SolidFilterFieldsParams } from '../SolidFilterFields';

const SolidBooleanField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'boolean';

    const booleanOptions = [
        { label: 'true', value: true },
        { label: 'false', value: false },
    ];
    const filterMatchModeOptions = [
        { label: 'Equals', value: "$eq" },
    ];


    // const header = column.attrs.label ?? fieldMetadata.displayName;


    return (
        <div className='flex flex-column md:flex-row  align-items-start gap-2 md:gap-3 w-full'>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    onChange(rule.id, 'matchMode', e.value)
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator"
                className="w-full p-inputtext-sm col-12 md:col-6"
            />
            <div className='flex flex-column gap-2 w-full col-12 md:col-6 pl-0 md:pl-2'>
                <Dropdown
                    value={rule.value}
                    options={booleanOptions}
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e.value)
                    }}
                    placeholder="Select"
                    className="p-column-filter"
                />
            </div>
        </div>
    );
};

export default SolidBooleanField;