
import { SolidAutocomplete } from "../../../shad-cn-ui/SolidAutocomplete";
import { SolidRadioGroup } from "../../../shad-cn-ui/SolidRadioGroup";
import { SolidSegmentedControl } from "../../../shad-cn-ui/SolidSegmentedControl";
import { buildSyntheticChangeEvent } from "./fieldEventUtils";
import styles from './solidFields.module.css';
import { useMemo, useState } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";

type AutoCompleteCompleteEvent = { query: string };

export class SolidSelectionStaticField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const isMultiSelect = fieldMetadata?.isMultiSelect;
        if (isMultiSelect && Array.isArray(value)) {
            formData.append(fieldLayoutInfo.attrs.name, JSON.stringify(value.map(v => v.value)));
        } else if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value.value);
        }
        // if (value) {
        //     formData.append(fieldLayoutInfo.attrs.name, value.value);
        // }
    }

    initialValue(): any {
        // Get field name and metadata
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldDefaultValue = fieldMetadata?.defaultValue;
        const isMultiSelect = fieldMetadata?.isMultiSelect;
        // Get existing value from form data
        const existingValue = this.fieldContext.data[fieldName];

        // Function to get display value based on selectionStaticValues
        // const getDisplayValue = (value: string | null): string | null => {
        //     if (!value) return null;
        //     for (const item of fieldMetadata.selectionStaticValues) {
        //         const [lhs, rhs] = item.split(':');
        //         if (lhs === value) {
        //             return rhs;
        //         }
        //     }
        //     return null;
        // };

        // Function to get display value based on selectionStaticValues
        const getDisplayValue = (value: string): string => {
            const match = fieldMetadata.selectionStaticValues.find((item: string) => item.startsWith(value + ':'));
            return match ? match.split(':')[1] : value;
        };

        // Determine the final value to use (existing value or default value)
        const finalValue = existingValue ?? fieldDefaultValue ?? '';

        if (isMultiSelect) {
            let values: string[] = [];

            if (Array.isArray(finalValue)) {
                values = finalValue;
            } else {
                try {
                    const parsed = JSON.parse(finalValue);
                    if (Array.isArray(parsed)) values = parsed;
                } catch { }
            }

            return values.map(val => ({
                label: getDisplayValue(val),
                value: val
            }));
        }

        // Get display value for the final value
        // const displayValue = getDisplayValue(finalValue);

        return { label: getDisplayValue(finalValue), value: finalValue };
    }


    validationSchema(): Yup.Schema {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const isMultiSelect = fieldMetadata?.isMultiSelect;

        // let schema = Yup.object({
        //     value: Yup.string().required(`${fieldLabel} is required.`)
        // });
        let schema: Yup.Schema;

        if (isMultiSelect) {
            // For multi-select, create array schema
            if (fieldMetadata.required) {
                schema = Yup.array()
                    .of(Yup.object({
                        value: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                    }))
                    .min(1, ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                    .required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
            } else {
                schema = Yup.array()
                    .of(Yup.object({
                        value: Yup.string()
                    }))
                    .nullable(); // Allow null/undefined for non-required fields
            }
        } else {
            // For single select, create object schema
            if (fieldMetadata.required) {
                schema = Yup.object({
                    value: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                }).required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
            } else {
                schema = Yup.object({
                    value: Yup.string()
                }).nullable(); // Allow null/undefined for non-required fields
            }
        }
        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const isFormFieldValid = (formik: any, fieldName: string) => formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultSelectionStaticAutocompleteFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultSelectionStaticFormViewWidget';
        }
        const viewMode: string = this.fieldContext.viewMode;

        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" &&
                        <>
                            {editWidget &&
                                this.renderExtensionRenderMode(editWidget, formik)
                            }
                        </>
                    }
                </div>
            </>
        );
    }

    renderExtensionRenderMode(widget: string, formik: FormikObject) {
        let DynamicWidget = getExtensionComponent(widget);
        const widgetProps: SolidFormFieldWidgetProps = {
            formik: formik,
            fieldContext: this.fieldContext,
        }
        return (
            <>
                {DynamicWidget && <DynamicWidget {...widgetProps} />}
            </>
        )
    }

}

export const DefaultSelectionStaticAutocompleteFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = fieldContext.readOnly;
        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
        const isMultiSelect = fieldMetadata?.isMultiSelect;

    const [selectionStaticItems, setSelectionStaticItems] = useState([]);
    const selectionStaticSearch = (event: AutoCompleteCompleteEvent) => {
        const selectionStaticData = fieldMetadata.selectionStaticValues.map((i: string) => {
            return {
                label: i.split(":")[1],
                value: i.split(":")[0]
            }
        });
        const suggestionData = selectionStaticData.filter((t: any) => t.value.toLowerCase().startsWith(event.query.toLowerCase()));
        setSelectionStaticItems(suggestionData)
    }
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <div className={`${styles.fieldWrapper} ${isFormFieldValid(formik, fieldLayoutInfo.attrs.name) ? styles.fieldInvalid : ""}`}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidAutocomplete
                multiple={isMultiSelect}
                dropdown
                field="label"
                className={`solid-standard-autocomplete ${isFormFieldValid(formik, fieldLayoutInfo.attrs.name) ? styles.fieldInvalidControl : ""}`}
                value={formik.values[fieldLayoutInfo.attrs.name] || (isMultiSelect ? [] : null)}
                suggestions={selectionStaticItems}
                completeMethod={(e) => selectionStaticSearch(e)}
                onChange={({ value }) => {
                    if (formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled) return;
                    const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, value, "text");
                    fieldContext.onChange(syntheticEvent, "onFieldChange");
                }}
                onSelect={({ value }) => {
                    const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, value, "text");
                    fieldContext.onChange(syntheticEvent, "onFieldChange");
                }}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className={styles.fieldErrorBadge}>
                    {typeof formik.errors[fieldLayoutInfo?.attrs?.name] === 'object'
                        ? (formik.errors[fieldLayoutInfo?.attrs?.name] as any)?.value?.toString()
                        : formik.errors[fieldLayoutInfo?.attrs?.name]?.toString()}
                </div>
            )}
        </div>
    );
}

export const SolidSelectionStaticRadioFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    const fieldName = fieldLayoutInfo.attrs.name;
    const isMultiSelect = fieldMetadata?.isMultiSelect;
    // Convert selectionStaticValues to usable radio options
    const radioOptions = fieldMetadata.selectionStaticValues.map((i: string) => {
        const [value, label] = i.split(":");
        return { label, value };
    });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.errors[fieldName];

    if (isMultiSelect) {
        return (
            <p className={styles.fieldError}>This render mode is not supported for multi select.</p>
        );
    }

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel !== false && (
                <label htmlFor={fieldName} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}
            <SolidRadioGroup
                name={fieldName}
                options={radioOptions}
                value={formik.values[fieldName]?.value ?? formik.values[fieldName]}
                disabled={formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled}
                onChange={(nextValue) => {
                    const selectedOption = radioOptions.find((opt: any) => opt.value === nextValue);
                    if (selectedOption) {
                        formik.setFieldValue(fieldName, selectedOption);
                        const syntheticEvent = buildSyntheticChangeEvent(fieldName, selectedOption, "radio");
                        fieldContext.onChange(syntheticEvent, "onFieldChange");
                    }
                }}
            />
            {isFormFieldValid(formik, fieldName) && (
                <p className={styles.fieldError}>{formik?.errors[fieldName]?.toString()}</p>
            )}
        </div>
    );
}

export const SolidSelectionStaticSelectButtonFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    const fieldName = fieldLayoutInfo.attrs.name;
    const isMultiSelect = fieldMetadata?.isMultiSelect;

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.errors[fieldName];

    if (isMultiSelect) {
        return (
            <p className={styles.fieldError}>This render mode is not supported for multi select.</p>
        );
    }

    const options = fieldMetadata.selectionStaticValues.map((i: string) => {
        const [value, label] = i.split(":");
        return { label, value };
    });

    const currentValue = formik.values[fieldName];
    const buttonValue =
        typeof currentValue === "object" ? currentValue.value : currentValue || null;

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel !== false && (
                <label htmlFor={fieldName} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <SolidSegmentedControl
                options={options}
                value={buttonValue}
                disabled={formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled}
                onChange={(nextValue) => {
                    const selectedOption = options.find((opt: any) => opt.value === nextValue);
                    if (selectedOption) {
                        formik.setFieldValue(fieldName, selectedOption);
                        const syntheticEvent = buildSyntheticChangeEvent(fieldName, selectedOption, "button");
                        fieldContext.onChange(syntheticEvent, "onFieldChange");
                    }
                }}
            />
            {isFormFieldValid(formik, fieldName) && (
                <p className={styles.fieldError}>{formik.errors[fieldName]?.toString()}</p>
            )}
        </div>
    );
};


export const DefaultSelectionStaticFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const value = formik.values[fieldLayoutInfo.attrs.name];
    const isMultiSelect = fieldMetadata?.isMultiSelect;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={styles.fieldViewLabel}>{fieldLabel}</p>
            )}
            <p className={styles.fieldViewValue}>
                {isMultiSelect
                    ? Array.isArray(value)
                        ? value.map((v: any) => v?.label).filter(Boolean).join(', ')
                        : ''
                    : value?.label || ''}
            </p>
        </div>
    );
}
