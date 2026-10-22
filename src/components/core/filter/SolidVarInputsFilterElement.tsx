import { useEffect, useMemo, useRef, useState } from "react";
import { SolidManyToOneFilterElement } from "./SolidManyToOneFilterElement";
import { SolidSelectionDynamicFilterElement } from "./SolidSelectionDynamicFilterElement";
import { SolidSelectionStaticFilterElement } from "./SolidSelectionStaticFilterElement";
import { SolidManyToManyFilterElement } from "./SolidManyToManyFilterElement";
import { SolidBooleanFilterElement } from "./SolidBooleanFilterElement";
import { SolidOneToManyFilterElement } from "./SolidOneToManyFilterElement";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidInput } from "../../shad-cn-ui/SolidInput";
import { SolidNumberInput } from "../../shad-cn-ui/SolidNumberInput";
import { SolidIcon } from "../../shad-cn-ui";

export enum InputTypes {
    Date = 'Date',
    DateTime = 'DateTime',
    Time = 'Time',
    Numeric = 'Numeric',
    Text = 'Text',
    SelectionStatic = 'SelectionStatic',
    RelationManyToOne = 'RelationManyToOne',
    RelationManyToMany = 'RelationManyToMany',
    RelationOneToMany = 'RelationOneToMany',
    SelectionDynamic = 'SelectionDynamic',
    Boolean = 'Boolean',
}

const areInputsEqual = (left: any[] = [], right: any[] = []) => {
    if (left.length !== right.length) return false;
    return left.every((item, index) => {
        const other = right[index];
        if (item === other) return true;
        try {
            return JSON.stringify(item) === JSON.stringify(other);
        } catch {
            return false;
        }
    });
};


const DYNAMIC_DATE_OPERATORS = ['$thisWeek', '$thisMonth'];

export const isDynamicDateOperator = (matchMode: string): boolean =>
    DYNAMIC_DATE_OPERATORS.includes(matchMode);

export const getUtcDynamicDateRange = (
    matchMode: string,
    fieldType: 'date' | 'datetime',
): [string, string] => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (matchMode === '$thisWeek') {
        start = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
        ));

        const daysSinceMonday = (start.getUTCDay() + 6) % 7;
        start.setUTCDate(start.getUTCDate() - daysSinceMonday);

        end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7);
        end.setUTCMilliseconds(-1);
    } else {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        end.setUTCMilliseconds(-1);
    }

    if (fieldType === 'date') {
        return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    }

    return [start.toISOString().slice(0, 16), end.toISOString().slice(0, 16)];
};


// Based on numberOfInputs map the input filed and hide add and delete 
export const SolidVarInputsFilterElement = ({ values, onChange, inputType = InputTypes.Text, numberOfInputs = null, fieldMetadata, readOnly = false }: any) => {
    const normalizedValues = useMemo(() => {
        const emptyShape = numberOfInputs && numberOfInputs > 0 ? Array(numberOfInputs).fill('') : [''];
        if (!values || !Array.isArray(values)) {
            return emptyShape;
        }
        if (values[0] === '') {
            return emptyShape;
        }
        return values;
    }, [numberOfInputs, values]);

    // TODO: Ideally values will be an array, so we can spread them here instead of making a nested array.
    const [inputs, setInputs] = useState([...normalizedValues]);
    const latestInputsRef = useRef(inputs);
    const autocompleteTypes = [
        InputTypes.RelationManyToOne,
        InputTypes.RelationManyToMany,
        InputTypes.RelationOneToMany,
        InputTypes.SelectionDynamic,
        InputTypes.SelectionStatic,
        InputTypes.Boolean,
    ];
    const useMultiAutocomplete = numberOfInputs === null && autocompleteTypes.includes(inputType);

    useEffect(() => {
        latestInputsRef.current = inputs;
    }, [inputs]);

    useEffect(() => {
        if (!areInputsEqual(latestInputsRef.current, normalizedValues)) {
            setInputs([...normalizedValues]);
        }
    }, [normalizedValues]);

    const updateInputs = (index: number, value: any) => {
        if (useMultiAutocomplete && index === 0 && Array.isArray(value)) {
            setInputs(value);
            return;
        }
        const updatedSpecification = inputs.map((item, i) =>
            i === index ? value : item
        );
        setInputs(updatedSpecification);
    };

    const addInput = () => {
        setInputs([...inputs, '']);
    };

    const deleteInput = (index: number) => {
        if (inputs.length > 1) {
            const updatedRows = inputs.filter((_, rowIndex) => rowIndex !== index);
            setInputs(updatedRows);

        } else {
        }
    };

    useEffect(() => {
        if (!areInputsEqual(inputs, normalizedValues)) {
            onChange(inputs);
        }
    }, [inputs, normalizedValues, onChange]);

    const renderInputByType = (value: any, index: number, multiple = false) => {
        if (inputType === InputTypes.Text) {
            return (
                <SolidInput
                    value={value}
                    onChange={(e) => updateInputs(index, e.target.value)}
                    placeholder="Value"
                    className='w-full solid-filter-compact-control'
                />
            );
        }

        if (inputType === InputTypes.Numeric) {
            return (
                <SolidNumberInput
                    value={value}
                    onChange={(e) => updateInputs(index, e.value)}
                    placeholder="Value"
                    className='w-full solid-filter-compact-control'
                />
            );
        }

        if (inputType === InputTypes.Date) {
            return (
                <SolidInput
                    type="date"
                    value={value || ""}
                    onChange={readOnly ? undefined : (e) => updateInputs(index, e.target.value)}
                    readOnly={readOnly}
                    className="w-full solid-filter-compact-control"
                />
            );
        }

        if (inputType === InputTypes.DateTime) {
            return (
                <SolidInput
                    type="datetime-local"
                    value={value || ""}
                    onChange={readOnly ? undefined : (e) => updateInputs(index, e.target.value)}
                    readOnly={readOnly}
                    className="w-full solid-filter-compact-control"
                />
            );
        }

        if (inputType === InputTypes.Time) {
            return (
                <SolidInput
                    type="time"
                    value={value || ""}
                    onChange={(e) => updateInputs(index, e.target.value)}
                    className="w-full solid-filter-compact-control"
                />
            );
        }

        if (inputType === InputTypes.RelationManyToOne) {
            return (
                <SolidManyToOneFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        if (inputType === InputTypes.RelationManyToMany) {
            return (
                <SolidManyToManyFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        if (inputType === InputTypes.RelationOneToMany) {
            return (
                <SolidOneToManyFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        if (inputType === InputTypes.SelectionDynamic) {
            return (
                <SolidSelectionDynamicFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        if (inputType === InputTypes.SelectionStatic) {
            return (
                <SolidSelectionStaticFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        if (inputType === InputTypes.Boolean) {
            return (
                <SolidBooleanFilterElement
                    value={value}
                    index={index}
                    updateInputs={updateInputs}
                    fieldMetadata={fieldMetadata}
                    multiple={multiple}
                />
            );
        }

        return null;
    };

    if (numberOfInputs === 0) return null;

    if (useMultiAutocomplete) {
        const selectedValues = Array.isArray(inputs) ? inputs.filter((item) => item !== "" && item !== null && item !== undefined) : [];
        return (
            <div className="solid-filter-var-input-row">
                {renderInputByType(selectedValues, 0, true)}
            </div>
        );
    }

    if (numberOfInputs === 2) {
        const leftValue = inputs?.[0] ?? "";
        const rightValue = inputs?.[1] ?? "";
        return (
            <div className="solid-filter-var-input-between">
                {renderInputByType(leftValue, 0, false)}
                {renderInputByType(rightValue, 1, false)}
            </div>
        );
    }

    return (
        <>
            {inputs && inputs.map((value: any, index: number) => (
                <div className="solid-filter-var-input-row" key={`solid-filter-value-${index}`}>
                    {renderInputByType(value, index, false)}
                    {numberOfInputs === null && !readOnly &&
                        <>
                            <SolidButton variant="ghost" size="sm" onClick={() => addInput()} className='solid-filter-action-btn solid-filter-action-icon-btn'>
                                <SolidIcon name="si-plus" aria-hidden />
                            </SolidButton>
                            <SolidButton variant="ghost" size="sm" onClick={() => deleteInput(index)} className='solid-filter-action-btn solid-filter-action-icon-btn is-danger'>
                                <SolidIcon name="si-trash" aria-hidden />
                            </SolidButton>
                        </>
                    }
                </div>
            ))}
        </>
    )
}
