"use client";
import { useEffect, useState } from "react";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import { SelectButton } from "primereact/selectbutton";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { RadioButton } from "primereact/radiobutton";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { AvatarWidget } from "@/components/core/common/AvatarWidget";
import MarkdownViewer from "@/components/common/MarkdownViewer";
import { Divider } from "primereact/divider";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";

export const SolidAiInteractionMetadataFieldFormWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const userKeyFieldName = fieldMetadata.relationModel?.userKeyField?.name;
    const value = formik.values[fieldLayoutInfo.attrs.name];

    return (
        <div className="mt-2 flex-column">
            <p className="m-0 form-field-label font-medium">{fieldLabel}</p>


            <div className="solid-layout-accordion">
                <Accordion multiple expandIcon="pi pi-chevron-down" collapseIcon="pi pi-chevron-up" activeIndex={[0]}>
                    {value && value?.chunks?.map((c: any) => {
                        let processedText = c.text;
                        if (processedText) {
                            processedText = processedText.replace("Document Title:", "", 1);
                            processedText = processedText.replace("Text:", "", 1);
                        }
                        return (
                            <AccordionTab key={c.id} header={
                                <div className="flex justify-between items-center w-full">
                                    <span style={{ paddingTop: "5px" }} className="font-medium">{c?.metadata?.path}</span>
                                    <Button
                                        icon="pi pi-external-link"
                                        rounded
                                        text
                                        outlined
                                        style={{
                                            height: "1.5rem"
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent accordion toggle
                                            const cleanPath = (c?.metadata?.path || "").replace(/\.md$/, "");
                                            const url = `https://docs.solidxai.com/docs/${cleanPath}`; // or any base path you need
                                            window.open(url, "_blank"); // open in new tab
                                        }}
                                    />
                                </div>

                            }>
                                <div key={c.id} className="shadow-1 bg-bluegray-50">
                                    <MarkdownViewer data={processedText}></MarkdownViewer>
                                </div>
                            </AccordionTab>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
