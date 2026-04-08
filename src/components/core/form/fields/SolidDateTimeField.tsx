"use client";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import { useEffect, useRef, useState } from "react";
import * as Yup from "yup";

import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { DateFieldViewComponent } from "../../../../components/core/common/DateFieldViewComponent";

export class SolidDateTimeField implements ISolidField {
  private fieldContext: SolidFieldProps;

  constructor(fieldContext: SolidFieldProps) {
    this.fieldContext = fieldContext;
  }

  updateFormData(value: any, formData: FormData): any {
    const fieldLayoutInfo = this.fieldContext.field;
    if (value) {
      // If value is a Date object, convert to ISO string for the backend
      const valToAppend = value instanceof Date ? value.toISOString() : value;
      formData.append(fieldLayoutInfo.attrs.name, valToAppend);
    }
  }

  initialValue(): any {
    const fieldName = this.fieldContext.field.attrs.name;
    const existingValue = this.fieldContext.data[fieldName];

    // CRITICAL: Convert API string to Date object so UI shows the value
    if (existingValue) {
      const date = new Date(existingValue);
      return isNaN(date.getTime()) ? null : date;
    }

    return this.fieldContext?.fieldMetadata?.defaultValue || null;
  }

  validationSchema(): Yup.Schema {
    let schema: Yup.DateSchema<Date | null | undefined> = Yup.date();
    const fieldMetadata = this.fieldContext.fieldMetadata;
    const fieldLayoutInfo = this.fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

    if (fieldMetadata.required) {
      schema = schema.required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
    } else {
      schema = schema.nullable();
    }
    return schema;
  }

  render(formik: FormikObject) {
    const fieldLayoutInfo = this.fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || "field col-12";

    let viewWidget =
      fieldLayoutInfo.attrs.viewWidget || "DefaultDateTimeFormViewWidget";
    let editWidget =
      fieldLayoutInfo.attrs.editWidget || "DefaultDateTimeFormEditWidget";

    const viewMode: string = this.fieldContext.viewMode;

    return (
      <div className={className}>
        {viewMode === "view" &&
          this.renderExtensionRenderMode(viewWidget, formik)}
        {viewMode === "edit" &&
          this.renderExtensionRenderMode(editWidget, formik)}
      </div>
    );
  }

  renderExtensionRenderMode(widget: string, formik: FormikObject) {
    let DynamicWidget = getExtensionComponent(widget);
    const widgetProps: SolidFormFieldWidgetProps = {
      formik: formik,
      fieldContext: this.fieldContext,
    };
    return <>{DynamicWidget && <DynamicWidget {...widgetProps} />}</>;
  }
}

export const DefaultDateTimeFormEditWidget = ({
  formik,
  fieldContext,
}: SolidFormFieldWidgetProps) => {
  const fieldMetadata = fieldContext.fieldMetadata;
  const fieldLayoutInfo = fieldContext.field;
  const fieldName = fieldLayoutInfo.attrs.name;
  const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

  const readOnlyPermission = fieldContext.readOnly;
  const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
  const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
  const formDisabled =
    solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;

  // Check if Formik has an error for this field
  const isInvalid = !!(formik.touched[fieldName] && formik.errors[fieldName]);

  // Ensure the value passed to Calendar is ALWAYS a Date object or null
  const getSafeDateValue = (val: any) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <div className="relative">
      <div className="flex flex-column gap-2 mt-2">
        {fieldLayoutInfo?.attrs?.showLabel !== false && (
          <label htmlFor={fieldName} className="form-field-label">
            {fieldLabel}
            {fieldMetadata.required && <span className="text-red-500"> *</span>}
            <SolidFieldTooltip fieldContext={fieldContext} />
          </label>
        )}

        <Calendar
          id={fieldName}
          value={getSafeDateValue(formik.values[fieldName])}
          onChange={(e) => {
            // 1. Update Formik (This forces the UI to refresh)
            formik.setFieldValue(fieldName, e.value);

            // 2. Custom context logic (e.g., triggering other field updates)
            if (fieldContext.onChange) {
              fieldContext.onChange(e, "onFieldChange");
            }
          }}
          disabled={formDisabled || fieldDisabled || readOnlyPermission}
          showTime
          hourFormat="24"
          mask="99/99/9999 99:99"
          // Keep overlay open so users can select time after date
          hideOnDateTimeSelect={false}
          appendTo="self"
          className={isInvalid ? "p-invalid w-full" : "w-full"}
          showIcon
          placeholder="Select Date and Time"
        />
      </div>

      {isInvalid && (
        <div className="mt-1">
          <Message
            severity="error"
            text={formik.errors[fieldName]?.toString()}
          />
        </div>
      )}
    </div>
  );
};

export const DefaultDateTimeFormViewWidget = ({
  formik,
  fieldContext,
}: SolidFormFieldWidgetProps) => {
  const fieldMetadata = fieldContext.fieldMetadata;
  const fieldLayoutInfo = fieldContext.field;
  const fieldName = fieldLayoutInfo.attrs.name;
  const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
  const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

  const rawValue = formik.values[fieldName];

  const format = fieldLayoutInfo.attrs?.format || "MM/DD/YYYY HH:mm";

  return (
    <div className="mt-2 flex flex-column gap-2">
      {showFieldLabel !== false && (
        <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
      )}
      <div className="m-0">
        <DateFieldViewComponent
          value={rawValue}
          format={format}
          fallback="-"
          showTime={true}
        />
      </div>
    </div>
  );
};
