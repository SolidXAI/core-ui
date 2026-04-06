import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "../../../components/core/common/FilterComponent";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { getFilterObjectFromLocalStorage } from "../list/SolidListView";
import { InputText } from "primereact/inputtext";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import qs from "qs";
import { SolidSaveCustomFilterForm } from "./SolidSaveCustomFilterForm";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { hydrateRelationRules } from "../../../helpers/hydrateRelationRules";
import { useSession } from '../../../hooks/useSession'
import GroupingComponent, { AggregationRule, GroupingRule, DateGroupingFormat } from "./GroupingComponent";
import { SearchX } from "lucide-react";
import { SolidButton } from "../../shad-cn-ui/SolidButton";


const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface PredefinedSearch {
    name: string;
    description?: string;
    filters: Record<string, any>;
}

export type SearchableField = {
    fieldName: string;
    displayName: string;
    searchField: string;
    matchMode: string;
}

export type GroupableField = {
    fieldName: string;
    displayName: string;
    searchField: string;
    matchMode: string;
    type: string;
    ormType: string;
    relationType: string;
    computedFieldValueType: string;
}

const extractFields = (nodes: any[] = []): any[] => {
    const result: any[] = [];

    for (const node of nodes) {
        if (node?.type === "field") {
            result.push(node);
        }

        if (Array.isArray(node?.children)) {
            result.push(...extractFields(node.children));
        }
    }

    return result;
};


const transformFiltersToRules = (filter: any, parentRule: number | null = null): FilterRule => {
    if (!filter || typeof filter !== "object" || Object.keys(filter).length === 0) {
        throw new Error("Invalid filter: expected a non-null object with properties");
    }
    if (!filter || typeof filter !== "object") {
        throw new Error("Invalid filter: expected a non-null object");
    }
    const currentId = idCounter++;
    if (filter["$or"]) {
        return {
            id: currentId,
            type: FilterRuleType.RULE_GROUP,
            matchOperator: FilterOperator.OR,
            parentRule,
            children: filter["$or"]
                .filter((sub: any) => {
                    // Filter out null, undefined, empty strings, and empty objects
                    if (sub == null) return false;
                    if (typeof sub === "string" && sub.trim() === "") return false;
                    if (typeof sub === "object" && Object.keys(sub).length === 0) return false;
                    return true;
                })
                .map((subFilter: any) => transformFiltersToRules(subFilter, currentId))
        };
    }

    if (filter["$and"]) {
        return {
            id: currentId,
            type: FilterRuleType.RULE_GROUP,
            matchOperator: FilterOperator.AND,
            parentRule,
            children: filter["$and"]
                .filter((sub: any) => {
                    // Filter out null, undefined, empty strings, and empty objects
                    if (sub == null) return false;
                    if (typeof sub === "string" && sub.trim() === "") return false;
                    if (typeof sub === "object" && Object.keys(sub).length === 0) return false;
                    return true;
                })
                .map((subFilter: any) => transformFiltersToRules(subFilter, currentId))
        };
    }

    // Handle single rule condition
    for (const fieldName in filter) {
        const condition = filter[fieldName];
        if (!condition || typeof condition !== "object") {
            throw new Error(`Invalid condition for field '${fieldName}'`);
        }

        // CASE 1: relation filter → unwrap first
        if (condition?.id && typeof condition?.id === "object") {
            for (const matchMode in condition.id) {
                const rawValue = condition.id[matchMode];
                const mathcModeValue: any = matchMode
                return {
                    id: currentId,
                    type: FilterRuleType.RULE,
                    fieldName,
                    matchMode: mathcModeValue,
                    value: Array.isArray(rawValue) ? rawValue : [rawValue],
                    parentRule,
                    children: []
                };
            }
        }

        // CASE 2: normal field → loop stays
        for (const matchMode in condition) {
            const rawValue = condition[matchMode];
            const mathcModeValue: any = matchMode
            return {
                id: currentId,
                type: FilterRuleType.RULE,
                fieldName,
                matchMode: mathcModeValue,
                value: Array.isArray(rawValue) ? rawValue : [rawValue],
                parentRule,
                children: []
            };
        }


    }
    throw new Error(ERROR_MESSAGES.INVALID_FILTER_STRUCTURE);
}




let idCounter = 1;
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);


const transformRulesToFilters = (input: any, viewData: any) => {

    // Helper function to process individual rules
    const processRule = (rule: any) => {
        if (rule.value !== undefined && rule.value !== null) {

            // Ensure rule.value is always an array
            let values = typeof rule.value[0] === "object" ? rule.value.map((i: any) => i?.value ? i?.value : i) : rule?.value;
            if (rule.matchMode !== '$in' && rule.matchMode !== '$notIn' && rule.matchMode !== '$between' && rule.matchMode !== '$null' && rule.matchMode !== '$notNull') {
                values = values[0];
            }


            const fieldMeta = viewData?.data?.solidFieldsMetadata?.[rule.fieldName];
            const isManyToMany = fieldMeta?.type === 'relation' && fieldMeta?.relationType === 'many-to-many';


            let transformedRule;
            if (isManyToMany) {
                // For many-to-many relations, always use array format for $in/$notIn
                transformedRule = {
                    [rule.fieldName]: {
                        id: {
                            [rule.matchMode]: values // Keep as array
                        }
                    }
                };
            } else {
                // Rule transformation
                transformedRule = {
                    [rule.fieldName]: {
                        [rule.matchMode]: values    // Assuming `value` is always an array with `value` and `label`
                    }
                };
            }

            let processedFields;
            if (rule.children && rule.children.length > 0) {
                processedFields = rule.children.map((child: any) => processRuleGroup(child)).filter((child: any) => child != null);;
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
        }).filter((child: any) => child != null);
        // If no valid children, return null
        // if (children.length === 0) {
        //     return null;
        // }

        // If only one child, return it directly without wrapping in operator
        // if (children.length === 1) {
        //     return children[0];
        // }

        return {
            [operator]: children
        };
    };


    // Start processing the root rule group
    const filterObject = processRuleGroup(input);

    if (!filterObject) {
        return {};
    }

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


export const mergeAllDiffFilters = (customFilter: any, searchFilter: any, savedFilter: any, preDefinedFilter?: any, groupingRules?: GroupingRule[], aggregationRules?: AggregationRule[]) => {
    const filters: any = {};

    // Add only non-null filters
    if (customFilter && Object.keys(customFilter).length > 0) {
        filters["custom_filter_predicate"] = customFilter;
    }
    if (searchFilter && Object.keys(searchFilter).length > 0) {
        filters["search_predicate"] = searchFilter;
    }
    if (savedFilter && Object.keys(savedFilter).length > 0) {
        filters["saved_filter_predicate"] = savedFilter;
    }
    if (preDefinedFilter && Object.keys(preDefinedFilter).length > 0) {
        filters["predefined_search_predicate"] = preDefinedFilter;
    }
    if (groupingRules && Object.keys(groupingRules).length > 0) {
        filters["grouping_rules"] = groupingRules;
    }
    if (aggregationRules && Object.keys(aggregationRules).length > 0) {
        filters["aggregation_rules"] = aggregationRules;
    }
    // Return the combined filters object
    return filters;
}

const SavedFilterList = ({ savedfilter, activeSavedFilter, applySavedFilter, openSavedCustomFilter, setSavedFilterTobeDeleted, setIsDeleteSQDialogVisible, isFocused, onMouseEnter }: any) => {
    const isActive = Number(activeSavedFilter) == savedfilter.id;

    return (
        <div className="solid-saved-filter-item" onMouseEnter={onMouseEnter}>
            <div className="solid-saved-filter-main-wrap">
                <Button text
                    size="small"
                    className={`solid-saved-filter-main w-full ${isActive ? "is-active" : ""} ${isFocused ? "solid-search-overlay-option-active" : ""}`}
                    onClick={() => applySavedFilter(savedfilter)}
                    tooltip={savedfilter?.description}>{savedfilter.name}
                </Button>
                {/* {savedfilter?.description && <p className="text-xs pl-3">{savedfilter?.description}</p>} */}
            </div>
            <div className="solid-saved-filter-actions">
                {savedfilter.isSeeded !== true &&
                    <>
                        <Button
                            icon="pi pi-pencil"
                            severity="secondary"
                            outlined
                            size="small"
                            className="solid-saved-filter-icon-btn"
                            onClick={() => openSavedCustomFilter(savedfilter)}
                        />
                        <Button
                            icon="pi pi-trash"
                            severity="secondary"
                            outlined
                            size="small"
                            className="solid-saved-filter-icon-btn is-danger"
                            onClick={() => {
                                setSavedFilterTobeDeleted(savedfilter.id),
                                    setIsDeleteSQDialogVisible(true);
                            }}
                        />
                    </>
                }

            </div>
        </div>
    )
}

const replacePlaceholders = (obj: any, searchValue: string): any => {
    if (typeof obj === 'string') {
        return obj.replace(/\{\{search\}\}/g, searchValue);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replacePlaceholders(item, searchValue));
    }
    if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = replacePlaceholders(obj[key], searchValue);
        }
        return newObj;
    }
    return obj;
};


const extractChips = (node: any): any[] => {
    if (!node) return [];

    // If node has $and
    if (node.$and && Array.isArray(node.$and)) {
        return node.$and.flatMap(extractChips);
    }

    // If node has $or
    if (node.$or && Array.isArray(node.$or)) {
        return node.$or.flatMap(extractChips);
    }

    // Leaf condition
    const field = Object.keys(node)[0];
    const operatorObj = node[field];

    // ✅ Normal case
    if (operatorObj?.$containsi) {
        return [{
            columnName: field,
            value: operatorObj.$containsi,
            columnDisplayName: field.charAt(0).toUpperCase() + field.slice(1),
            searchField: field,
            matchMode: "$containsi"
        }];
    }
    // ✅ Nested case (like city.name)
    else if (typeof operatorObj === "object") {
        const nestedField = Object.keys(operatorObj)[0];
        const nestedOperatorObj = operatorObj[nestedField];

        const operatorKey = nestedOperatorObj
            ? Object.keys(nestedOperatorObj).find(k => k.startsWith("$"))
            : null;

        if (operatorKey) {
            return [{
                columnName: field,
                value: nestedOperatorObj[operatorKey],
                columnDisplayName: field.charAt(0).toUpperCase() + field.slice(1),
                searchField: `${field}.${nestedField}`,
                matchMode: operatorKey
            }];
        }
    }

    return [];
};



type RelationCache = Map<string, { label: string; value: number }>;



export const SolidGlobalSearchElement = forwardRef(({ viewData, viewType, handleApplyCustomFilter, showSaveFilterPopup, setShowSaveFilterPopup, filterPredicates }: any, ref) => {
    type OverlayOption =
        | { id: string; kind: "field"; field: any }
        | { id: string; kind: "predefined"; predefined: any }
        | { id: string; kind: "saved"; saved: any };
    type ManagedChipItem = {
        id: string;
        type: "saved" | "search" | "predefined" | "custom" | "grouping";
        label: string;
        onRemove: () => void;
    };

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

    const defaultAggregationRules: AggregationRule[] = [
        {
            id: 1,
            operator: "count",
            fieldName: "id",
            locked: true
        }
    ];

    const defaultGroupingRules: GroupingRule[] = [
        { id: 1, fieldName: null, dateGrouping: null }
    ];

    const [initialState, setInitialState] = useState(defaultState);
    const pathname = usePathname();
    const searchableEntityLabel =
        viewData?.data?.solidView?.displayName ||
        viewData?.data?.solidView?.model?.displayName ||
        "records";


    const searchParams = useSearchParams() // Converts the query params to a string
    const activeSavedFilter = searchParams?.get("savedQuery");

    const router = useRouter();

    const chipsRef = useRef<HTMLDivElement | null | any>(null);

    // filterRules is used to maintian the ui of custom filter 
    // customFilter is used to maintian the transformed filter object of custom filter
    const [filterRules, setFilterRules] = useState<FilterRule[]>(initialState);
    const [customFilter, setCustomFilter] = useState<any | null>(null);

    const [fields, setFields] = useState<any[]>([]);
    const [searchableFields, setSearchableFields] = useState<any[]>([]);
    const [groupableFields, setGroupableFields] = useState<GroupableField[]>([]);

    const [groupingRules, setGroupingRules] = useState<GroupingRule[]>(defaultGroupingRules);
    const [aggregationRules, setAggregationRules] = useState<AggregationRule[]>(defaultAggregationRules);

    // used to show the list of predefined searches 
    const [predefinedSearches, setPredefinedSearches] = useState<PredefinedSearch[]>([]);

    // used to open / close the custom fitler popup 
    const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);

    // used to open / close the group fitler popup 
    const [showGroupFilterElement, setShowGroupFilterElement] = useState<boolean>(false);


    // searchChips maintain the ui to display searched query 
    // searchFilter maintain the transformed filter of the  searched query 
    const [searchChips, setSearchChips] = useState<{ columnName?: string; value: string }[]>([]);
    const [searchFilter, setSearchFilter] = useState<any | null>(null);

    // predefinedSearchChip maintain the ui to display predefined searches query 
    const [predefinedSearchChip, setPredefinedSearchChip] = useState<{ name: string; value: string } | null>(null);

    //  state to maintain the text typed in the search input box
    const [inputValue, setInputValue] = useState<string | null>("");
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // flag to prevent un necessary re renders
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    // currentSavedFilterData  is used to save the whole object of saved filter 
    const [currentSavedFilterData, setCurrentSavedFilterData] = useState<any>();
    const [currentSavedFilterQuery, setCurrentSavedFilterQuery] = useState<any>();
    const [currentSavedFilterRules, setCurrentSavedFilterRules] = useState<any>();
    const [showSavedFilterComponent, setShowSavedFilterComponent] = useState<boolean>(false);


    const [savedFilterTobeDeleted, setSavedFilterTobeDeleted] = useState<any>();
    const [isDeleteSQDialogVisible, setIsDeleteSQDialogVisible] = useState<boolean>(false);
    const [savedFilterQueryString, setSavedFilterQueryString] = useState<string>();
    const [showOverlay, setShowOverlay] = useState(false);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [showChipManager, setShowChipManager] = useState(false);
    const chipManagerRef = useRef<HTMLDivElement | null>(null);
    const chipManagerTriggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (focusedIndex >= 0 && showOverlay) {
            const activeElement = document.querySelector(`.solid-search-overlay-option-active`);
            if (activeElement) {
                activeElement.scrollIntoView({
                    block: 'nearest',
                    inline: 'start'
                });
            }
        }
    }, [focusedIndex, showOverlay]);

    const { data: session, status } = useSession();
    const user = session?.user;

    const [refreshKey, setRefreshKey] = useState(0);

    const [predefinedSearchBaseFilter, setPredefinedSearchBaseFilter] = useState<any>(null);

    const [savedFilters, setSavedFilters] = useState([]);
    const [savedFiltersLoaded, setSavedFiltersLoaded] = useState(false);

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

    const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading: isSavedFilterLoading, error }] = useLazyGetSolidEntitiesQuery();

    const [savedFilterFetchDataRefreshKey, setSavedFilterFetchDataRefreshKey] = useState(0);



    useEffect(() => {
        const fn = async () => {
            if (!viewData?.data?.solidView?.model?.id || !viewData?.data?.solidView?.id || !user?.id) {
                return;
            }
            setSavedFiltersLoaded(false)
            const filters = {
                $or: [
                    {
                        $and: [
                            { model: { $in: [viewData?.data?.solidView?.model?.id] } },
                            { view: { $in: [viewData?.solidView?.id] } },
                            { user: { $in: [user?.id] } },
                            { isPrivate: { $eq: true } }
                        ]
                    },
                    {
                        $and: [
                            { model: { $in: [viewData?.data?.solidView?.model?.id] } },
                            { view: { $in: [viewData?.solidView?.id] } },
                            { isPrivate: { $eq: false } }
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
            const savedFilter = await triggerGetSolidEntities(queryString).unwrap();

            if (savedFilter) {
                // console.log("savedFilter", savedFilter);
                setSavedFilters(savedFilter?.records)
            }
            setSavedFiltersLoaded(true);
        }
        fn()
    }, [
        activeSavedFilter,
        savedFilterFetchDataRefreshKey,
        viewData?.data?.solidView?.id,
        viewData?.data?.solidView?.model?.id,
        user?.id
    ])

    useImperativeHandle(ref, () => ({
        clearFilter: () => {
            setFilterRules(initialState);
        }
    }));

    useEffect(() => {
        const fn = async () => {
            let searchChips: any;
            let customChips: any;
            if (savedFiltersLoaded) {

                if (activeSavedFilter && savedFilters.length === 0) return;

                const queryObject = getFilterObjectFromLocalStorage();
                // const savedQuery = parsedSearchParams?.get("savedQuery");
                if (activeSavedFilter) {
                    const currentSavedFilterId = Number(activeSavedFilter);
                    const currentSavedFilterData: any = savedFilters.find((savedFilter: any) => savedFilter.id === currentSavedFilterId);
                    setCurrentSavedFilterData(currentSavedFilterData);
                    if (currentSavedFilterData) {
                        const filterJson = JSON.parse(currentSavedFilterData?.filterQueryJson);
                        if (filterJson) {
                            let finalSavedFilter = filterJson
                            setCurrentSavedFilterQuery(finalSavedFilter)
                        }
                    }
                } else {
                    setCurrentSavedFilterData(null)
                    setCurrentSavedFilterQuery(null)
                }
                if (queryObject) {
                    if (queryObject) {
                        searchChips = queryObject?.search_predicate || null;
                        customChips = queryObject?.custom_filter_predicate || null;
                    }
                }
                if (searchChips) {
                    setSearchFilter(searchChips);
                    // const formattedChips = searchChips?.$and.map((chip: any, key: any) => {
                    //     const chipKey = Object.keys(chip)[0]; // Get the key, e.g., "displayName"
                    //     const chipValue = chip[chipKey]?.$containsi; // Get the value of "$containsi"
                    //     const chipdata = {
                    //         columnName: chipKey,
                    //         value: chipValue
                    //     };
                    //     return chipdata
                    // }
                    // );
                    // setSearchChips(formattedChips);

                    const formattedChips = extractChips(searchChips);
                    setSearchChips(formattedChips);

                }
                if (customChips && Object.keys(customChips).length !== 0) {
                    setCustomFilter(customChips);
                    const rules: FilterRule = transformFiltersToRules(customChips);
                    const hydratedRules = await hydrateRelationRules([rules], viewData);
                    setFilterRules(hydratedRules);
                }
                const hasGroupingRules = (queryObject?.grouping_rules?.some((rule: any) => rule.fieldName !== null));

                if (hasGroupingRules) {
                    setGroupingRules(queryObject?.grouping_rules);
                } else {
                    // If no grouping rules in localStorage check layout
                    const layoutGroupBy = viewData?.data?.solidView?.layout?.attrs?.groupBy;

                    if (Array.isArray(layoutGroupBy) && layoutGroupBy.length > 0) {
                        const initialGroupingRules: GroupingRule[] = layoutGroupBy.map((groupStr: string, index: number) => {
                            const [fieldName, dateGrouping] = groupStr.split(":");
                            return {
                                id: Date.now() + index,
                                fieldName: fieldName || null,
                                dateGrouping: (dateGrouping as DateGroupingFormat) || null
                            };
                        });
                        setGroupingRules(initialGroupingRules);
                    }
                }

                if (queryObject?.aggregation_rules && queryObject?.aggregation_rules !== aggregationRules) {
                    setAggregationRules(queryObject?.aggregation_rules);
                }


                setRefreshKey((prev) => prev + 1)
                setHasSearched(true);
            }
        }
        fn()
    }, [viewData?.data?.solidView?.id, activeSavedFilter, savedFiltersLoaded])

    useEffect(() => {
        const fn = async () => {
            if (filterPredicates) {
                if (filterPredicates?.custom_filter_predicate && filterPredicates?.custom_filter_predicate !== customFilter) {
                    setCustomFilter(filterPredicates?.custom_filter_predicate);
                    const rules: FilterRule = transformFiltersToRules(filterPredicates.custom_filter_predicate);
                    const hydratedRules = await hydrateRelationRules([rules], viewData);
                    setFilterRules(hydratedRules);
                }
                if (filterPredicates?.search_predicate && filterPredicates?.search_predicate !== searchFilter) {
                    setSearchFilter(filterPredicates?.search_predicate);
                    // const formattedChips = filterPredicates.search_predicate?.$and.map((chip: any, key: any) => {
                    //     const chipKey = Object.keys(chip)[0]; // Get the key, e.g., "displayName"
                    //     const chipValue = chip[chipKey]?.$containsi; // Get the value of "$containsi"
                    //     const chipdata = {
                    //         columnName: chipKey,
                    //         value: chipValue
                    //     };
                    //     return chipdata
                    // }
                    // );
                    // setSearchChips(formattedChips);
                    const formattedChips = extractChips(filterPredicates.search_predicate);
                    setSearchChips(formattedChips);

                }
            }
        }
        fn()
    }, [filterPredicates])

    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            // Reset search state when switching views
            setSearchChips([]);
            setSearchFilter(null);
            setFilterRules(initialState);
            setCustomFilter(null);
            setPredefinedSearchChip(null);
            setPredefinedSearchBaseFilter(null);
            setInputValue("");


            let fieldsData = viewData?.data?.solidFieldsMetadata;
            // console.log(`fiels data while rendering solid global search element: `);
            // console.log(fieldsData);

            const layoutChildren = viewData?.data?.solidView?.layout?.children ?? [];
            const fieldElements = extractFields(layoutChildren);


            const fieldsList = Object.entries(fieldsData ?? {}).map(([key, value]: any) => {
                const viewFieldElement = fieldElements.find(
                    (f: any) => f?.attrs?.name === key
                );
                return {
                    name: value.displayName,
                    value: key,
                    type: value.type,
                    ormType: value.ormType,
                    matchMode: viewFieldElement?.attrs?.searchMatchMode,
                    searchField: viewFieldElement?.attrs?.searchField ?? null,
                    isSearchable: viewFieldElement?.attrs?.isSearchable ?? false,
                    relationType: value?.relationType ?? null,
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

            const groupableFieldsList = fieldsList.filter((field: any) => {
                switch (field.type) {
                    case "relation":
                        // Only include relation if searchField is present
                        if (field.relationType === "many-to-one")
                            return true;
                        return false;
                    case "longText":
                    case "shortText":
                    case "selectionStatic":
                    case "selectionDynamic":
                    case "int":
                    case "float":
                    case "boolean":
                    case "date":
                    case "datetime":
                        return true;
                    // case "selectionStatic":
                    case "computed":
                        return field.ormType === "varchar";
                    default:
                        return false;
                }
            });

            // Optionally map to a minimal structure if needed for UI
            let finalSearchableFieldsList: any = searchableFieldsList.map((field: any) => ({
                fieldName: field.value,
                displayName: field.name,
                searchField: field.searchField ?? "",
                matchMode: field.matchMode
            }));

            setSearchableFields(finalSearchableFieldsList);

            let finalGroupableFieldsList: any = groupableFieldsList.map((field: any) => ({
                fieldName: field.value,
                displayName: field.name,
                searchField: field.searchField ?? "",
                matchMode: field.matchMode,
                type: field.type,
                ormType: field.ormType,
                relationType: field.relationType,
                computedFieldValueType: field.computedFieldValueType
            }));

            setGroupableFields(finalGroupableFieldsList)

            const predefinedSearchesList = viewData?.data?.solidView?.layout?.attrs?.predefinedSearches || [];
            setPredefinedSearches(predefinedSearchesList);
        }
        // used to open the 
    }, [viewData])

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


    const handleAddChip = (columnName?: string) => {
        if (inputValue?.trim()) {
            const fallbackField = searchableFields[0]; // guaranteed object
            if (!fallbackField) return;
            // Support comma-separated values: split, trim and add as separate chips
            const values = inputValue.split(",").map(v => v.trim()).filter(v => v !== "");
            const fieldName = columnName || fallbackField.fieldName;
            const chipsToAdd = values.map(v => ({
                columnName: fieldName,
                value: v,
                columnDisplayName: fallbackField.displayName,
                searchField: fallbackField.searchField,
                matchMode: fallbackField.matchMode
            }));

            setSearchChips((prev) => [...prev, ...chipsToAdd]);
            setInputValue("");
            setHasSearched(true)
            setRefreshKey((prev) => prev + 1)

        }

    };

    const clearCustomFilter = () => {
        // handleApplyCustomFilter(finalFilter)
        setFilterRules(initialState);
        setCustomFilter(null)
        // setPredefinedSearchChip(null)
        // setPredefinedSearchBaseFilter(null)
        setHasSearched(true)
        setRefreshKey((prev) => prev + 1)

    }


    const transformCustomFilterRules = (filterRules: any) => {
        const transformedFilter = transformRulesToFilters(filterRules[0], viewData);
        // If there's a predefined search, merge it with the new custom filter
        let finalCustomFilter = transformedFilter;
        // if (predefinedSearchChip && predefinedSearchBaseFilter) {
        //     // Combine predefined filter with new custom filter
        //     finalCustomFilter = {
        //         $and: [predefinedSearchBaseFilter, transformedFilter]
        //     };
        // }
        setCustomFilter(finalCustomFilter);
        // handleApplyCustomFilter(finalFilter);
        setShowGlobalSearchElement(false);
        setHasSearched(true)
        setRefreshKey((prev) => prev + 1)
    }

    const transformSavedFilterRules = (filterRules: any) => {
        const transformedFilter = transformRulesToFilters(filterRules[0], viewData);

        // If there's a predefined search, merge it with the new custom filter
        let finalCustomFilter = transformedFilter;
        // if (predefinedSearchChip && predefinedSearchBaseFilter) {
        //     // Combine predefined filter with new custom filter
        //     finalCustomFilter = {
        //         $and: [predefinedSearchBaseFilter, transformedFilter]
        //     };
        // }
        setCurrentSavedFilterQuery(finalCustomFilter);
        // handleApplyCustomFilter(finalFilter);
        setShowSavedFilterComponent(false);
        setHasSearched(true)
        setRefreshKey((prev) => prev + 1)


    }

    const applyGrouping = (groupingRules: GroupingRule[], aggregationRules: AggregationRule[]) => {
        setHasSearched(true)
        setShowGroupFilterElement(false);
        setGroupingRules(groupingRules);
        setAggregationRules(aggregationRules);
        setRefreshKey((prev) => prev + 1)
    }

    useEffect(() => {
        if (refreshKey > 0 && hasSearched) {

            const formattedChips = {
                $and: searchChips.map((chip: any) => ({
                    fieldName: chip.columnName,
                    matchMode: chip.matchMode,
                    value: [chip.value],
                    searchField: chip.searchField ?? "",
                }))
            };


            const finalSearchFilter = tranformSearchToFilters(formattedChips);
            setSearchFilter(finalSearchFilter);

            let finalSavedFilter: any = currentSavedFilterQuery
            const finalPredefinedFilter = predefinedSearchBaseFilter

            const finalCustomFilter = customFilter
            const finalFilter = mergeAllDiffFilters(finalCustomFilter, finalSearchFilter, finalSavedFilter, finalPredefinedFilter, groupingRules, aggregationRules)
            handleApplyCustomFilter(finalFilter, true);
            setHasSearched(false)
            // }
        }
    }, [refreshKey]);


    // Handle predefined search selection

    const hasCustomFilterChanged = () => {
        if (!predefinedSearchChip || !customFilter || !predefinedSearchBaseFilter) {
            return false;
        }
        // Deep comparison to check if filter has changed
        return JSON.stringify(customFilter) !== JSON.stringify(predefinedSearchBaseFilter);
    };

    const openSavedCustomFilter = async (savedfilter: any) => {
        //Open custom filter popup 
        // router.push(`?savedQuery=${savedfilter.id}`);
        // setShowGlobalSearchElement(true);
        // // dont refetch the data yet
        // const customFilter = JSON.parse(savedfilter.filterQueryJson);
        // setCustomFilter(customFilter ? customFilter : null);
        // if (customFilter) {
        //     const formatedCustomChips: FilterRule = transformFiltersToRules(customFilter ? customFilter : null);
        //     setFilterRules(formatedCustomChips ? [formatedCustomChips] : initialState);
        // }


        setSearchChips([]);
        setSearchFilter(null);
        setFilterRules(initialState);
        setCustomFilter(null)
        setPredefinedSearchChip(null);
        setPredefinedSearchBaseFilter(null);

        // push the savedQuery=1 in url 
        if (savedfilter?.id) {
            const savedfilterId = savedfilter.id;
            // router.push(`?savedQuery=${savedfilter.id}`);
            setShowOverlay(false);
            const currentSavedFilterData: any = savedFilters.find((savedFilter: any) => savedFilter.id === savedfilterId);
            setCurrentSavedFilterData(currentSavedFilterData);
            if (currentSavedFilterData) {
                const filterJson = JSON.parse(currentSavedFilterData?.filterQueryJson);
                if (filterJson) {
                    let finalSavedFilter = filterJson
                    setCurrentSavedFilterQuery(finalSavedFilter)
                    const rules: FilterRule = transformFiltersToRules(finalSavedFilter ? finalSavedFilter : null);
                    const hydratedRules = await hydrateRelationRules(
                        [rules],
                        viewData
                    );
                    setCurrentSavedFilterRules(hydratedRules ? hydratedRules : initialState);
                    setShowSavedFilterComponent(true)
                }
            }
        } else {
            console.error(ERROR_MESSAGES.SAVE_FILTER_UNDEFINED_NULL);
        }
    }

    const deleteSavedFilter = async () => {
        // delte the saved filter with id 
        await deleteEntity(savedFilterTobeDeleted);
        // triggerGetSolidEntities(savedFilterQueryString);
        let parsedSearchParams = searchParams;
        const savedQuery = parsedSearchParams?.get("savedQuery");
        if (savedFilterTobeDeleted == savedQuery) {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete("savedQuery");
            router.push(`?${urlParams.toString()}`);
        }
        setIsDeleteSQDialogVisible(false);
        setTimeout(() => {
            setSavedFilterFetchDataRefreshKey(prev => prev + 1)
        }, 500)
    }
    const handleSaveFilter = async (formValues: any) => {
        setShowSaveFilterPopup(false)

        try {
            if (formValues.id) {
                const filterJson = currentSavedFilterQuery;
                const formData = new FormData();
                formData.append("name", formValues.name);
                formData.append("filterQueryJson", JSON.stringify(filterJson, null, 2));
                formData.append("modelId", viewData?.data?.solidView?.model?.id);
                formData.append("viewId", viewData?.data?.solidView?.id);
                formData.append("isPrivate", formValues.isPrivate);
                formData.append("userId", user?.id);

                await updateEntity({ id: +formValues.id, data: formData }).unwrap();

                setSearchChips([]);
                setSearchFilter(null);
                setFilterRules(initialState);
                setCustomFilter(null)
                setPredefinedSearchChip(null);
                const currentPageUrl = window.location.pathname; // Get the current page URL
                localStorage.removeItem(currentPageUrl); // Store in local storage with the URL as the key

                setPredefinedSearchBaseFilter(null);
                setTimeout(() => {
                    router.push(`?savedQuery=${formValues.id}`);
                }, 500)
            } else {

                const filterJson = customFilter;
                const formData = new FormData();
                formData.append("name", formValues.name);
                formData.append("filterQueryJson", JSON.stringify(filterJson, null, 2));
                formData.append("modelId", viewData?.data?.solidView?.model?.id);
                formData.append("viewId", viewData?.data?.solidView?.id);
                formData.append("isPrivate", formValues.isPrivate);
                formData.append("userId", user?.id);
                const result = await createEntity(formData).unwrap();

                setSearchChips([]);
                setSearchFilter(null);
                setFilterRules(initialState);
                setCustomFilter(null)
                setPredefinedSearchChip(null);
                setPredefinedSearchBaseFilter(null);

                const currentPageUrl = window.location.pathname; // Get the current page URL
                localStorage.removeItem(currentPageUrl); // Store in local storage with the URL as the key

                setTimeout(() => {
                    router.push(`?savedQuery=${result.data.id}`);
                }, 500)

            }
        } catch (error) {

        }
    }



    useEffect(() => {
        // Explicitly type the event as a MouseEvent
        function handleClickOutside(event: MouseEvent) {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                setShowOverlay(false);
            }
        }
        if (showOverlay) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showOverlay]);

    useEffect(() => {
        function handleChipManagerClickOutside(event: MouseEvent) {
            const targetNode = event.target as Node;
            if (chipManagerRef.current?.contains(targetNode)) return;
            if (chipManagerTriggerRef.current?.contains(targetNode)) return;
            setShowChipManager(false);
        }

        if (showChipManager) {
            document.addEventListener("mousedown", handleChipManagerClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleChipManagerClickOutside);
        };
    }, [showChipManager]);

    const CustomChip = () => {
        // console.log("customFilter", customFilter);
        const ruleCount =
            customFilter?.$or?.length ??
            customFilter?.$and?.length ??
            Object.keys(customFilter || {}).length;

        return (
            <li>
                <div className="custom-filter-chip-type">
                    <div className="flex align-items-center gap-2 text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"
                            onClick={() => {
                                setShowGlobalSearchElement(true)
                            }
                            }>
                            <rect width="20" height="20" rx="4" fill="#722ED1" />
                            <path d="M8.66667 15V13.3333H11.3333V15H8.66667ZM6 10.8333V9.16667H14V10.8333H6ZM4 6.66667V5H16V6.66667H4Z"
                                fill="white" />
                        </svg>
                        <span><strong>{ruleCount}</strong> rules applied</span>
                    </div>

                    {/* button to clear filter */}
                    <a onClick={clearCustomFilter}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="pi pi-times ml-1">
                        </i></a>
                </div>
            </li>
        )
    };


    //saved filter related code start

    const applySavedFilter = (savedfilter: any) => {

        setSearchChips([]);
        setSearchFilter(null);
        setFilterRules(initialState);
        setCustomFilter(null)
        setPredefinedSearchChip(null);
        setPredefinedSearchBaseFilter(null);
        const currentPageUrl = window.location.pathname; // Get the current page URL
        localStorage.removeItem(currentPageUrl); // Store in local storage with the URL as the key
        // push the savedQuery=1 in url 
        if (savedfilter?.id) {
            router.push(`?savedQuery=${savedfilter.id}`);
            setShowOverlay(false);
        } else {
            console.error(ERROR_MESSAGES.SAVE_FILTER_UNDEFINED_NULL);
        }
    }

    const removeSavedFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        setCurrentSavedFilterData(null);
        setCurrentSavedFilterQuery(null)
        if (params.has("savedQuery")) {
            params.delete("savedQuery");
            const newUrl = params.toString()
                ? `${pathname}?${params.toString()}`
                : pathname;
            router.push(newUrl);
        }
    }

    const SavedFiltersChip = () => {

        return (
            <li>
                <div className="custom-filter-chip-type">
                    <div className="flex align-items-center gap-2 text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"
                            onClick={() => {
                                const fn = async () => {
                                    if (currentSavedFilterQuery) {
                                        const rules: FilterRule = transformFiltersToRules(currentSavedFilterQuery ? currentSavedFilterQuery : null);
                                        const hydratedRules = await hydrateRelationRules(
                                            [rules],
                                            viewData
                                        );
                                        setCurrentSavedFilterRules(hydratedRules ? hydratedRules : initialState);
                                        setShowSavedFilterComponent(true)
                                    }
                                }
                                fn()
                            }
                            }
                        >
                            <rect width="20" height="20" rx="4" fill="#722ED1" />
                            <path d="M8.66667 15V13.3333H11.3333V15H8.66667ZM6 10.8333V9.16667H14V10.8333H6ZM4 6.66667V5H16V6.66667H4Z"
                                fill="white" />
                        </svg>
                        <span><strong>{currentSavedFilterData?.name}</strong></span>
                    </div>

                    {/* button to clear filter */}
                    <a onClick={removeSavedFilter}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="pi pi-times ml-1">
                        </i></a>
                </div>
            </li>
        )
    };

    const removeGrouping = () => {
        setGroupingRules(defaultGroupingRules);
        setAggregationRules(defaultAggregationRules);
        setHasSearched(true);
        setRefreshKey((prev) => prev + 1)
    }

    const GroupingChip = () => {
        return (
            <li className="solid-global-search-chip">
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"

                            onClick={() => setShowGroupFilterElement(true)}
                        >
                            <rect width="20" height="20" rx="4" fill="#722ED1" />
                            <path d="M8.66667 15V13.3333H11.3333V15H8.66667ZM6 10.8333V9.16667H14V10.8333H6ZM4 6.66667V5H16V6.66667H4Z"
                                fill="white" />
                        </svg>
                        <span><strong>{groupingRules.length}</strong> Grouping rules applied</span>
                    </div>

                    {/* button to clear filter */}
                    <a onClick={removeGrouping}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="pi pi-times ml-1">
                        </i></a>
                </div>
            </li>
        )
    };




    //saved filter related code end


    // search related code start

    const handleRemoveChipGroup = (columnName: string) => {
        const updatedChips = searchChips.filter(chip => chip.columnName !== columnName);
        setSearchChips(updatedChips);
        setHasSearched(true);
        setRefreshKey((prev) => prev + 1)

    };

    const groupedSearchChips = searchChips.reduce((acc: Record<string, string[]>, chip) => {
        const key = chip.columnName;
        if (!key) return acc; // skip if undefined

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(chip.value);
        return acc;
    }, {});

    const customRuleCount =
        customFilter?.$or?.length ??
        customFilter?.$and?.length ??
        Object.keys(customFilter || {}).length;

    const managedChipItems = useMemo<ManagedChipItem[]>(() => {
        const items: ManagedChipItem[] = [];

        if (currentSavedFilterData?.name) {
            items.push({
                id: "saved-filter",
                type: "saved",
                label: `Saved: ${currentSavedFilterData.name}`,
                onRemove: () => removeSavedFilter(),
            });
        }

        if (predefinedSearchChip?.name && predefinedSearchChip?.value) {
            items.push({
                id: "predefined-search",
                type: "predefined",
                label: `Predefined: ${predefinedSearchChip.name} (${predefinedSearchChip.value})`,
                onRemove: () => removePredefinedSearchChip(),
            });
        }

        if (customFilter && customRuleCount > 0) {
            items.push({
                id: "custom-filter",
                type: "custom",
                label: `${customRuleCount} custom rules applied`,
                onRemove: () => clearCustomFilter(),
            });
        }

        if (groupingRules.length > 0 && groupingRules.some((r) => r.fieldName !== null)) {
            items.push({
                id: "grouping-rules",
                type: "grouping",
                label: `${groupingRules.length} grouping rules applied`,
                onRemove: () => removeGrouping(),
            });
        }

        Object.entries(groupedSearchChips).forEach(([column, values]) => {
            const fieldMeta = searchableFields.find((field) => field.fieldName === column);
            const columnDisplayName = fieldMeta?.displayName || column;
            items.push({
                id: `search:${column}`,
                type: "search",
                label: `${columnDisplayName}: ${values.join(" or ")}`,
                onRemove: () => handleRemoveChipGroup(column),
            });
        });

        return items;
    }, [
        currentSavedFilterData,
        predefinedSearchChip,
        customFilter,
        customRuleCount,
        groupingRules,
        groupedSearchChips,
        searchableFields,
    ]);

    const MAX_VISIBLE_CHIPS = 3;
    const visibleChipItems = managedChipItems.slice(0, MAX_VISIBLE_CHIPS);
    const hiddenChipItems = managedChipItems.slice(MAX_VISIBLE_CHIPS);
    const hiddenChipCount = hiddenChipItems.length;

    const clearAllAppliedChips = () => {
        if (managedChipItems.length === 0) return;

        if (activeSavedFilter || currentSavedFilterData) {
            removeSavedFilter();
        }

        setSearchChips([]);
        setSearchFilter(null);
        setPredefinedSearchChip(null);
        setPredefinedSearchBaseFilter(null);
        setCustomFilter(null);
        setFilterRules(initialState);
        setGroupingRules(defaultGroupingRules);
        setAggregationRules(defaultAggregationRules);
        setShowChipManager(false);
        setHasSearched(true);
        setRefreshKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (managedChipItems.length === 0 && showChipManager) {
            setShowChipManager(false);
        }
    }, [managedChipItems.length, showChipManager]);


    const overlayOptions = useMemo<OverlayOption[]>(() => {
        const currentValue = inputValue?.trim() || "";
        const fields: OverlayOption[] = currentValue
            ? searchableFields.map((field: any) => ({ 
                id: `field:${field.fieldName}`, 
                kind: "field" as const, 
                field 
            }))
            : [];
        const predefined: OverlayOption[] =
            currentValue && predefinedSearches?.length
                ? predefinedSearches.map((p: any, idx: number) => ({
                    id: `predefined:${p.name || idx}`,
                    kind: "predefined" as const,
                    predefined: p,
                }))
                : [];
        const saved: OverlayOption[] = (savedFilters || []).map((s: any) => ({
            id: `saved:${s.id}`,
            kind: "saved" as const,
            saved: s,
        }));

        return [...fields, ...predefined, ...saved];
    }, [inputValue, searchableFields, predefinedSearches, savedFilters]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const currentValue = inputValue?.trim() || "";

        const applyFieldOption = (value: any) => {
            const trimmed = inputValue?.trim();
            if (!trimmed) return;
            const values = trimmed.split(",").map((v) => v.trim()).filter((v) => v !== "");
            const chipsToAdd = values.map(v => ({
                columnName: value.fieldName,
                value: v,
                columnDisplayName: value.displayName,
                searchField: value.searchField,
                matchMode: value.matchMode
            }));
            setSearchChips((prev) => [...prev, ...chipsToAdd]);
            setInputValue("");
            setHasSearched(true);
            setRefreshKey((prev) => prev + 1);
            setShowOverlay(false);
        };

        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && overlayOptions.length > 0) {
            e.preventDefault();
            setShowOverlay(true);
            const nextIndex =
                e.key === "ArrowDown"
                    ? (focusedIndex + 1) % overlayOptions.length
                    : (focusedIndex <= 0 ? overlayOptions.length - 1 : focusedIndex - 1);
            setFocusedIndex(nextIndex);
            return;
        }

        if (e.key === "Enter") {
            if (currentValue || focusedIndex >= 0) {
                e.preventDefault();
                const activeOption = overlayOptions[focusedIndex] || (currentValue ? overlayOptions[0] : null);
                
                if (activeOption?.kind === "field") {
                    applyFieldOption(activeOption.field);
                } else if (activeOption?.kind === "predefined") {
                    handlePredefinedSearch(activeOption.predefined);
                } else if (activeOption?.kind === "saved") {
                    applySavedFilter(activeOption.saved);
                } else if (currentValue) {
                    handleAddChip();
                    setShowOverlay(false);
                }
            }
        } else if (e.key === "Backspace" && inputValue === "") {
            if (searchChips.length > 0) {
                setSearchChips((prev) => prev.slice(0, -1));
            } else if (customFilter) {
                setCustomFilter(null);
                setFilterRules(initialState);
            } else if (predefinedSearchChip) {
                setPredefinedSearchChip(null);
                setPredefinedSearchBaseFilter(null);
            } else if (activeSavedFilter) {
                removeSavedFilter();
            }
            setHasSearched(true);
            setRefreshKey((prev) => prev + 1);
        }
    };

    useEffect(() => {
        if (!showOverlay) {
            setFocusedIndex(-1);
        }
    }, [showOverlay]);

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

    // search related code end


    // predefinedfilter related code start

    const handlePredefinedSearch = (predefinedSearch: any) => {
        if (!inputValue?.trim()) return;

        if (!predefinedSearch?.filters) {
            console.error('Invalid predefined search: missing filters', predefinedSearch);
            return;
        }

        try {
            // Replace {{ search }} placeholders with actual search value
            const processedFilter = replacePlaceholders(predefinedSearch.filters, inputValue.trim());

            // Clear all existing filters and searches
            // setSearchChips([]);
            // setSearchFilter(null);
            // setFilterRules(initialState);
            // setCustomFilter(null)
            // removeSavedFilter();
            // Set the predefined search chip
            setPredefinedSearchChip({
                name: predefinedSearch.name,
                value: inputValue.trim()
            });

            setPredefinedSearchBaseFilter(processedFilter);

            // Apply the predefined search filter as custom filter
            // setCustomFilter(processedFilter);

            // Apply the filter
            // handleApplyCustomFilter(finalFilter);

            // Clear input and close overlay
            setInputValue("");
            setShowOverlay(false);
            setHasSearched(true);
            setRefreshKey((prev) => prev + 1)
        } catch (error) {
            console.error('Error applying predefined search:', error);
            // Optionally show user-friendly error message
        }
    };


    const removePredefinedSearchChip = () => {
        setPredefinedSearchChip(null);
        setPredefinedSearchBaseFilter(null)
        setCustomFilter(null);
        // handleApplyCustomFilter(finalFilter);
        setHasSearched(true);
        setRefreshKey((prev) => prev + 1)
    };

    const PredefinedSearchChip = () => (
        <li>
            <div className="search-filter-chip-type">
                <div className="flex align-items-center gap-2">
                    <strong>{predefinedSearchChip?.name}:</strong>
                    <span className="custom-chip-value">{predefinedSearchChip?.value}</span>
                </div>
                {/* button to clear filter */}
                <i className="pi pi-times ml-1"
                    style={{ cursor: "pointer" }}
                    onClick={removePredefinedSearchChip}
                >
                </i>
            </div>
        </li>
    );

    // predefinedfilter related code end

    return (
        <>
            <div className="flex justify-content-center solid-custom-filter-wrapper relative">
                <div className="solid-global-search-element">
                    <ul className="solid-global-search-chip-list">
                        {visibleChipItems.map((chip) => (
                            <li key={chip.id}>
                                <div className={`search-filter-chip-type solid-chip-pill solid-chip-tone-${chip.type}`}>
                                    <span className="custom-chip-value solid-chip-pill-label" title={chip.label}>
                                        {chip.label}
                                    </span>
                                    <button
                                        type="button"
                                        className="solid-chip-pill-remove"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={chip.onRemove}
                                        aria-label={`Remove ${chip.label}`}
                                    >
                                        <i className="pi pi-times" />
                                    </button>
                                </div>
                            </li>
                        ))}
                        {hiddenChipCount > 0 && (
                            <li>
                                <button
                                    type="button"
                                    ref={chipManagerTriggerRef}
                                    className="solid-chip-manage-trigger"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowChipManager((prev) => !prev)}
                                >
                                    +{hiddenChipCount} more
                                </button>
                            </li>
                        )}
                        {managedChipItems.length > 0 && hiddenChipCount === 0 && (
                            <li>
                                <button
                                    type="button"
                                    ref={chipManagerTriggerRef}
                                    className="solid-chip-manage-trigger solid-chip-manage-trigger-secondary"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowChipManager((prev) => !prev)}
                                >
                                    Manage
                                </button>
                            </li>
                        )}
                        <li ref={chipsRef} className="solid-global-search-input-item">
                            <div className="relative solid-global-search-element-wrapper">
                                <InputText
                                    className="solid-global-search-input"
                                    value={inputValue || ""}
                                    placeholder="Search."
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setShowChipManager(false);
                                        setShowOverlay(true);
                                        setFocusedIndex(-1);
                                    }}
                                    onFocus={() => {
                                        setShowChipManager(false);
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
                                    onClick={() => {
                                        setShowChipManager(false);
                                        setShowOverlay(true);
                                    }}
                                    className="custom-filter-button solid-global-search-trigger"
                                />
                            </div>
                        </li>
                    </ul>
                </div>

                {showChipManager && managedChipItems.length > 0 && (
                    <div ref={chipManagerRef} className="absolute z-5 solid-chip-manager-panel">
                        <div className="solid-chip-manager-header">
                            <div className="solid-chip-manager-title">Applied chips ({managedChipItems.length})</div>
                            <button type="button" className="solid-chip-manager-clear-btn" onClick={clearAllAppliedChips}>
                                Clear all
                            </button>
                        </div>
                        <div className="solid-chip-manager-body">
                            {managedChipItems.map((chip) => (
                                <div key={`manage-${chip.id}`} className={`solid-chip-manager-item solid-chip-tone-${chip.type}`}>
                                    <span className="solid-chip-manager-item-label" title={chip.label}>
                                        {chip.label}
                                    </span>
                                    <button
                                        type="button"
                                        className="solid-chip-manager-item-remove"
                                        onClick={chip.onRemove}
                                        aria-label={`Remove ${chip.label}`}
                                    >
                                        <i className="pi pi-times" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showOverlay && (
                    <div ref={overlayRef} className="absolute w-full z-5 shadow-2 solid-search-overlay-pannel">
                        <div className="solid-search-overlay-scroll">
                            {inputValue ? (
                                <>
                                    <div className="custom-filter-search-options solid-search-overlay-section px-3 py-1 flex flex-column">
                                        <h6 className="my-1 solid-search-overlay-heading solid-search-overlay-section-title">Search by fields</h6>
                                        {searchableFields.length > 0 ? (
                                            searchableFields.map((value: any, index: number) => {
                                                return (
                                                    <Button
                                                        key={index}
                                                        className={`flex gap-1 text-color solid-search-overlay-option ${focusedIndex === index ? "solid-search-overlay-option-active" : ""}`}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const currentValue = inputValue?.trim();
                                                            if (currentValue) {
                                                                const values = currentValue.split(",").map((v) => v.trim()).filter((v) => v !== "");
                                                                const chipsToAdd = values.map(v => ({
                                                                    columnName: value.fieldName,
                                                                    value: v,
                                                                    columnDisplayName: value.displayName,
                                                                    searchField: value.searchField,
                                                                    matchMode: value.matchMode
                                                                }));
                                                                setSearchChips((prev) => [...prev, ...chipsToAdd]);
                                                                setInputValue("");
                                                                setHasSearched(true);
                                                                setRefreshKey((prev) => prev + 1)
                                                                setShowOverlay(false);
                                                            }
                                                        }}
                                                        onMouseEnter={() => setFocusedIndex(index)}
                                                        text
                                                        severity="secondary"
                                                        size="small"
                                                    >
                                                        Search <strong>{value.displayName}</strong> for: <span className="font-bold text-color">{inputValue}</span>
                                                    </Button>
                                                )
                                            })
                                        ) : (
                                            <div className="solid-search-overlay-no-fields">
                                                <div className="solid-search-overlay-no-fields-icon">
                                                    <SearchX size={14} />
                                                </div>
                                                <div className="solid-search-overlay-no-fields-text">
                                                    No fields configured for search.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {predefinedSearches && predefinedSearches.length > 0 && (
                                        <>
                                            <Divider className="m-0" />
                                            <div className="custom-filter-search-options solid-search-overlay-section px-3 py-1 flex flex-column">
                                                <h6 className="my-1 solid-search-overlay-heading solid-search-overlay-section-title">Predefined searches</h6>
                                                {predefinedSearches.map((predefinedSearch: any, index: number) => (
                                                    <Button
                                                        key={index}
                                                        className={`flex flex-column align-items-start gap-1 text-color solid-search-overlay-option solid-search-overlay-option-stacked ${focusedIndex === searchableFields.length + index ? "solid-search-overlay-option-active" : ""}`}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handlePredefinedSearch(predefinedSearch);
                                                        }}
                                                        onMouseEnter={() => setFocusedIndex(searchableFields.length + index)}
                                                        text
                                                        severity="secondary"
                                                        size="small"
                                                    >
                                                        <div className="flex gap-1 align-items-center">
                                                            <strong>{predefinedSearch.name}:</strong>
                                                            <span className="font-bold text-color">{inputValue}</span>
                                                        </div>
                                                        <div className="text-xs">{predefinedSearch.description}</div>
                                                    </Button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) :
                                <>
                                    <div className="p-3 solid-search-overlay-empty">
                                        <div className="solid-search-overlay-empty-title">Start typing to search</div>
                                        <div className="solid-search-overlay-empty-subtitle">
                                            Start typing in search input to see all fields on which you can search {searchableEntityLabel} by.
                                        </div>
                                    </div>
                                    <Divider className="m-0" />
                                </>
                            }
                            {savedFilters.length > 0 &&
                                <>
                                    <div className="p-3 solid-search-overlay-section">
                                        <p className="solid-search-overlay-heading solid-search-overlay-section-title">Saved filters</p>
                                        <div className="flex flex-column solid-search-overlay-saved-list">
                                            {savedFilters.map((savedfilter: any, index: number) => (
                                                <SavedFilterList
                                                    key={savedfilter.id}
                                                    savedfilter={savedfilter}
                                                    activeSavedFilter={activeSavedFilter}
                                                    applySavedFilter={applySavedFilter}
                                                    openSavedCustomFilter={openSavedCustomFilter}
                                                    setSavedFilterTobeDeleted={setSavedFilterTobeDeleted}
                                                    setIsDeleteSQDialogVisible={setIsDeleteSQDialogVisible}
                                                    isFocused={overlayOptions[focusedIndex]?.id === `saved:${savedfilter.id}`}
                                                    onMouseEnter={() => {
                                                        const optIndex = overlayOptions.findIndex(o => o.id === `saved:${savedfilter.id}`);
                                                        if (optIndex !== -1) setFocusedIndex(optIndex);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            }
                        </div>

                        <div className="px-3 py-2 flex flex-column solid-search-overlay-footer">
                            <div className="solid-search-overlay-footer-title solid-search-overlay-section-title">Or apply a custom filter</div>
                            <div className="solid-search-overlay-footer-subtitle">
                                Use custom filters to apply filters on any field using any operator for a more flexible approach to filtering data.
                            </div>
                            <div className="solid-search-overlay-footer-actions">
                                <Button text size="small" label="Custom Filter" iconPos="left" icon='pi pi-filter' onClick={() => setShowGlobalSearchElement(true)} className="solid-search-overlay-option solid-search-overlay-footer-btn" />
                                {viewType === "tree" &&
                                    <Button text size="small" label="Grouping" iconPos="left" icon='pi pi-plus' onClick={() => setShowGroupFilterElement(true)} className="solid-search-overlay-option solid-search-overlay-footer-btn" />
                                }
                            </div>
                        </div>
                    </div>
                )
                }
                <Dialog header={false} className="solid-global-search-filter solid-filter-dialog-shell" showHeader={false} visible={showGlobalSearchElement} style={{ width: '52vw' }} breakpoints={{ '1200px': '62vw', '1024px': '72vw', '991px': '86vw', '767px': '94vw', '250px': '96vw' }} onHide={() => { if (!showGlobalSearchElement) return; setShowGlobalSearchElement(false); }}>
                    <div className="solid-filter-dialog-head">
                        <div>
                            <h5 className="solid-filter-dialog-title m-0">Add Custom Filter</h5>
                            <p className="solid-filter-dialog-subtitle m-0">Apply conditions on any field with operators.</p>
                        </div>
                        <SolidButton type="button" variant="ghost" size="sm" aria-label="Cancel" onClick={() => setShowGlobalSearchElement(false)} className="solid-filter-dialog-close">
                            <i className="pi pi-times" />
                        </SolidButton>
                    </div>
                    <div className="solid-filter-dialog-sep" />
                    <div className="solid-filter-dialog-body">
                        {fields.length > 0 &&
                            <FilterComponent viewData={viewData} fields={fields} filterRules={filterRules} setFilterRules={setFilterRules} transformFilterRules={transformCustomFilterRules} closeDialog={() => setShowGlobalSearchElement(false)}></FilterComponent>
                        }
                    </div>
                </Dialog>
                <Dialog header={false} className="solid-global-search-filter solid-filter-dialog-shell solid-filter-dialog-shell-grouping" showHeader={false} visible={showGroupFilterElement} style={{ width: '24vw' }} breakpoints={{ '1024px': '75vw', '991px': '90vw', '767px': '94w', '250px': '96vw' }} onHide={() => { if (!showGroupFilterElement) return; setShowGroupFilterElement(false); }}>
                    <div className="solid-filter-dialog-head">
                        <div>
                            <h5 className="solid-filter-dialog-title m-0">Grouping</h5>
                            <p className="solid-filter-dialog-subtitle m-0">Configure grouping and aggregation.</p>
                        </div>
                        <SolidButton type="button" variant="ghost" size="sm" aria-label="Cancel" onClick={() => setShowGroupFilterElement(false)} className="solid-filter-dialog-close">
                            <i className="pi pi-times" />
                        </SolidButton>
                    </div>
                    <div className="solid-filter-dialog-sep" />
                    <div className="solid-filter-dialog-body">
                        {groupableFields.length > 0 &&
                            <GroupingComponent
                                viewData={viewData}
                                fields={groupableFields}
                                groupingRules={groupingRules}
                                setGroupingRules={setGroupingRules}
                                aggregationRules={aggregationRules}
                                setAggregationRules={setAggregationRules}
                                applyGrouping={applyGrouping}
                                closeDialog={() => setShowGroupFilterElement(false)}
                            ></GroupingComponent>
                        }
                    </div>
                </Dialog >
                <Dialog header={false} className="solid-global-search-filter solid-filter-dialog-shell" showHeader={false} visible={showSavedFilterComponent} style={{ width: '52vw' }} breakpoints={{ '1200px': '62vw', '1024px': '72vw', '991px': '86vw', '767px': '94vw', '250px': '96vw' }} onHide={() => { if (!showSavedFilterComponent) return; setShowSavedFilterComponent(false); }}>
                    <div className="solid-filter-dialog-head">
                        <div>
                            <h5 className="solid-filter-dialog-title m-0">Saved Filter</h5>
                            <p className="solid-filter-dialog-subtitle m-0">Review and refine the saved filter conditions.</p>
                        </div>
                        <SolidButton type="button" variant="ghost" size="sm" aria-label="Cancel" onClick={() => setShowSavedFilterComponent(false)} className="solid-filter-dialog-close">
                            <i className="pi pi-times" />
                        </SolidButton>
                    </div>
                    <div className="solid-filter-dialog-sep" />
                    <div className="solid-filter-dialog-body">
                        {fields.length > 0 &&
                            <FilterComponent viewData={viewData} fields={fields} filterRules={currentSavedFilterRules} setFilterRules={setCurrentSavedFilterRules} transformFilterRules={transformSavedFilterRules} closeDialog={() => setShowSavedFilterComponent(false)}></FilterComponent>
                        }
                    </div>
                </Dialog>
                <Dialog header="Save Custom Filter" className="solid-custom-filter-dialog" visible={showSaveFilterPopup} style={{ width: 500 }} onHide={() => { if (!showSaveFilterPopup) return; setShowSaveFilterPopup(false); }}>
                    <SolidSaveCustomFilterForm currentSavedFilterData={currentSavedFilterData} handleSaveFilter={handleSaveFilter} closeDialog={setShowSaveFilterPopup}></SolidSaveCustomFilterForm>
                </Dialog>

                <Dialog
                    visible={isDeleteSQDialogVisible}
                    header="Confirm Delete"
                    modal
                    className="solid-confirm-dialog"
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
            </div >
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
