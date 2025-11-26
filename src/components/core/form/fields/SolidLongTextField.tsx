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
import { Slider } from "primereact/slider";
import { InputSwitch } from "primereact/inputswitch";
import { InputNumber } from "primereact/inputnumber";


export class SolidLongTextField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        console.log("CORE SolidLongTextField updateFormData called with value:", value);
        console.log("CORE formData before update:", formData);
        console.log("CORE fieldContext:", this.fieldContext);
        const fieldLayoutInfo = this.fieldContext.field;
        if (value !== undefined && value !== null) {
            if(fieldLayoutInfo){
                formData.append(fieldLayoutInfo.attrs.name, value);
            }else{
                formData.append(this.fieldContext.fieldMetadata?.name, value);
            }
            
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
                    // onChange={formik.handleChange}
                    onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
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

        if (meta.type === "string" || meta.type === "shortText") {
            return (
                <InputText value={value} readOnly disabled />
            );
        }
        if (meta.type === "longText") {
            return (
                <InputTextarea value={value} rows={10} cols={100} readOnly />
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
                                className={`flex ${fieldLayoutInfo.attrs?.className ? `flex-${fieldLayoutInfo.attrs?.className}` : 'flex-row'} border-1 border-round p-3 gap-2`}
                            >
                                {Object.keys(fieldJsonSchema).map((key) => (
                                    <div key={key} className="flex flex-column gap-1">
                                        <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
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

        if (meta.type === "string" || meta.type === "shortText") {
            return (
                <InputText
                    value={value}
                    onChange={(e) => handleChange(index, key, e.target.value)}
                    disabled={!!disabled}
                    readOnly={!!readOnly}
                />
            );
        }

        if (meta.type === "longText") {
            return (
                <InputTextarea
                    onChange={(e) => handleChange(index, key, e.target.value)}
                    value={value}
                    rows={10}
                    cols={100}
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
                    disabled={!!disabled}
                    readOnlyInput={!!readOnly}
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
                    disabled={!!disabled}
                    readOnly={!!readOnly}
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
                    {!disabled && !readOnly ? (
                        <Button
                            type="button"
                            label="Add"
                            icon="pi pi-plus"
                            onClick={handleAdd}
                        />
                    ) : null}
                </div>

                <div className="flex flex-column gap-2">
                    {
                        // @ts-ignore
                        data.map((row, idx) => (
                            <div
                                key={idx}
                                className={`flex ${fieldLayoutInfo.attrs?.className ? `flex-${fieldLayoutInfo.attrs?.className}` : 'flex-row'} border-1 border-round p-3 gap-2`}
                            >
                                <div className="flex gap-3 align-items-center">
                                    {Object.keys(fieldJsonSchema).map((key) => (
                                        <div key={key} className="flex flex-column gap-1">
                                            <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                            {
                                                // @ts-ignore
                                                renderInput(row[key], key, idx)
                                            }
                                        </div>
                                    ))}
                                </div>
                                {!disabled && !readOnly ? (
                                    <Button
                                        type="button"
                                        icon="pi pi-minus"
                                        className="ml-2 h-2rem w-2rem rounded-circle"
                                        onClick={() => handleRemove(idx)}
                                    />
                                ) : null}
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

export const DynamicSelectionStaticEditWidget = ({
    formik,
    fieldContext,
}: SolidFormFieldWidgetProps) => {
    const fieldLayoutInfo = fieldContext.field;
    const fieldJsonSchema = fieldLayoutInfo.attrs.jsonSchema;
    const name = fieldLayoutInfo.attrs.name;
    const readOnly = fieldLayoutInfo.attrs?.readonly || fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;

    const value = formik.values[name] || "{}";
    const [data, setData] = useState(JSON.parse(value || "{}"));

    useEffect(() => {
        try {
            setData(JSON.parse(formik.values[name] || "{}"));
        } catch (e) {
            setData({});
        }
    }, [formik.values[name]]);

    const handleChange = (key: string, value: any) => {
        const updated = { ...data, [key]: value };
        setData(updated);
        formik.setFieldValue(name, JSON.stringify(updated));
    };

    const renderInput = (key: string) => {
        const meta: any = fieldJsonSchema[key];
        const val = data[key];

        if (meta) {
            return (
                <Dropdown
                    value={val}
                    options={meta.allowedValues.map((v:any) => ({
                        label: v,
                        value: v,
                    }))}
                    onChange={(e) => handleChange(key, e.value)}
                    placeholder={meta.placeHolder || "Select..."}
                    disabled={!!disabled}
                    readOnly={!!readOnly}
                    className="w-full"
                />
            );
        }

        return null;
    };
    const shouldShowField = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!meta?.visibility) return true; // default show

        if (meta.visibility === "parent") {
            const parentKey = Object.keys(fieldJsonSchema)[0]; // assume first field is parent
            return !!data[parentKey]; // show only if parent has value
        }

        return true;
    };

    return (
      <div className="flex gap-3 align-items-center">
        {Object.keys(fieldJsonSchema).map((key) => {
          const meta: any = fieldJsonSchema[key];
           if (!shouldShowField(key)) return null;
          return (
            <div key={key} className={"flex flex-column gap-2 " + (meta.className || '')}>
              {/*load prime header icon and headerText */}
              {(meta.headerText || meta.headerIcon) && (
                <div className="flex align-items-center gap-2">
                  {meta.headerIcon && <i className={meta.headerIcon}></i>}
                  <span className="font-semibold form-field-label font-medium">
                    {meta.headerText ?? key}
                  </span>
                </div>
              )}
              {/* Notes below input */}
                {meta.noteText && (
                    <small className="text-secondary mt-2">{meta.noteText}</small>
                )}
              {/*load note here */}
              <label className="form-field-label font-medium">{key.charAt(0).toUpperCase() + key.slice(1)} {meta.required && <span className="text-red-500">*</span>}</label>
              <div className="w-full mt-1 flex flex-row gap-2">
              {renderInput(key)}
              </div>
            </div>
          );
        })}
      </div>
    );
};

export const DynamicSelectionStaticViewWidget = ({
    formik,
    fieldContext,
}: SolidFormFieldWidgetProps) => {
    const fieldLayoutInfo = fieldContext.field;
    const fieldJsonSchema = fieldLayoutInfo.attrs.jsonSchema;
    const name = fieldLayoutInfo.attrs.name;

    const value = formik.values[name] || "{}";
    const [data, setData] = useState(JSON.parse(value || "{}"));

    // Keep data in sync with formik
    useEffect(() => {
        try {
            setData(JSON.parse(formik.values[name] || "{}"));
        } catch {
            setData({});
        }
    }, [formik.values[name]]);

    const shouldShowField = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!meta?.visibility) return true;

        if (meta.visibility === "parent") {
            const parentKey = Object.keys(fieldJsonSchema)[0]; // same logic as edit widget
            return !!data[parentKey];
        }

        return true;
    };

    const renderValue = (key: string) => {
        const meta: any = fieldJsonSchema[key];
        const val = data[key];

        if (!val) return <span className="text-600">—</span>;

        // value comes from meta.allowedValues
        return <span className="font-medium">{val}</span>;
    };

    return (
        <div className="flex gap-4 flex-wrap align-items-center">
            {Object.keys(fieldJsonSchema).map((key) => {
                const meta: any = fieldJsonSchema[key];
                if (!shouldShowField(key)) return null;

                return (
                    <div key={key} className={"flex flex-column "}>

                        {/* Header Text / Icon */}
                        {(meta.headerText || meta.headerIcon) && (
                            <div className="flex align-items-center gap-2 mb-1">
                                {meta.headerIcon && (
                                    <i className={meta.headerIcon}></i>
                                )}
                                <span className="font-semibold text-900 text-sm">
                                    {meta.headerText}
                                </span>
                            </div>
                        )}

                        {/* Label + Value inline (compact mode) */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 text-sm">
                                {meta.label}
                                {meta.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </span>

                            {/* VALUE (light inline text) */}
                            <div>{renderValue(key)}</div>
                        </div>

                        {/* Note text (optional) */}
                        {meta.noteText && (
                            <small className="text-600 mt-1">
                                {meta.noteText}
                            </small>
                        )}
                    </div>
                );
            })}
        </div>
    );
};



export const DynamicSettingsEditWidget = ({
    formik,
    fieldContext,
}: SolidFormFieldWidgetProps) => {
    const fieldLayoutInfo = fieldContext.field;
    const fieldJsonSchema = fieldLayoutInfo.attrs.jsonSchema;
    const name = fieldLayoutInfo.attrs.name;
    const readOnly = fieldLayoutInfo.attrs?.readonly || fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;

    const value = formik.values[name] || "{}";
    const [data, setData] = useState(JSON.parse(value || "{}"));

    useEffect(() => {
        console.log("DynamicSettingsEditWidget initializing data from formik value:", formik.values[name]);
        console.log("attached fieldJsonSchema:", fieldJsonSchema);
        const initialized = { ...data };
        Object.keys(fieldJsonSchema).forEach((key) => {
            const meta = fieldJsonSchema[key];
            if (initialized[key] === undefined && meta.defaultValue !== undefined) {
                initialized[key] = meta.defaultValue;
            }
        });
        setData(initialized);
    }, [fieldJsonSchema]);

    const handleChange = (key: string, value: any) => {
        const updated = { ...data, [key]: value };
        setData(updated);
        formik.setFieldValue(name, JSON.stringify(updated));
    };

    const shouldShowField = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!meta?.visibility) return true;

        if (meta.visibility === "conditional") {
            const dependsOn = meta.dependsOn;
            if (dependsOn) {
                return !!data[dependsOn];
            }
        }

        return true;
    };

    // Key-Value Pair Handler
    const handleKeyValueAdd = (e:any,key: string) => {
        e.preventDefault();
        // @ts-ignore
        const meta = fieldJsonSchema[key];
        const currentData = data[key] || [];
        const newEntry = { key: '', value: '' };
        handleChange(key, [...currentData, newEntry]);
    };

    const handleKeyValueRemove = (e:any,key: string, index: number) => {
        e.preventDefault();
        const currentData = data[key] || [];
        const updated = currentData.filter((_: any, i: number) => i !== index);
        handleChange(key, updated);
    };

    const handleKeyValueChange = (key: string, index: number, field: 'key' | 'value', value: string) => {
        const currentData = data[key] || [];
        const updated = [...currentData];
        updated[index] = { ...updated[index], [field]: value };
        handleChange(key, updated);
    };

    const renderInput = (key: string) => {
        const meta: any = fieldJsonSchema[key];
        const val = data[key];

        switch (meta?.type) {
            case "dropdown":
            case "selectionStatic":
                return (
                    <Dropdown
                        value={val}
                        options={meta.allowedValues?.map((v: any) => ({
                            label: typeof v === 'object' ? v.label : v,
                            value: typeof v === 'object' ? v.value : v,
                        }))}
                        onChange={(e) => handleChange(key, e.value)}
                        placeholder={meta.placeholder || "Select..."}
                        disabled={!!disabled}
                        className="w-full"
                    />
                );

            case "toggle":
            case "switch":
                return (
                    <div className="flex align-items-center gap-2">
                        <InputSwitch
                            checked={!!val}
                            onChange={(e) => handleChange(key, e.value)}
                            disabled={!!disabled || !!readOnly}
                        />
                        {meta.switchLabel && (
                            <span className="text-600 text-sm">{meta.switchLabel}</span>
                        )}
                    </div>
                );

            case "slider":
                return (
                    <div className="w-full">
                        <Slider
                            value={val || meta.defaultValue || 0}
                            onChange={(e) => handleChange(key, e.value)}
                            min={meta.min || 0}
                            max={meta.max || 100}
                            step={meta.step || 1}
                            disabled={!!disabled || !!readOnly}
                            className="w-full"
                        />
                        {meta.showMinMaxLabels && (
                            <div className="flex justify-content-between mt-2">
                                <span className="text-600 text-sm">{meta.min || 0}</span>
                                {meta.centerLabel && (
                                    <span className="text-600 text-sm font-medium">{meta.centerLabel}</span>
                                )}
                                <span className="text-600 text-sm">{meta.max || 100}</span>
                            </div>
                        )}
                    </div>
                );

            case "number":
            case "inputNumber":
                return (
                    <div className="flex align-items-center gap-2 w-full">
                        <InputNumber
                            value={val}
                            onValueChange={(e) => handleChange(key, e.value)}
                            min={meta.min}
                            max={meta.max}
                            step={meta.step || 1}
                            disabled={!!disabled}
                            readOnly={!!readOnly}
                            placeholder={meta.placeholder}
                            className="flex-1"
                            showButtons={meta.showButtons}
                            buttonLayout={meta.buttonLayout || "stacked"}
                        />
                        {meta.suffix && (
                            <span className="text-600 text-sm">{meta.suffix}</span>
                        )}
                    </div>
                );

            case "keyValue":
            case "keyValuePair":
                const entries = val || [];
                return (
                    <div className="w-full">

                       <div className="flex justify-content-between align-items-center mb-3">
                            <span className="text-900 font-medium text-lg">
                                {meta.innerLabel}
                            </span>

                            {!readOnly && !disabled && (
                                <Button
                                    icon="pi pi-plus"
                                    className="p-button p-component p-button-sm w-auto"
                                    label={meta.addButtonLabel || "Add"}
                                    onClick={(e) => handleKeyValueAdd(e, key)}
                                />
                            )}
                        </div>

                        {/* Table Header */}
                        {entries.length > 0 && (
                            <div className="grid mb-2">
                                <div className="col-5">
                                    <span className="text-900 font-medium text-sm">Key</span>
                                </div>
                                <div className="col-5">
                                    <span className="text-900 font-medium text-sm">Value</span>
                                </div>
                                <div className="col-2"></div>
                            </div>
                        )}

                        {/* Key-Value Rows */}
                        {entries.map((entry: any, index: number) => (
                            <div key={index} className="grid mb-2 align-items-center">
                                <div className="col-5">
                                    <InputText
                                        value={entry.key || ''}
                                        onChange={(e) =>
                                            handleKeyValueChange(key, index, 'key', e.target.value)
                                        }
                                        placeholder="Enter key"
                                        className="w-full"
                                        disabled={!!disabled}
                                        readOnly={!!readOnly}
                                    />
                                </div>
                                <div className="col-6">
                                    <InputText
                                        value={entry.value || ''}
                                        onChange={(e) =>
                                            handleKeyValueChange(key, index, 'value', e.target.value)
                                        }
                                        placeholder="Enter value"
                                        className="w-full"
                                        disabled={!!disabled}
                                        readOnly={!!readOnly}
                                    />
                                </div>
                                <div className="col-1 flex justify-content-end">
                                    <i
                                        className="pi pi-trash text-red-500 cursor-pointer text-lg"
                                        onClick={(e) => handleKeyValueRemove(e, key, index)}
                                        style={{ padding: "6px" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case "text":
            case "inputText":
            case "url":
                return (
                    <InputText
                        value={val || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={meta.placeholder}
                        disabled={!!disabled}
                        readOnly={!!readOnly}
                        className="w-full"
                    />
                );

            default:
                return (
                    <InputText
                        value={val || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={meta.placeholder}
                        disabled={!!disabled}
                        readOnly={!!readOnly}
                        className="w-full"
                    />
                );
        }
    };

    const renderSection = (key: string) => {
        const meta: any = fieldJsonSchema[key];

        if (!shouldShowField(key)) return null;

        if (meta.type === "section" || meta.type === "group") {
            return (
                <div key={key} className={`mb-4 ${meta.className || ''}`}>
                    {(meta.headerText || meta.headerIcon) && (
                        <div className="flex align-items-center gap-2 mb-3">
                            {meta.headerIcon && (
                                <i className={`${meta.headerIcon} text-primary`} style={{ fontSize: '1.25rem' }}></i>
                            )}
                            <h3 className="text-lg font-semibold text-900 m-0">
                                {meta.headerText}
                            </h3>
                        </div>
                    )}

                    {meta.description && (
                        <p className="text-600 text-sm mb-3 line-height-3">
                            {meta.description}
                        </p>
                    )}

                    {meta.fields && (
                        <div className={meta.containerClass || 'flex flex-column gap-3'}>
                            {meta.fields.map((fieldKey: string) => renderField(fieldKey))}
                        </div>
                    )}
                </div>
            );
        }

        return renderField(key);
    };

    const renderField = (key: string) => {
        const meta: any = fieldJsonSchema[key];

        if (!shouldShowField(key)) return null;

        const isInlineLabel = meta.labelPosition === 'inline';
        const wrapperClass = meta.wrapperClass || (isInlineLabel ? 'surface-50 border-1 surface-border border-round p-3' : '');

        return (
            <div key={key} className={`${wrapperClass} ${meta.className || ''}`}>
                {(meta.headerText || meta.headerIcon) && !isInlineLabel && (
                    <div className="flex align-items-center gap-2 mb-2">
                        {meta.headerIcon && <i className={meta.headerIcon}></i>}
                        <span className="font-semibold text-900">{meta.headerText}</span>
                    </div>
                )}

                <div className={isInlineLabel ? "flex flex-column gap-1" : "w-full flex flex-column gap-1"}>
                    {/* Row: Label + Input */}
                    {isInlineLabel ? (
                        <div className="flex justify-content-between align-items-center w-full">
                            <label className="text-900 font-medium mb-0 flex-shrink-0">
                                {meta.label}
                                {meta.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            <div className="flex align-items-center gap-2">
                                {renderInput(key)}
                            </div>
                        </div>
                    ) : (
                        <>
                            <label className="block text-900 font-medium mb-2">
                                {meta.label}
                                {meta.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div>{renderInput(key)}</div>
                        </>
                    )}

                    {/* Help Text (always below entire block) */}
                    {meta.helpText && (
                        <small className="text-600 mt-1 line-height-3">{meta.helpText}</small>
                    )}
                </div>

                {meta.noteText && (
                    <small className="block text-500 mt-2 line-height-3">{meta.noteText}</small>
                )}
            </div>
        );
    };

    const getFieldsInSections = () => {
        const fieldsInSections = new Set<string>();
        Object.keys(fieldJsonSchema).forEach((key) => {
            const meta = fieldJsonSchema[key];
            if ((meta.type === "section" || meta.type === "group") && meta.fields) {
                meta.fields.forEach((fieldKey: string) => fieldsInSections.add(fieldKey));
            }
        });
        return fieldsInSections;
    };

    return (
        <div className="surface-card">
            {fieldLayoutInfo.attrs.title && (
                <div className="flex align-items-center gap-3 p-4 border-bottom-1 surface-border">
                    {fieldLayoutInfo.attrs.titleIcon && (
                        <i className={`${fieldLayoutInfo.attrs.titleIcon} text-primary`} style={{ fontSize: '1.25rem' }}></i>
                    )}
                    <h2 className="text-xl font-semibold text-900 m-0">
                        {fieldLayoutInfo.attrs.title}
                    </h2>
                </div>
            )}

            <div className="p-4">
                <div className={fieldLayoutInfo.attrs.containerClass || 'flex flex-column gap-4'}>
                    {Object.keys(fieldJsonSchema).map((key) => {
                        const meta = fieldJsonSchema[key];
                        const fieldsInSections = getFieldsInSections();
                        
                        if (fieldsInSections.has(key) && meta.type !== "section" && meta.type !== "group") {
                            return null;
                        }
                        
                        return renderSection(key);
                    })}
                </div>
            </div>
        </div>
    );
};

export const DynamicSettingsViewWidget = ({
    formik,
    fieldContext,
}: SolidFormFieldWidgetProps) => {
    const fieldLayoutInfo = fieldContext.field;
    const fieldJsonSchema = fieldLayoutInfo.attrs.jsonSchema;
    const name = fieldLayoutInfo.attrs.name;

    const value = formik.values[name] || "{}";
    const [data, setData] = useState(JSON.parse(value || "{}"));

    // initialize defaults same as edit widget
    useEffect(() => {
        const initialized = { ...data };
        Object.keys(fieldJsonSchema).forEach((key) => {
            const meta = fieldJsonSchema[key];
            if (initialized[key] === undefined && meta.defaultValue !== undefined) {
                initialized[key] = meta.defaultValue;
            }
        });
        setData(initialized);
    }, [fieldJsonSchema]);

    const shouldShowField = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!meta?.visibility) return true;

        if (meta.visibility === "conditional") {
            const dependsOn = meta.dependsOn;
            if (dependsOn) {
                return !!data[dependsOn];
            }
        }
        return true;
    };

    // ============================
    // Render Display Value
    // ============================
    const renderValue = (key: string) => {
        const meta = fieldJsonSchema[key];
        const val = data[key];

        if (val === undefined || val === null || val === "")
            return <span className="text-600">—</span>;

        switch (meta.type) {
            case "toggle":
            case "switch":
                return <span>{val ? "Enabled" : "Disabled"}</span>;

            case "slider":
            case "number":
            case "inputNumber":
                return <span>{val}</span>;

            case "dropdown":
            case "selectionStatic":
                if (meta.allowedValues && Array.isArray(meta.allowedValues)) {
                    const found = meta.allowedValues.find((v: any) =>
                        typeof v === "object" ? v.value === val : v === val
                    );
                    return (
                        <span>
                            {typeof found === "object" ? found.label : found || val}
                        </span>
                    );
                }
                return <span>{val}</span>;

            case "keyValue":
            case "keyValuePair":
                const entries = val || [];
                if (!entries.length)
                    return <span className="text-600">No entries</span>;

                return (
                    <table className="w-full border-1 surface-border border-round">
                        <thead>
                            <tr className="surface-100">
                                <th className="p-2 text-left text-sm">Key</th>
                                <th className="p-2 text-left text-sm">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((row: any, idx: number) => (
                                <tr key={idx} className="border-top-1 surface-border">
                                    <td className="p-2">{row.key || "—"}</td>
                                    <td className="p-2">{row.value || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            default:
                return <span>{val}</span>;
        }
    };

    // ============================
    // Render Field Wrapper
    // ============================
    const renderField = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!shouldShowField(key)) return null;

        const isInlineLabel = meta.labelPosition === "inline";
        const wrapperClass =
            meta.wrapperClass ||
            (isInlineLabel
                ? "surface-50 border-1 surface-border border-round p-3"
                : "");

        return (
            <div key={key} className={`${wrapperClass} ${meta.className || ""}`}>
                {!isInlineLabel && meta.label && (
                    <label className="block text-900 font-medium mb-2">
                        {meta.label}
                    </label>
                )}

                {isInlineLabel ? (
                    <div className="flex justify-content-between align-items-center">
                        <label className="text-900 font-medium">{meta.label}</label>
                        <div>{renderValue(key)}</div>
                    </div>
                ) : (
                    <div>{renderValue(key)}</div>
                )}

                {meta.helpText && (
                    <small className="text-600 mt-1">{meta.helpText}</small>
                )}
                {meta.noteText && (
                    <small className="block text-500 mt-2">{meta.noteText}</small>
                )}
            </div>
        );
    };

    // ============================
    // Render Section / Group
    // ============================
    const renderSection = (key: string) => {
        const meta = fieldJsonSchema[key];

        if (!shouldShowField(key)) return null;

        if (meta.type === "section" || meta.type === "group") {
            return (
                <div key={key} className={`mb-4 ${meta.className || ""}`}>
                    {(meta.headerText || meta.headerIcon) && (
                        <div className="flex align-items-center gap-2 mb-3">
                            {meta.headerIcon && (
                                <i
                                    className={`${meta.headerIcon} text-primary`}
                                    style={{ fontSize: "1.25rem" }}
                                ></i>
                            )}
                            <h3 className="text-lg font-semibold text-900 m-0">
                                {meta.headerText}
                            </h3>
                        </div>
                    )}

                    {meta.description && (
                        <p className="text-600 text-sm mb-3">{meta.description}</p>
                    )}

                    {meta.fields && (
                        <div className={meta.containerClass || "flex flex-column gap-3"}>
                            {meta.fields.map((fieldKey: string) =>
                                renderField(fieldKey)
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return renderField(key);
    };

    // Get fields that belong to sections
    const getFieldsInSections = () => {
        const set = new Set<string>();
        Object.keys(fieldJsonSchema).forEach((key) => {
            const meta = fieldJsonSchema[key];
            if ((meta.type === "section" || meta.type === "group") && meta.fields) {
                meta.fields.forEach((f: string) => set.add(f));
            }
        });
        return set;
    };

    const fieldsInSections = getFieldsInSections();

    return (
        <div className="surface-card">
            {fieldLayoutInfo.attrs.title && (
                <div className="flex align-items-center gap-3 p-4 border-bottom-1 surface-border">
                    {fieldLayoutInfo.attrs.titleIcon && (
                        <i
                            className={`${fieldLayoutInfo.attrs.titleIcon} text-primary`}
                            style={{ fontSize: "1.25rem" }}
                        ></i>
                    )}
                    <h2 className="text-xl font-semibold text-900 m-0">
                        {fieldLayoutInfo.attrs.title}
                    </h2>
                </div>
            )}

            <div className="p-4">
                <div
                    className={
                        fieldLayoutInfo.attrs.containerClass ||
                        "flex flex-column gap-4"
                    }
                >
                    {Object.keys(fieldJsonSchema).map((key) => {
                        const meta = fieldJsonSchema[key];

                        if (
                            fieldsInSections.has(key) &&
                            meta.type !== "section" &&
                            meta.type !== "group"
                        )
                            return null;

                        return renderSection(key);
                    })}
                </div>
            </div>
        </div>
    );
};
