"use client";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SolidDashboardVariableFilter from "./SolidDashboardVariableFilter";
import { ISolidDashboardVariableFilterRule, ISolidDashboardVariableRecord } from "./SolidDashboard";
import { Dispatch, SetStateAction, useState } from "react";
import React from "react";
import { Calendar } from "primereact/calendar";
import { Nullable } from "primereact/ts-helpers";

export interface SolidDashboardVariablesFilterDialogProps {
  dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
  setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
}

const SolidDashboardVariableFilterDialog: React.FC<SolidDashboardVariablesFilterDialogProps> = ({ dashboardVariableFilterRules, setDashboardVariableFilterRules }) => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [dates, setDates] = useState<Nullable<(Date | null)[]>>(null);

  return (
    <div className="page-header" style={{ borderBottom: '1px solid var(--primary-light-color)' }}>
      <p className="m-0 view-title">
        Dashboard
      </p>
      <div>
        <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput hideOnRangeSelection inputClassName="h-2rem" />
        {/* <Button size="small" label="Filter" outlined onClick={()=>setShowFilterDialog(true)}/> */}
      </div>

      <Dialog header={<h5>Add Variable Filter</h5>} headerClassName="px-3 py-2" contentClassName="p-0" visible={showFilterDialog} style={{ width: '65vw' }} onHide={() => { if (!showFilterDialog) return; setShowFilterDialog(false); }}>
        <SolidDashboardVariableFilter dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} closeFilterDialog={() => { setShowFilterDialog(false) }} />
      </Dialog>
    </div>
  );
}
export default SolidDashboardVariableFilterDialog;