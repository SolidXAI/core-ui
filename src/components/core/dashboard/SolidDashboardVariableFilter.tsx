"use client";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { ISolidDashboardVariableFilterRule, SolidDashboardVariableType } from "./SolidDashboard";
import { SolidDashboardVariablesFilterProps } from "./SolidDashboardVariableFilterWrapper";
import SolidDashboardVariableDate from "./variable-filters/SolidDashboardVariableDate";
import SolidDashboardVariableSelectionDynamic from "./variable-filters/SolidDashboardVariableSelectionDynamic";
import SolidDashboardVariableSelectionStatic from "./variable-filters/SolidDashboardVariableSelectionStatic";

export interface SolidDashboardVariableFilterProps {
    dashboardVariableFilterRule: ISolidDashboardVariableFilterRule;
}

const SolidDashboardVariableFilteredVariable: React.FC<SolidDashboardVariableFilterProps> = ({ dashboardVariableFilterRule }) => {
    switch (dashboardVariableFilterRule.type) {
        case SolidDashboardVariableType.DATE:
            return <SolidDashboardVariableDate />;
        case SolidDashboardVariableType.SELECTION_STATIC:
            return <SolidDashboardVariableSelectionStatic selectionOptions={dashboardVariableFilterRule.selectionStaticValues ?? []} />;
        case SolidDashboardVariableType.SELECTION_DYNAMIC:
            return <SolidDashboardVariableSelectionDynamic />;
        default:
            return <></>
    }
}

const SolidDashboardVariableFilterRule: React.FC<SolidDashboardVariablesFilterProps> = ({ dashboardVariableFilterRules }) => {
    const [selectedVariable, setSelectedVariable] = useState<ISolidDashboardVariableFilterRule | null>(null);
    return (
        <>
            {dashboardVariableFilterRules.map((rule) => (
                <div className='flex align-items-center gap-3'>
                    <div className='formgrid grid w-full'>
                        <div className='col-4'>
                            <div className="w-full p-inputtext-sm border rounded px-2 py-1 bg-gray-100">
                                {rule?.name || 'No variable selected'}
                            </div>                </div>
                        <div className='col-8'>
                            <div className='formgrid grid w-full'>
                                {
                                    <div className='col-12'>
                                        <SolidDashboardVariableFilteredVariable dashboardVariableFilterRule={rule} />
                                    </div>
                                }

                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}

export const SolidDashboardVariableFilter: React.FC<SolidDashboardVariablesFilterProps> = ({ dashboardVariableFilterRules }) => {
    return (
        <div className=''>

            <SolidDashboardVariableFilterRule dashboardVariableFilterRules={dashboardVariableFilterRules} />
            <div className='flex gap-3 mt-3'>
                <Button label="Apply" size="small" onClick={() => { console.log("Dashboard variable filter applied") }} type="submit" />
                <Button type='button' label='Cancel' outlined size='small' onClick={() => { console.log("Dashboard variable filter cancelled") }} />
            </div>
        </div>
    );
}
export default SolidDashboardVariableFilter;