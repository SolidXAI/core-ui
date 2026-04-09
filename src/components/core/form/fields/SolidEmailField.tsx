
import styles from './solidFields.module.css';
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { SolidInput } from "../../../shad-cn-ui";

export class SolidEmailField implements ISolidField {

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
        // 1. required
        if (fieldMetadata.required) {
            schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        } else {
            schema = schema.nullable(); // Allow null when not required
        }

        // 2. length (min/max)
        if (fieldMetadata.min && fieldMetadata.min > 0) {
            schema = schema.min(fieldMetadata.min, ERROR_MESSAGES.FIELD_MINIMUM_CHARACTER(fieldLabel,fieldMetadata.min));
        }
        if (fieldMetadata.max && fieldMetadata.max > 0) {
            schema = schema.max(fieldMetadata.max, ERROR_MESSAGES.FIELD_MAXIMUM_CHARACTER(fieldLabel,fieldMetadata.max));
        }
        // 3. regular expression
        if (fieldMetadata.regexPattern) {
            let regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg;

            // Fallback to a user-friendly default for common fields
            if (!regexPatternNotMatchingErrorMsg) {
                const fieldName = fieldMetadata.name?.toLowerCase();
                if (fieldName?.includes("email")) {
                    regexPatternNotMatchingErrorMsg = ERROR_MESSAGES.ENTER_VALID_FIELD('email address');
                } else {
                    regexPatternNotMatchingErrorMsg = ERROR_MESSAGES.FIELD_INAVLID_FORMAT(fieldLabel);
                }
            }
            
            schema = schema.matches(new RegExp(fieldMetadata.regexPattern), regexPatternNotMatchingErrorMsg);
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultEmailFormEditWidget';
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



export const DefaultEmailFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

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
            <SolidInput
                type="email"
                readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                disabled={formDisabled || fieldDisabled}
                id={fieldLayoutInfo.attrs.name}
                name={fieldMetadata.name}
                aria-describedby={`${fieldLayoutInfo.attrs.name}-help`}
                onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                onBlur={(e) => fieldContext.onBlur(e, 'onFieldBlur')}
                value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                className={styles.fieldInput}
            />
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <p className={styles.fieldError}>{formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}</p>
            )}
        </div>
    );
}
