'use client';
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
// import { Editor } from "primereact/editor";
import { useState } from "react";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { SolidFieldTooltip } from "@/components/common/SolidFieldTooltip";
import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";


export class SolidLongTextField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
         if (value !== undefined && value !== null) {
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
        let schema: Yup.StringSchema<string | null | undefined> = Yup.string();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(`${fieldLabel} is required.`);
        } else {
            schema = schema.nullable(); // Allow null when not required
        }
        // 2. length (min/max)
        if (fieldMetadata.min && fieldMetadata.min > 0) {
            schema = schema.min(fieldMetadata.min, `${fieldLabel} should be at-least ${fieldMetadata.min} characters long.`);
        }
        if (fieldMetadata.max && fieldMetadata.max > 0) {
            schema = schema.max(fieldMetadata.max, `${fieldLabel} should not be more than ${fieldMetadata.max} characters long.`);
        }
        // 3. regular expression
        if (fieldMetadata.regexPattern) {
            const regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg ?? `${fieldLabel} has invalid data.`
            schema = schema.matches(fieldMetadata.regexPattern, regexPatternNotMatchingErrorMsg);
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultLongTextFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultShortTextFormViewWidget';
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

export const DefaultLongTextFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;


    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <div className="relative">
            <div className="flex flex-column gap-2 mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                        {/* &nbsp;   {fieldDescription && <span>({fieldDescription}) </span>} */}
                    </label>
                }
                <InputTextarea
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    disabled={formDisabled || fieldDisabled}
                    id={fieldLayoutInfo.attrs.name}
                    aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                    onChange={formik.handleChange}
                    value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                    rows={5}
                    cols={30}
                />
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
}

export const DynamicJsonEditorFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

    const readOnly = fieldLayoutInfo.attrs?.readonly || fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;

    // Default to SQL
    const language = fieldLayoutInfo.attrs.editorLanguage || 'ts';

    const value = formik.values[fieldLayoutInfo.attrs.name] || '';

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    // Sample schema, this comes from the metadata...
    // {
    //     key1: {
    //         required: true,
    //         type: "string",
    //     },
    //     key2: {
    //         required: true,
    //         type: "selectionStatic",
    //         allowedValues: [
    //             "selection static val 1",
    //             "selection static val 2",
    //             "selection static val 3",
    //             "selection static val 4",
    //         ],
    //     },
    // };
    const fieldJsonSchema = fieldLayoutInfo.attrs?.jsonSchema;
    if (!fieldJsonSchema) {
        return <Message severity="error" text="Field Layout Attributes are missing jsonSchema, cannot render with widget jsonEditor without specifying the schema." />
    }
    const [data, setData] = useState(JSON.parse(value || '[]'));

    const renderInput = (value: any, key: string, index: number) => {
        // @ts-ignore
        const meta: any = fieldJsonSchema[key];
        if (!meta) return null;

        if (meta.type === "string") {
            return (
                <InputText value={value} readOnly disabled />
            );
        }

        if (meta.type === "date" || meta.type === "datetime") {
            return (
                <Calendar
                    value={value ? new Date(value) : null}
                    showTime={meta.type === "datetime"}
                    dateFormat="yy-mm-dd"
                    readOnlyInput
                    disabled
                />
            );
        }

        if (meta.type === "selectionStatic") {
            return (
                <Dropdown
                    value={value}
                    // @ts-ignore
                    options={meta.allowedValues.map((v) => ({ label: v, value: v }))}
                    placeholder="Select..."
                    readOnly
                    disabled
                />
            );
        }

        return null;
    };

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className="form-field-label mb-10">
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="p-4 border-round surface-card shadow-1">

                <div className="flex flex-column gap-2">
                    {
                        // @ts-ignore
                        data.map((row, idx) => (
                            <div
                                key={idx}
                                className="flex gap-3 align-items-center border-1 border-round p-2"
                            >
                                {Object.keys(fieldJsonSchema).map((key) => (
                                    <div key={key} className="flex flex-column gap-1">
                                        <label>{key}</label>
                                        {
                                            // @ts-ignore
                                            renderInput(row[key], key, idx)
                                        }
                                    </div>
                                ))}

                            </div>
                        ))
                    }
                </div>

            </div>
        </div>
    );
}

export const DynamicJsonEditorFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

    const readOnly = fieldLayoutInfo.attrs?.readonly || fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;

    // Default to SQL
    const language = fieldLayoutInfo.attrs.editorLanguage || 'ts';

    const value = formik.values[fieldLayoutInfo.attrs.name] || '';

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    // Sample schema, this comes from the metadata...
    // {
    //     key1: {
    //         required: true,
    //         type: "string",
    //     },
    //     key2: {
    //         required: true,
    //         type: "selectionStatic",
    //         allowedValues: [
    //             "selection static val 1",
    //             "selection static val 2",
    //             "selection static val 3",
    //             "selection static val 4",
    //         ],
    //     },
    // };
    const fieldJsonSchema = fieldLayoutInfo.attrs?.jsonSchema;
    if (!fieldJsonSchema) {
        return <Message severity="error" text="Field Layout Attributes are missing jsonSchema, cannot render with widget jsonEditor without specifying the schema." />
    }
    const [data, setData] = useState(JSON.parse(value || '[]'));

    const handleAllChange = (updated: any) => {
        setData(updated);
        formik.setFieldValue(fieldLayoutInfo.attrs.name, JSON.stringify(updated));
    }

    const handleChange = (index: number, key: string, value: any) => {
        const updated = [...data];
        // @ts-ignore
        updated[index][key] = value;
        handleAllChange(updated);
    };

    const handleAdd = () => {
        const newItem = {};
        Object.keys(fieldJsonSchema).forEach((key) => {
            // @ts-ignore
            newItem[key] = "";
        });
        // @ts-ignore
        handleAllChange([...data, newItem]);
    };

    const handleRemove = (index: number) => {
        const updated = [...data];
        updated.splice(index, 1);
        handleAllChange(updated);
    };

    const renderInput = (value: any, key: string, index: number) => {
        // @ts-ignore
        const meta: any = fieldJsonSchema[key];
        if (!meta) return null;

        if (meta.type === "string") {
            return (
                <InputText
                    value={value}
                    onChange={(e) => handleChange(index, key, e.target.value)}
                />
            );
        }

        if (meta.type === "date" || meta.type === "datetime") {
            return (
                <Calendar
                    value={value ? new Date(value) : null}
                    onChange={(e) => handleChange(index, key, e.value)}
                    showTime={meta.type === "datetime"}
                    dateFormat="yy-mm-dd"
                />
            );
        }

        if (meta.type === "selectionStatic") {
            return (
                <Dropdown
                    value={value}
                    // @ts-ignore
                    options={meta.allowedValues.map((v) => ({ label: v, value: v }))}
                    onChange={(e) => handleChange(index, key, e.value)}
                    placeholder="Select..."
                />
            );
        }

        return null;
    };

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className="form-field-label mb-10">
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="p-4 border-round surface-card shadow-1">
                <div className="flex justify-content-between align-items-center mb-3">
                    <Button
                        type="button"
                        label="Add"
                        icon="pi pi-plus"
                        onClick={handleAdd}
                    />
                </div>

                <div className="flex flex-column gap-2">
                    {
                        // @ts-ignore
                        data.map((row, idx) => (
                            <div
                                key={idx}
                                className="flex gap-3 align-items-center border-1 border-round p-2"
                            >
                                {Object.keys(fieldJsonSchema).map((key) => (
                                    <div key={key} className="flex flex-column gap-1">
                                        <label>{key}</label>
                                        {
                                            // @ts-ignore
                                            renderInput(row[key], key, idx)
                                        }
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    icon="pi pi-minus"
                                    className="p-button-danger ml-2"
                                    onClick={() => handleRemove(idx)}
                                />
                            </div>
                        ))
                    }
                </div>

                {
                    fieldLayoutInfo.attrs?.jsonSchemaShowPreview &&
                    <pre className="mt-4 bg-gray-100 p-3 border-round overflow-auto">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                }
            </div>
        </div>
    );
};

export const CodeEditorFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

    const readOnly = fieldLayoutInfo.attrs?.readonly || fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;

    // Default to SQL
    const language = fieldLayoutInfo.attrs.editorLanguage || 'ts';

    const value = formik.values[fieldLayoutInfo.attrs.name] || '';

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className="form-field-label mb-10">
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="border border-gray-300 rounded overflow-hidden">
                <Editor
                    height="200px"
                    defaultLanguage={language}
                    value={value}
                    onChange={(val) => formik.setFieldValue(fieldLayoutInfo.attrs.name, val)}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                    }}
                />
            </div>

            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="mt-1">
                    <Message text={formik.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
};
