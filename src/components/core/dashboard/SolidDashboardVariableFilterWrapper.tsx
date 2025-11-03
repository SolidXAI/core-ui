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
import { Tooltip } from "primereact/tooltip";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
export interface SolidDashboardVariablesFilterDialogProps {
  dashboardVariableFilterRules: ISolidDashboardVariableFilterRule[];
  setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>;
  setFilters: Dispatch<SetStateAction<SqlExpression[]>>;
  data: any
}

const SolidDashboardVariableFilterDialog: React.FC<SolidDashboardVariablesFilterDialogProps> = ({ dashboardVariableFilterRules, setDashboardVariableFilterRules, setFilters, data }) => {

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [dates, setDates] = useState<Nullable<(Date | null)[]>>(null);

  // Selection Static Values
  const [selectionStaticValues, setSelectionStaticValues] = useState<string[]>([]);
  const [filteredStaticItems, setFilteredStaticItems] = useState<string[]>([]);
  const staticItems = ["Value 1", "Value 2", "Value 3"];

  // Selection Dynamic Values
  const [selectionDynamicValues, setSelectionDynamicValues] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<string[]>([]);
  const allItems = ["Value1", "Value2", "Value3"];

  // Static search
  const searchStatic = (event: AutoCompleteCompleteEvent) => {
    const query = event.query.toLowerCase();
    const filtered = staticItems.filter(item =>
      item.toLowerCase().includes(query)
    );
    setFilteredStaticItems(filtered);
  };

  // Dynamic search
  const searchDynamic = (event: AutoCompleteCompleteEvent) => {
    const query = event.query.toLowerCase();
    const filtered = allItems.filter(item =>
      item.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  };


  // TODO [HP]: Currently this is static, we need this to be dynamic how we are invoking setFilters below has to be fully dynamic...
  return (
    <div className="page-header" style={{ borderBottom: '1px solid var(--primary-light-color)' }}>
      <p className={`view-title flex align-items-center gap-1 ${styles.SolidDashboardTitle}`}>
        {data?.records[0]?.displayName ? data?.records[0]?.displayName : data?.records[0]?.name}
        {data?.records[0]?.description &&
          <>
            <Tooltip className='solid-field-tooltip' target=".solid-field-tooltip-icon" />
            <i className="pi pi-info-circle solid-field-tooltip-icon"
              data-pr-tooltip={data?.records[0]?.description}
              data-pr-position={'right'}
            />
          </>
        }
      </p>
      <div className="flex align-items-center gap-3">
        <div className={`flex align-items-center ${styles.SolidDashboardDateRangeFilterWrapper}`}>
          <Calendar value={dates} onChange={(e) => {
            console.log(`Calendar changed values are: `);
            console.log(e.value);
            const newDates = e.value as Date[] | null;
            setDates(newDates);

            if (newDates && newDates.length === 2 && newDates[0] && newDates[1]) {
              const filter: SqlExpression = {
                variableName: data?.records[0]?.dashboardVariables[0]?.variableName,
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

          }} selectionMode="range" readOnlyInput hideOnRangeSelection inputStyle={{height: 36.38}} className={styles.SolidDashboardDateRangeFilter} />
          <div className="px-2">
            <i className="pi pi-calendar opacity-50"></i>
          </div>
        </div>
         {/* Static Selection */}
      <AutoComplete
        value={selectionStaticValues}
        suggestions={filteredStaticItems}
        completeMethod={searchStatic}
        onChange={(e: AutoCompleteChangeEvent) => setSelectionStaticValues(e.value)}
        multiple
        dropdown
        placeholder="Selection Static Field"
        className="solid-standard-autocomplete"
        style={{minHeight: 38}}
      />

      {/* Dynamic Selection */}
      <AutoComplete
        value={selectionDynamicValues}
        suggestions={filteredItems}
        completeMethod={searchDynamic}
        onChange={(e: AutoCompleteChangeEvent) => setSelectionDynamicValues(e.value)}
        multiple
        dropdown
        placeholder="Selection Dynamic Field"
        className="solid-standard-autocomplete"
        style={{minHeight: 38}}
      />
        {/* <Button size="small" label="Filter" outlined onClick={()=>setShowFilterDialog(true)}/> */}
      </div>

      <Dialog header={<h5>Add Variable Filter</h5>} headerClassName="px-3 py-2" contentClassName="p-0" visible={showFilterDialog} style={{ width: '65vw' }} onHide={() => { if (!showFilterDialog) return; setShowFilterDialog(false); }}>
        <SolidDashboardVariableFilter dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} closeFilterDialog={() => { setShowFilterDialog(false) }} />
      </Dialog>
    </div>
  );
}

export default SolidDashboardVariableFilterDialog;
