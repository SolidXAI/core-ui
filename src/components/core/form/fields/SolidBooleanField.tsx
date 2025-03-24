'use client';
import { Message } from "primereact/message";
import { SelectButton } from "primereact/selectbutton";
import { classNames } from "primereact/utils";
import { useEffect } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { Panel } from "primereact/panel";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidBooleanFieldWidgetProps } from "@/types/solid-core";

export class SolidBooleanField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value === "true" ? "true" : "");
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;

        const existingValue = this.fieldContext.data[fieldName];

        // return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';

        // Ensure the value is always a string "true" or "false"
        const result = existingValue !== undefined && existingValue !== null 
        ? (existingValue === true || existingValue === "true" ? "true" : "false") 
        : (fieldDefaultValue === true || fieldDefaultValue === "true" ? "true" : "false");

        return result;
    }

    validationSchema(): Schema {
        let schema: Yup.StringSchema<string | null | undefined> = Yup.string();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(`${fieldLabel} is required.`);
        } else {
            schema = schema.nullable(); // Allow null when not required
        }
        // // 2. length (min/max)
        // if (fieldMetadata.min && fieldMetadata.min > 0) {
        //     schema = schema.min(fieldMetadata.min, `${fieldLabel} should be at-least ${fieldMetadata.min} characters long.`);
        // }
        // if (fieldMetadata.max && fieldMetadata.max > 0) {
        //     schema = schema.max(fieldMetadata.max, `${fieldLabel} should not be more than ${fieldMetadata.max} characters long.`);
        // }
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
        const booleanOptions = ["false", "true"];
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = this.fieldContext.readOnly;

        useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        // return (
        //             <>
        //                 {/* <div className={className}> */}
        //                 {fieldLayoutInfo.attrs.renderMode === "checkbox" &&
        //                     <div className={className}>
        //                         {this.renderCheckBoxMode(formik)}
        //                     </div>
        //                 }
        //                 {(!fieldLayoutInfo.attrs.renderMode || fieldLayoutInfo.attrs.renderMode === "autocomplete") &&
        //                     this.renderSelectMode(formik)
        //                 }
        //                 {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
        //                     <div className="absolute mt-1">
        //                         <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
        //                     </div>
        //                 )}
        //                 {/* </div> */}
        //             </>
        //         );


        let renderMode = fieldLayoutInfo.attrs.renderMode;
        if (!renderMode) {
            renderMode = 'field-selectbox';
        }
        return (
            <>
                {renderMode &&
                    this.renderExtensionRenderMode(renderMode, formik) 
                }
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <div className="absolute mt-1">
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    </div>
                )}
            </>
        );

        
    }

    renderCheckBoxMode(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || "field col-12";
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = this.fieldContext.readOnly;
    
        // Set default value to false on mount
        useEffect(() => {
            if (formik.values[fieldLayoutInfo.attrs.name] === undefined) {
                console.log("Setting default value:", false);
                formik.setFieldValue(fieldLayoutInfo.attrs.name, false);
            }
        }, []);

        const handleChange = (e: CheckboxChangeEvent) => {
            const newValue = e.checked; // This returns `true` or `false`
            console.log(`${fieldLayoutInfo.attrs.name}, new value:`, newValue);
            
            formik.setFieldValue(fieldLayoutInfo.attrs.name, newValue);
            formik.setTouched({ ...formik.touched, [fieldLayoutInfo.attrs.name]: true }); // Ensure Formik registers the change
        };
    
        const isFormFieldValid = (formik:any, fieldName:any) => 
            formik.touched[fieldName] && formik.errors[fieldName];
    
        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    
        return (
            <div className={className}>
                <div className="relative">
                    <div className="flex flex-column gap-2 mt-4">
                        {showFieldLabel !== false && (
                            <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                                {fieldLabel}
                                {fieldMetadata.required && <span className="text-red-500"> *</span>}
                            </label>
                        )}
    
                        <div className="flex align-items-center">
                            <Checkbox
                                id={fieldLayoutInfo.attrs.name}
                                checked={formik.values[fieldLayoutInfo.attrs.name] === true}
                                onChange={handleChange}
                                disabled={formDisabled || fieldDisabled}
                                readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                                className={classNames("", {
                                    "p-invalid": isFormFieldValid(formik, fieldLayoutInfo.attrs.name),
                                })}
                            />
                            <span className="ml-2">{formik.values[fieldLayoutInfo.attrs.label] || "Yes"}</span>
                        </div>
                    </div>
    
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <div className="absolute mt-1">
                            <Message severity="error" text={formik.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                        </div>
                    )}
                </div>
            </div>
        );
        }
    
        renderSelectMode(formik: FormikObject) {
            const fieldMetadata = this.fieldContext.fieldMetadata;
            const fieldLayoutInfo = this.fieldContext.field;
            const className = fieldLayoutInfo.attrs?.className || 'field col-12';
            const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
            const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
            const booleanOptions = ["false", "true"];
            const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
            const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
            const readOnlyPermission = this.fieldContext.readOnly;

            useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

            const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

            const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
            const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

            const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
            const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
        
            return (
                <div className={className}>
                    <div className="relative">
                        <div className="flex flex-column gap-2 mt-4">
                            {showFieldLabel != false &&
                                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                                    {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                                </label>
                            }
                            {/* <InputText
                            id={fieldLayoutInfo.attrs.name}
                            className="small-input"
                            aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                            onChange={formik.handleChange}
                            value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                        /> */}
                            <SelectButton
                                readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                                disabled={formDisabled || fieldDisabled}
                                id={fieldLayoutInfo.attrs.name}
                                aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                                onChange={(e) => {formik.setFieldValue(fieldLayoutInfo.attrs.name, e.value); console.log("value is",e.value)}} // Custom handling for boolean input
                                value={formik.values[fieldLayoutInfo.attrs.name] ? formik.values[fieldLayoutInfo.attrs.name].toString() : "false"}
                                options={booleanOptions}
                                className={classNames("", {
                                    "p-invalid": isFormFieldValid(formik, "defaultValue"),
                                })}
    
                            />
                        </div>
                        {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                            <div className="absolute mt-1">
                                <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                            </div>
                        )}
                    </div>
                </div>
            );
        }


        renderExtensionRenderMode(widgetName: string, formik: FormikObject) { 
                let DynamicWidget = getExtensionComponent(widgetName);
                if (!DynamicWidget) {
                    DynamicWidget = getExtensionComponent('field-selectbox');
                }
                const widgetProps: SolidBooleanFieldWidgetProps = {
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
