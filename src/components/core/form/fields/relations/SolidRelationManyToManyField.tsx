'use client';
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { camelCase, capitalize } from "lodash";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import qs from "qs";
import { useEffect, useState } from "react";
import * as Yup from 'yup';
import { Schema } from "yup";
import SolidFormView from "../../SolidFormView";
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { useRouter } from "next/router";




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
        // return { label: manyToOneColVal || '', value: manyToOneFieldData?.id || '' };

        return [];
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value && value.length > 0) {
            // value.forEach((value: any, index: any) => {
            //     formData.append(`${fieldLayoutInfo.attrs.name}Ids[${index}]`, value.value)
            //     formData.append(`${fieldLayoutInfo.attrs.name}[${index}]`, JSON.stringify(value.original))
            // });
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
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);


        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;


        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];


        return (
            <>
                {/* <div className={className}> */}
                {fieldLayoutInfo.attrs.renderMode === "checkbox" &&
                    <div className={className}>
                        {this.renderCheckBoxMode(formik, visibleCreateRelationEntity, setvisibleCreateRelationEntity)}
                    </div>
                }
                {(!fieldLayoutInfo.attrs.renderMode || fieldLayoutInfo.attrs.renderMode === "autocomplete") &&
                    this.renderAutoCompleteMode(formik, visibleCreateRelationEntity, setvisibleCreateRelationEntity)
                }
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (<Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />)}
                {/* </div> */}
            </>
        );
    }

    renderCheckBoxMode(formik: FormikObject, visibleCreateRelationEntity: any, setvisibleCreateRelationEntity: any) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const router = useRouter();
        console.log("router",router);
        
        const readOnlyPermission = this.fieldContext.readOnly;


        // auto complete specific code. 
        const entityApi = createSolidEntityApi(fieldMetadata.relationModelSingularName);
        const { useLazyGetSolidEntitiesQuery } = entityApi;
        const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

        const disabled = fieldLayoutInfo.attrs?.disabled;
        const readOnly = fieldLayoutInfo.attrs?.readOnly;

        const [autoCompleteItems, setAutoCompleteItems] = useState<any>([]);
        const autoCompleteSearch = async (query?: any) => {
            let filterQuery;
            if (query) {
                filterQuery = {
                    [fieldMetadata?.relationModel?.userKeyField?.name]: {
                        '$containsi': query
                    }
                }
            }
            // Get the list view layout & metadata first. 
            const queryData = {
                offset: 0,
                limit: 1000,
                filters: filterQuery
            };

            const autocompleteQs = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });

            // TODO: do error handling here, possible errors like modelname is incorrect etc...
            const autocompleteResponse = await triggerGetSolidEntities(autocompleteQs);

            // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
            const autocompleteData = autocompleteResponse.data;

            if (autocompleteData) {
                const autoCompleteItems = autocompleteData.records.map((item: any) => {
                    return {
                        label: item[fieldMetadata?.relationModel?.userKeyField?.name],
                        value: item['id'],
                        original: item
                    }
                });
                setAutoCompleteItems(autoCompleteItems);
            }
        }
        useEffect(() => {
            if (visibleCreateRelationEntity === false) {
                autoCompleteSearch();
            }
        }, [visibleCreateRelationEntity])

        const handleCheckboxChange = (e: any) => {
            if (formik.values[fieldLayoutInfo.attrs.name].some((item: any) => item.value === e.value)) {
                formik.setFieldValue(fieldLayoutInfo.attrs.name, formik.values[fieldLayoutInfo.attrs.name].filter((s: any) => s.value !== e.value));
            } else {
                formik.setFieldValue(fieldLayoutInfo.attrs.name, [...formik.values[fieldLayoutInfo.attrs.name], e]);
            }
        };

        const customCreateHandler = (values: any) => {
            const currentRelationData = formik.values[fieldLayoutInfo.attrs.name] || [];
            const jsonValues = Object.fromEntries(values.entries());

            // Create a new array with the existing data and the new entry
            const updatedRelationData = [
                ...currentRelationData,
                {
                    label: jsonValues[fieldMetadata?.relationModel?.userKeyField?.name],
                    value: "new",
                    original: jsonValues,
                },
            ];

            formik.setFieldValue(fieldLayoutInfo.attrs.name, updatedRelationData);
            // const updatedAutoCompleteItems = [
            //     ...autoCompleteItems, ...updatedRelationData
            // ];


            const updatedAutoCompleteItems = [...autoCompleteItems, ...updatedRelationData].reduce((acc, current) => {
                if (!acc.some((item: any) => item.label === current.label && item.value === current.value)) {
                    acc.push(current);
                }
                return acc;
            }, []);



            setAutoCompleteItems(updatedAutoCompleteItems)
        }

        const headerTemplate = (options: any) => {
            const className = `${options.className} justify-content-space-between`;

            return (
                <div className={className}>
                    <div className="flex align-items-center gap-3">
                        {showFieldLabel != false &&
                            <label className="form-field-label">
                                {capitalize(fieldLayoutInfo.attrs.name)}
                            </label>
                        }
                        {fieldLayoutInfo.attrs.inlineCreate === "true" &&
                            this.renderSolidFormEmbededView(formik, customCreateHandler, visibleCreateRelationEntity, setvisibleCreateRelationEntity)
                        }
                        <div className="many-to-many-add" >
                            {/* <Button icon="pi pi-plus"
                                rounded
                                outlined
                                aria-label="Filter"
                                type="button"
                                onClick={() => autoCompleteSearch()}
                            /> */}
                        </div>
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


    renderAutoCompleteMode(formik: FormikObject, visibleCreateRelationEntity: any, setvisibleCreateRelationEntity: any) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
        const readOnlyPermission = this.fieldContext.readOnly;

        // auto complete specific code. 
        const entityApi = createSolidEntityApi(fieldMetadata.relationModelSingularName);
        const { useLazyGetSolidEntitiesQuery } = entityApi;
        const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();


        const disabled = fieldLayoutInfo.attrs?.disabled;
        const readOnly = fieldLayoutInfo.attrs?.readOnly;

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

            const autocompleteQs = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });

            // TODO: do error handling here, possible errors like modelname is incorrect etc...
            const autocompleteResponse = await triggerGetSolidEntities(autocompleteQs);

            // TODO: if no data found then can we show no matching "entities", where entities can be replaced with the model plural name,
            const autocompleteData = autocompleteResponse.data;

            if (autocompleteData) {
                const autoCompleteItems = autocompleteData.records.map((item: any) => {
                    return {
                        label: item[fieldMetadata?.relationModel?.userKeyField?.name],
                        value: item['id'],
                        original: item

                    }
                });
                setAutoCompleteItems(autoCompleteItems);
            }
        }

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
            <div className={className}>
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">
                        {fieldLabel}
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
                        onChange={formik.handleChange}
                        className="solid-standard-autocomplete w-full"
                    />
                    {fieldLayoutInfo.attrs.inlineCreate === "true" && readOnlyPermission === false && 
                        this.renderSolidFormEmbededView(formik, customCreateHandler, visibleCreateRelationEntity, setvisibleCreateRelationEntity)
                    }
                </div>
            </div>
        );
    }

    renderSolidFormEmbededView(formik: FormikObject, customCreateHandler: any, visibleCreateRelationEntity: any, setvisibleCreateRelationEntity: any) {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        const params = {
            moduleName: this.fieldContext.fieldMetadata.relationModelModuleName,
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
            modelName: camelCase(this.fieldContext.fieldMetadata.relationModelSingularName)
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
}
