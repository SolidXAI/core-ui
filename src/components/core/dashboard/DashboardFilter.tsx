import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { SqlExpression } from "../../../types/solid-core";
import { DashboardVariableRecord } from "./SolidDashboard";
import { useLazyGetDashboardVariableSelectionDynamicValuesQuery } from "../../../redux/api/dashboardApi";

interface DashboardFilterProps {
    dashboardVariables: DashboardVariableRecord[];
    initialFilters: SqlExpression[];
    onApply: (filters: SqlExpression[]) => void;
    visible: boolean;
    onHide: () => void;
}

const getNumberOfInputs = (matchMode: any): number | null => {
    switch (matchMode) {
        case '$between': return 2;
        case '$in': case '$notIn': return null;
        case '$startsWith': case '$contains': case '$notContains': case '$endsWith': case '$equals': case '$notEquals': case '$lt': case '$lte': case '$gt': case '$gte': return 1;
        case '$null': case '$notNull': return 0;
        default: return 1;
    }
}

const dateFilterMatchModeOptions = [
    { label: 'Equals', value: "$eq" },
    { label: 'Not Equals', value: "$nei" },
    { label: 'Less Than', value: "$lt" },
    { label: 'Less Than Or Equal', value: "$lte" },
    { label: 'Greater Than', value: "$gt" },
    { label: 'Greater Than Or Equal', value: "$gte" },
    { label: 'In', value: "$in" },
    { label: 'Not In', value: "$notIn" },
    { label: 'Between', value: "$between" },
    { label: 'Is null', value: "$null" },
    { label: 'Is Not null', value: "$notNull" }
];

const selectionFilterMatchModeOptions = [
    { label: 'In', value: "$in" },
    { label: 'Not In', value: "$notIn" },
    { label: 'Is null', value: "$null" },
    { label: 'Is Not null', value: "$notNull" }
];

const FilterValueInput = ({ rule, onChange }: any) => {
    const numberOfInputs = getNumberOfInputs(rule.matchMode);

    // Ensure values is an array properly sized immediately on render
    let values = Array.isArray(rule.value) ? [...rule.value] : (rule.value ? [rule.value] : []);

    if (numberOfInputs !== null && numberOfInputs > 0 && values.length !== numberOfInputs) {
        if (values.length < numberOfInputs) {
            values = [...values, ...Array(numberOfInputs - values.length).fill('')];
        } else {
            values = values.slice(0, numberOfInputs);
        }
    }
    if (values.length === 0 && (numberOfInputs === null || numberOfInputs > 0)) {
        values = [''];
    }

    const updateValue = (index: number, val: any) => {
        const newValues = [...values];
        newValues[index] = val;
        onChange(rule.id, 'value', numberOfInputs === 1 ? newValues[0] : newValues);
    };

    const addInput = () => {
        const newValues = [...values, ''];
        onChange(rule.id, 'value', newValues);
    };

    const deleteInput = (index: number) => {
        if (values.length > 1) {
            const newValues = values.filter((_: any, i: number) => i !== index);
            onChange(rule.id, 'value', newValues);
        }
    };

    // Components for actual rendering
    const renderDate = (val: any, index: number) => {
        let dateVal = val ? new Date(val) : null;
        if (isNaN(dateVal?.getTime() || 0)) dateVal = null;
        return (
            <Calendar
                value={dateVal}
                onChange={(e) => {
                    const dateStr = e.value ? (e.value as Date).toISOString().split('T')[0] : '';
                    updateValue(index, dateStr);
                }}
                dateFormat="mm/dd/yy"
                placeholder="mm/dd/yyyy"
                mask="99/99/9999"
                className="w-full"
                inputClassName="w-full p-inputtext-sm"
            />
        );
    };

    const SelectionStaticInput = ({ val, index, updateValue, dv }: any) => {
        const [filteredItems, setFilteredItems] = useState<{ label: string, value: string }[]>([]);
        const staticValues = JSON.parse(dv.selectionStaticValues || '[]') || [];
        const staticValueItems = staticValues.map((v: any) => ({ value: v.split(':')[0], label: v.split(':')[1] }));

        const search = (event: AutoCompleteCompleteEvent) => {
            const query = event.query.toLowerCase();
            const filtered = staticValueItems.filter((item: any) =>
                item.label.toLowerCase().includes(query)
            );
            setFilteredItems(filtered);
        };

        return (
            <AutoComplete
                value={val}
                suggestions={filteredItems}
                completeMethod={search}
                onChange={(e) => updateValue(index, e.value)}
                field="label"
                dropdown
                className="w-full"
                inputClassName="w-full p-inputtext-sm"
            />
        );
    };

    const SelectionDynamicInput = ({ val, index, updateValue, dv }: any) => {
        const [filteredItems, setFilteredItems] = useState<{ label: string, value: string }[]>([]);
        const [trigger] = useLazyGetDashboardVariableSelectionDynamicValuesQuery();

        const search = async (event: AutoCompleteCompleteEvent) => {
            const queryString = `variableId=${dv.id}&q=${event.query}`;
            try {
                const res = await trigger(queryString).unwrap();
                const filtered = res.filter((item: any) =>
                    item.label.toLowerCase().includes(event.query.toLowerCase())
                );
                setFilteredItems(filtered);
            } catch (error) {
                console.error(error);
            }
        };

        return (
            <AutoComplete
                value={val}
                suggestions={filteredItems}
                completeMethod={search}
                onChange={(e) => updateValue(index, e.value)}
                field="label"
                dropdown
                className="w-full"
                inputClassName="w-full p-inputtext-sm"
            />
        );
    };

    if (numberOfInputs === 0) return <></>;

    return (
        <div className="flex flex-column gap-2">
            {values.map((val: any, index: number) => (
                <div key={index} className="flex gap-2">
                    <div className="flex-grow-1">
                        {rule.variable.variableType === 'date' && renderDate(val, index)}
                        {rule.variable.variableType === 'selectionStatic' && <SelectionStaticInput val={val} index={index} updateValue={updateValue} dv={rule.variable} />}
                        {rule.variable.variableType === 'selectionDynamic' && <SelectionDynamicInput val={val} index={index} updateValue={updateValue} dv={rule.variable} />}
                    </div>
                    {numberOfInputs === null && (
                        <div className="flex align-items-center">
                            <Button type="button" text severity='secondary' icon="pi pi-plus" size='small' onClick={addInput} className='p-0 mr-2 target-btn' style={{ width: 30, minWidth: 30 }} />
                            <Button type="button" text severity='secondary' icon="pi pi-trash" size='small' onClick={() => deleteInput(index)} className='p-0 target-btn' style={{ width: 30, minWidth: 30 }} disabled={values.length <= 1} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
    dashboardVariables,
    initialFilters,
    onApply,
    visible,
    onHide,
}) => {
    const [rules, setRules] = useState<any[]>([]);

    useEffect(() => {
        if (visible) {
            // Initialize rules based on dashboardVariables
            const newRules = dashboardVariables.map((dv, index) => {
                const existingFilter = initialFilters.find((f: any) => f.variableName === dv.variableName);

                const defaultOperator = dv.defaultOperator || (dv.variableType === 'date' ? '$between' : '$in');

                let defaultValue = null;
                if (existingFilter && existingFilter.value !== undefined) {
                    defaultValue = existingFilter.value;
                } else if (dv.defaultValue) {
                    try {
                        defaultValue = JSON.parse(dv.defaultValue || '[]');
                    } catch (e) {
                        defaultValue = null;
                    }
                }

                return {
                    id: index + 1,
                    fieldName: dv.variableName,
                    matchMode: existingFilter ? existingFilter.operator : defaultOperator,
                    value: defaultValue,
                    variable: dv
                };
            });
            setRules(newRules);
        }
    }, [visible, dashboardVariables, initialFilters]);

    const handleChange = (id: number, key: string, value: any) => {
        setRules((prev) =>
            prev.map((rule) => {
                if (rule.id === id) {
                    let newVal = rule.value;
                    // Immediate sync of values count when operator matches
                    if (key === 'matchMode') {
                        const newNum = getNumberOfInputs(value);
                        let currentValues = Array.isArray(rule.value) ? [...rule.value] : (rule.value ? [rule.value] : []);
                        if (newNum !== null && newNum > 0) {
                            if (currentValues.length < newNum) {
                                currentValues = [...currentValues, ...Array(newNum - currentValues.length).fill('')];
                            } else if (currentValues.length > newNum) {
                                currentValues = currentValues.slice(0, newNum);
                            }
                        } else if (newNum === null && currentValues.length === 0) {
                            currentValues = [''];
                        }
                        newVal = newNum === 1 && currentValues.length === 1 ? currentValues[0] : currentValues;
                        return { ...rule, [key]: value, value: newVal };
                    }
                    return { ...rule, [key]: value };
                }
                return rule;
            })
        );
    };

    const handleApply = () => {
        const newFilters: SqlExpression[] = rules
            .filter((rule) => {
                if (['$null', '$notNull'].includes(rule.matchMode)) return true;

                if (rule.value === null || rule.value === undefined) return false;
                if (Array.isArray(rule.value)) {
                    const hasValidValue = rule.value.some((v: any) => v !== '' && v !== null);
                    if (!hasValidValue) return false;
                } else {
                    if (rule.value === '') return false;
                }
                return true;
            })
            .map((rule) => {
                let finalValue = rule.value;
                const numberOfInputs = getNumberOfInputs(rule.matchMode);
                // Clean array values or extract single values
                if (Array.isArray(finalValue)) {
                    finalValue = finalValue.filter(v => v !== null && v !== '');
                    if (numberOfInputs === 1 && finalValue.length > 0) {
                        finalValue = finalValue[0];
                    }
                }

                // For selection static/dynamic, we might have selected an object {label, value} or string
                // We need to extract the 'value' if it's an object from AutoComplete selection
                if (Array.isArray(finalValue)) {
                    finalValue = finalValue.map(v => typeof v === 'object' && v !== null && 'value' in v ? v.value : v);
                } else if (typeof finalValue === 'object' && finalValue !== null && 'value' in finalValue) {
                    finalValue = finalValue.value;
                }

                return {
                    variableName: rule.fieldName,
                    operator: rule.matchMode,
                    value: finalValue,
                }
            });

        onApply(newFilters);
        onHide();
    };

    const handleClear = () => {
        onApply([]);
        onHide();
    };

    return (
        <Dialog
            header="Dashboard Filters"
            visible={visible}
            style={{ width: '60vw' }}
            onHide={onHide}
            breakpoints={{ '960px': '75vw', '641px': '100vw' }}
        >
            <div className="flex flex-column gap-3 py-3">
                {rules.map((rule) => (
                    <div key={rule.id} className="grid grid-nogutter align-items-start">
                        <div className="col-12 md:col-3 pr-2">
                            <div className="p-inputtext p-disabled w-full flex align-items-center mb-2 md:mb-0" style={{ minHeight: '38px' }}>
                                {rule.fieldName}
                            </div>
                        </div>
                        <div className="col-12 md:col-3 pr-2">
                            <Dropdown
                                value={rule.matchMode}
                                onChange={(e: any) => handleChange(rule.id, 'matchMode', e.value)}
                                options={rule.variable.variableType === 'date' ? dateFilterMatchModeOptions : selectionFilterMatchModeOptions}
                                optionLabel='label'
                                optionValue='value'
                                placeholder="Select Operator"
                                className="p-inputtext-sm w-full"
                            />
                        </div>
                        <div className="col-12 md:col-6">
                            <FilterValueInput rule={rule} onChange={handleChange} />
                        </div>
                    </div>
                ))}
                {rules.length === 0 && (
                    <div className="text-color-secondary italic">No variables available for this dashboard.</div>
                )}
            </div>
            <div className="flex justify-content-between align-items-center mt-4">
                <Button label="Clear Filters" icon="pi pi-filter-slash" severity="danger" text onClick={handleClear} />
                <div className="flex gap-2">
                    <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                    <Button label="Apply" icon="pi pi-check" onClick={handleApply} autoFocus />
                </div>
            </div>
        </Dialog>
    );
};
