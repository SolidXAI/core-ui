import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Message } from "primereact/message";
import qs from "qs";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";


export class SolidRelationManyToOneField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {

        const manyToOneFieldData = this.fieldContext.data[this.fieldContext.field.attrs.name];
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const userKeyField = fieldMetadata.relationModel.userKeyField.name;
        const manyToOneColVal = manyToOneFieldData ? manyToOneFieldData[userKeyField] : '';
        if (manyToOneColVal) {
            return { label: manyToOneColVal || '', value: manyToOneFieldData?.id || '' };
        }
        return {}
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value?.value) {
            formData.append(`${fieldLayoutInfo.attrs.name}Id`, value.value);
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
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;

        // auto complete specific code. 
        const entityApi = createSolidEntityApi(fieldMetadata.relationModelSingularName);
        const { useLazyGetSolidEntitiesQuery } = entityApi;
        const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        const [autoCompleteItems, setAutoCompleteItems] = useState([]);
        const autoCompleteSearch = async (event: AutoCompleteCompleteEvent) => {

            // Get the list view layout & metadata first. 
            const queryData = {
                offset: 0,
                limit: 10,
                filters: {
                    [fieldMetadata.relationModel.userKeyField.name]: {
                        '$containsi': event.query
                    }
                }
            };

            const autocompleteQs = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });

            // TODO: do error handling here, possible errors like modelname is incorrect etc...
            const autocompleteResponse = await triggerGetSolidEntities(autocompleteQs);

            // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
            const autocompleteData = autocompleteResponse.data;

            if (autocompleteData) {
                const autoCompleteItems = autocompleteData.records.map((item: any) => {
                    return {
                        label: item[fieldMetadata.relationModel.userKeyField.name],
                        value: item['id']
                    }
                });
                setAutoCompleteItems(autoCompleteItems);
            }
        }
console.log("formik",formik.values);

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        return (
            <div className={className}>
                <div className="justify-content-center align-items-center">
                    <label htmlFor={fieldLayoutInfo.attrs.name}>{fieldLabel}

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
                        suggestions={autoCompleteItems}
                        completeMethod={autoCompleteSearch}
                        onChange={formik.handleChange} />

                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    )}
                </div>
            </div>
        );
    }
}
