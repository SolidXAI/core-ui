import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SolidKanbanViewColumnParams } from '../SolidKanbanViewSearchColumn';
import { FilterMatchMode } from 'primereact/api';

const SolidBooleanColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'boolean';

    const booleanOptions = [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
    ];
    const filterMatchModeOptions = [
        { label: 'Equals', value: FilterMatchMode.EQUALS },
  ];


    // const header = column.attrs.label ?? fieldMetadata.displayName;


    return (
        <>
            <Dropdown
                value={enumValue.operator}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'operator', e.value)
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator" className="w-full md:w-14rem" />
            <Dropdown
                value={enumValue.value}
                options={booleanOptions}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'value', e)
                }}
                placeholder="Select"
                className="p-column-filter"
            />
        </>
    );
};

export default SolidBooleanColumn;