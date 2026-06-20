
import * as Yup from 'yup';
import styles from './solidFields.module.css';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { useEffect, useRef, useState } from "react";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { SolidButton, SolidDatePicker, SolidSelect, SolidInput, SolidCodeEditor, SolidIcon, SolidTextarea } from "../../../shad-cn-ui";
import { parseSolidIconMeta } from "../../../shad-cn-ui/SolidIcon";
import { SolidMessage } from "../../../shad-cn-ui/SolidMessage";


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

    validationSchema(): Yup.Schema {
        let schema: Yup.StringSchema<string | null | undefined> = Yup.string();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        } else {
            schema = schema.nullable(); // Allow null when not required
        }
        // 2. length (min/max)
        if (fieldMetadata.min && fieldMetadata.min > 0) {
            schema = schema.min(fieldMetadata.min, ERROR_MESSAGES.FIELD_MINIMUM_CHARACTER(fieldLabel, fieldMetadata.min));
        }
        if (fieldMetadata.max && fieldMetadata.max > 0) {
            schema = schema.max(fieldMetadata.max, ERROR_MESSAGES.FIELD_MAXIMUM_CHARACTER(fieldLabel, fieldMetadata.max));
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
        const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
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
        <div className={styles.fieldWrapper}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidTextarea
                readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                disabled={formDisabled || fieldDisabled}
                id={fieldLayoutInfo.attrs.name}
                aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => fieldContext.onChange(e, 'onFieldChange')}
                value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                rows={5}
                className={styles.fieldTextarea}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
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
    const value = formik.values[fieldLayoutInfo.attrs.name] || '';
    const codeLanguage = fieldLayoutInfo.attrs.editorLanguage || 'ts';

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
        return <SolidMessage severity="error" text="Field Layout Attributes are missing jsonSchema, cannot render with widget jsonEditor without specifying the schema" />
    }
    const [data, setData] = useState(JSON.parse(value || '[]'));

    const renderInput = (value: any, key: string, index: number) => {
        // @ts-ignore
        const meta: any = fieldJsonSchema[key];
        if (!meta) return null;

        if (meta.type === "string" || meta.type === "shortText") {
            return <SolidInput value={value} readOnly disabled />;
        }
        if (meta.type === "longText") {
            return (
                <SolidTextarea value={value} rows={10} cols={100} readOnly className={styles.fieldTextarea} />
            );
        }
        if (meta.type === "date" || meta.type === "datetime") {
            return (
                <SolidDatePicker
                    selected={value ? new Date(value) : null}
                    onChange={() => { }}
                    showTimeSelect={meta.type === "datetime"}
                    disabled
                />
            );
        }

        if (meta.type === "selectionStatic") {
            return (
                <SolidSelect
                    value={value}
                    // @ts-ignore
                    options={meta.allowedValues.map((v) => ({ label: v, value: v }))}
                    placeholder="Select."
                    disabled
                />
            );
        }

        return null;
    };

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className={`${styles.fieldLabel} form-field-label mb-10`}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="rounded bg-[var(--surface-card)] p-4 shadow-sm">

                <div className="flex flex-col gap-2">
                    {
                        // @ts-ignore
                        data.map((row, idx) => (
                            <div
                                key={idx}
                                className={`flex ${fieldLayoutInfo.attrs?.className ? `flex-${fieldLayoutInfo.attrs?.className}` : 'flex-row'} rounded border p-3 gap-2`}
                            >
                                {Object.keys(fieldJsonSchema).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
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
        return <SolidMessage severity="error" text="Field Layout Attributes are missing jsonSchema, cannot render with widget jsonEditor without specifying the schema" />
    }
    const [data, setData] = useState(JSON.parse(value || '[]'));

    const handleAllChange = (updated: any) => {
        setData(updated);
        fieldContext.onChange(
            {
                target: {
                    name: fieldLayoutInfo.attrs.name,
                    value: JSON.stringify(updated),
                    type: "text",
                },
            } as any,
            "onFieldChange"
        );
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
                <SolidInput
                    value={value}
                    onChange={(e) => handleChange(index, key, e.target.value)}
                    disabled={!!disabled}
                    readOnly={!!readOnly}
                />
            );
        }

        if (meta.type === "longText") {
            return (
                <SolidTextarea
                    onChange={(e) => handleChange(index, key, e.target.value)}
                    value={value}
                    rows={10}
                    cols={100}
                    className={styles.fieldTextarea}
                />
            );
        }

        if (meta.type === "date" || meta.type === "datetime") {
            return (
                <SolidDatePicker
                    selected={value ? new Date(value) : null}
                    onChange={(date: Date | null) => handleChange(index, key, date)}
                    showTimeSelect={meta.type === "datetime"}
                    disabled={!!disabled}
                />
            );
        }

        if (meta.type === "selectionStatic") {
            return (
                <SolidSelect
                    value={value}
                    // @ts-ignore
                    options={meta.allowedValues.map((v) => ({ label: v, value: v }))}
                    onChange={(e) => handleChange(index, key, e.value)}
                    placeholder="Select."
                    disabled={!!disabled}
                />
            );
        }

        return null;
    };

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className={`${styles.fieldLabel} form-field-label mb-10`}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="rounded bg-[var(--surface-card)] p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    {!disabled && !readOnly ? (
                        <SolidButton
                            type="button"
                            leftIcon={<SolidIcon name="si-plus" aria-hidden />}
                            onClick={handleAdd}
                        >
                            Add
                        </SolidButton>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2">
                    {
                        // @ts-ignore
                        data.map((row, idx) => (
                            <div
                                key={idx}
                                className={`flex ${fieldLayoutInfo.attrs?.className ? `flex-${fieldLayoutInfo.attrs?.className}` : 'flex-row'} rounded border p-3 gap-2`}
                            >
                                <div className="flex gap-4 items-center">
                                    {Object.keys(fieldJsonSchema).map((key) => (
                                        <div key={key} className="flex flex-col gap-1">
                                            <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                            {
                                                // @ts-ignore
                                                renderInput(row[key], key, idx)
                                            }
                                        </div>
                                    ))}
                                </div>
                                {!disabled && !readOnly ? (
                                    <SolidButton
                                        type="button"
                                        leftIcon={<SolidIcon name="si-minus" aria-hidden />}
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
                    <pre className="mt-4 overflow-auto rounded bg-gray-100 p-3">
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
    const codeLanguage = fieldLayoutInfo.attrs.editorLanguage || 'ts';

    const value = formik.values[fieldLayoutInfo.attrs.name] || '';

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <div className="mt-4">
            {fieldLayoutInfo?.attrs?.showLabel !== false && (
                <label className={`${styles.fieldLabel} form-field-label mb-10`}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}

            <div className="border border-gray-300 rounded overflow-hidden">
                <SolidCodeEditor
                    value={value}
                    onChange={(val) => {
                        fieldContext.onChange(
                            {
                                target: {
                                    name: fieldLayoutInfo.attrs.name,
                                    value: val,
                                    type: "text",
                                },
                            } as any,
                            "onFieldChange"
                        );
                    }}
                    height={fieldLayoutInfo.attrs?.height ?? "200px"}
                    fontSize={fieldLayoutInfo.attrs?.fontSize ?? "14px"}
                    readOnly={readOnly || disabled}
                    language={codeLanguage}
                />
            </div>

            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="mt-1">
                    <SolidMessage text={formik.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
};
