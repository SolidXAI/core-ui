import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { SolidSearchBox } from "./SolidSearchBox";
import FilterComponent from "@/components/core/common/FilterComponent";
import { Button } from "primereact/button";


export const SolidGlobalSearchElement = ({ viewData, applyFilter, showGlobalSearchElement, setShowGlobalSearchElement,customFilter, setCustomFilter,handleApplyCustomFilter }: any) => {

    const handleApplyFilter = (filters: any) => {
        setShowGlobalSearchElement(false);
        applyFilter(filters)
    }

    const [fields, setFields] = useState<any[]>([]);

    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            const fieldsData = viewData?.data?.solidFieldsMetadata
            const fieldsList = Object.entries(fieldsData).map(([key, value]: any) => ({ name: key, value: key }));

            setFields(fieldsList)
        }
    }, [])


    return (


        <div className="card flex justify-content-center">
            <i className="pi pi-search" onClick={() => setShowGlobalSearchElement(true)}></i>
            <Dialog header={false} className="search-filter-popup" showHeader={false} visible={showGlobalSearchElement} style={{ width: '50vw' }} onHide={() => { if (!showGlobalSearchElement) return; setShowGlobalSearchElement(false); }}>
                <div className="flex field-popup-navigation gap-3 justify-content-between ">
                    <div className="flex text-2xl font-bold align-items-center ml-4" style={{ color: '#000' }}>
                        <i className="pi pi-search" style={{ marginRight: '5px', color: "#06b6d4" }}></i>
                        <p className="popup-heading m-0">Search and Filter</p>
                    </div>
                    <div className="flex align-items-center gap-3 close-popup">
                        <Button icon="pi pi-times" rounded text aria-label="Cancel" type="reset" size="small" onClick={() => setShowGlobalSearchElement(false)} />
                    </div>
                </div>
                <div className="card relative">
                    <TabView >
                        <TabPanel header="Search">
                            <SolidSearchBox viewData={viewData}></SolidSearchBox>
                        </TabPanel>
                        <TabPanel header="Filter" >
                            {fields.length > 0 &&
                                <FilterComponent viewData={viewData} fields={fields} filterRules={customFilter} setFilterRules={setCustomFilter} handleApplyCustomFilter={handleApplyCustomFilter} ></FilterComponent>
                            }
                            {/* <SolidKanbanFilter solidKanbanViewMetaData={solidKanbanViewMetaData} handleApplyFilter={handleApplyFilter} filterValues={filterValues} setFilterValues={setFilterValues}></SolidKanbanFilter> */}
                        </TabPanel>
                    </TabView>
                </div >
            </Dialog>
        </div>
    )

}