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
        const isMultiple = this.fieldContext.field.attrs.multiple;

        // return { label: optionValue || '', value: optionValue || '' };
        if (isMultiple) {
            // Multiple selected options - initialize as array
            if (Array.isArray(optionValue)) {
                return optionValue.map(val => ({ label: val, value: val }));
            }
            return [];
        } else {
            // Single selection
            return { label: optionValue || '', value: optionValue || '' };
        }
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        const isMultiple = fieldLayoutInfo.attrs.multiple;
        // if (value) {
        //     formData.append(fieldLayoutInfo.attrs.name, value.value);
        // }
        if (value) {
            if (isMultiple) {
                const selectedValues = value.map((v: any) => v.value);
                formData.append(fieldLayoutInfo.attrs.name, JSON.stringify(selectedValues)); // You can change format if needed
            } else {
                formData.append(fieldLayoutInfo.attrs.name, value.value);
            }
        }
    }

    validationSchema(): Schema {
        let schema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const isMultiple = fieldLayoutInfo.attrs.multiple;

        // 1. required 
        if (fieldMetadata.required) {
            // schema = schema.required(`${fieldLabel} is required.`);
            if (isMultiple) {
                schema = schema.test('required', `${fieldLabel} is required.`, (value: any) => {
                    return Array.isArray(value) && value.length > 0;
                });
            } else {
                schema = schema.test('required', `${fieldLabel} is required.`, (value: any) => {
                    return value && value.value;
                });
            }
        }

        return schema;
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




export const DefaultSelectionDynamicFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const isMultiple = fieldLayoutInfo.attrs.multiple;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const whereClause = fieldLayoutInfo.attrs.whereClause;

    // selection dynamic specific code. 
    const [triggerGetSelectionDynamicValues] = useLazyGetSelectionDynamicValuesQuery();
    const [selectionDynamicItems, setSelectionDynamicItems] = useState([]);
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
            encoder: (str, defaultEncoder, charset, type) => {
                if (type === 'key' || type === 'value') {
                    if (str === queryData.query) return str;
                }
                return defaultEncoder(str);
            }
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
                        {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                    </label>
                }
                <AutoComplete
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    disabled={formDisabled || fieldDisabled}
                    {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                    id={fieldLayoutInfo.attrs.name}
                    field="label"
                    value={formik.values[fieldLayoutInfo.attrs.name] || null}
                    dropdown
                    suggestions={selectionDynamicItems}
                    completeMethod={selectionDynamicSearch}
                    // onChange={(e) => updateInputs(index, e.value)} />
                    // onChange={formik.handleChange}
                    onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                    className="solid-standard-autocomplete"
                />
            </div>
        </div>
    );
}


export const DefaultSelectionDynamicFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

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

