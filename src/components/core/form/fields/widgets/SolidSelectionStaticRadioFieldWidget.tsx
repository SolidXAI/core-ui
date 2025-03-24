"use client";
import { SolidSelectionStaticFieldWidgetProps } from "@/types/solid-core";
import { useEffect, useState } from "react";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import { SelectButton } from "primereact/selectbutton";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { RadioButton } from "primereact/radiobutton";

export const SolidSelectionStaticRadioWidget = ({ formik, fieldContext }: SolidSelectionStaticFieldWidgetProps) => {
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
                        <label htmlFor={fieldName} className="form-field-label">
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
                                onChange={(e) => formik.setFieldValue(fieldName, e.value)} 
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
