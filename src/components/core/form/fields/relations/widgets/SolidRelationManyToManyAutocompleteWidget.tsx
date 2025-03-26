"use client";
import { SolidRelationManyToManyFieldWidgetProps } from "@/types/solid-core";
import { AutoComplete } from "primereact/autocomplete";
import { useState } from "react";
import { Button } from "primereact/button";
import { useRelationEntityHandler } from "./helpers/useRelationEntityHandler";
import { InlineRelationEntityDialog } from "./helpers/InlineRelationEntityDialog";

export const SolidRelationManyToManyAutocompleteWidget = ({ formik, fieldContext }: SolidRelationManyToManyFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;
    const readOnly = fieldLayoutInfo.attrs?.readOnly;

    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);
    const { autoCompleteItems, fetchRelationEntities, addNewRelation } = useRelationEntityHandler({ fieldContext, formik });
  
    const onChange = (e: any) => {
      formik.setFieldValue(fieldContext.field.attrs.name, e.value);
    };

    return (
        <div className={className}>
            <div className="mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                        {fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    </label>
                }
                <div className="flex align-items-center gap-3 mt-2">
                    <AutoComplete
                        readOnly={readOnly || readOnlyPermission}
                        disabled={disabled || readOnlyPermission}
                        multiple
                        {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                        id={fieldLayoutInfo.attrs.name}
                        field="label"
                        value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                        dropdown={!readOnlyPermission}
                        suggestions={autoCompleteItems}
                        completeMethod={(e) => fetchRelationEntities(e.query)}
                        onChange={onChange}
                        className="solid-standard-autocomplete w-full"
                    />
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
                </div>
            </div>
        </div>
    );
}
