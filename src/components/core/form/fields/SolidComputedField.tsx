
import * as Yup from 'yup';
import styles from './solidFields.module.css';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { SolidInput } from "../../../shad-cn-ui";

/**
 * SolidComputedField
 *
 * Computed fields are server-generated values (e.g. auto-calculated totals, slugs, codes).
 * They are always read-only in the UI and are only shown when a record already exists
 * (i.e., the form is in view or edit mode for an existing record, NOT during creation).
 */
export class SolidComputedField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(_value: any, _formData: FormData): any {
        // Computed fields are never submitted — the server calculates them.
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const existingValue = this.fieldContext.data?.[fieldName];
        return existingValue !== undefined && existingValue !== null ? existingValue : '';
    }

    validationSchema(): Yup.Schema {
        // Computed fields are always optional; they are never set by the user.
        return Yup.mixed().nullable();
    }

    render(formik: FormikObject) {
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        // Computed fields are only relevant for existing records.
        // Check by whether the underlying data has an `id` (record exists).
        const recordExists = !!this.fieldContext.data?.id;
        if (!recordExists) {
            return null;
        }

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultComputedFormWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultComputedFormWidget';
        }

        const viewMode: string = this.fieldContext.viewMode;

        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" &&
                        this.renderExtensionRenderMode(editWidget, formik)
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

/**
 * Default widget for computed fields — renders as a read-only input in edit mode.
 * Uses the same layout as the short-text view widget for consistency.
 */
export const DefaultComputedFormWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata?.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const viewMode: string = fieldContext.viewMode;
    const value = formik.values[fieldLayoutInfo.attrs.name];

    if (viewMode === 'view') {
        // View mode: display as plain text (same as DefaultShortTextFormViewWidget)
        return (
            <div className={styles.fieldViewWrapper}>
                {showFieldLabel !== false && (
                    <p className={`${styles.fieldViewLabel} form-field-label`}>{fieldLabel}</p>
                )}
                <p className={styles.fieldViewValue}>{value && typeof value === 'string' ? value : ''}</p>
            </div>
        );
    }

    // Edit mode: read-only input to make it clear this is a server-computed value
    return (
        <div className={styles.fieldWrapper}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>
                    {fieldLabel}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidInput
                type="text"
                id={fieldLayoutInfo.attrs.name}
                name={fieldLayoutInfo.attrs.name}
                value={value || ''}
                readOnly
                disabled
                className={styles.fieldInput}
            />
        </div>
    );
};
