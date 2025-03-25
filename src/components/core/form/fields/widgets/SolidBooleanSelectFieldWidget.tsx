"use client";
import { SolidBooleanFieldWidgetProps } from "@/types/solid-core";
import { useEffect, useState } from "react";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import { SelectButton } from "primereact/selectbutton";

export const SolidBooleanFieldSelectWidget = ({ formik, fieldContext }: SolidBooleanFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const booleanOptions = ["false", "true"];
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={className}>
            <div className="relative">
                <div className="flex flex-column gap-2 mt-4">
                    {showFieldLabel != false &&
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                            {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                        </label>
                    }
                    {/* <InputText
                    id={fieldLayoutInfo.attrs.name}
                    className="small-input"
                    aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                    onChange={formik.handleChange}
                    value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                /> */}
                    <SelectButton
                        readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                        disabled={formDisabled || fieldDisabled}
                        id={fieldLayoutInfo.attrs.name}
                        aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                        onChange={(e) => {formik.setFieldValue(fieldLayoutInfo.attrs.name, e.value); console.log("value is",e.value)}} // Custom handling for boolean input
                        value={formik.values[fieldLayoutInfo.attrs.name] ? formik.values[fieldLayoutInfo.attrs.name].toString() : "false"}
                        options={booleanOptions}
                        className={classNames("", {
                            "p-invalid": isFormFieldValid(formik, "defaultValue"),
                        })}

                    />
                </div>
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <div className="absolute mt-1">
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    </div>
                )}
            </div>
        </div>
    );
}
