"use client";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SolidDashboardVariableFilter from "./SolidDashboardVariableFilter";
import { ISolidDashboardVariableFilterRule, ISolidDashboardVariableRecord } from "./SolidDashboard";
export interface SolidDashboardVariablesFilterProps {
  dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
}

const SolidDashboardVariableFilterWrapper: React.FC<SolidDashboardVariablesFilterProps> = ({dashboardVariableFilterRules}) => {
  return (
      <Dialog header={false} className="solid-global-search-filter" showHeader={false} visible={true} style={{ width: '65vw' }} onHide={() => { console.log('Dialog closed'); }}>
        <div className="flex align-items-center justify-content-between px-3">
          <h5 className="solid-custom-title m-0">Add Variable Filter</h5>
          <Button icon="pi pi-times" rounded text aria-label="Cancel" type="reset" size="small" onClick={() => {console.log("Cancel clicked")}} />
        </div>
        <Divider className="m-0" />
        <SolidDashboardVariableFilter dashboardVariableFilterRules={dashboardVariableFilterRules}/>
      </Dialog>
  );
}
export default SolidDashboardVariableFilterWrapper;