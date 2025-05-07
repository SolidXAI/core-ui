'use client';
import { useLazyGetSelectionDynamicValuesQuery } from "@/redux/api/fieldApi";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Message } from "primereact/message";
import qs from "qs";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { SolidFieldTooltip } from "@/components/common/SolidFieldTooltip";


export class SolidSelectionDynamicField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {
        // TODO: Use the field metadata to re-create the object in the valid format 
        // {label: '', value: ''}
        const optionValue = this.fieldContext.data[this.fieldContext.field.attrs.name];
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const isMultiSelect = fieldMetadata?.isMultiSelect;
        // isMultiSelect: fieldMetaData ? fieldMetaData?.isMultiSelect : false,

        // return { label: optionValue || '', value: optionValue || '' };
        const stripBracketsAndQuotes = (str: string) =>
            str.replace(/^\[?"?/, '').replace(/"?\]?$/, '').trim();
    
        const cleanValue = (val: any) => {
            if (typeof val === 'string') {
                const cleaned = stripBracketsAndQuotes(val);
                return { label: cleaned, value: cleaned };
            } else if (val && typeof val === 'object') {
                const label = stripBracketsAndQuotes(String(val.label ?? val));
                const value = stripBracketsAndQuotes(String(val.value ?? val));
                return { label, value };
            } else {
                const strVal = stripBracketsAndQuotes(String(val));
                return { label: strVal, value: strVal };
            }
        };
    
        if (isMultiSelect) {
            if (Array.isArray(optionValue)) {
                return optionValue.map(cleanValue);
            } else if (typeof optionValue === 'string') {
                try {
                    const parsed = JSON.parse(optionValue); // try to parse as JSON array
                    if (Array.isArray(parsed)) {
                        return parsed.map(cleanValue);
                    }
                } catch {
                    // fallback to comma-split only if not valid JSON
                    const splitValues = optionValue.split(',').map(v => v.trim()).filter(Boolean);
                    return splitValues.map(cleanValue);
                }
            }
            return [];
        } else {
            return cleanValue(optionValue || '');
        }
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const isMultiSelect = fieldMetadata?.isMultiSelect;
        const stripQuotes = (str: string) => str.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');

        if (value) {
            if (isMultiSelect) {
                const selectedValues = value.map((v: any) => {
                    const cleanedValue = stripQuotes(v.value);  // still fine
                    return cleanedValue;
                });
                const jsonString = JSON.stringify(selectedValues);  // ✅ Proper JSON array
                formData.append(fieldLayoutInfo.attrs.name, jsonString);
            } else {
                const cleanedValue = stripQuotes(value.value);
                formData.append(fieldLayoutInfo.attrs.name, cleanedValue);
            }
        }
        // if (value) {
        //     formData.append(fieldLayoutInfo.attrs.name, value.value);
        // }
    }

    validationSchema(): Schema {
        let schema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        // if (fieldMetadata.required) {
        //     schema = schema.required(`${fieldLabel} is required.`);
        // }

        // return schema;
        const isMultiSelect = fieldMetadata?.isMultiSelect;
    
        if (!fieldMetadata.required) {
          return Yup.mixed();
        }
    
        if (isMultiSelect) {
          return Yup.array()
            .min(1, `${fieldLabel} is required.`)
            .of(Yup.object().shape({ label: Yup.string(), value: Yup.string() }));
        }
    
        return Yup.object().shape({
          label: Yup.string(),
          value: Yup.string().required(`${fieldLabel} is required.`),
        });
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        // const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const isFormFieldValid = (formik: any, fieldName: string) => formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultSelectionDynamicFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultSelectionDynamicFormViewWidget';
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




export const DefaultSelectionDynamicFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
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
    const whereClause = fieldLayoutInfo.attrs.whereClause;
    
    const isMultiSelect = fieldMetadata?.isMultiSelect;

    // selection dynamic specific code. 
    const [triggerGetSelectionDynamicValues] = useLazyGetSelectionDynamicValuesQuery();
    const [selectionDynamicItems, setSelectionDynamicItems] = useState([]);
    const isFormFieldValid = (formik: any, fieldName: string) => formik.errors[fieldName];

    const selectionDynamicSearch = async (event: AutoCompleteCompleteEvent) => {

        // Get the list view layout & metadata first. 
        const queryData = {
            offset: 0,
            limit: 10,
            query: event.query,
            fieldId: fieldMetadata.id
        };
        if (whereClause) {
            queryData.query = whereClause;
        }
        let sdQs = qs.stringify(queryData, {
            encodeValuesOnly: true,
            // encoder: (str, defaultEncoder, charset, type) => {
            //     if (type === 'key' || type === 'value') {
            //         if (str === queryData.query) return str;
            //     }
            //     return defaultEncoder(str);
            // }
        });
        // TODO: do error handling here, possible errors like modelname is incorrect etc...
        const sdResponse = await triggerGetSelectionDynamicValues(sdQs);

        // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
        const sdData = sdResponse.data.data;

        // @ts-ignore
        setSelectionDynamicItems(sdData);
    }


    return (
        <div className="relative">
            <div className="flex flex-column gap-2 mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                        {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                    </label>
                }
                <AutoComplete
                    multiple={isMultiSelect}
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    disabled={formDisabled || fieldDisabled}
                    {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                    id={fieldLayoutInfo.attrs.name}
                    field="label"
                    // value={formik.values[fieldLayoutInfo.attrs.name] || null}
                    value={formik.values[fieldLayoutInfo.attrs.name] || (isMultiSelect ? [] : null)}
                    dropdown
                    suggestions={selectionDynamicItems}
                    completeMethod={selectionDynamicSearch}
                    // onChange={(e) => updateInputs(index, e.value)} />
                    // onChange={formik.handleChange}
                    onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                    className="solid-standard-autocomplete"
                />
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <Message severity="error" 
                        text={
                            // formik?.errors[fieldLayoutInfo.attrs.name]?.toString()
                            typeof formik.errors[fieldLayoutInfo?.attrs?.name] === 'object'
                            ? formik.errors[fieldLayoutInfo?.attrs?.name]?.value?.toString()
                            : formik.errors[fieldLayoutInfo?.attrs?.name]?.toString()
                        } 
                    />
                </div>
            )}
        </div>
    );
}


export const DefaultSelectionDynamicFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const value  =formik.values[fieldLayoutInfo.attrs.name];
    const isMultiSelect = fieldMetadata?.isMultiSelect;

    let values: string[] = [];
    if (isMultiSelect) {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    values = parsed;
                }
            } catch {
                // Fallback if not a JSON string (or invalid JSON)
                values = value.split(',').map(v => v.trim());
            }
        } else if (Array.isArray(value)) {
            values = value.map(v => (typeof v === 'object' && v.label ? v.label : String(v)));
        }
    }
    
    return (
        // <div className="mt-2 flex-column gap-2">
        //     <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
        //     <p className="m-0 solid-custom-selection-dynamic-pill">{value && value.label && value.label}</p>
        // </div>
        <div className="mt-2 flex-column gap-2">
            <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
            <p className="m-0">
                {isMultiSelect ? (
                    values.length > 0 ? (
                    <span>{values.join(', ')}</span> // ✅ Join with commas
                    ) : (
                    <span className="text-gray-500">No selection</span>
                    )
                ) : (
                    value && value?.label ? value.label : <span className="text-gray-500">No selection</span>
                )}
                </p>
        </div>
    );
}

