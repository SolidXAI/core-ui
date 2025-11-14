"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "@/components/core/common/FilterComponent";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";
import { useRouter, useSearchParams } from "next/navigation";
import { queryStringToQueryObject } from "../list/SolidListView";
import { InputText } from "primereact/inputtext";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import qs from "qs";
import { useSelector } from "react-redux";
import { SolidSaveCustomFilterForm } from "./SolidSaveCustomFilterForm";
import { ERROR_MESSAGES } from "@/constants/error-messages";
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
                value: matchMode !== "$between" ? [condition[matchMode]] : condition[matchMode],
                parentRule,
                children: []
            };
        }
    }

    throw new Error(ERROR_MESSAGES.INVALID_FILTER_STRUCTURE);
}




let idCounter = 1;
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);


const transformRulesToFilters = (input: any) => {

    // Helper function to process individual rules
    const processRule = (rule: any) => {
        if (rule.value && rule.value.length > 0) {

            // Ensure rule.value is always an array
            let values = typeof rule.value[0] === "object" ? rule.value.map((i: any) => i?.value ? i?.value : i) : rule?.value;
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

type GroupedType = {
    values: string[];
    searchField: any;
    matchMode: string;
}

// Build nested condition for relation fields
function buildNestedCondition(path: string, operatorKey: string, value: any) {
    const keys = path.split(".").filter(Boolean);
    const leaf = { [operatorKey]: value };
    return keys.reduceRight((acc, key) => ({ [key]: acc }), leaf);
}

const tranformSearchToFilters = (input: any) => {
    if (!input || !input.$and) return input;

    const grouped: Record<string, GroupedType> = {};

    input.$and.forEach(({ fieldName, value, searchField, matchMode }: any) => {
        const val = Array.isArray(value) && value.length === 1 ? value[0] : value;

        if (!grouped[fieldName]) {
            grouped[fieldName] = { values: [], searchField: searchField || "", matchMode: matchMode || "$containsi" };
        }

        if (Array.isArray(val)) {
            grouped[fieldName]?.values.push(...val);
        } else {
            grouped[fieldName]?.values.push(val);
        }
    });

    // return {
    //     $and: Object.entries(grouped).map(([fieldName, values]) => ({
    //         [fieldName]: {
    //             $containsi: values.length === 1 ? values[0] : values
    //         }
    //     }))
    // };

    const andFilters: any[] = [];

    Object.entries(grouped).forEach(([fieldName, value]) => {

        const isNested = value.searchField ? value.searchField.includes(".") : false;

        if (isNested) {

            // NESTED: use $eq and expand dot-notation into nested objects
            if (value.values.length === 1) {
                andFilters.push(buildNestedCondition(value.searchField, value.matchMode, value.values[0]));
            } else {
                andFilters.push({
                    $or: value.values.map(v => buildNestedCondition(value.searchField, value.matchMode, v)),
                });
            }
        } else {

            if (value.values.length === 1) {
                andFilters.push({
                    [fieldName]: {
                        $containsi: value.values[0]
                    }
                });
            } else {
                andFilters.push({
                    $or: value.values.map((v) => ({
                        [fieldName]: { $containsi: v }
                    }))
                });
            }
        }
    });

    return {
        $and: andFilters
    };
}

export const mergeSearchAndCustomFilters = (transformedFilter: any, newFilter: any, transformedFilterName: string, newFilterName: string) => {
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


const SavedFilterList = ({ savedfilter, activeSavedFilter, applySavedFilter, openSavedCustomFilter, setSavedFilterTobeDeleted, setIsDeleteSQDialogVisible }: any) => {
    return (
        <div className="flex align-items-center justify-content-between gap-2">
            <Button text size="small" className="text-base py-1 w-full" severity={Number(activeSavedFilter) == savedfilter.id ? "secondary" : "contrast"} onClick={() => applySavedFilter(savedfilter)}>{savedfilter.name}</Button>
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-pencil"
                    style={{ fontSize: 10 }}
                    severity="secondary"
                    outlined size="small"
                    onClick={() => openSavedCustomFilter(savedfilter)}
                />
                <Button
                    icon="pi pi-trash"
                    style={{ fontSize: 10 }}
                    severity="secondary"
                    outlined size="small"
                    onClick={() => {
                        setSavedFilterTobeDeleted(savedfilter.id),
                            setIsDeleteSQDialogVisible(true);

                    }}
                />
            </div>
        </div>
    )
}

export const SolidGlobalSearchElement = forwardRef(({ viewData, handleApplyCustomFilter, filters, clearFilter, showSaveFilterPopup, setShowSaveFilterPopup }: any, ref) => {
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

    const searchParams = useSearchParams() // Converts the query params to a string
    const activeSavedFilter = searchParams?.get("savedQuery");

    const router = useRouter();

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
    const [currentSavedFilterData, setCurrentSavedFilterData] = useState<any>();
    const [savedFilterTobeDeleted, setSavedFilterTobeDeleted] = useState<any>();
    const [isDeleteSQDialogVisible, setIsDeleteSQDialogVisible] = useState<boolean>(false);
    const [savedFilterQueryString, setSavedFilterQueryString] = useState<string>();
    const { user } = useSelector((state: any) => state.auth);


    const [savedFilters, setSavedFilters] = useState([]);

    const entityApi = createSolidEntityApi("savedFilters");
    const {
        useCreateSolidEntityMutation,
        useDeleteSolidEntityMutation,
        useGetSolidEntityByIdQuery,
        useUpdateSolidEntityMutation,
        useLazyGetSolidEntitiesQuery
    } = entityApi;

    const [
        createEntity,
        { isSuccess: isEntityCreateSuccess, isError: isEntityCreateError, error: entityCreateError },
    ] = useCreateSolidEntityMutation();

    const [
        updateEntity,
        { isSuccess: isEntityUpdateSuceess, isError: isEntityUpdateError, error: entityUpdateError },
    ] = useUpdateSolidEntityMutation();

    const [
        deleteEntity,
        { isSuccess: isEntityDeleteSuceess, isError: isEntityDeleteError, error: entityDeleteError },
    ] = useDeleteSolidEntityMutation();

    const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();


    useEffect(() => {

        const filters = {
            $or: [
                {
                    $and: [
                        { model: { $in: [viewData?.data?.solidView?.model?.id] } },
                        { view: { $in: [viewData?.solidView?.id] } },
                        { user: { $in: [user?.user?.id] } }
                    ]
                },
                {
                    $and: [
                        { model: { $in: [viewData?.data?.solidView?.model?.id] } },
                        { view: { $in: [viewData?.solidView?.id] } },
                        { isPrivate: { $eq: true } }
                    ]
                }

            ]

        }

        const queryData: any = {
            offset: 0,
            limit: 10,
            filters: filters,
            populate: ["model", "view", "user"],
            sort: ["id:desc"],
        };
        const queryString = qs.stringify(queryData, { encodeValuesOnly: true });
        setSavedFilterQueryString(queryString)
        triggerGetSolidEntities(queryString);

    }, [searchParams])

    useEffect(() => {
        if (solidEntityListViewData) {
            setSavedFilters(solidEntityListViewData.records)
        }
    }, [solidEntityListViewData])

    useImperativeHandle(ref, () => ({
        clearFilter: () => {
            setFilterRules(initialState);
        }
    }));

    useEffect(() => {
        let searchChips: any;
        let customChips: any;
        let parsedSearchParams = searchParams;


        const savedQuery = parsedSearchParams?.get("savedQuery");
        if (savedQuery && savedFilters.length > 0) {
            const currentSavedFilterId = Number(savedQuery);
            const currentSavedFilterData: any = savedFilters.find((savedFilter: any) => savedFilter.id === currentSavedFilterId);
            setCurrentSavedFilterData(currentSavedFilterData)
            if (currentSavedFilterData) {
                const filterJson = JSON.parse(currentSavedFilterData?.filterQueryJson);
                if (filterJson) {
                    searchChips = filterJson?.s_filter || null;
                    customChips = filterJson?.c_filter || null;
                }
            }
        } else {
            const queryObject = queryStringToQueryObject();
            if (queryObject) {
                searchChips = queryObject?.s_filter || null;
                customChips = queryObject?.c_filter || null;
            }
        }
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
            setSearchFilter(searchChips);
            setHasSearched(true);
        }
        if (customChips) {
            setCustomFilter(customChips);
            const formatedCustomChips: FilterRule = transformFiltersToRules(customChips);
            setFilterRules([formatedCustomChips]);
            setHasSearched(true);
        }
    }, [searchParams, savedFilters])

    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            let fieldsData = viewData?.data?.solidFieldsMetadata;
            // console.log(`fiels data while rendering solid global search element: `);
            // console.log(fieldsData);

            const children = viewData?.data?.solidView?.layout?.children ?? [];

            const fieldsList = Object.entries(fieldsData ?? {}).map(([key, value]: any) => {
                const viewFieldElement = children.find((f: any) => f?.attrs?.name === key);

                return {
                    name: value.displayName,
                    value: key,
                    type: value.type,
                    ormType: value.ormType,
                    matchMode: viewFieldElement?.attrs?.searchMatchMode,
                    searchField: viewFieldElement?.attrs?.searchField ?? null,
                    isSearchable: viewFieldElement?.attrs?.isSearchable ?? false,
                };
            });

            setFields(fieldsList);

            const searchableFieldsList = fieldsList.filter((field: any) => {
                if (!field.isSearchable) return false;

                switch (field.type) {
                    case "relation":
                        // Only include relation if searchField is present
                        return !!field.searchField;
                    case "longText":
                    case "shortText":
                    case "selectionStatic":
                    case "selectionDynamic":
                        return true;
                    // case "selectionStatic":
                    case "computed":
                        return field.ormType === "varchar";
                    default:
                        return false;
                }
            });

            // console.log("searchableFieldsList", searchableFieldsList);


            // Optionally map to a minimal structure if needed for UI
            let finalSearchableFieldsList: any = searchableFieldsList.map((field: any) => ({
                fieldName: field.value,
                displayName: field.name,
                searchField: field.searchField ?? "",
                matchMode: field.matchMode
            }));

            // console.log("finalSearchableFieldsList", finalSearchableFieldsList);

            setSearchableFields(finalSearchableFieldsList);
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

    // useEffect(() => {
    //     // Get the last valid filter
    //     const validFilters = filters?.$or?.filter((filter: any) => filter !== undefined) || [];
    //     if (validFilters.length > 0) {
    //         setCustomChip(validFilters.length.toString()); // Store only the number
    //     } else {
    //         setCustomChip(""); // Reset when no filters are present
    //     }
    // }, [filters]);

    const handleAddChip = (columnName?: string) => {
        if (inputValue?.trim()) {
            const fallbackField = searchableFields[0]; // guaranteed object
            if (!fallbackField) return;
            const newChip = {
                columnName: columnName || fallbackField.fieldName,
                value: inputValue.trim(),
                columnDisplayName: fallbackField.displayName,
                searchField: fallbackField.searchField,
                matchMode: fallbackField.matchMode
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
            setShowOverlay(false);
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
        setCustomFilter(transformedFilter);
        if (transformedFilter) {
            const finalFilter = mergeSearchAndCustomFilters(transformedFilter, searchFilter, "c_filter", "s_filter");
            handleApplyCustomFilter(finalFilter)
        }
        setShowGlobalSearchElement(false)
    }

    useEffect(() => {
        if (hasSearched === true) {
            // console.log("searchChips", searchChips);

            const formattedChips = {
                $and: searchChips.map((chip: any) => ({
                    fieldName: chip.columnName,
                    matchMode: chip.matchMode,
                    value: [chip.value],
                    searchField: chip.searchField ?? "",
                }))
            };

            // console.log("formattedChips", formattedChips);

            // if (formattedChips.$and.length > 0) {
            const transformedFilter = tranformSearchToFilters(formattedChips);
            setSearchFilter(transformedFilter);
            const finalFilter = mergeSearchAndCustomFilters(transformedFilter, customFilter, "s_filter", "c_filter");
            handleApplyCustomFilter(finalFilter);
            // }
        }
    }, [searchChips, hasSearched]);


    // Saved Filter related 

    const applySavedFilter = (savedfilter: any) => {
        // push the savedQuery=1 in url 
        if (savedfilter?.id) {
            router.push(`?savedQuery=${savedfilter.id}`);
        } else {
            console.error(ERROR_MESSAGES.SAVE_FILTER_UNDEFINED_NULL);
        }

    }
    const openSavedCustomFilter = (savedfilter: any) => {
        //Open custom filter popup 
        router.push(`?savedQuery=${savedfilter.id}`);
        setShowGlobalSearchElement(true);
        // dont refetch the data yet
        const customFilter = JSON.parse(savedfilter.filterQueryJson).c_filter;
        setCustomFilter(customFilter ? customFilter : null);
        if (customFilter) {
            const formatedCustomChips: FilterRule = transformFiltersToRules(customFilter ? customFilter : null);
            setFilterRules(formatedCustomChips ? [formatedCustomChips] : initialState);
        }
    }
    const deleteSavedFilter = () => {
        // delte the saved filter with id 
        deleteEntity(savedFilterTobeDeleted);
        triggerGetSolidEntities(savedFilterQueryString);
        setIsDeleteSQDialogVisible(false);
        let parsedSearchParams = searchParams;
        const savedQuery = parsedSearchParams?.get("savedQuery");
        if (savedFilterTobeDeleted === savedQuery) {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete("savedQuery");
            router.push(`?${urlParams.toString()}`);
        }
    }

    const handleSaveFilter = async (formValues: any) => {
        const filterJson = mergeSearchAndCustomFilters(customFilter, searchFilter, "c_filter", "s_filter");
        setShowSaveFilterPopup(false)

        const formData = new FormData();
        formData.append("name", formValues.name);
        formData.append("filterQueryJson", JSON.stringify(filterJson, null, 2));
        formData.append("modelId", viewData?.data?.solidView?.model?.id);
        formData.append("viewId", viewData?.data?.solidView?.id);
        formData.append("isPrivate", formValues.isPrivate);
        formData.append("userId", user?.user?.id);
        if (formValues.id) {
            await updateEntity({ id: +formValues.id, data: formData }).unwrap();
            router.push(`?savedQuery=${formValues.id}`);

        } else {
            const result = await createEntity(formData).unwrap();
            // localStorage.setItem(window.location.pathname, result.data.id);
            router.push(`?savedQuery=${result.data.id}`);

        }
    }


    const groupedSearchChips = searchChips.reduce((acc: Record<string, string[]>, chip) => {
        const key = chip.columnName;
        if (!key) return acc; // skip if undefined

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(chip.value);
        return acc;
    }, {});



    const handleRemoveChipGroup = (columnName: string) => {
        const updatedChips = searchChips.filter(chip => chip.columnName !== columnName);
        setSearchChips(updatedChips);
        setHasSearched(true);
    };


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
                    <span><strong>{customFilter?.$or && customFilter?.$or?.length > 0 ? `${customFilter?.$or?.length}` : customFilter.$and.length}</strong> rules applied</span>
                </div>

                {/* button to clear filter */}
                <a onClick={clearCustomFilter}
                    style={{ cursor: "pointer" }}
                >
                    <i className="pi pi-times ml-1">
                    </i></a>
            </div>
        </li>
    );


    const SearchChip = () => (
        <>
            {Object.entries(groupedSearchChips).map(([column, values]) => {
                const fieldMeta = searchableFields.find(f => f.fieldName === column);
                const columnDisplayName = fieldMeta?.displayName || column;

                return (
                    <li key={column}>
                        <div className="search-filter-chip-type">
                            <div>{columnDisplayName}</div>
                            {values.map((value, index) => (
                                <React.Fragment>
                                    {/* displayname */}
                                    <span key={index} className="custom-chip-value">{value}
                                    </span>
                                    {index < values.length - 1 &&
                                        <span className="custom-chip-or">or</span>
                                    }
                                </React.Fragment>
                            ))}
                            {/* button to clear filter */}
                            <i className="pi pi-times ml-1"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRemoveChipGroup(column)}
                            >
                            </i>
                        </div>
                    </li>
                )
            })}
        </>
    );


    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <>
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
                                    onClick={() => setShowOverlay(true)}
                                    className="custom-filter-button"
                                />
                            </div>
                        </li>
                    </ul>
                </div>

                {showOverlay && (
                    <div className="absolute w-full z-5 surface-0 border-round border-1 border-300 shadow-2" style={{ top: 35 }}>
                        {inputValue ? (
                            <>
                                <div className="custom-filter-search-options px-2 py-2 flex flex-column">
                                    {
                                        searchableFields.map((value: any, index: any) => {
                                            // console.log("value", value);

                                            return (
                                                <Button
                                                    key={index}
                                                    className="p-2 flex gap-1 text-color"
                                                    // onClick={() => handleAddChip(value)}
                                                    onMouseDown={(e) => {
                                                        // Prevent focus loss from input
                                                        e.preventDefault();
                                                        const currentValue = inputValue?.trim();
                                                        if (currentValue) {
                                                            setSearchChips((prev) => [...prev, {
                                                                columnName: value.fieldName,
                                                                value: currentValue,
                                                                columnDisplayName: value.displayName,
                                                                searchField: value.searchField,
                                                                matchMode: value.matchMode
                                                            }]);
                                                            setInputValue("");
                                                            setHasSearched(true);
                                                            setShowOverlay(false);
                                                        }
                                                    }}
                                                    text
                                                    severity="secondary"
                                                    size="small"
                                                >
                                                    Search <strong>{value.displayName}</strong> for: <span className="font-bold text-color">{inputValue}</span>
                                                </Button>
                                            )
                                        })
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
                        {savedFilters.length > 0 &&
                            <>
                                <div className="p-3">
                                    <p className="font-medium">Saved Filters</p>
                                    <div className="flex flex-column gap-2">
                                        {savedFilters.map((savedfilter: any) =>
                                            <SavedFilterList savedfilter={savedfilter} activeSavedFilter={activeSavedFilter} applySavedFilter={applySavedFilter} openSavedCustomFilter={openSavedCustomFilter} setSavedFilterTobeDeleted={setSavedFilterTobeDeleted} setIsDeleteSQDialogVisible={setIsDeleteSQDialogVisible}></SavedFilterList>
                                        )}
                                    </div>
                                </div>
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
                <Dialog header="Save Custom Filter" visible={showSaveFilterPopup} style={{ width: 500 }} onHide={() => { if (!showSaveFilterPopup) return; setShowSaveFilterPopup(false); }}>
                    <SolidSaveCustomFilterForm currentSavedFilterData={currentSavedFilterData} handleSaveFilter={handleSaveFilter} closeDialog={setShowSaveFilterPopup}></SolidSaveCustomFilterForm>
                </Dialog>

                <Dialog
                    visible={isDeleteSQDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={deleteSavedFilter} />
                            <Button label="No" icon="pi pi-times" className='small-button' onClick={() => setIsDeleteSQDialogVisible(false)} />
                        </div>
                    )}
                    onHide={() => setIsDeleteSQDialogVisible(false)}
                >
                    <p>Are you sure you want to delete the {currentSavedFilterData?.name} saved query?</p>
                </Dialog>
            </div>
            {/* <div>
                <Button
                    icon="pi pi-save"
                    style={{ fontSize: 10 }}
                    severity="secondary"
                    outlined size="small"
                    onClick={() => {
                        setShowSaveFilterPopup(true)
                    }}
                />
            </div> */}
        </>
    )
});