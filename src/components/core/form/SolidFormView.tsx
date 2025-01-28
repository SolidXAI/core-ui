"use client";

import { SolidCancelButton } from "@/components/common/CancelButton";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";
import { useFormik } from "formik";
import { usePathname, useRouter } from "next/navigation";
import "primeflex/primeflex.css";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { Toast } from "primereact/toast";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import * as Yup from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./fields/ISolidField";
import { SolidBooleanField } from "./fields/SolidBooleanField";
import { SolidDateField } from "./fields/SolidDateField";
import { SolidDateTimeField } from "./fields/SolidDateTimeField";
import { SolidDecimalField } from "./fields/SolidDecimalField";
import { SolidIntegerField } from "./fields/SolidIntegerField";
import { SolidJsonField } from "./fields/SolidJsonField";
import { SolidLongTextField } from "./fields/SolidLongTextField";
import { SolidMediaMultipleField } from "./fields/SolidMediaMultipleField";
import { SolidMediaSingleField } from "./fields/SolidMediaSingleField";
import { SolidRelationField } from "./fields/SolidRelationField";
import { SolidRichTextField } from "./fields/SolidRichTextField";
import { SolidSelectionDynamicField } from "./fields/SolidSelectionDynamicField";
import { SolidSelectionStaticField } from "./fields/SolidSelectionStaticField";
import { SolidShortTextField } from "./fields/SolidShortTextField";
import { SolidTimeField } from "./fields/SolidTimeField";

export type SolidFormViewProps = {
    moduleName: string;
    modelName: string;
    id: string;
    embeded: boolean;
    handlePopupClose?: any,
    customCreateHandler?: any
    inlineCreateAutoSave?: boolean,
    customLayout?: any
};


interface ErrorResponseData {
    message: string;
    statusCode: number;
    error: string;
}

const getLayoutFields = (node: any): any => {
    let fields = [];

    if (node.type === "field") {
        fields.push(node);
    }

    if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
            fields = fields.concat(getLayoutFields(child));
        }
    }

    return fields;
}

const getLayoutFieldsAsObject = (layout: any[]): any => {
    const allFields = layout.flatMap(getLayoutFields);
    return allFields.reduce((result, field) => {
        if (field.attrs.name) {
            result[field.attrs.name] = { ...field };
        }
        return result;
    }, {});
}

const fieldFactory = (type: string, fieldContext: SolidFieldProps): ISolidField | null => {
    if (type === 'shortText') {
        return new SolidShortTextField(fieldContext);
    }
    if (type === 'longText') {
        return new SolidLongTextField(fieldContext);
    }
    if (type === 'int') {
        return new SolidIntegerField(fieldContext);
    }
    if (type === 'decimal' || type === 'float') {
        return new SolidDecimalField(fieldContext);
    }
    if (type === 'boolean') {
        return new SolidBooleanField(fieldContext);
    }
    if (type === 'richText') {
        return new SolidRichTextField(fieldContext);
    }
    if (type === 'date') {
        return new SolidDateField(fieldContext);
    }
    if (type === 'datetime') {
        return new SolidDateTimeField(fieldContext);
    }
    if (type === 'time') {
        return new SolidTimeField(fieldContext);
    }
    if (type === 'json') {
        return new SolidJsonField(fieldContext);
    }
    if (type === 'selectionStatic') {
        return new SolidSelectionStaticField(fieldContext);
    }
    if (type === 'selectionDynamic') {
        return new SolidSelectionDynamicField(fieldContext);
    }
    if (type === 'relation') {
        return new SolidRelationField(fieldContext);
    }
    if (type === 'mediaSingle') {
        return new SolidMediaSingleField(fieldContext);
    }
    if (type === 'mediaMultiple') {
        return new SolidMediaMultipleField(fieldContext);
    }
    return null;
}

// solidFieldsMetadata={solidFieldsMetadata} solidView={solidView}
const SolidField = ({ formik, field, fieldMetadata, initialEntityData, solidFormViewMetaData, modelName }: any) => {
    const fieldContext: SolidFieldProps = {
        // field metadata - coming from the field-metadata table.
        fieldMetadata: fieldMetadata,
        // field layout - coming from view.layout
        field: field,
        // initial data 
        data: initialEntityData,
        // complete form view metadata - this includes layout of the whole form & metadata about all fields in the corresponding model.
        solidFormViewMetaData: solidFormViewMetaData,
        modelName: modelName,
    }
    const solidField = fieldFactory(fieldMetadata.type, fieldContext);

    return solidField?.render(formik);
};

const SolidGroup = ({ children, attrs }: any) => {

    const className = attrs.className;

    return (
        <div className={className}>
            <div className="s_group">
                <fieldset>
                    {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
                    <div className="grid">{children}</div>
                </fieldset>
            </div>

        </div>
    );
};

const SolidRow = ({ children, attrs }: any) => {

    const className = attrs.className;

    return (
        <div className={`row ${className}`}>

            <div className="s_group">
                <fieldset>
                    {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
                    <div className="grid">{children}</div>
                </fieldset>
            </div>

        </div>
    );
};
const SolidColumn = ({ children, attrs }: any) => {
    const className = attrs.className;

    return (
        <div className={`${className}`}>
            <div className="s_group">
                <fieldset>
                    {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
                    <div className="grid">{children}</div>
                </fieldset>
            </div>

        </div>
    );
};

const SolidSheet = ({ children }: any) => (

    <div className="p-fluid p-grid">
        {children}
    </div>
);
const SolidNotebook = ({ children }: any) => {

    return (<div className="solid-tab-view">
        <TabView>
            {children}
        </TabView>
    </div>
    )
};


const SolidPage = ({ attrs, children, key }: any) => (
    <TabPanel key={key} header={attrs.label} className="solid-tab-panel">
        <div className="p-fluid">{children}</div>
    </TabPanel>
);

// Original code...
// const addLevelToGroups = (layout: any, level = 1) => {
//     return layout.map((element: any) => {
//         if (element.type === "group") {
//             // Add the level to the group's attrs
//             element.attrs = {
//                 ...element.attrs,
//                 level: level,  // Add level information to the attrs
//                 // className: level === 1 ? 'col-12' : 'col-6',  // Assign className based on level
//             };
//         } else {
//             element.children = addLevelToGroups(element.children, level);
//         }
//         // If the element has children, recursively apply this logic
//         // if (element.children) {
//         //     element.children = addLevelToGroups(element.children, level + 1);
//         // }

//         return element;
//     });
// };

// Fix for immutable objects. 
// const addLevelToGroups = (layout: any, level = 1): any[] => {
//     return layout.map((element: any) => {
//         // Create a new object for immutability
//         const updatedElement = { ...element };

//         if (updatedElement.type === "group") {
//             // Add level to attrs, creating a new object for immutability
//             updatedElement.attrs = {
//                 ...updatedElement.attrs,
//                 level: level, // Add level information
//             };
//         }

//         // If the element has children, recursively apply this logic
//         if (updatedElement.children) {
//             updatedElement.children = addLevelToGroups(updatedElement.children, level + 1);
//         }

//         return updatedElement;
//     });
// };

const SolidFormView = (params: SolidFormViewProps) => {

    const pathname = usePathname();
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [redirectToList, setRedirectToList] = useState(false);

    const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);

    const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);

    const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
    useEffect(() => {

        const fetchPermissions = async () => {
            if (params.modelName) {
                const permissionNames = [
                    createPermission(params.modelName),
                    deletePermission(params.modelName),
                    updatePermission(params.modelName)
                ]
                const queryData = {
                    permissionNames: permissionNames
                };
                const queryString = qs.stringify(queryData, {
                    encodeValuesOnly: true
                });
                const response = await triggerCheckIfPermissionExists(queryString);
                setActionsAllowed(response.data.data);
            }
        };
        fetchPermissions();
    }, [params.modelName]);


    // Create the RTK slices for this entitor (const id of fieldValue) {
    //     if (!isInt(id)) {
    //         errors.push({ field: this.fieldMetadata.name, error: `Invalid ids in ${commandFieldName}` });
    //     }
    // }y
    const entityApi = createSolidEntityApi(params.modelName);
    const {
        useCreateSolidEntityMutation,
        useDeleteSolidEntityMutation,
        useGetSolidEntityByIdQuery,
        useUpdateSolidEntityMutation
    } = entityApi;

    const [
        createEntity,
        { isSuccess: isEntityCreateSuccess, isError: isEntityCreateError, error: entityCreateError },
    ] = useCreateSolidEntityMutation();

    const [
        updateEntity,
        { isSuccess: isEntityUpdateSuceess, isError: isEntityUpdateError, error: entityUpdateError },
    ] = useUpdateSolidEntityMutation();

    const [
        deleteEntity,
        { isSuccess: isEntityDeleteSuceess, isError: isEntityDeleteError, error: entityDeleteError },
    ] = useDeleteSolidEntityMutation();

    // - - - - - - - - - - - -- - - - - - - - - - - - METADATA here
    // Get the form view layout & metadata first. 
    const formViewMetaDataQs = qs.stringify({ ...params, viewType: 'form' }, {
        encodeValuesOnly: true,
    });
    const [formViewMetaData, setFormViewMetaData] = useState({});
    const [formViewLayout, setFormViewLayout] = useState<any>(null);
    const {
        data: solidFormViewMetaData,
        isLoading: solidFormViewMetaDataIsLoading
    } = useGetSolidViewLayoutQuery(formViewMetaDataQs);

    useEffect(() => {
        if (solidFormViewMetaData) {
            console.log(`METADATA: `, solidFormViewMetaData);
            setFormViewMetaData(solidFormViewMetaData);
            if (params.customLayout) {
                setFormViewLayout(params.customLayout);
            } else {
                setFormViewLayout(solidFormViewMetaData.data.solidView.layout);
            }
        }
    }, [solidFormViewMetaData]);

    useEffect(() => {
        if (
            isEntityCreateSuccess == true ||
            isEntityUpdateSuceess == true ||
            isEntityDeleteSuceess == true
        ) {
            // Close The pop in case the form is used in embeded form
            if (params.embeded == true) {
                params.handlePopupClose()
            }
            if (redirectToList === true) {

                const segments = pathname.split('/').filter(Boolean); // Split and filter empty segments
                const newPath = '/' + segments.slice(0, -2).join('/') + '/list'; // Remove last segment and add "/all"
                router.push(newPath);
            }
        }
    }, [isEntityCreateSuccess, isEntityUpdateSuceess, isEntityDeleteSuceess]);

    function isFetchBaseQueryErrorWithErrorResponse(error: any): error is FetchBaseQueryError & { data: ErrorResponseData } {
        return error && typeof error === 'object' && 'data' in error && 'message' in error.data;
    }

    useEffect(() => {
        const handleError = (errorToast: any) => {
            let errorMessage: any = ['An error occurred'];

            if (isFetchBaseQueryErrorWithErrorResponse(errorToast)) {
                errorMessage = errorToast.data.message;
            } else {
                errorMessage = ['Something went wrong'];
            }

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000,
                //@ts-ignore
                content: () => (
                    <div className="flex flex-column align-items-left" style={{ flex: "1" }}>
                        {Array.isArray(errorMessage) ? (
                            errorMessage.map((message, index) => (
                                <div className="flex align-items-center gap-2" key={index}>
                                    <span className="font-bold text-900">{message.trim()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex align-items-center gap-2">
                                <span className="font-bold text-900">{errorMessage?.trim()}</span>
                            </div>
                        )}
                    </div>
                ),
            });
        };

        // Check and handle errors from each API operation
        if (isEntityCreateError) {
            handleError(entityCreateError);
        } else if (isEntityDeleteError) {
            handleError(entityDeleteError);
        } else if (isEntityUpdateError) {
            handleError(entityUpdateError);
        }
    }, [
        isEntityCreateError,
        isEntityDeleteError,
        isEntityUpdateError
    ]);

    const showError = async () => {
        // Trigger validation and get the updated errors
        const errors = await formik.validateForm();
        const errorMessages = Object.values(errors);
        console.log(`Error message is: `, errorMessages);
    };

    const onFormikSubmit = async (values: any) => {
        console.log(`Form being submitted with: `, values);
        const solidView = solidFormViewMetaData.data.solidView;
        const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;
        const layoutFieldsObj = getLayoutFieldsAsObject([formViewLayout]);

        try {
            let formData = new FormData();

            // Iterate through the keys in the values object
            Object.entries(values).forEach(([key, value]) => {

                const fieldMetadata = solidFieldsMetadata[key];
                const fieldContext: SolidFieldProps = {
                    fieldMetadata: fieldMetadata,
                    field: layoutFieldsObj[key],
                    data: initialEntityData,
                    solidFormViewMetaData: solidFormViewMetaData,
                    modelName: params.modelName,
                }

                let solidField = fieldFactory(fieldMetadata.type, fieldContext);

                // Append each field to the FormData
                if (value !== undefined && value !== null && solidField) {
                    solidField.updateFormData(value, formData);
                }

            });
            if (params.inlineCreateAutoSave === true) {
                params.customCreateHandler(formData);
            } else {
                if (params.id === 'new') {
                    createEntity(formData);
                }
                else {
                    updateEntity({ id: +params.id, data: formData });
                }
            }

        } catch (err) {
            console.error("Failed to create Entity: ", err);
        }
    }

    // - - - - - - - - - - - -- - - - - - - - - - - - DATA here
    // Fetch the actual data here. 
    // This is the initial value of this form, will come from an API call in the case of edit. 
    let layoutFields = [];
    let toPopulate = [];
    let toPopulateMedia = [];
    if (solidFormViewMetaData && formViewLayout) {
        const solidView = solidFormViewMetaData.data.solidView;
        const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;
        layoutFields = [formViewLayout].flatMap(getLayoutFields);
        for (let i = 0; i < layoutFields.length; i++) {
            const formLayoutField = layoutFields[i];
            const fieldMetadata = solidFieldsMetadata[formLayoutField.attrs.name];
            if (fieldMetadata.type === 'relation') {
                toPopulate.push(fieldMetadata.name);
            }
            if (fieldMetadata.type === 'mediaSingle' || fieldMetadata.type === 'mediaMultiple') {
                toPopulateMedia.push(fieldMetadata.name);
            }
        }
    }
    const formViewDataQs = qs.stringify({ populate: toPopulate, populateMedia: toPopulateMedia }, {
        encodeValuesOnly: true,
    });
    const [initialEntityData, setInitialEntityData] = useState({});
    const {
        data: solidFormViewData,
        isLoading: solidFormViewDataIsLoading,
    } = useGetSolidEntityByIdQuery({ id: params.id, qs: formViewDataQs },
        { skip: !solidFormViewMetaData || params.id === 'new', refetchOnMountOrArgChange: true, });
    useEffect(() => {
        if (solidFormViewData) {
            console.log(`DATA: `, solidFormViewData);
            setInitialEntityData(solidFormViewData.data);
        }
    }, [solidFormViewData, params]);

    let formik: FormikObject;
    
    if (solidFormViewMetaDataIsLoading || solidFormViewDataIsLoading || !formViewLayout) {
        formik = useFormik({
            initialValues: {},
            validationSchema: Yup.object(),
            enableReinitialize: true,
            onSubmit: onFormikSubmit,
        });

        return <div>Rendering form...</div>;
    }
    else {

        // Initialize formik...
        const solidView = solidFormViewMetaData.data.solidView;
        const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;

        const createHeaderTitle = `Create ${solidView.model.displayName}`;
        const editHeaderTitle = `Edit ${solidView.model.displayName}`;

        const validationSchema = {};
        const initialValues = {};

        for (let i = 0; i < layoutFields.length; i++) {
            const formLayoutField = layoutFields[i];
            const fieldMetadata = solidFieldsMetadata[formLayoutField.attrs.name];
            const fieldContext: SolidFieldProps = {
                fieldMetadata: fieldMetadata,
                field: formLayoutField,
                data: initialEntityData,
                solidFormViewMetaData: solidFormViewMetaData,
                modelName: params.modelName,
            }
            let solidField = fieldFactory(fieldMetadata.type, fieldContext);
            if (solidField) {
                // @ts-ignore
                validationSchema[formLayoutField.attrs.name] = solidField.validationSchema();
                // @ts-ignore
                initialValues[formLayoutField.attrs.name] = solidField.initialValue();

            }
        }
        console.log("solidFormViewMetaData", solidFormViewMetaData);
        console.log("layoutFields", layoutFields);

        formik = useFormik({
            initialValues: initialValues,
            validationSchema: Yup.object(validationSchema),
            enableReinitialize: true,
            onSubmit: onFormikSubmit,
        });

        // Now render the form dynamically...
        const renderFormElementDynamically: any = (element: any, solidFormViewMetaData: any) => {
            const { type, attrs, children } = element;

            // const key = attrs?.name ?? generateRandomKey();
            const key = attrs?.name;

            switch (type) {
                case "form":
                    return <div key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</div>;
                case "sheet":
                    return <SolidSheet key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidSheet>;
                case "group":
                    return <SolidGroup key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidGroup>;
                case "row":
                    return <SolidRow key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidRow>;
                case "column":
                    return <SolidColumn key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidColumn>;
                case "field": {
                    // const fieldMetadata = solidFieldsMetadata[attrs.name];
                    const fieldMetadata = solidFormViewMetaData.data.solidFieldsMetadata[attrs.name];
                    console.log("initialEntityData", initialEntityData);

                    return <SolidField key={key} field={element} formik={formik} fieldMetadata={fieldMetadata} initialEntityData={solidFormViewData ? solidFormViewData.data : null} solidFormViewMetaData={solidFormViewMetaData} modelName={params.modelName} />;
                }
                case "notebook":
                    return <SolidNotebook key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidNotebook>;
                case "page":
                    const pageChildren = children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData));
                    return SolidPage({ children: pageChildren, attrs: attrs, key: key });
                default:
                    return null;
            }
        };

        const renderFormDynamically = (solidFormViewMetaData: any) => {
            if (!solidFormViewMetaData) {
                return;
            }
            if (!solidFormViewMetaData.data) {
                return;
            }
            const solidView = solidFormViewMetaData.data.solidView;
            const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;
            if (!solidView || !solidFieldsMetadata) {
                return;
            }
            if (!solidView || !solidFieldsMetadata) {
                return;
            }

            const updatedLayout = [formViewLayout];

            const dynamicForm = updatedLayout.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData));

            return dynamicForm;
        };

        const handleDeleteEntity = async () => {
            deleteEntity(solidFormViewData.data.id);
            setDeleteDialogVisible(false);
            if (params.embeded == true) {
                setRedirectToList(false)

            } else {
                setRedirectToList(true)

            }
            // router.back();
        }

        const onDeleteClose = () => {
            setDeleteDialogVisible(false);
        }

        console.log(`Rendering with formViewLayout:`, formViewLayout);
        console.log("params.embeded", params.embeded);

        return (
            <>
                <Toast ref={toast} />

                <form onSubmit={formik.handleSubmit}>

                    {params.id === "new" ? (
                        <div className="flex gap-3 justify-content-between mb-3 align-items-baseline">
                            <div className="form-wrapper-title"> {createHeaderTitle}</div>
                            <div className="gap-1 flex">
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save"
                                            size="small"
                                            onClick={() => showError()}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save & Close"
                                            size="small"
                                            onClick={() => {
                                                setRedirectToList(true);
                                                showError()
                                            }}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save"
                                            size="small"
                                            onClick={() => {
                                                setRedirectToList(false);
                                                showError()
                                            }}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    <Button outlined size="small" type="button" label="Cancel" severity="danger" onClick={() => params.handlePopupClose()} className='small-button' />

                                }
                                {params.embeded !== true &&
                                    <SolidCancelButton />
                                }

                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-content-between mb-3">
                            <div className="form-wrapper-title"> {editHeaderTitle}</div>
                            <div className="gap-3 flex">
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save"
                                            size="small"
                                            onClick={() => showError()}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save"
                                            size="small"
                                            onClick={() => showError()}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            label="Save & Close"
                                            size="small"
                                            onClick={() => {
                                                setRedirectToList(true);
                                                showError()
                                            }}
                                            type="submit"
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            size="small"
                                            type="button"
                                            label="Delete"
                                            severity="danger"
                                            onClick={() => setDeleteDialogVisible(true)}
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    !formViewLayout.attrs.readonly &&
                                    <div>
                                        <Button
                                            size="small"
                                            type="button"
                                            label="Delete"
                                            severity="danger"
                                            onClick={() => setDeleteDialogVisible(true)}
                                            className="small-button"
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    <Button outlined size="small" type="button" label="Cancel" severity="danger" onClick={() => params.handlePopupClose()} className='small-button' />

                                }
                                {params.embeded !== true &&
                                    <SolidCancelButton />
                                }
                            </div>
                        </div>
                    )}
                    {renderFormDynamically(formViewMetaData)}
                </form>
                <Dialog
                    visible={isDeleteDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={() => handleDeleteEntity()} />
                            <Button label="No" icon="pi pi-times" className='small-button' onClick={onDeleteClose} />
                        </div>
                    )}
                    onHide={() => setDeleteDialogVisible(false)}
                >
                    <p>Are you sure you want to delete?</p>
                </Dialog>
            </>
        );

    }
};

export default SolidFormView;