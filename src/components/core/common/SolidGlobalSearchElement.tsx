import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { SolidSearchBox } from "./SolidSearchBox";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "@/components/core/common/FilterComponent";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";
import { Chips } from "primereact/chips";

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

export const SolidGlobalSearchElement = forwardRef(({ viewData, handleApplyCustomFilter, filters, clearFilter }: any, ref) => {
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

    const op = useRef<OverlayPanel>(null);
    const chipsRef = useRef<HTMLDivElement | null>(null);

    const [filterRules, setFilterRules] = useState<FilterRule[]>(initialState);
    const [fields, setFields] = useState<any[]>([]);
    const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);
    const [customChip, setCustomChip] = useState("");
    const [searchChips, setSearchChips] = useState<{ columnName?: string; value: string }[]>([]);
    const [inputValue, setInputValue] = useState<string | null>("");

    useImperativeHandle(ref, () => ({
        clearFilter: () => {
            setFilterRules(initialState);
        }
    }));

    useEffect(() => {
        if (viewData?.data?.solidFieldsMetadata) {
            const fieldsData = viewData?.data?.solidFieldsMetadata
            const fieldsList = Object.entries(fieldsData).map(([key, value]: any) => ({ name: value.displayName, value: key }));
            setFields(fieldsList)
        }
    }, [])

    useEffect(() => {
        if (chipsRef.current) {
            const inputElement = chipsRef.current.querySelector("input");
            if (inputElement) {
                inputElement.addEventListener("input", (e) => {
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

    const handleChipChange = (e: any) => {
        setInputValue(e.target.value);
        if (op.current && e.target) {
            op.current.show;
        }
        if (e.value && e.value.length > 0) {
            const newChip = e.value[e.value.length - 1];
            if (!searchChips.some(chip => chip.value === newChip.value)) {
                setSearchChips([...searchChips, newChip]);
            }
        }
    };

    const firstFilterableFieldName = viewData?.data?.solidView?.layout?.children?.find(
        (value: any) => value?.attrs?.filterable
    )?.attrs?.name;

    const handleAddChip = (columnName?: string) => {
        if (inputValue?.trim()) {
            const newChip = { columnName: columnName || firstFilterableFieldName, value: inputValue.trim() };

            setSearchChips((prevChips) => [...prevChips, newChip]);
            setInputValue(""); // Clear input value
        }
    }

    const handleKeyDown = (e: any) => {
        if (e.key === "Enter" && inputValue?.trim()) {
            handleAddChip();
            setInputValue(null);
            e.preventDefault(); // Prevent form submission or unexpected behavior
        }
    };

    const transformFilterRules = (filterRules: any) => {
        const transformedFilter = transformRulesToFilters(filterRules[0]);
        if (transformedFilter) {
            handleApplyCustomFilter(transformedFilter)
        }
        setShowGlobalSearchElement(false)
    }

    useEffect(() => {
        const formattedChips = {
            id: 1,
            matchOperator: "and",
            parentRule: null,
            type: "rule_group",
            children: searchChips.map((chip) => ({
                children: [],
                fieldName: chip.columnName,
                id: Date.now() + getRandomInt(1, 500),
                matchMode: "$containsi",
                parentRule: 1,
                type: "rule",
                value: [chip.value]
            }))
        };
        if (formattedChips.children.length > 0) {
            const transformedFilter = transformRulesToFilters(formattedChips);
            handleApplyCustomFilter(transformedFilter);
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

    const chipsToDisplay = [
        ...(customChip ? [customChip] : []),
        ...Object.entries(groupedSearchChips).map(([columnName, values]) => `<div class="custom-chip-column">${columnName}</div> <div class="custom-chip-value">${values.join("<span class='custom-chip-or'> or</span> ")}</div>`)
    ];


    // useEffect(() => {
    //     console.log("Input Value", customChip, "Input Value", searchChips, "Input Value", inputValue);
    // }, [chipsToDisplay])

    const customChipTemplate = (item: any) => {
        if (item === customChip) {
            return (
                <div className="flex align-items-center gap-2 text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" onClick={() => setShowGlobalSearchElement(true)} >
                        <rect width="20" height="20" rx="4" fill="#722ED1" />
                        <path d="M8.66667 15V13.3333H11.3333V15H8.66667ZM6 10.8333V9.16667H14V10.8333H6ZM4 6.66667V5H16V6.66667H4Z" fill="white" />
                    </svg>
                    <span><strong>{customChip}</strong> rule{customChip === "1" ? '' : 's'} applied</span>
                </div>
            );
        }
        return <div className="flex align-items-center gap-2 text-base" dangerouslySetInnerHTML={{ __html: item }}></div>;
    };

    const handleRemoveChip = (removedChipValue: any) => {
        console.log("Removing chip:", removedChipValue);

        setSearchChips((prevChips) => {
            const updatedChips = prevChips.filter((chip) => chip.value !== removedChipValue);
            console.log("Updated searchChips after removal:", updatedChips);
            return updatedChips;
        });

        // Prevent clearing customChip if it is different from the removed chip
        if (customChip === removedChipValue) {
            console.log("Clearing custom chip:", customChip);
            setCustomChip("");
        }
    };

    return (
        <div className="flex justify-content-center solid-custom-filter-wrapper">
            <div className="p-inputgroup flex-1 custom-input-group"
                ref={chipsRef}
                onClick={(e) => {
                    e.preventDefault();
                    if (op.current && e.target) {
                        op.current.toggle(e);
                    }
                }}
            >
                <Chips
                    value={chipsToDisplay}
                    onChange={(e: any) => {
                        // Compare previous and new values to detect removal
                        if (e.value.length < searchChips.length) {
                            const removedChip = searchChips.find(chip => !e.value.includes(chip.value));
                            if (removedChip) {
                                handleRemoveChip(removedChip.value);
                            }
                        } else {
                            setSearchChips(e.value.map((val: any) => ({ columnName: firstFilterableFieldName, value: val })));
                        }
                    }}
                    onRemove={(event) => {
                        setSearchChips((prevChips) => prevChips.filter((chip) => chip.value !== event.value));
                        if (searchChips.length === 1) {
                            setCustomChip("");
                            clearFilter();
                        }
                    }}
                    itemTemplate={customChipTemplate}
                    onKeyDown={handleKeyDown}
                    className="custom-filter-chip"
                    placeholder="Search..."
                    removeIcon='pi pi-times'
                    removable
                />
                <Button
                    icon="pi pi-search"
                    style={{ fontSize: 10 }}
                    severity="secondary"
                    outlined size="small"
                    onClick={() => setShowGlobalSearchElement(true)}
                // onClick={(e) => {
                //     if (op.current && e.target) {
                //         op.current.toggle(e);
                //     }
                // }}
                />
            </div>
            <OverlayPanel ref={op} className="solid-custom-overlay" style={{ minWidth: 405 }}>
                {inputValue ? (
                    <>
                        <div className="custom-filter-search-options px-2 py-2 flex flex-column">
                            {viewData?.data?.solidView?.layout?.children
                                .filter((value: any) => value?.attrs?.filterable) // Only keep filterable fields
                                .map((value: any, index: any) => (
                                    <Button
                                        key={index}
                                        className="p-2 flex gap-1 text-color"
                                        onClick={() => handleAddChip(value?.attrs?.name)}
                                        text
                                        severity="secondary"
                                        size="small"
                                    >
                                        Search <strong>{value?.attrs?.name}</strong> for :
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
                <Divider className="m-0" />
            </OverlayPanel>
            <Dialog header={false} className="solid-global-search-filter" showHeader={false} visible={showGlobalSearchElement} style={{ width: '50vw' }} onHide={() => { if (!showGlobalSearchElement) return; setShowGlobalSearchElement(false); }}>
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