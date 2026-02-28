
import { Message } from "primereact/message";
import { useEffect, useState } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { getExtensionComponent } from "../../../../../helpers/registry";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { SolidFormFieldWidgetProps } from "../../../../../types/solid-core";
import { useRelationEntityHandler } from "./widgets/helpers/useRelationEntityHandler";
import { InlineRelationEntityDialog } from "./widgets/helpers/InlineRelationEntityDialog";
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { SolidFieldTooltip } from "../../../../../components/common/SolidFieldTooltip";
import qs from 'qs';
// import Handlebars from "handlebars/dist/handlebars";
import * as Handlebars from "handlebars";
import { ERROR_MESSAGES } from "../../../../../constants/error-messages";
import { useRouter } from "@/hooks/useRouter";
import { usePathname } from "@/hooks/usePathname";
import { camelCase, capitalize } from "lodash";
import { SolidListView } from "@/components/core/list/SolidListView";
import { RenderSolidFormEmbededView } from "./SolidRelationManyToOneField";
import { Dialog } from "primereact/dialog";

export type FormViewParams = {
    moduleName: any;
    id: any;
    embeded: any;
    isCustomCreate: any;
    customLayout: any;
    modelName: any;
    parentFieldName?: any;
    parentData: any;
    onEmbeddedFormSave: any;
    inlineCreateAutoSave: any;
    customCreateHandler?: any;
    handlePopupClose?: any
}



export class SolidRelationManyToManyField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {

        // const manyToManyFieldData = this.fieldContext.data[this.fieldContext.field.attrs.name];
        // const fieldMetadata = this.fieldContext.fieldMetadata;
        // const userKeyField = fieldMetadata?.relationModel?.userKeyField?.name;
        // if (manyToManyFieldData) {
        //     return manyToManyFieldData.map((e: any) => {
        //         const manyToManyColVal = e[userKeyField] || '';
        //         return {
        //             label: manyToManyColVal,
        //             value: e?.id || '',
        //             original: e
        //         };
        //     });
        // }
        return [];
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        // if empty then clear the field
        // if (value && value.length === 0) {
        //     formData.append(`${fieldLayoutInfo.attrs.name}Command`, "clear");
        // }
        // if (value && value.length > 0) {
        //     const shouldUseOriginal = value.every((item: any) => item.original && item.original.id);

        //     value.forEach((item: any, index: number) => {
        //         if (shouldUseOriginal) {
        //             formData.append(
        //                 `${fieldLayoutInfo.attrs.name}Ids[${index}]`,
        //                 item.value
        //             );
        //         } else {
        //             formData.append(
        //                 `${fieldLayoutInfo.attrs.name}[${index}]`,
        //                 JSON.stringify(item.original)
        //             );
        //         }
        //     });
        //     if (shouldUseOriginal) {
        //         formData.append(`${fieldLayoutInfo.attrs.name}Command`, "set")
        //     } else {
        //         formData.append(`${fieldLayoutInfo.attrs.name}Command`, "update")

        //     }

        // }
    }

    validationSchema(): Yup.Schema {
        let schema = Yup.array();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        // 1. required 
        if (fieldMetadata.required) {
            schema = schema
                .min(1, ERROR_MESSAGES.SELECT_ATLEAST_ONE(fieldLabel))
                .required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultRelationManyToManyAutoCompleteFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultRelationManyToManyListFormEditWidget';
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



export const DefaultRelationManyToManyAutoCompleteFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;
    const readOnly = fieldLayoutInfo.attrs?.readOnly;
    const whereClause = fieldLayoutInfo.attrs.whereClause;

    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);
    const { autoCompleteItems, fetchRelationEntities, populateFormikWithRelatedEntities, addNewRelation, handleRelationUpdate } = useRelationEntityHandler({ fieldContext, formik });
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    // const onChange = (e: any) => {
    //     formik.setFieldValue(fieldContext.field.attrs.name, e.value);
    // };

    useEffect(() => {
        populateFormikWithRelatedEntities();
    }, [formik.values?.id]);


    const autoCompleteSearch = async (event: AutoCompleteCompleteEvent) => {
        const queryData: any = {
            offset: 0,
            limit: 1000,
            filters: {
                $and: [
                    {
                        [fieldMetadata?.relationModel?.userKeyField?.name]: {
                            [fieldLayoutInfo?.attrs?.autocompleteMatchMode || '$containsi']: event.query
                        }
                    }
                ]
            }
        };
        let fixedFilterToBeApplied = false;
        let fixedFilterParsed = false;

        if (fieldMetadata?.relationFieldFixedFilter || fieldLayoutInfo?.attrs?.whereClause) {
            const convertedFixedFilter = fieldLayoutInfo?.attrs?.whereClause ? fieldLayoutInfo?.attrs?.whereClause : fieldMetadata?.relationFieldFixedFilter;
            fixedFilterToBeApplied = true;
            const fixedFilterTemplate = Handlebars.compile(convertedFixedFilter);
            const renderedFilter = fixedFilterTemplate(formik.values);

            let parsedFilter: any;
            try {
                parsedFilter = JSON.parse(renderedFilter);
                const isValid = (obj: any): boolean => {
                    if (!obj || typeof obj !== 'object') return false;

                    const hasValidValue = (val: any): boolean => {
                        if (val === null || val === undefined || val === '') return false;
                        if (typeof val === 'object') {
                            return Object.values(val).some(hasValidValue);
                        }
                        return true;
                    };

                    return hasValidValue(parsedFilter);
                };

                if (isValid(parsedFilter)) {
                    queryData.filters.$and.push(parsedFilter);
                    fixedFilterParsed = true;
                } else {
                    console.warn(ERROR_MESSAGES.SKIPPING_EMPTY_FIXED_FILTER, parsedFilter);
                }
            } catch (e) {
                console.error(ERROR_MESSAGES.INVALID_JSON_WHERECLAUSE, renderedFilter);
                parsedFilter = {};
            }

        }

        let autocompleteQs = qs.stringify(queryData, {
            encodeValuesOnly: true,
        });
        // if (whereClause) {
        //     autocompleteQs = `${autocompleteQs}&${whereClause}`;
        // }

        if (fixedFilterToBeApplied && !fixedFilterParsed) {
            console.error(ERROR_MESSAGES.FIXED_FILTER_NOT_APPLIED);

        } else {
            //  const autocompleteQs = qs.stringify(queryData, {
            //     encodeValuesOnly: true,
            // });
            fetchRelationEntities(autocompleteQs);
        }
    };

    return (

        <div className="relative">
            <div className="flex flex-column gap-2 mt-1 sm:mt-2 md:mt-3 lg:mt-4">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                        {fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                    </label>
                }
                <div className="flex align-items-center gap-3">
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
                        completeMethod={autoCompleteSearch}
                        onChange={(e) => fieldContext.onChange(e, 'onFieldChange')}
                        onSelect={(e) => {
                            // e.value is the newly selected single item; formik.values already
                            // updated by onChange above, so read the post-update array from formik.
                            const updated = [
                                ...(formik.values[fieldLayoutInfo.attrs.name] || []),
                                e.value,
                            ];
                            handleRelationUpdate(updated);
                        }}
                        onUnselect={(e) => {
                            const updated = (formik.values[fieldLayoutInfo.attrs.name] || []).filter(
                                (item: any) => item.value !== e.value.value
                            );
                            handleRelationUpdate(updated);
                        }}

                        className="solid-standard-autocomplete w-full"
                    />
                    {fieldContext.field.attrs.inlineCreate && (
                        <>
                            <div>
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
                            </div>
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
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
}



export const DefaultRelationManyToManyCheckBoxFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    const readOnlyPermission = fieldContext.readOnly;
    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);
    const { autoCompleteItems, fetchRelationEntities, populateFormikWithRelatedEntities, addNewRelation, handleRelationUpdate } = useRelationEntityHandler({ fieldContext, formik });

    useEffect(() => {
        populateFormikWithRelatedEntities();
    }, [formik.values?.id]);


    useEffect(() => {
        const fieldMetadata = fieldContext.fieldMetadata;
        const fieldLayoutInfo = fieldContext.field;
        const queryData: any = {
            offset: 0,
            limit: 1000,
            filters: {
                $and: []
            }
        };

        let fixedFilterToBeApplied = false;
        let fixedFilterParsed = false;

        if (fieldMetadata?.relationFieldFixedFilter || fieldLayoutInfo?.attrs?.whereClause) {
            const convertedFixedFilter = fieldLayoutInfo?.attrs?.whereClause ? fieldLayoutInfo?.attrs?.whereClause : fieldMetadata?.relationFieldFixedFilter;
            fixedFilterToBeApplied = true;
            const fixedFilterTemplate = Handlebars.compile(convertedFixedFilter);
            const renderedFilter = fixedFilterTemplate(formik.values);

            let parsedFilter: any;
            try {
                parsedFilter = JSON.parse(renderedFilter);
                const isValid = (obj: any): boolean => {
                    if (!obj || typeof obj !== 'object') return false;

                    const hasValidValue = (val: any): boolean => {
                        if (val === null || val === undefined || val === '') return false;
                        if (typeof val === 'object') {
                            return Object.values(val).some(hasValidValue);
                        }
                        return true;
                    };

                    return hasValidValue(parsedFilter);
                };

                if (isValid(parsedFilter)) {
                    queryData.filters.$and.push(parsedFilter);
                    fixedFilterParsed = true;
                } else {
                    console.warn(ERROR_MESSAGES.SKIPPING_EMPTY_FIXED_FILTER, parsedFilter);
                }
            } catch (e) {
                console.error(ERROR_MESSAGES.INVALID_JSON_WHERECLAUSE, renderedFilter);
                parsedFilter = {};
            }

        }

        if (fixedFilterToBeApplied && !fixedFilterParsed) {
            console.error(ERROR_MESSAGES.FIXED_FILTER_NOT_APPLIED);

        } else {
            const autocompleteQs = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });
            fetchRelationEntities(autocompleteQs);
        }

    }, [fieldContext, formik.values]);

    const handleCheckboxChange = (e: any) => {
        const current: any[] = formik.values[fieldLayoutInfo.attrs.name] || [];

        const updated = current.some((s: any) => s.value === e.value)
            ? current.filter((s: any) => s.value !== e.value)   // uncheck
            : [...current, e];                              // check

        formik.setFieldValue(fieldLayoutInfo.attrs.name, updated);

        handleRelationUpdate(updated);

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
                            <SolidFieldTooltip fieldContext={fieldContext} />
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



const buildRelationCustomFilter = ({ fieldContext, fieldLayoutInfo, }: { fieldContext: any; fieldLayoutInfo?: any; }) => {
    if (!fieldContext) {
        return { id: { $eq: -1 } };
    }
    const relationFieldName =
        fieldContext.fieldMetadata?.relationCoModelFieldName ??
        fieldContext.modelName;

    const parentId = fieldContext.data?.id ?? -1;


    const baseFilter = {
        [relationFieldName]: {
            id: { $eq: parentId },
        },
    };

    const whereClause = fieldLayoutInfo?.attrs?.whereClause;

    if (!whereClause) return { $and: [baseFilter] };

    try {
        const parsedWhereClause = JSON.parse(whereClause);

        return {
            $and: [baseFilter, parsedWhereClause],
        };
    } catch (error) {
        console.error("Failed to parse whereClause:", error);
        return { $and: [baseFilter] };
    }
};

export const DefaultRelationManyToManyListFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const router = useRouter();

    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);
    const [listViewParams, setListViewParams] = useState<any>()
    const [formViewParams, setformViewParams] = useState<FormViewParams>()
    const [refreshList, setRefreshList] = useState(false); // Added state for rerender
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const pathname = usePathname();
    const lastPathSegment = pathname.split('/').pop();
    const userKeyField: any = Object.entries(fieldContext.solidFormViewMetaData.data.solidFieldsMetadata).find(([_, value]: any) => value.isUserKey)?.[0];
    const [showSaveParentEntityConfirmationPopup, setShowSaveParentEntityConfirmationPopup] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const childEntity = urlParams.get('childEntity');
        if (childEntity === fieldLayoutInfo.attrs.name && lastPathSegment !== "new") {
            handlePopupOpen('new');
        }
    }, [])

    const handlePopupOpen = (id: any) => {
        if (lastPathSegment === "new") {
            setShowSaveParentEntityConfirmationPopup(true);
        } else {

            const formviewparams: FormViewParams = {
                moduleName: fieldContext.fieldMetadata.relationModelModuleName,
                id: id,
                embeded: true,
                isCustomCreate: false,
                customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
                modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
                parentFieldName: fieldContext.fieldMetadata.relationCoModelFieldName,
                parentData: userKeyField ? { [userKeyField]: { solidManyToOneLabel: fieldContext.data[userKeyField], solidManyToOneValue: fieldContext.data['id'] } } : {},
                onEmbeddedFormSave: fieldContext.onEmbeddedFormSave,
                inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
            }
            setformViewParams(formviewparams);
            setvisibleCreateRelationEntity(true);
        }
    }

    const handlePopupClose = () => {
        setvisibleCreateRelationEntity(false);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('childEntity');
        router.push(currentUrl.toString());
        setRefreshList((prev) => !prev);
        const customFilter = fieldContext.fieldMetadata.relationCoModelFieldName ? fieldContext.fieldMetadata.relationCoModelFieldName : `${fieldContext.modelName}`
        const lisviewparams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false ? true : false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data ? fieldContext?.data?.id : 'new',
            customFilter: buildRelationCustomFilter({
                fieldContext,
                fieldLayoutInfo,
            })
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
            customFilter: buildRelationCustomFilter({
                fieldContext,
                fieldLayoutInfo,
            })

        }
        setListViewParams(listviewparams);
        const formviewparams: FormViewParams = {
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            parentFieldName: fieldContext.fieldMetadata.relationCoModelFieldName,
            id: "new",
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            parentData: userKeyField ? { [userKeyField]: { solidManyToOneLabel: fieldContext.data[userKeyField], solidManyToOneValue: fieldContext.data['id'] } } : {},
            onEmbeddedFormSave: fieldContext.onEmbeddedFormSave,
            inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
        }



        setformViewParams(formviewparams)

    }, [readOnlyPermission])

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const saveParentEntity = async () => {
        const currentPath = window.location.pathname;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('childEntity', fieldLayoutInfo.attrs.name);
        currentUrl.searchParams.set('viewMode', 'edit');
        const updatedPath = currentUrl.toString();
        try {
            console.log("updatedPath", updatedPath);
            router.push(updatedPath);
            await formik.handleSubmit();
        } catch {

        }
        setShowSaveParentEntityConfirmationPopup(false);
    };



    return (
        <div>
            {/* <div className="justify-content-center align-items-center"> */}
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }

            {/* {lastPathSegment === 'new' && <p>Please save the {solidFormViewMetaData.data.solidView.model.displayName} to be able to save {fieldMetadata.displayName}</p>} */}
            {listViewParams &&
                <SolidListView key={refreshList.toString()}  {...listViewParams} handlePopUpOpen={handlePopupOpen} />
            }
            {readOnlyPermission !== true && formViewParams &&
                <RenderSolidFormEmbededView formik={formik} fieldContext={fieldContext} visibleCreateRelationEntity={visibleCreateRelationEntity} setvisibleCreateRelationEntity={setvisibleCreateRelationEntity} formViewParams={formViewParams} handlePopupClose={handlePopupClose}></RenderSolidFormEmbededView>
            }

            <Dialog showHeader={false} headerClassName="py-2" contentClassName="px-0 pb-0" className="solid-confirm-dialog" contentStyle={{ borderRadius: 6 }} visible={showSaveParentEntityConfirmationPopup} style={{ width: '20vw' }} onHide={() => { if (!showSaveParentEntityConfirmationPopup) return; setShowSaveParentEntityConfirmationPopup(false); }}>
                <div className="p-4">
                    <p className="m-0 solid-primary-title" style={{ fontSize: 16 }}>
                        Before Creating {fieldLabel} you need to save {solidFormViewMetaData?.data?.solidView?.model?.displayName ? solidFormViewMetaData?.data?.solidView?.model?.displayName : capitalize(fieldContext.modelName)}.
                        Please click save if you wish to proceed ?
                    </p>
                    <div className="flex align-items-center justify-content-start gap-2 mt-3">
                        <Button label="Save" size="small" onClick={saveParentEntity} />
                        <Button label="Cancel" size="small" onClick={() => setShowSaveParentEntityConfirmationPopup(false)} outlined className='bg-primary-reverse' />
                    </div>
                </div>
            </Dialog>

        </div>
    );
}
