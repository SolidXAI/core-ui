
import { SolidDatePicker } from "../../../shad-cn-ui/SolidDatePicker";
import { SolidMessage } from "../../../shad-cn-ui/SolidMessage";
import { buildSyntheticChangeEvent } from "./fieldEventUtils";
import { useEffect, useRef, useState } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { DateFieldViewComponent } from '../../../../components/core/common/DateFieldViewComponent';

const toDateValue = (value: any) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export class SolidDateField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;

        if (value instanceof Date && !isNaN(value.getTime())) {
            const localDate = new Date(value);
            const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
            // "2025-06-10T00:00:00.000Z"
            const isoString = utcDate.toISOString();
            formData.append(fieldLayoutInfo.attrs.name, isoString.split('T')[0]);
        } else if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;

        const existingValue = this.fieldContext.data[fieldName];

        return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';
    }

    validationSchema(): Yup.Schema {
        let schema: Yup.DateSchema<Date | null | undefined> = Yup.date();
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        } else {
            schema = schema.nullable();
        }
        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultDateFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultDateFormViewWidget';
        }
        const viewMode: string = this.fieldContext.viewMode;

        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" && (
                        <>
                            {editWidget &&
                                this.renderExtensionRenderMode(editWidget, formik)
                            }
                        </>
                    )
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


export const DefaultDateFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    const parsedValue = toDateValue(formik.values[fieldLayoutInfo.attrs.name]);

    const handleChange = (date: Date | null) => {
        const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, date, "date");
        fieldContext.onChange(syntheticEvent, "onFieldChange");
    };

    return (
        <div className="relative">
            <div className="solid-field-wrapper">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className={`solid-field-label form-field-label`}>{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                    </label>
                }
                <SolidDatePicker
                    selected={parsedValue ?? undefined}
                    onChange={(date: Date | null) => handleChange(date as Date | null)}
                    disabled={formDisabled || fieldDisabled || readOnlyPermission}
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    placeholderText={fieldLayoutInfo.attrs.placeholder}
                    className=""
                />
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <SolidMessage
                        severity="error"
                        text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}
                        className="solid-field-error"
                    />
                )}
            </div>
        </div>
    );
}
export const DefaultDateFormViewWidget = ({ formik, fieldContext, }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;

    const fieldName = fieldLayoutInfo.attrs.name;
    const fieldLabel =
        fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    const rawValue = formik.values[fieldName];
    const format = fieldLayoutInfo.attrs?.format as string | undefined;


    return (
        <div className="solid-field-view-wrapper">
            {showFieldLabel !== false && (
                <p className={`solid-field-view-label form-field-label`}>
                    {fieldLabel}
                </p>
            )}
            <p className="solid-field-view-value">
                <DateFieldViewComponent value={rawValue} format={format} fallback="-"></DateFieldViewComponent>
            </p>
        </div>
    );
};
