
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import styles from "./solidFields.module.css";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import {
  SolidCheckbox,
  SolidMessage,
  SolidSegmentedControl,
  SolidSwitch,
} from "../../../shad-cn-ui";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";

function cx(...parts: Array<string | Record<string, boolean> | undefined | null | false>) {
  const tokens: string[] = [];
  parts.forEach((part) => {
    if (!part) return;
    if (typeof part === "string") {
      tokens.push(part);
      return;
    }
    Object.entries(part).forEach(([key, value]) => value && tokens.push(key));
  });
  return tokens.join(" ");
}

type BooleanOption = {
    label: string;
    value: string;
};


export class SolidBooleanField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        formData.append(fieldLayoutInfo.attrs.name, value === "true" || value === true ? "true" : "");
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;

        const existingValue = this.fieldContext.data[fieldName];

        // return existingValue !== undefined && existingValue !== null ? existingValue : fieldDefaultValue || '';

        // Ensure the value is always a string "true" or "false"
        // const result = existingValue
        //     ? (existingValue === true || existingValue === "true" ? "true" : "false")
        //     : (fieldDefaultValue === true || fieldDefaultValue === "true" ? "true" : "false");
        // return result;

        if (existingValue !== undefined && existingValue !== null) {
            return existingValue === true || existingValue === "true";
        }
        return fieldDefaultValue === true || fieldDefaultValue === "true";
    }

    validationSchema(): Yup.Schema {
        let schema: Yup.BooleanSchema<boolean | null | undefined> = Yup.boolean();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        } else {
            schema = schema.nullable(); // Allow null when not required
        }
        // // 2. length (min/max)
        // if (fieldMetadata.min && fieldMetadata.min > 0) {
        //     schema = schema.min(fieldMetadata.min, `${fieldLabel} should be at-least ${fieldMetadata.min} characters long.`);
        // }
        // if (fieldMetadata.max && fieldMetadata.max > 0) {
        //     schema = schema.max(fieldMetadata.max, `${fieldLabel} should not be more than ${fieldMetadata.max} characters long.`);
        // }
        // 3. regular expression
        //*********Regex doesnt make sense in boolean right? */
        // if (fieldMetadata.regexPattern) {
        //     const regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg ?? `${fieldLabel} has invalid data.`
        //     schema = schema.matches(fieldMetadata.regexPattern, regexPatternNotMatchingErrorMsg);
        // }

        return schema;
    }

    render(formik: FormikObject) {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        //useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'booleanCheckbox';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultBooleanFormViewWidget';
        }
        const viewMode: string = this.fieldContext.viewMode;

        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" &&
                        (
                            <>
                                {
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



export const DefaultBooleanFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const trueLabel = fieldLayoutInfo?.attrs?.trueLabel;
    const falseLabel = fieldLayoutInfo?.attrs?.falseLabel;
    const readOnlyPermission = fieldContext.readOnly;
    // const [booleanOptions, setBooleanOptions] = useState<string[]>(["false", "true"]);
    const [booleanOptions, setBooleanOptions] = useState<BooleanOption[]>([
        { label: "False", value: "false" },
        { label: "True", value: "true" },
    ]);

    // let booleanOptions = ["false", "true"];
    useEffect(() => {
        if (trueLabel || falseLabel) {
            setBooleanOptions([
                {
                    label: falseLabel ?? "False",
                    value: "false",
                },
                {
                    label: trueLabel ?? "True",
                    value: "true",
                },
            ]);
        }
    }, [trueLabel, falseLabel]);

    // useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])
    useEffect(() => {
        const name = fieldLayoutInfo.attrs.name;
        if (formik.values[name] === undefined || formik.values[name] === null) {
            formik.setFieldValue(name, "false");
        }
    }, []);
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidSegmentedControl
                className={cx(isFormFieldValid(formik, "defaultValue") && "is-invalid")}
                options={booleanOptions}
                value={formik.values[fieldLayoutInfo.attrs.name] ? formik.values[fieldLayoutInfo.attrs.name].toString() : "false"}
                disabled={formDisabled || fieldDisabled || formReadonly || fieldReadonly || readOnlyPermission}
                onChange={(val) => formik.setFieldValue(fieldLayoutInfo.attrs.name, val)}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
}

export const SolidBooleanCheckboxStyleFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const checkboxLabel = fieldLayoutInfo?.attrs?.checkboxLabel;
    const readOnlyPermission = fieldContext.readOnly;

    // Set default value to false on mount
    // useEffect(() => {
    //     if (formik.values[fieldLayoutInfo.attrs.name] === undefined) {
    //         console.log("Setting default value:", false);
    //         //formik.setFieldValue(fieldLayoutInfo.attrs.name, false);
    //     }
    // }, []);

    const handleChange = (checked: boolean) => {
        const newValue = checked;
        formik.setFieldValue(fieldLayoutInfo.attrs.name, newValue === true ? 'true' : 'false');
        formik.setTouched({ ...formik.touched, [fieldLayoutInfo.attrs.name]: true });
    };

    const isFormFieldValid = (formik: any, fieldName: any) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel !== false && (
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}
            <div className="flex align-items-center">
                <SolidCheckbox
                    id={fieldLayoutInfo.attrs.name}
                    checked={formik.values[fieldLayoutInfo.attrs.name] === true || formik.values[fieldLayoutInfo.attrs.name] === "true"}
                    onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        fieldContext.onChange(
                            {
                                ...e,
                                target: {
                                    name: fieldLayoutInfo.attrs.name,
                                    value: checked,
                                    checked,
                                    type: "checkbox",
                                },
                            },
                            "onFieldChange"
                        );
                        handleChange(checked);
                    }}
                    disabled={formDisabled || fieldDisabled}
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    className={cx(isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && "is-invalid")}
                />
                {checkboxLabel &&
                    <span className="ml-2">{checkboxLabel || "Yes"}</span>
                }
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
}

export const SolidBooleanSwitchStyleFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    // Set default value to false on mount
    useEffect(() => {
        if (formik.values[fieldLayoutInfo.attrs.name] === undefined) {
            console.log("Setting default value:", false);
            formik.setFieldValue(fieldLayoutInfo.attrs.name, false);
        }
    }, []);

    const handleChange = (e: any) => {
        const newValue = e.value;
        console.log(`${fieldLayoutInfo.attrs.name} switch clicked, new value:`, newValue);

        // formik.setFieldValue(fieldLayoutInfo.attrs.name, newValue === true ? true : false);
        // formik.setTouched({ ...formik.touched, [fieldLayoutInfo.attrs.name]: true }); // Ensure Formik registers the change
        // // ✅ Check if Formik updated the value correctly
        // setTimeout(() => {
        //     console.log("Formik values after update:", formik.values);
        // }, 0);

        // 1: BYPASS Formik's validation by directly mutating the values object
        // This is necessary because the validation schema was rejecting boolean values
        // Direct assignment skips all validation logic that was causing the issue
        formik.values[fieldLayoutInfo.attrs.name] = newValue;

        // 2: Force Formik to recognize the change and trigger re-renders
        // setValues() with the second parameter as 'false' means:
        // - false = skip validation (avoid the schema conflict)
        // - This triggers Formik's internal change detection and component re-renders
        formik.setValues({ ...formik.values }, false);

        // 3: Mark the field as "touched" to indicate user interaction
        // This is important for validation state and form submission logic
        // The 'false' parameter means don't validate immediately
        formik.setTouched({ ...formik.touched, [fieldLayoutInfo.attrs.name]: true }, false);
        fieldContext.onChange(e, 'onFieldChange');
    };

    const isFormFieldValid = (formik: any, fieldName: any) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel !== false && (
                <label htmlFor={fieldLayoutInfo.attrs.name} className={styles.fieldLabel}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500">*</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}
            <div className="flex align-items-center">
                <SolidSwitch
                    checked={formik.values[fieldLayoutInfo.attrs.name] === true || formik.values[fieldLayoutInfo.attrs.name] === "true"}
                    onChange={(checked) => {
                        handleChange(checked);
                        fieldContext.onChange(
                            {
                                target: {
                                    name: fieldLayoutInfo.attrs.name,
                                    value: checked,
                                    checked,
                                    type: "checkbox",
                                },
                            } as any,
                            "onFieldChange"
                        );
                    }}
                    disabled={formDisabled || fieldDisabled || formReadonly || fieldReadonly || readOnlyPermission}
                    className={cx(isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && "is-invalid")}
                />
                <span className="ml-2">{fieldLabel || "Yes"}</span>
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
}

export const DefaultBooleanFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    const [trueLabel, setTrueLabel] = useState<string>("true");
    const [falseLabel, setFalseLabel] = useState<string>("false");

    useEffect(() => {
        if (fieldLayoutInfo?.attrs?.trueLabel) {
            setTrueLabel(fieldLayoutInfo?.attrs?.trueLabel)
        }
        if (fieldLayoutInfo?.attrs?.falseLabel) {
            setFalseLabel(fieldLayoutInfo?.attrs?.falseLabel)
        }
    }, [fieldLayoutInfo?.attrs?.falseLabel, fieldLayoutInfo?.attrs?.trueLabel])


    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={styles.fieldViewLabel}>{fieldLabel}</p>
            )}
            <p className={styles.fieldViewValue}>
                {(() => {
                    const value = formik.values[fieldLayoutInfo.attrs.name];
                    if (value === true) return trueLabel;
                    if (value === false) return falseLabel;
                    return '';
                })()}
            </p>
        </div>
    );
}
