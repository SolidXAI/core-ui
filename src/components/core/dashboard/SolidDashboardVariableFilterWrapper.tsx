"use client";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SolidDashboardVariableFilter from "./SolidDashboardVariableFilter";
import { ISolidDashboardVariableFilterRule, ISolidDashboardVariableRecord } from "./SolidDashboard";
import { Dispatch, SetStateAction } from "react";
import React from "react";
export interface SolidDashboardVariablesFilterDialogProps {
  dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
  setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
}

const SolidDashboardVariableFilterDialog: React.FC<SolidDashboardVariablesFilterDialogProps> = ({dashboardVariableFilterRules, setDashboardVariableFilterRules}) => {
  const [showFilterDialog, setShowFilterDialog] = React.useState(true);
  return (
      <Dialog header={false} className="solid-global-search-filter" showHeader={false} visible={showFilterDialog} style={{ width: '65vw' }} onHide={() => { if (!showFilterDialog) return; setShowFilterDialog(false); }}>
        <div className="flex align-items-center justify-content-between px-3">
          <h5 className="solid-custom-title m-0">Add Variable Filter</h5>
          <Button icon="pi pi-times" rounded text aria-label="Cancel" type="reset" size="small" onClick={() => {setShowFilterDialog(false)}} />
        </div>
        <Divider className="m-0" />
        <SolidDashboardVariableFilter dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} closeFilterDialog={() => {setShowFilterDialog(false)}}/>
      </Dialog>
  );
}
export default SolidDashboardVariableFilterDialog;