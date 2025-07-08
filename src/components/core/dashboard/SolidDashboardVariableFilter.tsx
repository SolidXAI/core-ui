"use client";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dispatch, SetStateAction, useState } from "react";
import { ISolidDashboardVariableFilterRule, SolidDashboardVariableType } from "./SolidDashboard";
import { SolidDashboardVariablesFilterDialogProps } from "./SolidDashboardVariableFilterWrapper";
import SolidDashboardVariableDate from "./variable-filters/SolidDashboardVariableDate";
import SolidDashboardVariableSelectionDynamic from "./variable-filters/SolidDashboardVariableSelectionDynamic";
import SolidDashboardVariableSelectionStatic from "./variable-filters/SolidDashboardVariableSelectionStatic";

export interface SolidDashboardVariableFilteredVariableProps {
    dashboardVariableFilterRule: ISolidDashboardVariableFilterRule;
    // setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;

}
export interface SolidDashboardVariableFilterRuleProps {
    dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
    setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
}
export interface SolidDashboardVariableFilterProps {
    dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
    setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
    closeFilterDialog: () => void;
}

const SolidDashboardVariableFilteredVariable: React.FC<SolidDashboardVariableFilteredVariableProps> = ({ dashboardVariableFilterRule }) => {
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

const SolidDashboardVariableFilterRule: React.FC<SolidDashboardVariableFilterRuleProps> = ({ dashboardVariableFilterRules, setDashboardVariableFilterRules }) => {
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

export const SolidDashboardVariableFilter: React.FC<SolidDashboardVariableFilterProps> = ({ dashboardVariableFilterRules, setDashboardVariableFilterRules, closeFilterDialog }) => {
    return (
        <div className=''>
            <SolidDashboardVariableFilterRule dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} />
            <div className='flex gap-3 mt-3'>
                <Button label="Apply" size="small" onClick={() => { console.log("transform rules pending ...") }} type="submit" />
                <Button type='button' label='Cancel' outlined size='small' onClick={closeFilterDialog} />
            </div>
        </div>
    );
}
export default SolidDashboardVariableFilter;