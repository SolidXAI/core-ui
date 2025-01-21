import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import * as Yup from 'yup';
import { Tooltip } from "primereact/tooltip";
import { Message } from "primereact/message";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import qs from "qs";
import { useLazyGetSelectionDynamicValuesQuery } from "@/redux/api/fieldApi";
import { useState } from "react";


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
        const className = fieldLayoutInfo.attrs?.className || 'col-12 s-field';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

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

            const sdQs = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });

            // TODO: do error handling here, possible errors like modelname is incorrect etc...
            const sdResponse = await triggerGetSelectionDynamicValues(sdQs);

            // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
            const sdData = sdResponse.data.data;

            // @ts-ignore
            setSelectionDynamicItems(sdData);
        }

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        return (
            <div className={className}>
                <div className="justify-content-center align-items-center">
                    <label htmlFor={fieldLayoutInfo.attrs.name}>{fieldLabel}

                        &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>}
                    </label>
                </div>
                <div className="s-input">
                    <AutoComplete
                        readOnly={formReadonly || fieldReadonly}
                        disabled={formDisabled || fieldDisabled}
                        {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                        id={fieldLayoutInfo.attrs.name}
                        field="label"
                        value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                        dropdown
                        className="w-full small-input"
                        suggestions={selectionDynamicItems}
                        completeMethod={selectionDynamicSearch}
                        // onChange={(e) => updateInputs(index, e.value)} />
                        onChange={formik.handleChange} />
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    )}
                </div>
            </div>
        );
    }
}
