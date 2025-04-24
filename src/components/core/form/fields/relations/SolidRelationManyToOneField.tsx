'use client';
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Message } from "primereact/message";
import qs from "qs";
import { useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { camelCase, capitalize } from "lodash";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Panel } from "primereact/panel";
import SolidFormView from "../../SolidFormView";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";


export class SolidRelationManyToOneField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {

        const manyToOneFieldData = this.fieldContext.data[this.fieldContext.field.attrs.name];
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const userKeyField = fieldMetadata?.relationModel?.userKeyField?.name;
        const manyToOneColVal = manyToOneFieldData ? manyToOneFieldData[userKeyField] : '';
        if (manyToOneColVal) {
            return { label: manyToOneColVal || '', value: manyToOneFieldData?.id || '' };
        }
        return {}
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value?.value) {
            formData.append(`${fieldLayoutInfo.attrs.name}Id`, value.value);
        }
    }

    validationSchema(): Schema {
        let schema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema.required(`${fieldLabel} is required.`);
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
            editWidget = 'DefaultRelationManyToOneFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultRelationManyToOneFormViewWidget';
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
                            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                                <div className="absolute mt-1">
                                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                                </div>
                            )}

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

export const DefaultRelationManyToOneFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);

    // auto complete specific code. 
    const entityApi = createSolidEntityApi(fieldMetadata.relationCoModelSingularName);
    const { useLazyGetSolidEntitiesQuery } = entityApi;
    const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const whereClause = fieldLayoutInfo.attrs.whereClause;

    const [autoCompleteItems, setAutoCompleteItems] = useState([]);
    const autoCompleteSearch = async (event: AutoCompleteCompleteEvent) => {

        // Get the list view layout & metadata first. 
        const queryData = {
            offset: 0,
            limit: 10,
            filters: {
                [fieldMetadata?.relationModel?.userKeyField?.name]: {
                    '$containsi': event.query
                }
            }
        };

        let autocompleteQs = qs.stringify(queryData, {
            encodeValuesOnly: true,
        });
        if (whereClause) {
            autocompleteQs = `${autocompleteQs}&${whereClause}`;
        }
        // TODO: do error handling here, possible errors like modelname is incorrect etc...
        const autocompleteResponse = await triggerGetSolidEntities(autocompleteQs);

        // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
        const autocompleteData = autocompleteResponse.data;

        if (autocompleteData) {
            const autoCompleteItems = autocompleteData.records.map((item: any) => {
                return {
                    label: item[fieldMetadata?.relationModel?.userKeyField?.name],
                    value: item['id']
                }
            });
            setAutoCompleteItems(autoCompleteItems);
        }
    }

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const customCreateHandler = (values: any) => {
        const currentRelationData = formik.values[fieldLayoutInfo.attrs.name] || [];
        const jsonValues = Object.fromEntries(values.entries());
        const updatedRelationData = [
            ...currentRelationData,
            {
                label: jsonValues[fieldMetadata?.relationModel?.userKeyField?.name],
                value: "new",
                original: jsonValues,
            },
        ];

        formik.setFieldValue(fieldLayoutInfo.attrs.name, updatedRelationData);

    }
    return (
        <div className="mt-4 relative">
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                </label>
            }
            <div className="flex align-items-center gap-3 mt-2">
                <AutoComplete
                    readOnly={formReadonly || fieldReadonly || readOnlyPermission}
                    disabled={formDisabled || fieldDisabled || readOnlyPermission}
                    {...formik.getFieldProps(fieldLayoutInfo.attrs.name)}
                    id={fieldLayoutInfo.attrs.name}
                    field="label"
                    value={formik.values[fieldLayoutInfo.attrs.name] || ''}
                    dropdown={!readOnlyPermission}
                    suggestions={autoCompleteItems}
                    completeMethod={autoCompleteSearch}
                    onChange={formik.handleChange}
                    onFocus={(e) => e.target.select()}
                    className="w-full solid-standard-autocomplete"
                />
                {fieldLayoutInfo.attrs.inlineCreate === "true" && readOnlyPermission === false &&
                    <RenderSolidFormEmbededView formik={formik} fieldContext={fieldContext} customCreateHandler={customCreateHandler} visibleCreateRelationEntity={visibleCreateRelationEntity} setvisibleCreateRelationEntity={setvisibleCreateRelationEntity}></RenderSolidFormEmbededView>
                }
            </div>

        </div>
    );
}

export const RenderSolidFormEmbededView = ({ formik, fieldContext, customCreateHandler, visibleCreateRelationEntity, setvisibleCreateRelationEntity }: any) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-6 flex flex-column gap-2 mt-4';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

    const params = {
        moduleName: fieldContext.fieldMetadata.relationModelModuleName,
        id: "new",
        embeded: true,
        layout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
        customCreateHandler: ((values: any) => {
            setvisibleCreateRelationEntity(false);
            customCreateHandler(values)
        }),
        inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
        handlePopupClose: (() => {
            setvisibleCreateRelationEntity(false);
        }),
        modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName)
    }
    return (
        <div >
            <Button
                icon="pi pi-plus"
                rounded
                outlined
                aria-label="Filter"
                type="button"
                size="small"
                onClick={() => setvisibleCreateRelationEntity(true)}
                className="custom-add-button"
            />
            <Dialog
                header=""
                showHeader={false}
                visible={visibleCreateRelationEntity}
                style={{ width: fieldLayoutInfo?.attrs?.inlineCreateLayout?.attrs?.width ?? "60vw" }}
                onHide={() => {
                    if (!visibleCreateRelationEntity) return;
                    setvisibleCreateRelationEntity(false);
                }}
                className="solid-dialog"
            >
                <SolidFormView {...params} />

            </Dialog>
        </div>
    )
}


export const DefaultRelationManyToOneFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const value = formik.values[fieldLayoutInfo.attrs.name];
    return (
        <div className="mt-2 flex-column gap-2">
            <p className="m-0 form-field-label font-medium">{fieldLabel}</p>
            <p className="m-0">{value && value.label}</p>
        </div>
    );
}

