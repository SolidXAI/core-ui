'use client';
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps, SolidListFieldWidgetProps } from "@/types/solid-core";
import { SolidFieldTooltip } from "@/components/common/SolidFieldTooltip";
import { Button } from "primereact/button";
import { useState } from "react";
import { Password } from "primereact/password";
import { ERROR_MESSAGES } from "@/constants/error-messages";

export class SolidShortTextField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value !== undefined && value !== null) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;
        if (this.fieldContext.parentData && this.fieldContext.parentData[fieldName]) {
            const parentDataForKey = this.fieldContext.parentData[fieldName];
            if (parentDataForKey && typeof parentDataForKey !== 'object') {
                return this.fieldContext.parentData[fieldName]
            }
        }
        const existingValue = this.fieldContext.data[fieldName];

        return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';
    }

    validationSchema(): Schema {
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
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const includeWrapper = fieldLayoutInfo.attrs?.includeWrapper || 'yes';
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
        <>
            {includeWrapper === 'yes' &&
                <div className="relative">
                    <div className="flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                        {showFieldLabel != false &&
                            <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                                {fieldMetadata.required && <span className="text-red-500"> *</span>}
                                <SolidFieldTooltip fieldContext={fieldContext} />
                                {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                            </label>
                        }
                        <InputText
                            readOnly={formReadonly || fieldReadonly || readOnlyPermission || isPrimaryKey}
                            disabled={formDisabled || fieldDisabled || isPrimaryKey}
                            id={fieldLayoutInfo.attrs.name}
                            name={fieldMetadata.name}
                            aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                            // onChange={formik.handleChange}
                            onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                            onBlur={(e) => fieldContext.onBlur(e, 'onFieldBlur')}
                            value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                        />
                    </div>
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <div className="absolute mt-1">
                            <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                        </div>
                    )}
                </div>
            }
            {includeWrapper === 'no' &&
                <>
                    {showFieldLabel != false &&
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                            <SolidFieldTooltip fieldContext={fieldContext} />
                            {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                        </label>
                    }
                    <InputText
                        readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                        disabled={formDisabled || fieldDisabled}
                        id={fieldLayoutInfo.attrs.name}
                        name={fieldMetadata.name}
                        aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                        // onChange={formik.handleChange}
                        onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                        onBlur={(e) => fieldContext.onBlur(e, 'onFieldBlur')}
                        value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                    />
                </>
            }
        </>
    );
}

export const DefaultShortTextFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    return (
        <div className="mt-2 flex-column gap-2">
            {showFieldLabel !== false && (
                <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
            )}
            <p className="m-0">{formik.values[fieldLayoutInfo.attrs.name]}</p>
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
    // Get actual value
    const rawValue: string = formik.values[fieldLayoutInfo.attrs.name] || '';

    // Mask it (show same number of * as characters, or fixed length if you want)
    const maskedValue = rawValue ? '*'.repeat(rawValue.length) : '';

    return (
        <div className="mt-2 flex-column gap-2">
            {showFieldLabel !== false && (
                <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
            )}
            <p className="m-0">{maskedValue}</p>
        </div>
    );
};

// Masked ShortText - EDIT
export const MaskedShortTextFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const includeWrapper = fieldLayoutInfo.attrs?.includeWrapper || 'yes';
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

    const passwordField = (
        <Password
            toggleMask
            feedback={false}
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
    );

    return (
        <>
            {includeWrapper === 'yes' && (
                <div className="relative">
                    <div className="flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                        {showFieldLabel !== false && (
                            <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                                {fieldLabel}
                                {fieldMetadata.required && <span className="text-red-500"> *</span>}
                                <SolidFieldTooltip fieldContext={fieldContext} />
                            </label>
                        )}
                        {passwordField}
                    </div>
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <div className="absolute mt-1">
                            <Message
                                severity="error"
                                text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}
                            />
                        </div>
                    )}
                </div>
            )}

            {includeWrapper === 'no' && (
                <>
                    {showFieldLabel !== false && (
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                            {fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                            <SolidFieldTooltip fieldContext={fieldContext} />
                        </label>
                    )}
                    {passwordField}
                </>
            )}
        </>
    );
};
