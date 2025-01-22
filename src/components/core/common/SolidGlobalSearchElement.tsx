"use client";
import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { SolidKanbanFilter } from "../kanban/SolidKanbanFilter";
import { SolidSearchBox } from "./SolidSearchBox";


export const SolidGlobalSearchElement = ({ solidKanbanViewMetaData, applyFilter, filterValues, setFilterValues }: any) => {

    const [visible, setVisible] = useState<boolean>(false);
    const handleApplyFilter = (filters: any) => {
        setVisible(false);
        applyFilter(filters)
    }

    return (


        <div className="card flex justify-content-center">
            <i className="pi pi-search" onClick={() => setVisible(true)}></i>

            <Dialog header={false} visible={visible} style={{ width: '50vw' }} onHide={() => { if (!visible) return; setVisible(false); }}>
                <div className="card relative">
                    <TabView>
                        <TabPanel header="Search">
                            <SolidSearchBox solidKanbanViewMetaData={solidKanbanViewMetaData}></SolidSearchBox>
                        </TabPanel>
                        <TabPanel header="Filter" >
                            <SolidKanbanFilter solidKanbanViewMetaData={solidKanbanViewMetaData} handleApplyFilter={handleApplyFilter} filterValues={filterValues} setFilterValues={setFilterValues}></SolidKanbanFilter>
                        </TabPanel>
                    </TabView>
                </div >
            </Dialog>
        </div>
    )

}