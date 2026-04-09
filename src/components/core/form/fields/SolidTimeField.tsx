
import { SolidDatePicker } from "../../../shad-cn-ui/SolidDatePicker";
import { SolidMessage } from "../../../shad-cn-ui/SolidMessage";
import { buildSyntheticChangeEvent } from "./fieldEventUtils";
import { useRef } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { DateFieldViewComponent } from '../../../../components/core/common/DateFieldViewComponent';
import styles from "./solidFields.module.css";


// Converts multiple time formats into a JavaScript Date object
function parseTimeStringToDate(timeStr: string): Date | null {
    if (!timeStr) return null;

    // CASE 1: HH:mm:ss
    if (typeof timeStr === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        const [h, m, s] = timeStr.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, s, 0);
        return d;
    }

    // CASE 2: timestamp or timestamptz
    try {
        const d = new Date(timeStr); // ← AUTO UTC → LOCAL conversion
        if (!isNaN(d.getTime())) return d;
    } catch (e) {
        console.error(`${ERROR_MESSAGES.FIELD_INAVLID_FORMAT('Date')}:,${e}`)
    }

    return null;
}

// Formats a Date object to a HH:mm:ss string for display
function formatTime(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleTimeString();
}


export class SolidTimeField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value instanceof Date) {
            // Use local date with selected time
            const now = new Date();
            const localDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                value.getHours(),
                value.getMinutes(),
                value.getSeconds()
            );

            formData.append(fieldLayoutInfo.attrs.name, localDate.toISOString());
        } else if (value) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const fieldName = this.fieldContext.field.attrs.name;
        const fieldDefaultValue = this.fieldContext?.fieldMetadata?.defaultValue;
        const existingValue = this.fieldContext.data[fieldName];

        if (existingValue) {
            if (existingValue instanceof Date) {
                return existingValue;
            }
            if (typeof existingValue === "string") {
                const parsed = parseTimeStringToDate(existingValue);
                if (parsed) return parsed;
            }
        }

        return fieldDefaultValue ? new Date(fieldDefaultValue) : null;
    }

    validationSchema(): Yup.Schema {
        let schema = Yup.date().nullable();
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
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
            editWidget = 'DefaultTimeFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultTimeFormViewWidget';
        }
        const viewMode: string = this.fieldContext.viewMode;

        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" &&
                        <>
                            {editWidget &&
                                this.renderExtensionRenderMode(editWidget, formik)
                            }
                        </>
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



export const DefaultTimeFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const calendarRef = useRef<any>(null); // Reference for the Calendar component
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;

    const fieldValue = formik.values[fieldLayoutInfo.attrs.name];



    return (
        <div className="relative">
            <div className="flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                        {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                    </label>
                }
                <SolidDatePicker
                    selected={fieldValue instanceof Date ? fieldValue : typeof fieldValue === "string" ? parseTimeStringToDate(fieldValue) ?? undefined : undefined}
                    onChange={(date: Date | null) => {
                        const nextValue = (date as Date | null) ?? null;
                        const syntheticEvent = buildSyntheticChangeEvent(fieldLayoutInfo.attrs.name, nextValue, "time", nextValue ? true : undefined);
                        fieldContext.onChange(syntheticEvent, "onFieldChange");
                    }}
                    disabled={formDisabled || fieldDisabled || readOnlyPermission}
                    readOnly={readOnlyPermission}
                    timeOnly
                    showTimeSelect
                    dateFormat="HH:mm"
                    className=""
                />
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <SolidMessage severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
}


export const DefaultTimeFormViewWidget = ({
    formik,
    fieldContext,
}: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;

    const fieldName = fieldLayoutInfo.attrs.name;
    const fieldLabel =
        fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    const rawValue = formik.values[fieldName];
    const format = fieldLayoutInfo.attrs?.format


    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel !== false && (
                <p className={`${styles.fieldViewLabel} form-field-label`}>
                    {fieldLabel}
                </p>
            )}
            <p className={styles.fieldViewValue}>
                <DateFieldViewComponent value={rawValue} format={format} fallback="-"></DateFieldViewComponent>
            </p>
        </div>
    );
};
