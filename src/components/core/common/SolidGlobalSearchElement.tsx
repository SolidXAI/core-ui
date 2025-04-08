"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "@/components/core/common/FilterComponent";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";
import { useSearchParams } from "next/navigation";
import { queryStringToQueryObject } from "../list/SolidListView";
import { InputText } from "primereact/inputtext";

const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


const transformFiltersToRules = (filter: any, parentRule: number | null = null): FilterRule => {
    const currentId = idCounter++;

    if (filter["$or"]) {
        return {
            id: currentId,
            type: FilterRuleType.RULE_GROUP,
            matchOperator: FilterOperator.OR,
            parentRule,
            children: filter["$or"].map((subFilter: any) => transformFiltersToRules(subFilter, currentId))
        };
    }

    if (filter["$and"]) {
        return {
            id: currentId,
            type: FilterRuleType.RULE_GROUP,
            matchOperator: FilterOperator.AND,
            parentRule,
            children: filter["$and"].map((subFilter: any) => transformFiltersToRules(subFilter, currentId))
        };
    }

    // Handle single rule condition
    for (const key in filter) {
        const condition = filter[key];

        for (const matchMode in condition) {
            return {
                id: currentId,
                type: FilterRuleType.RULE,
                fieldName: key,
                //@ts-ignore
                matchMode,
                value: [condition[matchMode]],
                parentRule,
                children: []
            };
        }
    }

    throw new Error("Invalid filter structure");
}




let idCounter = 1;
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);


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

const tranformSearchToFilters = (input: any) => {

    if (!input || !input.$and) return input; // Return as-is if invalid

    return {
        $and: input.$and.map((condition: any) => {
            const { fieldName, matchMode, value } = condition;

            // Ensure value is a single string (if it's an array with one element, extract it)
            const formattedValue = Array.isArray(value) && value.length === 1 ? value[0] : value;

            return {
                [fieldName]: {
                    [matchMode]: formattedValue
                }
            };
        })
    };
}

export const SolidGlobalSearchElement = forwardRef(({ viewData, handleApplyCustomFilter, filters, clearFilter }: any, ref) => {
    const defaultState: FilterRule[] = [
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
    const [initialState, setInitialState] = useState(defaultState);

    const searchParams = useSearchParams().toString(); // Converts the query params to a string


    const chipsRef = useRef<HTMLDivElement | null | any>(null);

    const [filterRules, setFilterRules] = useState<FilterRule[]>(initialState);
    const [fields, setFields] = useState<any[]>([]);
    const [searchableFields, setSearchableFields] = useState<any[]>([]);
    const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);
    const [customChip, setCustomChip] = useState("");
    const [searchChips, setSearchChips] = useState<{ columnName?: string; value: string }[]>([]);
    const [inputValue, setInputValue] = useState<string | null>("");
    const [searchFilter, setSearchFilter] = useState<any | null>(null);
    const [customFilter, setCustomFilter] = useState<any | null>(null);
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    useImperativeHandle(ref, () => ({
        clearFilter: () => {
            setFilterRules(initialState);
        }
    }));

    useEffect(() => {
        const queryObject = queryStringToQueryObject();
        if (queryObject) {
            const searchChips: any = queryObject?.s_filter || null;
            const customChips = queryObject?.c_filter || null;
            if (searchChips) {
                const formattedChips = searchChips?.$and.map((chip: any, key: any) => {
                    const chipKey = Object.keys(chip)[0]; // Get the key, e.g., "displayName"
                    const chipValue = chip[chipKey]?.$containsi; // Get the value of "$containsi"
                    const chipdata = {
                        columnName: chipKey,
                        value: chipValue
                    };
                    return chipdata
                }
                );
                setSearchChips(formattedChips);
            }
            if (customChips) {
                setCustomFilter(customChips);
                const formatedCustomChips: FilterRule = transformFiltersToRules(customChips);
                console.log("formatedCustomChips", formatedCustomChips);
                setFilterRules([formatedCustomChips]);

            }
        }
    }, [searchParams])


    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            if (searchParams && (searchParams.includes("list") || searchParams.includes("kanban"))) {
            }
            const fieldsData = viewData?.data?.solidFieldsMetadata;
            const fieldsList = Object.entries(fieldsData).map(([key, value]: any) => ({ name: value.displayName, value: key, type: value.type }));
            setFields(fieldsList);
            const searchableFieldsList = fieldsList.filter((field: any) => field.type === "longText" || field.type === "shortText");
            const finalsearchableFieldsList = searchableFieldsList.filter((field: any) => field.value && viewData?.data?.solidView?.layout?.children?.some((child: any) => child?.attrs?.name === field.value && child?.attrs?.isSearchable)).map((field: any) => field.value);
            setSearchableFields(finalsearchableFieldsList);
        }
    }, [])

    useEffect(() => {
        if (chipsRef.current) {
            const inputElement = chipsRef.current.querySelector("input");
            if (inputElement) {
                inputElement.addEventListener("input", (e: any) => {
                    setInputValue((e.target as HTMLInputElement).value);
                });
            }
        }
    }, []);

    useEffect(() => {
        // Get the last valid filter
        const validFilters = filters?.$or?.filter((filter: any) => filter !== undefined) || [];
        if (validFilters.length > 0) {
            setCustomChip(validFilters.length.toString()); // Store only the number
        } else {
            setCustomChip(""); // Reset when no filters are present
        }
    }, [filters]);

    const firstFilterableFieldName = searchableFields[0]; // First searchable field

    const handleAddChip = (columnName?: string) => {
        if (inputValue?.trim()) {
            const newChip = {
                columnName: columnName || firstFilterableFieldName,
                value: inputValue.trim(),
            };
            setSearchChips((prev) => [...prev, newChip]);
            setInputValue("");
            setHasSearched(true)
        }

    };

    const clearCustomFilter = () => {
        const finalFilter = mergeSearchAndCustomFilters(null, searchFilter, "c_filter", "s_filter");
        handleApplyCustomFilter(finalFilter)
        setFilterRules(initialState);
        setCustomFilter(null)

    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue?.trim()) {
            handleAddChip();
            e.preventDefault();
        } else if (e.key === "Backspace" && inputValue === "") {
            if (searchChips.length > 0) {
                // Remove last search chip only
                setSearchChips((prev) => prev.slice(0, -1));
                setHasSearched(true);
            } else if (customFilter) {
                // If no search chips, remove custom filter
                clearCustomFilter();
            }
        }
    };


    const mergeSearchAndCustomFilters = (transformedFilter: any, newFilter: any, transformedFilterName: string, newFilterName: string) => {
        const filters: any = {};

        // Add only non-null filters
        if (transformedFilter && Object.keys(transformedFilter).length > 0) {
            filters[transformedFilterName] = transformedFilter;
        }
        if (newFilter && Object.keys(newFilter).length > 0) {
            filters[newFilterName] = newFilter;
        }

        // Return the combined filters object
        return filters;
    }


    const transformFilterRules = (filterRules: any) => {
        const transformedFilter = transformRulesToFilters(filterRules[0]);
        console.log("transformedFilter from custom filter", transformedFilter);
        setCustomFilter(transformedFilter);
        if (transformedFilter) {
            const finalFilter = mergeSearchAndCustomFilters(transformedFilter, searchFilter, "c_filter", "s_filter");
            handleApplyCustomFilter(finalFilter)
        }
        setShowGlobalSearchElement(false)
    }

    useEffect(() => {
        if (hasSearched === true) {

            const formattedChips = {
                $and: searchChips.map((chip) => ({
                    fieldName: chip.columnName,
                    matchMode: "$containsi",
                    value: [chip.value]
                }))
            };
            // if (formattedChips.$and.length > 0) {
            const transformedFilter = tranformSearchToFilters(formattedChips);
            setSearchFilter(transformedFilter);
            const finalFilter = mergeSearchAndCustomFilters(transformedFilter, customFilter, "s_filter", "c_filter");
            handleApplyCustomFilter(finalFilter);
            // }
        }
    }, [searchChips]);

    const groupedSearchChips = searchChips.reduce((acc, chip) => {
        const key = chip.columnName || firstFilterableFieldName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(chip.value);
        return acc;
    }, {} as Record<string, string[]>);

    const CustomChip = () => (
        <li>
            <div className="custom-filter-chip-type">
                <div className="flex align-items-center gap-2 text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"
                        onClick={() => setShowGlobalSearchElement(true)}>
                        <rect width="20" height="20" rx="4" fill="#722ED1" />
                        <path d="M8.66667 15V13.3333H11.3333V15H8.66667ZM6 10.8333V9.16667H14V10.8333H6ZM4 6.66667V5H16V6.66667H4Z"
                            fill="white" />
                    </svg>
                    <span><strong>{customFilter.$or.length > 0 ? `${customFilter.$or.length}` : customFilter.$and.length}</strong> rules applied</span>
                </div>

                {/* button to clear filter */}
                <a onClick={clearCustomFilter}>
                    <i className="pi pi-times ml-1">
                    </i></a>
            </div>
        </li>
    );


    const SearchChip = () => (
        <>
            {Object.entries(groupedSearchChips).map(([column, values]) => (
                <li key={column}>
                    <div className="search-filter-chip-type">
                        <div>{column}</div>
                        {values.map((value, index) => (
                            <React.Fragment>
                                <span key={index} className="custom-chip-value">{value}
                                </span>
                                {values.length > 1 &&
                                    <span className="custom-chip-or">and</span>
                                }
                            </React.Fragment>
                        ))}
                        {/* button to clear filter */}
                        <i className="pi pi-times ml-1">
                        </i>
                    </div>
                </li>
            ))}
        </>
    );

    console.log("custom chip", customFilter);

    const [showOverlay, setShowOverlay] = useState(false);


    return (
        <div className="flex justify-content-center solid-custom-filter-wrapper relative">
            <div className="solid-global-search-element">
                <ul className="">
                    {customFilter && <CustomChip />}
                    <SearchChip />
                    <li ref={chipsRef}>
                        <div className="relative">
                            <InputText
                                value={inputValue || ""}
                                placeholder="Search..."
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowOverlay(true);
                                }}
                                onFocus={() => {
                                    if (inputValue?.trim()) setShowOverlay(true);
                                }}
                                onBlur={() => {
                                    // Delay so you can click buttons inside overlay
                                    setTimeout(() => setShowOverlay(false), 150);
                                }}

                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                icon="pi pi-search"
                                style={{ fontSize: 10 }}
                                severity="secondary"
                                outlined size="small"
                                onClick={() => setShowGlobalSearchElement(true)}
                                className="custom-filter-button"
                            />
                        </div>
                    </li>
                </ul>
            </div>
            {showOverlay && inputValue?.trim() && (
                <div className="absolute w-full z-5 bg-white border-round border-1 border-300 shadow-2" style={{ top: 35 }}>
                    {inputValue ? (
                        <>
                            <div className="custom-filter-search-options px-2 py-2 flex flex-column">
                                {
                                    searchableFields.map((value: any, index: any) => (
                                        <Button
                                            key={index}
                                            className="p-2 flex gap-1 text-color"
                                            onClick={() => handleAddChip(value)}
                                            text
                                            severity="secondary"
                                            size="small"
                                        >
                                            Search <strong>{value}</strong> for :
                                            <span className="font-bold" style={{ color: '#000' }}>{inputValue}</span>
                                        </Button>
                                    ))
                                }
                            </div>
                            <Divider className="m-0" />
                        </>
                    ) :
                        <>
                            <div className="p-3 text-base">Search Here...</div>
                            <Divider className="m-0" />
                        </>
                    }
                    <div className="px-2 py-1">
                        <Button text size="small" label="Custom Filter" iconPos="left" icon='pi pi-plus' onClick={() => setShowGlobalSearchElement(true)} className="font-bold" />
                    </div>
                </div>
            )
            }
            <Dialog header={false} className="solid-global-search-filter" showHeader={false} visible={showGlobalSearchElement} style={{ width: '65vw' }} onHide={() => { if (!showGlobalSearchElement) return; setShowGlobalSearchElement(false); }}>
                <div className="flex align-items-center justify-content-between px-3">
                    <h5 className="solid-custom-title m-0">Add Custom Filter</h5>
                    <Button icon="pi pi-times" rounded text aria-label="Cancel" type="reset" size="small" onClick={() => setShowGlobalSearchElement(false)} />
                </div>
                <Divider className="m-0" />
                <div className="p-4">
                    {fields.length > 0 &&
                        <FilterComponent viewData={viewData} fields={fields} filterRules={filterRules} setFilterRules={setFilterRules} transformFilterRules={transformFilterRules} closeDialog={() => setShowGlobalSearchElement(false)}></FilterComponent>
                    }
                </div>
            </Dialog>
        </div>
    )
});