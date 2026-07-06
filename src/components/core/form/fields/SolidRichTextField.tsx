
import React, { useEffect } from "react";
import { SolidMessage } from "../../../shad-cn-ui/SolidMessage";
import { SolidRichTextEditor } from "../../../shad-cn-ui/SolidRichTextEditor";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import styles from "./solidFields.module.css";

const normalizeQuillRichTextHtml = (html: string): string => {
    if (!html || typeof document === "undefined") {
        return html ?? "";
    }

    const template = document.createElement("template");
    template.innerHTML = html;

    const orderedLists = Array.from(template.content.querySelectorAll("ol")).reverse();

    orderedLists.forEach((orderedList) => {
        const listItems = Array.from(orderedList.children).filter(
            (child): child is HTMLLIElement => child instanceof HTMLLIElement,
        );

        if (listItems.length === 0) {
            return;
        }

        const hasBulletItems = listItems.some((item) => item.getAttribute("data-list") === "bullet");
        if (!hasBulletItems) {
            listItems.forEach((item) => item.removeAttribute("data-list"));
            return;
        }

        const replacementFragment = document.createDocumentFragment();
        let currentList: HTMLOListElement | HTMLUListElement | null = null;
        let currentListType: "ordered" | "bullet" | null = null;

        const appendCurrentList = () => {
            if (currentList) {
                replacementFragment.appendChild(currentList);
                currentList = null;
                currentListType = null;
            }
        };

        Array.from(orderedList.childNodes).forEach((node) => {
            if (!(node instanceof HTMLLIElement)) {
                appendCurrentList();
                replacementFragment.appendChild(node);
                return;
            }

            const listType = node.getAttribute("data-list") === "bullet" ? "bullet" : "ordered";
            if (!currentList || currentListType !== listType) {
                appendCurrentList();
                currentList = document.createElement(listType === "bullet" ? "ul" : "ol");
                currentListType = listType;
            }

            node.removeAttribute("data-list");
            currentList.appendChild(node);
        });

        orderedList.replaceWith(replacementFragment);
    });

    return template.innerHTML;
};

export class SolidRichTextField implements ISolidField {

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
        return this.fieldContext.data[this.fieldContext.field.attrs.name];
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
            schema = schema.min(fieldMetadata.min, ERROR_MESSAGES.FIELD_MINIMUM_CHARACTER(fieldLabel,fieldMetadata.min));
        }
        if (fieldMetadata.max && fieldMetadata.max > 0) {
            schema = schema.max(fieldMetadata.max, ERROR_MESSAGES.FIELD_MAXIMUM_CHARACTER(fieldLabel,fieldMetadata.max));
        }
        // 3. regular expression
        if (fieldMetadata.regexPattern) {
            const regexPatternNotMatchingErrorMsg = fieldMetadata.regexPatternNotMatchingErrorMsg ?? `${fieldLabel} has invalid data.`
            schema = schema.matches(fieldMetadata.regexPattern, regexPatternNotMatchingErrorMsg);
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';


        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultRichTextFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultRichTextFormViewWidget';
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



export const DefaultRichTextFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const fieldName = fieldLayoutInfo.attrs.name;
    const fieldValue = formik.values[fieldName] || "";
    const normalizedFieldValue = normalizeQuillRichTextHtml(fieldValue);

    useEffect(() => {
        if (fieldValue === normalizedFieldValue) {
            return;
        }

        fieldContext.onChange(
            {
                target: {
                    name: fieldName,
                    value: normalizedFieldValue,
                    type: "text",
                },
            } as any,
            "onFieldChange"
        );
    }, [fieldContext, fieldName, fieldValue, normalizedFieldValue]);


    return (
        <div className={`${styles.fieldWrapper} relative`}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }
            <SolidRichTextEditor
                readOnly={formReadonly || fieldReadonly || readOnlyPermission || formDisabled || fieldDisabled}
                id={fieldName}
                value={normalizedFieldValue}
                onChange={(value) => {
                    const normalizedValue = normalizeQuillRichTextHtml(value ?? "");
                    fieldContext.onChange(
                        {
                            target: {
                                name: fieldName,
                                value: normalizedValue,
                                type: "text",
                            },
                        } as any,
                        "onFieldChange"
                    );
                }}
                className="solid-custom-editor"
                style={{ minHeight: 180 }}
            />
            {isFormFieldValid(formik, fieldName) && (
                <p className={styles.fieldError}>{formik?.errors[fieldName]?.toString()}</p>
            )}
        </div>
    );
}

export const DefaultRichTextFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel != false &&
                <p className={`${styles.fieldViewLabel} form-field-label`}>{fieldLabel}</p>
            }
            <div
                className="solid-custom-editor solid-custom-editor-view"
                id={fieldLabel}
                dangerouslySetInnerHTML={{ __html: formik.values[fieldLayoutInfo.attrs.name] || "" }}
            />
        </div>
    );
}
