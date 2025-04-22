'use client';
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Message } from "primereact/message";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidSelectionStaticFieldWidgetProps } from "@/types/solid-core";

export class SolidSelectionStaticField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value.value);
        }
    }

    initialValue(): any {
        // Get field name and metadata
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldDefaultValue = fieldMetadata?.defaultValue;

        // Get existing value from form data
        const existingValue = this.fieldContext.data[fieldName];

        // Function to get display value based on selectionStaticValues
        const getDisplayValue = (value: string | null): string | null => {
            if (!value) return null;
            for (const item of fieldMetadata.selectionStaticValues) {
                const [lhs, rhs] = item.split(':');
                if (lhs === value) {
                    return rhs;
                }
            }
            return null;
        };

        // Determine the final value to use (existing value or default value)
        const finalValue = existingValue ?? fieldDefaultValue ?? '';

        // Get display value for the final value
        const displayValue = getDisplayValue(finalValue);

        return { label: displayValue ?? '', value: finalValue };
    }


    validationSchema(): Schema {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        let schema = Yup.object({
            value: Yup.string().required(`${fieldLabel} is required.`)
        });

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(`${fieldLabel} is required.`);
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

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        let widget = fieldLayoutInfo.attrs.widget;
        if (!widget) {
            widget = 'field-autocomplete';
        }
        const viewMode: string = this.fieldContext.viewMode;
        let DynamicWidget = getExtensionComponent("SolidFormFieldViewModeWidget");
        const widgetProps = {
            label: fieldLabel,
            value: formik.values[fieldLayoutInfo.attrs.name] && formik.values[fieldLayoutInfo.attrs.name].value,
            layout:fieldLayoutInfo
        }
        return (
            <>
              {viewMode === "view" &&
                    <div className={className}>
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </div>
                }
                {viewMode === "edit" &&
                    (
                        <>
                            {widget &&
                                this.renderExtensionRenderMode(widget, formik)
                            }
                            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                                <div className="absolute mt-1">
                                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                                </div>
                            )}
                        </>)
                }
            </>
        );
    }

    renderExtensionRenderMode(widgetName: string, formik: FormikObject) {
        let DynamicWidget = getExtensionComponent(widgetName);
        if (!DynamicWidget) {
            DynamicWidget = getExtensionComponent('field-autocomplete');
        }
        const widgetProps: SolidSelectionStaticFieldWidgetProps = {
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
