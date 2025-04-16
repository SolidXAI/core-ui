"use client";
import { SolidBooleanFieldWidgetProps } from "@/types/solid-core";
import { useEffect, useState } from "react";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

export const SolidBooleanFieldCheckboxWidget = ({ formik, fieldContext }: SolidBooleanFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || "field col-12";
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    // Set default value to false on mount
    useEffect(() => {
        if (formik.values[fieldLayoutInfo.attrs.name] === undefined) {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, false);
        }
    }, []);

    const handleChange = (e: CheckboxChangeEvent) => {
        const newValue = e.checked; // This returns `true` or `false`
        console.log(`${fieldLayoutInfo.attrs.name}, new value:`, newValue);
        
        formik.setFieldValue(fieldLayoutInfo.attrs.name, newValue === true ? 'true' : 'false');
        formik.setTouched({ ...formik.touched, [fieldLayoutInfo.attrs.name]: true }); // Ensure Formik registers the change
        // ✅ Check if Formik updated the value correctly
    setTimeout(() => {
        console.log("Formik values after update:", formik.values);
    }, 0);
    };

    const isFormFieldValid = (formik:any, fieldName:any) => 
        formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={className}>
            <div className="relative">
                <div className="flex flex-column gap-2 mt-4">
                    {showFieldLabel !== false && (
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label font-medium">
                            {fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        </label>
                    )}

                    <div className="flex align-items-center">
                        <Checkbox
                            id={fieldLayoutInfo.attrs.name}
                            checked={formik.values[fieldLayoutInfo.attrs.name] === 'true' || formik.initialValues[fieldLayoutInfo.attrs.name] === 'true'}
                            onChange={handleChange}
                            disabled={formDisabled || fieldDisabled}
                            readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                            className={classNames("", {
                                "p-invalid": isFormFieldValid(formik, fieldLayoutInfo.attrs.name),
                            })}
                        />
                        <span className="ml-2">{fieldLabel || "Yes"}</span>
                    </div>
                </div>

                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <div className="absolute mt-1">
                        <Message severity="error" text={formik.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    </div>
                )}
            </div>
        </div>
    );
}
