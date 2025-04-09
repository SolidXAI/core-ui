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

        return { label: optionValue || '', value: optionValue || '' };
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value.value);
        }
    }

    validationSchema(): Schema {
        let schema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

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

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

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
                {viewMode === "edit" &&
                    (

                        <div className={className}>
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
                                        value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                                        dropdown
                                        suggestions={selectionDynamicItems}
                                        completeMethod={selectionDynamicSearch}
                                        // onChange={(e) => updateInputs(index, e.value)} />
                                        onChange={formik.handleChange}
                                        className="solid-standard-autocomplete"
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
