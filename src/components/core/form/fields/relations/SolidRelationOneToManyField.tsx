'use client';
import { SolidListView } from "@/components/core/list/SolidListView";
import { camelCase } from "lodash";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import SolidFormView from "../../SolidFormView";
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { usePathname } from "next/navigation";
import { getExtensionComponent } from "@/helpers/registry";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { Message } from "primereact/message";
import FieldMetaData from "@/components/core/model/FieldMetaData";
import { Chip } from "primereact/chip";


export class SolidRelationOneToManyField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {

        // const manyToOneFieldData = this.fieldContext.data[this.fieldContext.field.attrs.name];
        // const fieldMetadata = this.fieldContext.fieldMetadata;
        // const userKeyField = fieldMetadata.relationModel.userKeyField.name;
        // const manyToOneColVal = manyToOneFieldData ? manyToOneFieldData[userKeyField] : '';

        // return { label: manyToOneColVal || '', value: manyToOneFieldData?.id || '' };

        return '';
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value) {
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
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        const userKeyFieldName = fieldMetadata.relationModel?.userKeyField?.name;

        let DynamicWidget = getExtensionComponent("SolidFormFieldRelationViewModeWidget");
        const widgetProps = {
            label: fieldLabel,
            value: (this.fieldContext.data?.[fieldLayoutInfo.attrs.name] || []).map(
                (item: any) => ({ label: item[userKeyFieldName] ?? '' })
            ),
            layout: fieldLayoutInfo
        }

        DefaultRelationOneToManyFormEditWidget


        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultRelationOneToManyFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultRelationOneToManyFormViewWidget';
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


export const DefaultRelationOneToManyFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;

    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);
    const [listViewParams, setListViewParams] = useState<any>()
    const [formViewParams, setformViewParams] = useState<any>()
    const [refreshList, setRefreshList] = useState(false); // Added state for rerender
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const pathname = usePathname();
    const lastPathSegment = pathname.split('/').pop();
    const userKeyField: any = Object.entries(fieldContext.solidFormViewMetaData.data.solidFieldsMetadata).find(([_, value]: any) => value.isUserKey)?.[0];

    const handlePopupOpen = (id: any) => {
        const formviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            id: id,
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            parentData: userKeyField ? {[userKeyField] : {label: fieldContext.data[userKeyField], value: fieldContext.data['id']}} : {},
        }
        setformViewParams(formviewparams);
        setvisibleCreateRelationEntity(true);

    }

    const handlePopupClose = () => {
        setvisibleCreateRelationEntity(false);
        setRefreshList((prev) => !prev);
        const customFilter = fieldContext.fieldMetadata.relationCoModelFieldName ? fieldContext.fieldMetadata.relationCoModelFieldName : `${fieldContext.modelName}`
        const lisviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false ? true : false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data ? fieldContext?.data?.id : 'new',
            customFilter: {
                [customFilter]: {
                    id: {
                        $eq: fieldContext.data ? fieldContext?.data?.id : -1
                    }
                }
            }
        }
        setListViewParams(lisviewparams)
    }
    //Intial Params 
    useEffect(() => {

        const customFilter = fieldContext.fieldMetadata.relationCoModelFieldName ? fieldContext.fieldMetadata.relationCoModelFieldName : `${fieldContext.modelName}`
        const listviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false ? true : false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data ? fieldContext?.data?.id : 'new',
            customFilter: {
                [customFilter]: {
                    id: {
                        $eq: fieldContext.data ? fieldContext?.data?.id : -1
                    }
                }
            }
        }
        setListViewParams(listviewparams);
        const formviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            id: "new",
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            parentData: userKeyField ? {[userKeyField] : {label: fieldContext.data[userKeyField], value: fieldContext.data['id']}} : {}
        }
        setformViewParams(formviewparams)

    }, [readOnlyPermission])

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div>
            {/* <div className="justify-content-center align-items-center"> */}
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                </label>
            }

            {lastPathSegment === 'new' && <p>Please save the {solidFormViewMetaData.data.solidView.model.displayName} to be able to save {fieldMetadata.displayName}</p>}
            {listViewParams && lastPathSegment !== 'new' &&
                <SolidListView key={refreshList.toString()}  {...listViewParams} handlePopUpOpen={handlePopupOpen} />
            }
            {readOnlyPermission !== true &&
                <RenderSolidFormEmbededView formik={formik} fieldContext={fieldContext} visibleCreateRelationEntity={visibleCreateRelationEntity} setvisibleCreateRelationEntity={setvisibleCreateRelationEntity} formViewParams={formViewParams} handlePopupClose={handlePopupClose}></RenderSolidFormEmbededView>
            }

        </div>
    );
}


export const DefaultRelationOneToManyFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;

    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);
    const [listViewParams, setListViewParams] = useState<any>()
    const [formViewParams, setformViewParams] = useState<any>()
    const [refreshList, setRefreshList] = useState(false); // Added state for rerender
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const pathname = usePathname();
    const lastPathSegment = pathname.split('/').pop();

    const handlePopupOpen = (id: any) => {
        const formviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            id: id,
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName)
        }
        setformViewParams(formviewparams);
        setvisibleCreateRelationEntity(true);

    }

    const handlePopupClose = () => {
        setvisibleCreateRelationEntity(false);
        setRefreshList((prev) => !prev);
        const customFilter = fieldContext.fieldMetadata.relationCoModelFieldName ? fieldContext.fieldMetadata.relationCoModelFieldName : `${fieldContext.modelName}`
        const lisviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false ? true : false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data ? fieldContext?.data?.id : 'new',
            customFilter: {
                [customFilter]: {
                    id: {
                        $eq: fieldContext.data ? fieldContext?.data?.id : -1
                    }
                }
            }
        }
        setListViewParams(lisviewparams)
    }
    //Intial Params 
    useEffect(() => {

        const customFilter = fieldContext.fieldMetadata.relationCoModelFieldName ? fieldContext.fieldMetadata.relationCoModelFieldName : `${fieldContext.modelName}`
        const listviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false ? true : false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data ? fieldContext?.data?.id : 'new',
            customFilter: {
                [customFilter]: {
                    id: {
                        $eq: fieldContext.data ? fieldContext?.data?.id : -1
                    }
                }
            }
        }
        setListViewParams(listviewparams);
        const formviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            id: "new",
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
        }
        setformViewParams(formviewparams)

    }, [readOnlyPermission])

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    return (
        <div>
            {/* <div className="justify-content-center align-items-center"> */}
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                </label>
            }

            {lastPathSegment === 'new' && <p>Please save the {solidFormViewMetaData.data.solidView.model.displayName} to be able to save {fieldMetadata.displayName}</p>}
            {listViewParams && lastPathSegment !== 'new' &&
                <SolidListView key={refreshList.toString()}  {...listViewParams} handlePopUpOpen={handlePopupOpen} />
            }
            {readOnlyPermission !== true &&
                <RenderSolidFormEmbededView formik={formik} fieldContext={fieldContext} visibleCreateRelationEntity={visibleCreateRelationEntity} setvisibleCreateRelationEntity={setvisibleCreateRelationEntity} formViewParams={formViewParams} handlePopupClose={handlePopupClose}></RenderSolidFormEmbededView>
            }

        </div>
    );
}


export const RenderSolidFormEmbededView = ({ formik, fieldContext, customCreateHandler, visibleCreateRelationEntity, setvisibleCreateRelationEntity, formViewParams, handlePopupClose }: any) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;


    return (
        <div className="many-to-many-add" >
            {/* <Button icon="pi pi-plus"
                rounded
                outlined
                aria-label="Filter"
                type="button"
                onClick={() => setvisibleCreateRelationEntity(true)}
            /> */}
            <Dialog
                header=""
                showHeader={false}
                visible={visibleCreateRelationEntity}
                className="solid-dialog"
                style={{ width: fieldLayoutInfo?.attrs?.inlineCreateLayout?.attrs?.width ?? "40vw" }}
                onHide={() => {
                    if (!visibleCreateRelationEntity) return;
                    setvisibleCreateRelationEntity(false);
                }}
            >
                {formViewParams &&
                    < SolidFormView {...formViewParams} handlePopupClose={handlePopupClose} />
                }
            </Dialog>
        </div>
    )
}