"use client";

import { getExtensionComponent } from "@solid-ui/helpers/registry";
import { FormikObject, SolidFieldProps } from "./fields/ISolidField";
import { SolidFormFieldWidgetProps } from "@solid-ui/types/solid-core";


export type SolidFormFieldRenderExtensionType ={
    widget: any;
    formik: FormikObject;
    fieldContext: SolidFieldProps;
}

export const SolidFormFieldRenderExtension = ({ widget, formik, fieldContext }: SolidFormFieldRenderExtensionType) => {

    let DynamicWidget = getExtensionComponent(widget);
    const widgetProps: SolidFormFieldWidgetProps = {
        formik: formik,
        fieldContext: fieldContext,
    }
    return (
        <>
            {DynamicWidget && <DynamicWidget {...widgetProps} />}
        </>
    )
};
