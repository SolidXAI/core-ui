'use client';
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Message } from "primereact/message";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { RadioButton } from "primereact/radiobutton";

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
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

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
                            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                                <div className="absolute mt-1">
                                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                                </div>
                            )}
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
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

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
        <div className="relative">
            <div className="flex flex-column gap-2 mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label font-medium">{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                    </label>
                }
                <AutoComplete
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    disabled={formDisabled || fieldDisabled}
                    {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                    id={fieldLayoutInfo.attrs.name}
                    name={fieldLayoutInfo.attrs.name}
                    field="label"
                    value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                    dropdown
                    suggestions={selectionStaticItems}
                    completeMethod={selectionStaticSearch}
                    // onChange={(e) => updateInputs(index, e.value)} />
                    // onChange={formik.handleChange}
                    onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                    className="solid-standard-autocomplete"
                />
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
}

export const SolidSelectionStaticRadioFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = fieldContext.solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    const fieldName = fieldLayoutInfo.attrs.name;

    // Convert selectionStaticValues to usable radio options
    const radioOptions = fieldMetadata.selectionStaticValues.map((i: string) => {
        const [value, label] = i.split(":");
        return { label, value };
    });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <div className={className}>
            <div className="relative">
                <div className="flex flex-column gap-2 mt-4">
                    {showFieldLabel !== false && (
                        <label htmlFor={fieldName} className="form-field-label font-medium">
                            {fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        </label>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {radioOptions.map((option: any) => (
                            <div key={option.value} className="flex items-center">
                                <RadioButton
                                    id={`${fieldName}-${option.value}`}
                                    name={fieldName}
                                    value={option}
                                    checked={formik.values[fieldName]?.value === option.value}
                                    // onChange={(e) => formik.setFieldValue(fieldName, e.value)} 
                                    onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                                    disabled={formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled}
                                    className="mr-2"
                                />
                                <label htmlFor={`${fieldName}-${option.value}`} className="cursor-pointer">
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                {isFormFieldValid(formik, fieldName) && (
                    <div className="absolute mt-1">
                        <Message severity="error" text={formik?.errors[fieldName]?.toString()} />
                    </div>
                )}
            </div>
        </div>
    );
}


export const DefaultSelectionStaticFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const value  =formik.values[fieldLayoutInfo.attrs.name];

    return (
        <div className="mt-2 flex-column gap-2">
            <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
            <p className="m-0">{value && value.label && value.label}</p>
        </div>
    );
}


