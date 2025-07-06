"use client";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { SolidDashboardVariableRecord, SolidDashboardVariableType } from "./SolidDashboard";
import { SolidDashboardVariablesFilterProps } from "./SolidDashboardVariableFilterWrapper";
import SolidDashboardVariableDate from "./variable-filters/SolidDashboardVariableDate";
import SolidDashboardVariableSelectionStatic from "./variable-filters/SolidDashboardVariableSelectionStatic";
import SolidDashboardVariableSelectionDynamic from "./variable-filters/SolidDashboardVariableSelectionDynamic";

export interface SolidDashboardVariableFilterProps {
    dashboardVariable: SolidDashboardVariableRecord;
}

const SolidDashboardVariableFilteredVariable: React.FC<SolidDashboardVariableFilterProps> = ({ dashboardVariable }) => {
    switch (dashboardVariable.type) {
        case SolidDashboardVariableType.DATE:
            return <SolidDashboardVariableDate />;
        case SolidDashboardVariableType.SELECTION_STATIC:
            return <SolidDashboardVariableSelectionStatic />;
        case SolidDashboardVariableType.SELECTION_DYNAMIC:
            return <SolidDashboardVariableSelectionDynamic />;
        default:
            return <></>
    }
}

const SolidDashboardVariableFilterRule: React.FC<SolidDashboardVariablesFilterProps> = ({ dashboardVariables }) => {
    const [selectedVariable, setSelectedVariable] = useState<SolidDashboardVariableRecord | null>(null);
    return (
        <div className='flex align-items-center gap-3'>
            <div className='formgrid grid w-full'>
                <div className='col-4'>
                    <Dropdown
                        value = {selectedVariable}
                        onChange={(e) => {
                            console.log(e.value, 'selected variable');
                            setSelectedVariable(e.value);
                        }}
                        options={dashboardVariables}
                        optionLabel='name'
                        placeholder="Select Dashboard Variable"
                        className='w-full p-inputtext-sm'
                    />
                </div>
                <div className='col-8'>
                    <div className='formgrid grid w-full'>
                        {selectedVariable ?
                            <div className='col-12'>
                                <SolidDashboardVariableFilteredVariable dashboardVariable={selectedVariable} />
                            </div>
                            : <>
                                <div className='col-6'>
                                    <InputText
                                        disabled
                                        value={''}
                                        placeholder="operator"
                                        className='w-full p-inputtext-sm'
                                    />
                                </div>
                                <div className='col-6'>
                                    <InputText
                                        disabled
                                        value={''}
                                        placeholder="value"
                                        className='w-full p-inputtext-sm'
                                    />
                                </div>
                            </>
                        }

                    </div>
                </div>
            </div>
            <div className='formgrid grid'>
                <div className='col-4 px-0 flex align-items-center'>
                    <Button text severity='secondary' icon="pi pi-plus" size='small' onClick={() => { console.log("Add a variable filter rule") }} className='solid-filter-action-btn' />
                </div>
                <div className='col-4 px-0 flex align-items-center'>
                    <Button text severity='secondary' icon="pi pi-trash" size='small' onClick={() => { console.log("Delete a variable filter rule") }} className='solid-filter-action-btn' />
                </div>
            </div>
        </div>
    )
}

export const SolidDashboardVariableFilter: React.FC<SolidDashboardVariablesFilterProps> = ({ dashboardVariables }) => {
    return (
        <div className=''>
            <SolidDashboardVariableFilterRule dashboardVariables={dashboardVariables} />
            <div className='flex gap-3 mt-3'>
                <Button label="Apply" size="small" onClick={() => { console.log("Dashboard variable filter applied") }} type="submit" />
                <Button type='button' label='Cancel' outlined size='small' onClick={() => { console.log("Dashboard variable filter cancelled") }} />
            </div>
        </div>
    );
}
export default SolidDashboardVariableFilter;