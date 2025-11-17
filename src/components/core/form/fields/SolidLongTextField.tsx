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

    const handleChange = (key: string, value: any) => {
        const updated = { ...data, [key]: value };
        setData(updated);
        formik.setFieldValue(name, JSON.stringify(updated));
    };

    const renderInput = (key: string) => {
        const meta: any = fieldJsonSchema[key];
        const val = data[key];

        if (meta?.type === "selectionStatic") {
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


export const DynamicAdvancedSettingsWidget = ({
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
        // Initialize with default values from schema if not present
        console.log("json schema",fieldJsonSchema)
        const initialized = { ...data };
        Object.keys(fieldJsonSchema).forEach((key) => {
            const meta = fieldJsonSchema[key];
            if (initialized[key] === undefined && meta.defaultValue !== undefined) {
                initialized[key] = meta.defaultValue;
            }
        });
        console.log("advance setting widget",initialized)
        setData(initialized);
    }, []);

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

            case "text":
            case "inputText":
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

        // Section/Group rendering
        if (meta.type === "section" || meta.type === "group") {
            return (
                <div key={key} className={`mb-4 ${meta.className || ''}`}>
                    {/* Section Header */}
                    {(meta.headerText || meta.headerIcon) && (
                        <div className="flex align-items-center gap-2 mb-3">
                            {meta.headerIcon && (
                                <i className={`${meta.headerIcon} text-primary`} style={{ fontSize: '1.25rem' }}></i>
                            )}
                            <h3 className="text-lg font-semibold text-900 m-0">
                                {meta.headerText || key}
                            </h3>
                        </div>
                    )}

                    {/* Section Description */}
                    {meta.description && (
                        <p className="text-600 text-sm mb-3 line-height-3">
                            {meta.description}
                        </p>
                    )}

                    {/* Section Fields */}
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
                {/* Header Icon and Text */}
                {(meta.headerText || meta.headerIcon) && !isInlineLabel && (
                    <div className="flex align-items-center gap-2 mb-2">
                        {meta.headerIcon && <i className={meta.headerIcon}></i>}
                        <span className="font-semibold text-900">{meta.headerText}</span>
                    </div>
                )}

                {/* Field Label */}
                {meta.label !== false && !isInlineLabel && (
                    <label className="block text-900 font-medium mb-2">
                        {meta.label || key.charAt(0).toUpperCase() + key.slice(1)}
                        {meta.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                {/* Inline Label Layout */}
                {isInlineLabel ? (
                    <div>
                        <label className="block text-900 font-medium mb-3">
                            {meta.label || key.charAt(0).toUpperCase() + key.slice(1)}
                            {meta.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="flex align-items-center gap-2">
                            {renderInput(key)}
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {renderInput(key)}
                    </div>
                )}

                {/* Help Text / Note */}
                {meta.helpText && (
                    <small className="block text-600 mt-2 line-height-3">{meta.helpText}</small>
                )}

                {/* Note Text */}
                {meta.noteText && (
                    <small className="block text-500 mt-2 line-height-3">{meta.noteText}</small>
                )}
            </div>
        );
    };
    // Add this function before the return statement
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
            {/* Main Header */}
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

            {/* Form Fields */}
            <div className="p-4">
                <div className={fieldLayoutInfo.attrs.containerClass || 'flex flex-column gap-4'}>
                    {Object.keys(fieldJsonSchema).map((key) => {
                        const meta = fieldJsonSchema[key];
                        const fieldsInSections = getFieldsInSections();
                        
                        // Skip if this field is part of a section (unless it IS a section)
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