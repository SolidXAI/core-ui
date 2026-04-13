import React, { useState, useEffect } from "react";
import { SolidAutocomplete, SolidButton, SolidDatePicker, SolidDialog, SolidDivider, SolidSelect } from "../../shad-cn-ui";
import { SqlExpression } from "../../../types/solid-core";
import { DashboardVariableRecord } from "./SolidDashboard";
import { useLazyGetDashboardVariableSelectionDynamicValuesQuery } from "../../../redux/api/dashboardApi";
type AutoCompleteCompleteEvent = { query: string };

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
    { label: 'Between', value: "$between" }
];

const selectionFilterMatchModeOptions = [
    { label: 'In', value: "$in" },
    { label: 'Not In', value: "$notIn" }
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
        <SolidDatePicker
          selected={dateVal || undefined}
          onChange={(nextDate: Date | null) => {
            const dateStr = nextDate ? nextDate.toISOString().split('T')[0] : '';
                    updateValue(index, dateStr);
                }}
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
                className="w-full"
                inputClassName="w-full text-sm"
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
            <SolidAutocomplete
                value={val}
                suggestions={filteredItems}
                completeMethod={search}
                onChange={(e) => updateValue(index, e.value)}
                field="label"
                dropdown
                className="w-full"
                inputClassName="w-full text-sm"
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
            <SolidAutocomplete
                value={val}
                suggestions={filteredItems}
                completeMethod={search}
                onChange={(e) => updateValue(index, e.value)}
                field="label"
                dropdown
                className="w-full"
                inputClassName="w-full text-sm"
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
                            <SolidButton type="button" text severity='secondary' icon="si si-plus" size='sm' onClick={addInput} className='p-0 mr-2 target-btn' style={{ width: 30, minWidth: 30 }} />
                            <SolidButton type="button" text severity='secondary' icon="si si-trash" size='sm' onClick={() => deleteInput(index)} className='p-0 target-btn' style={{ width: 30, minWidth: 30 }} disabled={values.length <= 1} />
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


        <SolidDialog showHeader={false} visible={visible} className="solid-global-search-filter solid-dialog-lg" onHide={onHide}>
            <div className="flex align-items-center justify-content-between px-3">
                <h5 className="solid-custom-title m-0">Add Dashboard Filter</h5>
                <SolidButton icon="si si-times" rounded text aria-label="Cancel" type="reset" size="sm" onClick={onHide} />
            </div>
            <SolidDivider className="m-0" />
            <div className="p-2 lg:p-2">
                <div className='primary-filter-fieldset'>
                    <div className="flex flex-column gap-3 py-3">

                        {rules.map((rule) => (
                            <div key={rule.id} className="grid grid-nogutter align-items-start">
                                <div className="col-12 md:col-4 pr-2">
                                    <div className="p-inputtext p-disabled w-full flex align-items-center mb-2 md:mb-0" style={{ minHeight: '38px' }}>
                                        {rule.fieldName}
                                    </div>
                                </div>
                                <div className="col-12 md:col-4 pr-2">
                                    <SolidSelect
                                        value={rule.matchMode}
                                        onChange={(e: any) => handleChange(rule.id, 'matchMode', e.value)}
                                        options={rule.variable.variableType === 'date' ? dateFilterMatchModeOptions : selectionFilterMatchModeOptions}
                                        placeholder="Select Operator"
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-12 md:col-4">
                                    <FilterValueInput rule={rule} onChange={handleChange} />
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="text-color-secondary italic">No variables available for this dashboard.</div>
                        )}
                    </div>
                </div>
                {/* <div className="flex justify-content-between align-items-center mt-4">
                    <Button label="Clear Filters" icon="si si-filter-slash" severity="danger" text onClick={handleClear} />
                    <div className="flex gap-2">
                    </div>
                </div> */}
                <div className='flex gap-3 mt-3'>
                    <SolidButton label="Apply" size="sm" onClick={handleApply} autoFocus />
                    <SolidButton type='button' label='Cancel' outlined size='sm' onClick={onHide} />
                </div>

            </div>
        </SolidDialog>

    );
};
