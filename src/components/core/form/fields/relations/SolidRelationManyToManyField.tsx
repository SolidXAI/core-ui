'use client';
import { Message } from "primereact/message";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidRelationManyToManyFieldWidgetProps } from "@/types/solid-core";




export class SolidRelationManyToManyField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {

        const manyToManyFieldData = this.fieldContext.data[this.fieldContext.field.attrs.name];
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const userKeyField = fieldMetadata?.relationModel?.userKeyField?.name;
        if (manyToManyFieldData) {
            return manyToManyFieldData.map((e: any) => {
                const manyToManyColVal = e[userKeyField] || '';
                return {
                    label: manyToManyColVal,
                    value: e?.id || '',
                    original: e
                };
            });
        }

        return [];
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value && value.length > 0) {
            const shouldUseOriginal = value.every((item: any) => item.original && item.original.id);

            value.forEach((item: any, index: number) => {
                if (shouldUseOriginal) {
                    formData.append(
                        `${fieldLayoutInfo.attrs.name}Ids[${index}]`,
                        item.value
                    );
                } else {
                    formData.append(
                        `${fieldLayoutInfo.attrs.name}[${index}]`,
                        JSON.stringify(item.original)
                    );
                }
            });
            if (shouldUseOriginal) {
                formData.append(`${fieldLayoutInfo.attrs.name}Command`, "set")
            } else {
                formData.append(`${fieldLayoutInfo.attrs.name}Command`, "update")

            }

        }
    }

    validationSchema(): Schema {
        let schema = Yup.array();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema
                .min(1, `You must select at least one ${fieldLabel}.`)
                .required(`${fieldLabel} is required.`);
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const [visibleCreateRelationEntity, setVisibleCreateRelationEntity] = useState(false);
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        let widget = fieldLayoutInfo.attrs.widget;
        if (!widget) {
            widget = 'autocomplete';
        }

        const viewMode: string = this.fieldContext.viewMode;
        let DynamicWidget = getExtensionComponent("SolidFormFieldRelationViewModeWidget");
        const widgetProps = {
            label: fieldLabel,
            value: formik.values[fieldLayoutInfo.attrs.name],
            layout: fieldLayoutInfo
        }

        return (

            <>
                {viewMode === "view" &&
                    <div className={className}>
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </div>
                }
                {viewMode === "edit" &&
                    (
                        <>
                            {widget &&
                                this.renderExtensionRenderMode(widget, formik, visibleCreateRelationEntity, setVisibleCreateRelationEntity)
                            }
                            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                                <div className="absolute mt-1">
                                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                                </div>
                            )}
                        </>
                    )}
            </>
        );
    }

    renderExtensionRenderMode(widgetName: string, formik: FormikObject, visibleCreateRelationEntity: any, setvisibleCreateRelationEntity: any) {
        let DynamicWidget = getExtensionComponent(widgetName);
        if (!DynamicWidget) {
            DynamicWidget = getExtensionComponent('autocomplete');
        }
        const widgetProps: SolidRelationManyToManyFieldWidgetProps = {
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
