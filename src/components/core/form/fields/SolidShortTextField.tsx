
import * as Yup from 'yup';
import styles from './solidFields.module.css';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps, SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { useState } from "react";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { SolidInput, SolidPasswordInput } from "../../../shad-cn-ui";

export class SolidShortTextField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        const editWidget = fieldLayoutInfo?.attrs?.editWidget;
        if (editWidget === "PseudoRelationManyToOneFormWidget") {
            if (value?.solidManyToOneValue) {
                formData.append(fieldLayoutInfo?.attrs?.name, value.solidManyToOneValue);
            }
        } else {
            if (value !== undefined && value !== null) {
                formData.append(fieldLayoutInfo?.attrs?.name, value);
            }
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;
        const fieldLayoutInfo = this.fieldContext.field;

        const editWidget = fieldLayoutInfo?.attrs?.editWidget;

        if (this.fieldContext.parentData && this.fieldContext.parentData[fieldName]) {
            const parentDataForKey = this.fieldContext.parentData[fieldName];
            if (editWidget === "PseudoRelationManyToOneFormWidget") {
                if (parentDataForKey) {
                    return { solidManyToOneLabel: this.fieldContext.parentData[fieldName], solidManyToOneValue: this.fieldContext.parentData[fieldName] };
                }
            } else {
                if (parentDataForKey && typeof parentDataForKey !== 'object') {
                    return this.fieldContext.parentData[fieldName]
                }
            }
        }
        let existingValue = this.fieldContext.data[fieldName];

        if (editWidget === "PseudoRelationManyToOneFormWidget" && this.fieldContext.data[fieldName]) {
            existingValue =  { solidManyToOneLabel: this.fieldContext.data[fieldName], solidManyToOneValue: this.fieldContext.data[fieldName] };

        }

        return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';
    }

    validationSchema(): Yup.Schema {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo?.attrs?.label ?? fieldMetadata.displayName;
        const editWidget = fieldLayoutInfo?.attrs?.editWidget;
        if (editWidget === "PseudoRelationManyToOneFormWidget") {
            let schema = Yup.mixed();

            // Custom validation for relation field
            if (fieldMetadata.required) {
                schema = schema.test(
                    ERROR_MESSAGES.REQUIRED_REALTION,
                    ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel),
                    function (value: any) {
                        // Handle empty values
                        if (!value) return false;

                        // If it's an object with solidManyToOneValue, check if it's valid
                        if (typeof value === 'object' && value !== null && (value as any).solidManyToOneValue) {
                            return true;
                        }

                        // If it's a string (user typed but didn't select), it's invalid for required field
                        if (typeof value === 'string') {
                            return false;
                        }

                        return false;
                    }
                );
            }

            // Add validation to ensure valid selection
            schema = schema.test(
                ERROR_MESSAGES.VALIDATE_SELECTION,
                ERROR_MESSAGES.SELECT_VALID_FROM_DROPDOWN(fieldLabel),
                function (value: any) {
                    // If not required and empty, it's valid
                    if (!fieldMetadata.required && (!value || value === '')) {
                        return true;
                    }

                    // If it's an object with solidManyToOneValue, it's a valid selection
                    if (typeof value === 'object' && value !== null && (value as any).solidManyToOneValue) {
                        return true;
                    }

                    // If it's a string (user typed but didn't select), it's invalid
                    if (typeof value === 'string' && value.trim() !== '') {
                        return false;
                    }

                    // Empty value for non-required field
                    return !fieldMetadata.required;
                }
            );
            return schema;
        } else {

            let schema: Yup.StringSchema<string | null | undefined> = Yup.string();
            const fieldMetadata = this.fieldContext.fieldMetadata;
            const fieldLayoutInfo = this.fieldContext.field;
            const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
            // 1. required  
            // 1. required
            if (fieldMetadata.required) {
                schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
            } else {
                schema = schema.nullable(); // Allow null when not required
            }
            // 2. length (min/max)
            if (fieldMetadata.min && fieldMetadata.min > 0) {
                schema = schema.min(fieldMetadata.min, ERROR_MESSAGES.FIELD_MINIMUM_CHARACTER(fieldLabel, fieldMetadata.min));
            }
            if (fieldMetadata.max && fieldMetadata.max > 0) {
                schema = schema.max(fieldMetadata.max, ERROR_MESSAGES.FIELD_MAXIMUM_CHARACTER(fieldLabel, fieldMetadata.max));
            }
            // 3. regular expression
            if (fieldMetadata.regexPattern) {
                const regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg ?? ERROR_MESSAGES.FIELD_INVALID_DATA(fieldLabel)
                schema = schema.matches(fieldMetadata.regexPattern, regexPatternNotMatchingErrorMsg);
            }
            return schema;
        }
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultShortTextFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultShortTextFormViewWidget';
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


export const DefaultShortTextFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const isPrimaryKey = fieldMetadata.isPrimaryKey || false;

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidInput
                type="text"
                readOnly={formReadonly || fieldReadonly || readOnlyPermission || isPrimaryKey}
                disabled={formDisabled || fieldDisabled || isPrimaryKey}
                id={fieldLayoutInfo.attrs.name}
                name={fieldMetadata.name}
                aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => fieldContext.onChange(e, 'onFieldChange')}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => fieldContext.onBlur(e, 'onFieldBlur')}
                value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                className={styles.fieldInput}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
}

export const DefaultShortTextFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const value = formik.values[fieldLayoutInfo.attrs.name];
    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={styles.fieldViewLabel}>{fieldLabel}</p>
            )}
            <p className={styles.fieldViewValue}>{value && typeof value === "string" ? value : ''}</p>
        </div>
    );
}

// Masked ShortText - LIST
export const MaskedShortTextListViewWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const colVal = rowData[column.attrs.name];
    // Mask it (show same number of * as characters, or fixed length if you want)
    const maskedValue = colVal ? '*'.repeat(colVal.length) : '';
    return (
        <span>{maskedValue}</span>
    );
};

// Masked ShortText - VIEW
export const MaskedShortTextFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const rawValue: string = formik.values[fieldLayoutInfo.attrs.name] || '';
    const maskedValue = rawValue ? '*'.repeat(rawValue.length) : '';

    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={styles.fieldViewLabel}>{fieldLabel}</p>
            )}
            <p className={styles.fieldViewValue}>{maskedValue}</p>
        </div>
    );
};

// Masked ShortText - EDIT
export const MaskedShortTextFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const isPrimaryKey = fieldMetadata.isPrimaryKey || false;

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel !== false && (
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}
            <SolidPasswordInput
                toggle
                readOnly={formReadonly || fieldReadonly || readOnlyPermission || isPrimaryKey}
                disabled={formDisabled || fieldDisabled || isPrimaryKey}
                id={fieldLayoutInfo.attrs.name}
                name={fieldMetadata.name}
                aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                onBlur={(e) => fieldContext.onBlur(e, 'onFieldBlur')}
                value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                className="w-full"
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
};
