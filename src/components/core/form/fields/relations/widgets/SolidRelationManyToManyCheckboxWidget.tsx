"use client";
import { SolidRelationManyToManyFieldWidgetProps } from "@/types/solid-core";
import { capitalize } from "lodash";
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { useRelationEntityHandler } from "./helpers/useRelationEntityHandler";
import { InlineRelationEntityDialog } from "./helpers/InlineRelationEntityDialog";

export const SolidRelationManyToManyCheckboxWidget = ({formik, fieldContext }: SolidRelationManyToManyFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    const readOnlyPermission = fieldContext.readOnly;
    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);
    const { autoCompleteItems, fetchRelationEntities, addNewRelation } = useRelationEntityHandler({ fieldContext, formik });
  
    useEffect(() => {
      fetchRelationEntities();
    }, []);

    const handleCheckboxChange = (e: any) => {
        if (formik.values[fieldLayoutInfo.attrs.name].some((item: any) => item.value === e.value)) {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, formik.values[fieldLayoutInfo.attrs.name].filter((s: any) => s.value !== e.value));
        } else {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, [...formik.values[fieldLayoutInfo.attrs.name], e]);
        }
    };

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className}>
                <div className="flex align-items-center gap-3">
                    {showFieldLabel != false &&
                        <label className="form-field-label">
                            {capitalize(fieldLayoutInfo.attrs.name)}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        </label>
                    }
                    {fieldContext.field.attrs.inlineCreate && (
                        <>
                        <Button
                            icon="pi pi-plus"
                            rounded
                            outlined
                            aria-label="Filter"
                            type="button"
                            size="small"
                            onClick={() => setVisibleCreateDialog(true)}
                            className="custom-add-button"
                        />
                        <InlineRelationEntityDialog
                            visible={visibleCreateDialog}
                            setVisible={setVisibleCreateDialog}
                            fieldContext={fieldContext}
                            onCreate={addNewRelation}
                        />
                        </>
                    )}
                    {/* <div className="many-to-many-add" >
                        <Button icon="pi pi-plus"
                            rounded
                            outlined
                            aria-label="Filter"
                            type="button"
                            onClick={() => autoCompleteSearch()}
                        />
                    </div> */}
                </div>
                <div>
                    {options.togglerElement}
                </div>
            </div>
        );
    };
    return (
        <div>

            <Panel toggleable headerTemplate={headerTemplate}>
                <div className="formgrid grid">
                    {autoCompleteItems && autoCompleteItems.map((a: any, i: number) => {
                        return (
                            <div key={a.label} className={`field col-6 flex gap-2 ${i >= 2 ? 'mt-3' : ''}`}>
                                <Checkbox
                                    readOnly={readOnlyPermission}
                                    inputId={a.label}
                                    checked={formik.values[fieldLayoutInfo.attrs.name].some((item: any) => item.label === a.label)}
                                    onChange={() => handleCheckboxChange(a)}
                                />
                                <label htmlFor={a.label} className="form-field-label m-0"> {a.label}</label>
                            </div>
                        )
                    })}
                </div>
            </Panel>
        </div>
    )
        
}
