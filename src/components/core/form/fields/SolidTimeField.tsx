'use client';
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import { useRef } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";

export class SolidTimeField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;

        const existingValue = this.fieldContext.data[fieldName];

        return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';
    }

    validationSchema(): Schema {
        let schema: Yup.DateSchema = Yup.date();
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
        const calendarRef = useRef<any>(null); // Reference for the Calendar component
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;

        return (
            <div className={className}>
                <div className="flex flex-column gap-2 mt-4">
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}

                        &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>}
                    </label>
                    <Calendar
                        disabled={formDisabled || fieldDisabled}
                        ref={calendarRef} // Attach ref to Calendar
                        id={fieldLayoutInfo.attrs.name}
                        aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                        onChange={formik.handleChange}
                        //@ts-ignore
                        value={formik.values[fieldLayoutInfo.attrs.name] ? formik.values[fieldLayoutInfo.attrs.name] : Date()}
                        // dateFormat="mm/dd/yy"
                        // placeholder="mm/dd/yyyy hh:mm"
                        hideOnDateTimeSelect
                        timeOnly
                        showTime className=""
                        hourFormat="24"

                    />
                </div>
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                )}
            </div>
        );
    }
}
