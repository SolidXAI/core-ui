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
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);
        const [listViewParams, setListViewParams] = useState<any>()
        const [formViewParams, setformViewParams] = useState<any>()
        const [refreshList, setRefreshList] = useState(false); // Added state for rerender
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = this.fieldContext.readOnly;
        const pathname = usePathname();
        const lastPathSegment = pathname.split('/').pop();

        const handlePopupOpen = (id: any) => {
            const formviewparams = {
                moduleName: this.fieldContext.fieldMetadata.relationModelModuleName,
                id: id,
                embeded: true,
                isCustomCreate: false,
                customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
                modelName: camelCase(this.fieldContext.fieldMetadata.relationCoModelSingularName)
            }
            setformViewParams(formviewparams);
            setvisibleCreateRelationEntity(true);

        }

        const handlePopupClose = () => {
            setvisibleCreateRelationEntity(false);
            setRefreshList((prev) => !prev);
            const customFilter = this.fieldContext.fieldMetadata.relationCoModelFieldName ? this.fieldContext.fieldMetadata.relationCoModelFieldName : `${this.fieldContext.modelName}`
            const lisviewparams = {
                moduleName: this.fieldContext.fieldMetadata.relationModelModuleName,
                modelName: camelCase(this.fieldContext.fieldMetadata.relationCoModelSingularName),
                inlineCreate: readOnlyPermission === false ? true : false,
                customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
                embeded: true,
                id: this.fieldContext.data ? this?.fieldContext?.data?.id : 'new',
                customFilter: {
                    [customFilter]: {
                        id: {
                            $eq: this.fieldContext.data ? this?.fieldContext?.data?.id : -1
                        }
                    }
                }
            }
            setListViewParams(lisviewparams)
        }
        //Intial Params 
        useEffect(() => {

            const customFilter = this.fieldContext.fieldMetadata.relationCoModelFieldName ? this.fieldContext.fieldMetadata.relationCoModelFieldName : `${this.fieldContext.modelName}`
            const listviewparams = {
                moduleName: this.fieldContext.fieldMetadata.relationModelModuleName,
                modelName: camelCase(this.fieldContext.fieldMetadata.relationCoModelSingularName),
                inlineCreate: readOnlyPermission === false ? true : false,
                customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
                embeded: true,
                id: this.fieldContext.data ? this?.fieldContext?.data?.id : 'new',
                customFilter: {
                    [customFilter]: {
                        id: {
                            $eq: this.fieldContext.data ? this?.fieldContext?.data?.id : -1
                        }
                    }
                }
            }
            setListViewParams(listviewparams);
            const formviewparams = {
                moduleName: this.fieldContext.fieldMetadata.relationModelModuleName,
                id: "new",
                embeded: true,
                isCustomCreate: false,
                customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
                modelName: camelCase(this.fieldContext.fieldMetadata.relationCoModelSingularName),
            }
            setformViewParams(formviewparams)

        }, [readOnlyPermission])

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const viewMode: string = this.fieldContext.viewMode;
        let DynamicWidget = getExtensionComponent("SolidFormFieldRelationViewModeWidget");
        const widgetProps = {
            label: fieldLabel,
            value: formik.values[fieldLayoutInfo.attrs.name],
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
                        <div className={className}>
                            {/* <div className="justify-content-center align-items-center"> */}
                            {showFieldLabel != false &&
                                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                                    {/* &nbsp;{fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                                </label>
                            }

                            {/* </div>
                <br></br> */}
                            {lastPathSegment === 'new' && <p>Please save the {solidFormViewMetaData.data.solidView.model.displayName} to be able to save {fieldMetadata.displayName}</p>}
                            {listViewParams && lastPathSegment !== 'new' &&
                                <SolidListView key={refreshList.toString()}  {...listViewParams} handlePopUpOpen={handlePopupOpen} />
                            }
                            {readOnlyPermission !== true &&
                                this.renderSolidFormEmbededView(visibleCreateRelationEntity, setvisibleCreateRelationEntity, formViewParams, handlePopupClose)}

                        </div>
                    )}
            </>
        );

    }


    renderSolidFormEmbededView(visibleCreateRelationEntity: any, setvisibleCreateRelationEntity: any, formViewParams: any, handlePopupClose: any) {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
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
}

