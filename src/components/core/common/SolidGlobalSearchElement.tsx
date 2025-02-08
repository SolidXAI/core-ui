import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { SolidSearchBox } from "./SolidSearchBox";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "@/components/core/common/FilterComponent";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";



const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const transformRulesToFilters = (input: any) => {

    // Helper function to process individual rules
    const processRule = (rule: any) => {
        if (rule.value && rule.value.length > 0) {

            // Ensure rule.value is always an array
            let values = typeof rule.value[0] === "object" ? rule.value.map((i: any) => i.value) : rule.value;
            if (rule.matchMode !== '$in' && rule.matchMode !== '$notIn' && rule.matchMode !== '$between') {
                values = values[0];
            }
            // Rule transformation
            let transformedRule = {
                [rule.fieldName]: {
                    [rule.matchMode]: values    // Assuming `value` is always an array with `value` and `label`
                }
            };

            // If the rule has children (which means it's a rule group), process them
            let processedFields;
            if (rule.children && rule.children.length > 0) {
                processedFields = rule.children.map((child: any) => processRuleGroup(child));
            }
            if (processedFields) {
                return { ...transformedRule, processedFields }
            }
            return { ...transformedRule }
        }

    };

    // Helper function to process rule groups
    const processRuleGroup = (ruleGroup: any) => {
        const operator = ruleGroup.matchOperator === 'or' ? '$or' : '$and';
        const children = ruleGroup.children.map((child: any) => {
            if (child.type === 'rule') {
                // Process the rule
                return processRule(child);
            } else if (child.type === 'rule_group') {
                // Process the rule group recursively
                return processRuleGroup(child);
            }
        });

        return {
            [operator]: children
        };
    };

    // Start processing the root rule group
    const filterObject = processRuleGroup(input);

    function liftProcessedFields(filters: any) {
        if (!filters || typeof filters !== 'object') return filters;

        const processArray = (arr: any) => {
            let newArr = [];
            for (let obj of arr) {
                if (obj && obj.processedFields) {
                    let processed: any = processArray(obj.processedFields); // Recursively process nested processedFields
                    delete obj.processedFields;
                    newArr.push(obj, ...processed);
                } else {
                    newArr.push(obj);
                }

                for (let key in obj) {
                    if (Array.isArray(obj[key])) {
                        obj[key] = processArray(obj[key]);
                    }
                }
            }
            return newArr;
        }

        for (let key in filters) {
            if (Array.isArray(filters[key])) {
                filters[key] = processArray(filters[key]);
            }
        }

        return filters;
    }
    return liftProcessedFields(filterObject)

}

export const SolidGlobalSearchElement = forwardRef(({ viewData, handleApplyCustomFilter }: any, ref) => {

    const initialState: FilterRule[] = [
        {
            id: 1,
            type: FilterRuleType.RULE_GROUP,
            matchOperator: FilterOperator.OR,
            parentRule: null,
            children: [
                {
                    id: Date.now() + getRandomInt(1, 500),
                    type: FilterRuleType.RULE,
                    fieldName: null,
                    matchMode: null,
                    value: null,
                    parentRule: 1,
                    children: []
                },
                {
                    id: Date.now() + getRandomInt(1, 500),
                    type: FilterRuleType.RULE,
                    fieldName: null,
                    matchMode: null,
                    value: null,
                    parentRule: 1,
                    children: []
                }
            ]
        }
    ];
    const [filterRules, setFilterRules] = useState<FilterRule[]>(initialState);
    const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);
    const transformFilterRules = (filterRules: any) => {
        const transformedFilter = transformRulesToFilters(filterRules[0]);
        if (transformedFilter) {
            handleApplyCustomFilter(transformedFilter)
        }
        setShowGlobalSearchElement(false)
    }

    useImperativeHandle(ref, () => ({
        clearFilter: () => {
            setFilterRules(initialState);
        }
    }));



    const [fields, setFields] = useState<any[]>([]);

    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            const fieldsData = viewData?.data?.solidFieldsMetadata
            const fieldsList = Object.entries(fieldsData).map(([key, value]: any) => ({ name: key, value: key }));

            setFields(fieldsList)
        }
    }, [])

    const op = useRef(null);

    return (
        <div className="flex justify-content-center solid-custom-filter-wrapper">
            <div className="p-inputgroup flex-1"
                onClick={(e) =>
                    // @ts-ignore
                    op.current.toggle(e)}
            >
                <InputText placeholder="Search Here" className="p-inputtext-sm" />
                <Button
                    icon="pi pi-search"
                    severity="secondary"
                    outlined size="small"
                />
            </div>
            <OverlayPanel ref={op} className="solid-custom-overlay" style={{ minWidth: 378 }}>
                <div className="px-4 py-3">
                    <p className="m-0">Searching...</p>
                </div>
                <Divider className="m-0" />
                <div className="px-2 py-1">
                    <Button text size="small" label="Custom Filter" iconPos="left" icon='pi pi-plus' onClick={() => setShowGlobalSearchElement(true)} />
                </div>
            </OverlayPanel>
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
                                <FilterComponent viewData={viewData} fields={fields} filterRules={filterRules} setFilterRules={setFilterRules} transformFilterRules={transformFilterRules} ></FilterComponent>
                            }
                            {/* <SolidKanbanFilter solidKanbanViewMetaData={solidKanbanViewMetaData} handleApplyFilter={handleApplyFilter} filterValues={filterValues} setFilterValues={setFilterValues}></SolidKanbanFilter> */}
                        </TabPanel>
                    </TabView>
                </div >
            </Dialog>
        </div>
    )

});