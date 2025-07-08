"use client";
import { Button } from "primereact/button";
import { Dispatch, SetStateAction, useState } from "react";
import { ISolidDashboardVariableFilterRule, SolidDashboardVariableType } from "./SolidDashboard";
import SolidDashboardVariableDate from "./variable-filters/SolidDashboardVariableDate";
import SolidDashboardVariableSelectionDynamic from "./variable-filters/SolidDashboardVariableSelectionDynamic";
import SolidDashboardVariableSelectionStatic from "./variable-filters/SolidDashboardVariableSelectionStatic";

export interface SolidDashboardVariableFilteredVariableProps {
    rule: ISolidDashboardVariableFilterRule;
    onChange: (id: number, key: keyof ISolidDashboardVariableFilterRule, value: any) => void;
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

// Create a function onChange func which return a function that updates the state of the dashboardVariableFilterRules  and takes id, key, value as parameters
function getRuleOnChangeFunc(
    setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>
) {
    return (
        id: number,
        key: keyof ISolidDashboardVariableFilterRule,
        value: any,
    ) => {
        setDashboardVariableFilterRules((prevRules) =>
            prevRules.map((r) => (r.id === id ? { ...r, [key]: value } : r))
        );
        console.log("Updated rule:", id, key, value);
    };
}

const SolidDashboardVariableFilteredVariable: React.FC<SolidDashboardVariableFilteredVariableProps> = ({ rule: dashboardVariableFilterRule, onChange }) => {
    switch (dashboardVariableFilterRule.type) {
        case SolidDashboardVariableType.DATE:
            return <SolidDashboardVariableDate rule={dashboardVariableFilterRule} onChange={onChange} />;
        case SolidDashboardVariableType.SELECTION_STATIC:
            return <SolidDashboardVariableSelectionStatic selectionOptions={dashboardVariableFilterRule.selectionStaticValues ?? []}  rule={dashboardVariableFilterRule} onChange={onChange} />;
        case SolidDashboardVariableType.SELECTION_DYNAMIC:
            return <SolidDashboardVariableSelectionDynamic rule={dashboardVariableFilterRule} onChange={onChange}  />;
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
                                        <SolidDashboardVariableFilteredVariable rule={rule} onChange={getRuleOnChangeFunc(setDashboardVariableFilterRules)} />
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