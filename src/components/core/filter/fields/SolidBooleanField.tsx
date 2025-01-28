"use client";
import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SolidFilterFieldsParams } from '../SolidFilterFields';
import { FilterMatchMode } from 'primereact/api';

const SolidBooleanField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'boolean';

    const booleanOptions = [
        { label: 'true', value: true },
        { label: 'false', value: false },
    ];
    const filterMatchModeOptions = [
        { label: 'Equals', value: "$eqi" },
  ];


    // const header = column.attrs.label ?? fieldMetadata.displayName;


    return (
        <>
            <Dropdown
                value={rule.matchMode}
                onChange={(e: any) => {
                    console.log("e", e);
                    onChange(rule.id, 'matchMode', e.value)
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator" className="w-full md:w-14rem" />
            <Dropdown
                value={rule.value}
                options={booleanOptions}
                onChange={(e: any) => {
                    console.log("e", e);
                    onChange(rule.id, 'value', e.value)
                }}
                placeholder="Select"
                className="p-column-filter"
            />
        </>
    );
};

export default SolidBooleanField;