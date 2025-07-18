"use client";
import { Dialog } from "primereact/dialog";
import SolidDashboardVariableFilter from "./SolidDashboardVariableFilter";
import { ISolidDashboardVariableFilterRule } from "./SolidDashboard";
import { Dispatch, SetStateAction, useState } from "react";
import React from "react";
import { Calendar } from "primereact/calendar";
import { Nullable } from "primereact/ts-helpers";
import { SqlExpression } from "@/types/solid-core";
import styles from './SolidDashboard.module.css'
export interface SolidDashboardVariablesFilterDialogProps {
  dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
  setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
  setFilters: Dispatch<SetStateAction<SqlExpression[]>>;
}

const SolidDashboardVariableFilterDialog: React.FC<SolidDashboardVariablesFilterDialogProps> = ({ dashboardVariableFilterRules, setDashboardVariableFilterRules, setFilters }) => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [dates, setDates] = useState<Nullable<(Date | null)[]>>(null);

  // TODO [HP]: Currently this is static, we need this to be dynamic how we are invoking setFilters below has to be fully dynamic...
  return (
    <div className="page-header" style={{ borderBottom: '1px solid var(--primary-light-color)' }}>
      <p className="m-0 view-title">
        Dashboard
      </p>
      <div>
        <div className={`flex align-items-center ${styles.SolidDashboardDateRangeFilterWrapper}`}>
          <Calendar value={dates} onChange={(e) => {
            console.log(`Calendar changed values are: `);
            console.log(e.value);
            const newDates = e.value as Date[] | null;
            setDates(newDates);

            if (newDates && newDates.length === 2 && newDates[0] && newDates[1]) {
              const filter: SqlExpression = {
                variableName: 'dashboardDate',
                // @ts-ignore
                operator: '$between',
                value: [
                  newDates[0].toISOString().split('T')[0],
                  newDates[1].toISOString().split('T')[0]
                ]
              };
              setFilters(prev => {
                // Remove any existing dashboardDate filter and replace with the new one
                // const filtered = prev.filter(f => f.variableName !== 'dashboardDate');
                return [filter];
              });
            }

          }} selectionMode="range" readOnlyInput hideOnRangeSelection inputClassName="h-2rem" className={styles.SolidDashboardDateRangeFilter} />
          <div className="px-2">
            <i className="pi pi-calendar opacity-50"></i>
          </div>
        </div>
        {/* <Button size="small" label="Filter" outlined onClick={()=>setShowFilterDialog(true)}/> */}
      </div>

      <Dialog header={<h5>Add Variable Filter</h5>} headerClassName="px-3 py-2" contentClassName="p-0" visible={showFilterDialog} style={{ width: '65vw' }} onHide={() => { if (!showFilterDialog) return; setShowFilterDialog(false); }}>
        <SolidDashboardVariableFilter dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} closeFilterDialog={() => { setShowFilterDialog(false) }} />
      </Dialog>
    </div>
  );
}

export default SolidDashboardVariableFilterDialog;
