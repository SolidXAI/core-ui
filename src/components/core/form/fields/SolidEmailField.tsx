'use client';
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "@/helpers/registry";

export class SolidEmailField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;

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
            schema = schema.required(`${fieldLabel} is required.`);
        } else {
            schema = schema.nullable(); // Allow null when not required
        }

        // 2. length (min/max)
        if (fieldMetadata.min && fieldMetadata.min > 0) {
            schema = schema.min(fieldMetadata.min, `${fieldLabel} should be at-least ${fieldMetadata.min} characters long.`);
        }
        if (fieldMetadata.max && fieldMetadata.max > 0) {
            schema = schema.max(fieldMetadata.max, `${fieldLabel} should not be more than ${fieldMetadata.max} characters long.`);
        }
        // 3. regular expression
        if (fieldMetadata.regexPattern) {
            const regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg ?? `${fieldLabel} has invalid data.`
            schema = schema.matches(fieldMetadata.regexPattern, regexPatternNotMatchingErrorMsg);
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = this.fieldContext.readOnly;

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        const viewMode: string = this.fieldContext.viewMode;
        let DynamicWidget = getExtensionComponent("SolidFormFieldViewModeWidget");
        const widgetProps = {
            label: fieldLabel,
            value: formik.values[fieldLayoutInfo.attrs.name],
        }
        return (
            <>
               {viewMode === "view" &&
                    <div className={className}>
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </div>
                }
                {viewMode === "edit" && (
                    <div className={className}>
                        <div className="relative">
                            <div className="flex flex-column gap-2 mt-4">
                                {showFieldLabel != false &&
                                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                                        {fieldLabel}
                                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
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
                                    onChange={(e) => this.fieldContext.onChange(e, 'onFieldChange')}
                                    onBlur={(e) => this.fieldContext.onBlur(e, 'onFieldBlur')}
                                    value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                                />
                            </div>
                            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                                <div className="absolute mt-1">
                                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    }
}