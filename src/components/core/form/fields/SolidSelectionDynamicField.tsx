
import { useLazyGetSelectionDynamicValuesQuery } from "../../../../redux/api/fieldApi";
import { SolidAutocomplete } from "../../../shad-cn-ui/SolidAutocomplete";
import { buildSyntheticChangeEvent } from "./fieldEventUtils";
import qs from "qs";
import { useState } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { formikValuestoQueryString } from "../../../../helpers/helpers";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import styles from "./solidFields.module.css";

type AutoCompleteCompleteEvent = { query: string };


export class SolidSelectionDynamicField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {
        // TODO: Use the field metadata to re-create the object in the valid format 
        // {label: '', value: ''}
        const fieldLayoutInfo = this.fieldContext.field;
        const optionValue = this.fieldContext.data[fieldLayoutInfo.attrs.name];
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const isMultiSelect = fieldLayoutInfo.attrs.multiSelect ?? fieldMetadata?.isMultiSelect;
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

        if (optionValue === '' || optionValue === null || optionValue === undefined || (Array.isArray(optionValue) && optionValue.length === 0)) {
            return null;
        }

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
        const isMultiSelect = fieldLayoutInfo.attrs.multiSelect ?? fieldMetadata?.isMultiSelect;
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

    validationSchema(): Yup.Schema {
        let schema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        // if (fieldMetadata.required) {
        //     schema = schema.required(`${fieldLabel} is required.`);
        // }

        // return schema;
        const isMultiSelect = fieldLayoutInfo.attrs.multiSelect ?? fieldMetadata?.isMultiSelect;


        const isRequired = fieldLayoutInfo.attrs?.required ?? fieldMetadata.required;
    
        if (!isRequired) {
            return Yup.mixed();
        }

        if (isMultiSelect) {
            return Yup.array()
                .min(1, ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                .of(Yup.object().shape({ label: Yup.string(), value: Yup.string() }));
        }

        return Yup.object().shape({
            label: Yup.string(),
            value: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel)),
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

    const isMultiSelect = fieldLayoutInfo.attrs.multiSelect ?? fieldMetadata?.isMultiSelect;

    // selection dynamic specific code. 
    const [triggerGetSelectionDynamicValues] = useLazyGetSelectionDynamicValuesQuery();
    const [selectionDynamicItems, setSelectionDynamicItems] = useState([]);
    const isFormFieldValid = (formik: any, fieldName: string) =>
        (formik.touched[fieldName] || formik.submitCount > 0) && !!formik.errors[fieldName];

    const isRequired = fieldLayoutInfo.attrs?.required ?? fieldMetadata.required;

    const selectionDynamicSearch = async (event: AutoCompleteCompleteEvent) => {
        try {
            // const query = event.query ?? "";
            const queryData = {
                offset: 0,
                limit: 10,
                query: event.query,
                fieldId: fieldMetadata.id,
                formValues: formikValuestoQueryString(formik.values),
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
            const sdResponse = await triggerGetSelectionDynamicValues(sdQs).unwrap();
            const items = Array.isArray(sdResponse?.data) ? sdResponse.data : [];

            // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
            // const sdData = sdResponse.data.data;

            // @ts-ignore
            setSelectionDynamicItems([...items]);
        } catch (err) {
            setSelectionDynamicItems([]);
        }
    }


    return (
        <div className={`${styles.fieldWrapper} ${isFormFieldValid(formik, fieldLayoutInfo.attrs.name) ? styles.fieldInvalid : ""}`}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>
                    {fieldLabel}
                    {isRequired && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidAutocomplete
                multiple={isMultiSelect}
                field="label"
                className={`solid-standard-autocomplete ${isFormFieldValid(formik, fieldLayoutInfo.attrs.name) ? styles.fieldInvalidControl : ""}`}
                value={formik.values[fieldLayoutInfo.attrs.name] || (isMultiSelect ? [] : null)}
                dropdown
                suggestions={selectionDynamicItems}
                completeMethod={(e) => selectionDynamicSearch(e)}
                emptyMessage="No records found"
                onChange={({ value }) => {
                    if (formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled) return;
                    const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, value, "text");
                    fieldContext.onChange(syntheticEvent, "onFieldChange");
                }}
                onSelect={({ value }) => {
                    const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, value, "text");
                    fieldContext.onChange(syntheticEvent, "onFieldChange");
                }}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>
                    {typeof formik.errors[fieldLayoutInfo?.attrs?.name] === 'object'
                        ? formik.errors[fieldLayoutInfo?.attrs?.name]?.value?.toString()
                        : formik.errors[fieldLayoutInfo?.attrs?.name]?.toString()}
                </p>
            )}
        </div>
    );
}


export const DefaultSelectionDynamicFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const value = formik.values[fieldLayoutInfo.attrs.name];
    const isMultiSelect = fieldLayoutInfo.attrs.multiSelect ?? fieldMetadata?.isMultiSelect;

    const toLabel = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string' || typeof val === 'number') return String(val);
        if (typeof val === 'object') return val.label ?? val.value ?? '';
        return '';
    };

    let values: string[] = [];
    if (isMultiSelect) {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    values = parsed.map(toLabel);
                }
            } catch {
                values = value.split(',').map(v => v.trim()).map(toLabel);
            }
        } else if (Array.isArray(value)) {
            values = value.map(toLabel);
        }
    }

    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={`${styles.fieldViewLabel} form-field-label`}>{fieldLabel}</p>
            )}
            <p className={styles.fieldViewValue}>
                {isMultiSelect
                    ? (values.length > 0 ? values.join(', ') : 'No selection')
                    : (() => {
                        const single = toLabel(value);
                        return single ? single : 'No selection';
                    })()}
            </p>
        </div>
    );
}
