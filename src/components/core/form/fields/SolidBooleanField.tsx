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
