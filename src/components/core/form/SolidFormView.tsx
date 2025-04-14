"use client";

import { SolidCancelButton } from "@/components/common/CancelButton";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";
import { useFormik } from "formik";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import "primeflex/primeflex.css";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { Toast } from "primereact/toast";
import qs from "qs";
import { ChangeEvent, useEffect, useRef, useState } from "react";
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
import { BackButton } from "@/components/common/BackButton";
import { OverlayPanel } from "primereact/overlaypanel";
import { SolidBreadcrumb } from "@/components/common/SolidBreadcrumb";
import { SolidUiEvent } from "@/types";
import { getExtensionComponent, getExtensionFunction } from "@/helpers/registry";
import { SolidFormWidgetProps, SolidLoadForm } from "@/types/solid-core";
import { SolidPasswordField } from "./fields/SolidPasswordField";
import { SolidEmailField } from "./fields/SolidEmailField";
import { Panel } from "primereact/panel";
import { SolidFormStepper } from "@/components/common/SolidFormStepper";
import { SolidFormHeader } from "@/components/common/SolidFormHeader";
import { SolidFormUserViewLayout } from "./SolidFormUserViewLayout";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { SolidChatter } from "../chatter/SolidChatter";

export type SolidFormViewProps = {
    moduleName: string;
    modelName: string;
    id: string;
    embeded: boolean;
    handlePopupClose?: any,
    customCreateHandler?: any
    inlineCreateAutoSave?: boolean,
    customLayout?: any,
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

const fieldFactory = (type: string, fieldContext: SolidFieldProps, setLightboxUrls?: any, setOpenLightbox?: any): ISolidField | null => {
    if (type === 'shortText') {
        return new SolidShortTextField(fieldContext);
    }
    if (type === 'longText') {
        return new SolidLongTextField(fieldContext);
    }
    if (type === 'int' || type === 'bigint') {
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
        return new SolidMediaSingleField(fieldContext, setLightboxUrls, setOpenLightbox);
    }
    if (type === 'mediaMultiple') {
        return new SolidMediaMultipleField(fieldContext, setLightboxUrls, setOpenLightbox);
    }
    if (type === 'password') {
        return new SolidPasswordField(fieldContext);
    }
    if (type === 'email') {
        return new SolidEmailField(fieldContext);
    }
    return null;
}

// solidFieldsMetadata={solidFieldsMetadata} solidView={solidView}
const SolidField = ({ formik, field, fieldMetadata, initialEntityData, solidFormViewMetaData, modelName, readOnly, viewMode, onChange, onBlur, setLightboxUrls, setOpenLightbox }: any) => {
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
        readOnly: readOnly,
        viewMode: viewMode,
        onChange: onChange,
        onBlur: onBlur
    }
    const solidField = fieldFactory(fieldMetadata?.type, fieldContext, setLightboxUrls, setOpenLightbox);

    return solidField?.render(formik);
};

const SolidGroup = ({ children, attrs }: any) => {

    const className = attrs.className;

    return (
        <div className={className}>
            {attrs.label && <p>{attrs.label}</p>}
            <div className="grid">{children}</div>
        </div>
        // <div className={className}>
        //     <div className="s_group">
        //         <fieldset>
        //             {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
        //             <div className="grid">{children}</div>
        //         </fieldset>
        //     </div>

        // </div>
        // <div className="formgrid grid">
        //     {children}
        // </div>
    );
};

const SolidRow = ({ children, attrs }: any) => {

    const className = attrs.className;

    return (
        // <div className={`row ${className}`}>

        //     <div className="s_group">
        //         <fieldset>
        //             {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
        //             <div className="grid">{children}</div>
        //         </fieldset>
        //     </div>

        // </div>
        <div className={`row ${className}`}>
            {attrs.label && <p >{attrs.label}</p>}
            <div className="grid">{children}</div>
        </div>
        // <div>{children}</div>
    );
};
const SolidColumn = ({ children, attrs }: any) => {
    const className = attrs.className;

    return (
        // first fieldset ui

        // <div className={`${className}`}>
        //     <div className="s_group">
        //         <fieldset>
        //             {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
        //             <div className="grid">{children}</div>
        //         </fieldset>
        //     </div>
        // </div>

        //second fieldset ui
        // <div className={`${className}`}>
        //     {attrs.label && <p>{attrs.label}</p>}
        //     <div className="grid">{children}</div>
        // </div>

        //figma fieldset ui
        attrs.label ?
            <div className={`${className}`}>
                <Panel header={attrs.label} className="solid-column-panel">
                    <div className="grid">{children}</div>
                </Panel>
                {/* <div className="p-fieldset">
                    <div className="solid-fieldset-header">
                        <div>{attrs.label}</div>
                    </div>
                    <div className="grid solid-fieldset-content">{children}</div>
                </div> */}
            </div>
            :
            <div className={`${className}`}>
                <div className="grid">{children}</div>
            </div>
    );
};

const SolidSheet = ({ children }: any) => (
    <div className="p-fluid p-grid">
        {children}
    </div>
);

const SolidNotebook = ({ children }: any) => {

    return (
        <div className="solid-tab-view w-full">
            <TabView>
                {children}
            </TabView>
        </div>
    )
};

const SolidDynamicWidget = ({ widgetName, formik, field, solidFormViewMetaData }: any) => {
    const solidView = solidFormViewMetaData.data.solidView;
    const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;

    let DynamicWidget = getExtensionComponent(widgetName);

    const widgetProps: SolidFormWidgetProps = {
        formData: formik.values,
        field: field,
        fieldsMetadata: solidFieldsMetadata,
        viewMetadata: solidView
    }

    return (
        <div className="solid-tab-view w-full">
            {DynamicWidget && <DynamicWidget {...widgetProps} />}
        </div>
    )
};


const SolidPage = ({ attrs, children, key }: any) => (
    <TabPanel key={key} header={attrs.label} >
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
    const searchParams = useSearchParams();
    const viewModeFromURL = searchParams.get("viewMode");

    const [redirectToList, setRedirectToList] = useState(false);

    const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [isLayoutDialogVisible, setLayoutDialogVisible] = useState(false);

    const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"view" | "edit">("view");
    const [openLightbox, setOpenLightbox] = useState(false);
    const [lightboxUrls, setLightboxUrls] = useState([]);
    const [isShowChatter, setShowChatter] = useState(true);

    const errorFields: string[] = [];

    const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
    const op = useRef(null);

    useEffect(() => {
        if (viewModeFromURL === "edit" || viewModeFromURL === "view") {
            setViewMode(viewModeFromURL);
        } else {
            setViewMode("view"); // Default to 'view' if not present
        }
        if (params.id === 'new') {
            setViewMode("edit");
        }
    }, [viewModeFromURL]);


    // function that updates view mode 
    const updateViewMode = (newMode: "view" | "edit") => {
        setViewMode(newMode);
        const params = new URLSearchParams(searchParams.toString());
        params.set("viewMode", newMode);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };





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
    };

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const onFormikSubmit = async (values: any) => {
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
                    modelName: params.modelName
                }

                let solidField = fieldFactory(fieldMetadata?.type, fieldContext);

                // Append each field to the FormData
                if (value !== undefined && value !== null && solidField) {
                    solidField.updateFormData(value, formData);
                }

            });
            if (params.inlineCreateAutoSave === true) {
                params.customCreateHandler(formData);
            } else {
                if (params.id === 'new') {
                    // createEntity(formData);
                    const result = await createEntity(formData).unwrap();
                    showToast("success", "Form saved", "Form saved successfully!");
                    if (!params.embeded) {
                        const updatedUrl = pathname.replace("new", result?.data?.id);
                        router.push(updatedUrl);
                    }
                }
                else {
                    // updateEntity({ id: +params.id, data: formData });
                    await updateEntity({ id: +params.id, data: formData }).unwrap();
                    // const result = await updateEntity({ id: +params.id, data: formData }).unwrap();
                    if (!params.embeded) {
                        showToast("success", "Form Updated", "Form updated successfully!");
                    }
                }
            }

        } catch (err) {
            console.error("Failed to create Entity: ", err);
        }
    }

    const showFieldError = () => {
        if (errorFields?.length === 0) return;
        errorFields.forEach((error) => {
            toast?.current?.show({
                severity: "error",
                summary: "Metadata Error",
                detail: error,
                life: 3000,
            });

        });

        // errorFields.length = 0;
    };
    // useEffect(() => {
    //     if (errorFields?.length > 0) {
    //         showFieldError();
    //     }
    // }, [errorFields])

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
        for (let i = 0; i < layoutFields?.length; i++) {
            const formLayoutField = layoutFields[i];
            const fieldMetadata = solidFieldsMetadata[formLayoutField.attrs.name];
            if (fieldMetadata?.type === 'relation') {
                toPopulate.push(fieldMetadata.name);
            }
            if (fieldMetadata?.type === 'mediaSingle' || fieldMetadata?.type === 'mediaMultiple') {
                toPopulateMedia.push(fieldMetadata.name);
            }
        }
    }
    // TODO: Possible optimisation here, we are firing 2 queries to load the form view data object. 
    // once without populate & populateMedia and then again once after that.
    const formViewDataQs = qs.stringify({ populate: toPopulate, populateMedia: toPopulateMedia }, {
        encodeValuesOnly: true,
    });
    const [initialEntityData, setInitialEntityData] = useState({});
    const {
        data: solidFormViewData,
        isLoading: solidFormViewDataIsLoading,
        refetch: refetchSolidFormViewData,
    } = useGetSolidEntityByIdQuery({ id: params.id, qs: formViewDataQs }, {
        skip: params.id === 'new'
    });
    useEffect(() => {
        if (params.id !== 'new') {
            refetchSolidFormViewData()
        }
    }, [formViewDataQs])

    useEffect(() => {
        if (solidFormViewMetaData) {
            let formLayout = solidFormViewMetaData;
            const dynamicHeader = solidFormViewMetaData?.data?.solidView?.layout?.onFormLayoutLoad;
            let DynamicFunctionComponent = null;
            const event: SolidLoadForm = {
                fieldsMetadata: solidFormViewMetaData,
                formData: solidFormViewData?.data,
                type: 'onFormLayoutLoad',
                viewMetadata: solidFormViewMetaData?.data?.solidView
            }
            if (dynamicHeader) {
                DynamicFunctionComponent = getExtensionFunction(dynamicHeader);
                if (DynamicFunctionComponent) {
                    const updatedFormLayout = DynamicFunctionComponent(event);
                    if (updatedFormLayout && updatedFormLayout?.layoutChanged && updatedFormLayout?.newLayout) {
                        const newFormLayout = {
                            ...formLayout,
                            data: {
                                ...formLayout.data,
                                solidView: {
                                    ...formLayout.data.solidView,
                                    layout: updatedFormLayout.newLayout
                                }
                            }
                        };
                        formLayout = newFormLayout;
                    }
                }
            }
            setFormViewMetaData(formLayout);
            if (params.customLayout) {
                setFormViewLayout(params.customLayout);
            } else {
                setFormViewLayout(formLayout.data.solidView.layout);
            }
        }
    }, [solidFormViewMetaData, solidFormViewData]);

    useEffect(() => {
        const handleDynamicFunction = async () => {
            if (solidFormViewData) {
                const dynamicHeader = solidFormViewMetaData?.data?.solidView?.layout?.onFormDataLoad;

                let DynamicFunctionComponent = null;
                let formViewData = solidFormViewData?.data;

                const event: SolidLoadForm = {
                    fieldsMetadata: solidFormViewMetaData,
                    formData: solidFormViewData?.data,
                    type: dynamicHeader,
                    viewMetadata: solidFormViewMetaData?.data?.solidView
                };

                if (dynamicHeader) {
                    DynamicFunctionComponent = getExtensionFunction(dynamicHeader);

                    if (DynamicFunctionComponent) {
                        const updatedFormData = await DynamicFunctionComponent(event);

                        if (updatedFormData && updatedFormData?.dataChanged && updatedFormData?.newFormData) {
                            formViewData = updatedFormData.newFormData;
                        }
                    }
                }
                setInitialEntityData(formViewData);
            }
        };

        handleDynamicFunction();
    }, [solidFormViewData]);

    let formik: FormikObject;

    // If either the metadata or the data of this form is loading, then we simply render a loading screen...
    if (solidFormViewMetaDataIsLoading || solidFormViewDataIsLoading || !formViewLayout) {
        formik = useFormik({
            initialValues: {},
            validationSchema: Yup.object(),
            enableReinitialize: true,
            onSubmit: onFormikSubmit,
        });

        return <div>Rendering form...</div>;
    }
    // At this point everything required to render the form is loaded, so we go ahead and start rendering things dynamically...
    else {

        // Initialize formik...
        const solidView = solidFormViewMetaData.data.solidView;
        const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;

        const createHeaderTitle = `Create ${solidView.model.displayName}`;
        const editHeaderTitle = `Edit ${solidView.model.displayName}`;

        const validationSchema = {};
        const initialValues = {};

        for (let i = 0; i < layoutFields?.length; i++) {
            const formLayoutField = layoutFields[i];
            const fieldMetadata = solidFieldsMetadata[formLayoutField.attrs.name];
            const fieldContext: SolidFieldProps = {
                fieldMetadata: fieldMetadata,
                field: formLayoutField,
                data: initialEntityData,
                solidFormViewMetaData: solidFormViewMetaData,
                modelName: params.modelName
            }
            let solidField = fieldFactory(fieldMetadata?.type, fieldContext);
            if (!fieldMetadata?.type) {
                const errorMessage = formLayoutField.attrs.label;
                if (!errorFields.includes(errorMessage)) {
                    errorFields.push(errorMessage);
                }
            }
            if (solidField) {
                // @ts-ignore
                validationSchema[formLayoutField.attrs.name] = solidField.validationSchema();
                // @ts-ignore
                initialValues[formLayoutField.attrs.name] = solidField.initialValue();

            }
        }

        formik = useFormik({
            initialValues: initialValues,
            validationSchema: Yup.object(validationSchema),
            enableReinitialize: true,
            onSubmit: onFormikSubmit,
        });

        const formFieldOnXXX = async (event: ChangeEvent<HTMLInputElement>, eventType: string) => {

            // Invoke the formik change 
            if (eventType === 'onFieldChange') {
                formik.handleChange(event);
            }

            // get details from the form event
            const { name: fieldName, value, type, checked } = event.target;
            // console.log(`${eventType}: formFieldOnXXX ${fieldName} invoked for change with value:`, value);

            // TODO: check if there is a change handler registered with this form view, load it and fire it.
            const changeHandler = solidView.layout[eventType];
            // console.log(`changeHandler for this form is ${changeHandler}`);

            if (changeHandler) {
                // Get hold of the dynamic module...
                // const dynamicChangeHandler = await loadDynamicModule(changeHandler);
                const dynamicChangeHandler = getExtensionFunction(changeHandler);

                // Invoke the dynamic module...
                if (dynamicChangeHandler) {
                    const event: SolidUiEvent = {
                        fieldsMetadata: solidFieldsMetadata,
                        formData: formik.values,
                        modifiedField: fieldName,
                        modifiedFieldValue: value,
                        // @ts-ignore
                        // TODO: HP & OR: This will be fixed once we figure out how to get types exported from solid-core-ui
                        type: eventType,
                        viewMetadata: solidView
                    }

                    // Invoke the dynamic change handler: 
                    // TODO: encapsulate in try/catch, catch the exception render in the UI as an error & stop form rendering.
                    const updatedFormInfo = await dynamicChangeHandler(event);
                    // console.log(`${eventType}: formFieldOnXXX response received: `, updatedFormInfo);

                    // If dataChanged is true, update Formik values
                    if (updatedFormInfo?.dataChanged && updatedFormInfo.newFormData) {
                        // This does one field at a time.
                        // TODO: does the below fire change events again?
                        Object.entries(updatedFormInfo.newFormData).forEach(([key, newValue]) => {
                            formik.setFieldValue(key, newValue);
                        });

                        // This does all at once.
                        // formik.setValues({
                        //     ...formik.values,
                        //     ...updatedFormInfo.newFormData
                        // });
                    }

                    // if layout has changed then we need to re-render.
                    if (updatedFormInfo?.layoutChanged && updatedFormInfo.newLayout) {
                        // setFormViewMetaData({ ...formViewMetaData, layout: updatedFormInfo.newLayout });
                        // console.log(`Existing form view metadata is: `, formViewMetaData);

                        // TODO: this will trigger a useEffect dependent on formViewMetadata that invokes setFormViewLayout, 
                        // TODO: which means that this will not work if custom layout has been injected as a prop.
                        setFormViewLayout(updatedFormInfo.newLayout);
                        setFormViewMetaData((prevMetaData: any) => {
                            const updatedFormViewMetadata = {
                                ...prevMetaData,
                                data: {
                                    ...prevMetaData.data,
                                    solidView: {
                                        ...prevMetaData.data.solidView,
                                        layout: updatedFormInfo.newLayout,
                                    },
                                },
                            };
                            // console.log(`Updated form view metadata is: `, updatedFormViewMetadata);
                            return updatedFormViewMetadata;
                        });
                    }
                }
                else {
                    // TODO: Show an error popup and stop form rendering ideallly...
                    console.log(`Unable to load dynamic module:`, changeHandler);
                }
            }
        }

        // Now render the form dynamically...
        const renderFormElementDynamically: any = (element: any, solidFormViewMetaData: any) => {
            let { type, attrs, body, children } = element;

            // const key = attrs?.name ?? generateRandomKey();
            const key = attrs?.name;
            let visible = attrs?.visible;
            if (visible === undefined || visible === null) {
                visible = true;
            }
            // console.log(`Resolved visibility of form element ${key} to ${visible}`);
            // console.log(`Form element ${key}: `, attrs);

            switch (type) {
                case "form":
                    if (!children)
                        children = [];
                    return <div key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</div>;
                case "div":
                    if (!children)
                        children = [];
                    return <div key={key} {...attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</div>
                case "span":
                    return <span key={key} {...attrs}>{body}</span>
                case "p":
                    return <p key={key} {...attrs}>{body}</p>
                case "h1":
                    return <h1 key={key} {...attrs}>{body}</h1>
                case "h2":
                    return <h2 key={key} {...attrs}>{body}</h2>
                case "ul":
                    if (!children)
                        children = [];
                    return <ul key={key} {...attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</ul>
                case "li":
                    return <li key={key} {...attrs}>{body}</li>
                case "sheet":
                    return <SolidSheet key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidSheet>;
                case "group":
                    if (visible === true) {
                        return <SolidGroup key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidGroup>;
                    }
                case "row":
                    if (visible === true) {
                        return <SolidRow key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidRow>;
                    }
                case "column":
                    if (visible === true) {
                        return <SolidColumn key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidColumn>;
                    }
                case "field": {
                    if (visible === true) {

                        // const fieldMetadata = solidFieldsMetadata[attrs.name];
                        const fieldMetadata = solidFormViewMetaData.data.solidFieldsMetadata[attrs.name];
                        // Read only permission if there is no update permission on model and router doesnt contains new
                        const readOnlyPermission = !actionsAllowed.includes(`${updatePermission(params.modelName)}`) && params.id !== "new";
                        return <SolidField
                            key={key}
                            field={element}
                            formik={formik}
                            fieldMetadata={fieldMetadata}
                            initialEntityData={solidFormViewData ? solidFormViewData.data : null}
                            solidFormViewMetaData={solidFormViewMetaData}
                            modelName={params.modelName}
                            readOnly={readOnlyPermission}
                            viewMode={viewMode}
                            onChange={formFieldOnXXX}
                            onBlur={formFieldOnXXX}
                            setLightboxUrls={setLightboxUrls}
                            setOpenLightbox={setOpenLightbox}
                        />;
                    }
                }
                case "notebook":
                    if (visible === true) {
                        return <SolidNotebook key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData))}</SolidNotebook>;
                    }
                case "page":
                    // console.log(`Resolved visibility of form element ${key} to ${visible}`);
                    if (visible === true) {
                        const pageChildren = children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData));
                        return SolidPage({ children: pageChildren, attrs: attrs, key: key });
                    }
                case "custom":
                    if (visible === true) {
                        const widgetName = attrs?.widget;
                        const fieldMetadata = solidFormViewMetaData.data.solidFieldsMetadata[attrs.name];

                        if (widgetName) {
                            // widgetName, formik, field, fieldMetadata, solidFormViewMetaData
                            return <SolidDynamicWidget
                                key={key}
                                widgetName={widgetName}
                                field={element}
                                formik={formik}
                                fieldMetadata={fieldMetadata}
                                solidFormViewMetaData={solidFormViewMetaData}
                            />
                        }
                    }

                default:
                    return null;
            }
        };

        const renderFormDynamically = (solidFormViewMetaData: any) => {
            // console.log(`renderFormDynamically invoked....`);
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

        const formActionDropdown = () => {
            return (
                <div>
                    <Button
                        outlined
                        severity="secondary"
                        type="button"
                        icon={'pi pi-cog'}
                        size="small"
                        className="surface-card p-0"
                        style={{
                            height: 33.06,
                            width: 33.06
                        }}
                        onClick={(e) =>
                            // @ts-ignore 
                            op.current.toggle(e)
                        }
                    />
                    <OverlayPanel ref={op} className="solid-custom-overlay">
                        <div className="flex flex-column gap-1 p-1">
                            {/* <Button
                                text
                                type="button"
                                className="w-8rem text-left gap-2 text-color"
                                label="Duplicate"
                                size="small"
                                iconPos="left"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 11.9997C5.63333 11.9997 5.31944 11.8691 5.05833 11.608C4.79722 11.3469 4.66667 11.033 4.66667 10.6663V2.66634C4.66667 2.29967 4.79722 1.98579 5.05833 1.72467C5.31944 1.46356 5.63333 1.33301 6 1.33301H12C12.3667 1.33301 12.6806 1.46356 12.9417 1.72467C13.2028 1.98579 13.3333 2.29967 13.3333 2.66634V10.6663C13.3333 11.033 13.2028 11.3469 12.9417 11.608C12.6806 11.8691 12.3667 11.9997 12 11.9997H6ZM6 10.6663H12V2.66634H6V10.6663ZM3.33333 14.6663C2.96667 14.6663 2.65278 14.5358 2.39167 14.2747C2.13056 14.0136 2 13.6997 2 13.333V3.99967H3.33333V13.333H10.6667V14.6663H3.33333Z" fill="black" fill-opacity="0.88" />
                                </svg>}
                            /> */}
                            {params.embeded !== true &&
                                params.id !== "new" &&
                                actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                <Button
                                    text
                                    type="button"
                                    className="w-8rem text-left gap-2"
                                    label="Delete"
                                    size="small"
                                    iconPos="left"
                                    severity="danger"
                                    icon={'pi pi-trash'}
                                    onClick={() => setDeleteDialogVisible(true)}
                                />
                            }
                            <Button
                                text
                                type="button"
                                className="w-8rem text-left gap-2 purple-200"
                                label="Layout"
                                size="small"
                                iconPos="left"
                                severity="contrast"
                                icon={'pi pi-objects-column'}
                                onClick={() => setLayoutDialogVisible(true)}
                            />
                        </div>
                    </OverlayPanel>
                </div>
            )
        }

        // TODO: This was simply to demonstrate how we can use dynamic components, we will remove this and use it in a more sensible way in the layout. 
        // TODO: to demonstrated this you can simply add the below to the layout of the book form view.
        // TODO: "header": "BookFormViewDynamicComponent",
        const dynamicHeader = solidView.layout?.header;
        let DynamicHeaderComponent = null;
        if (dynamicHeader) {
            DynamicHeaderComponent = getExtensionComponent(dynamicHeader);
        }

        return (
            <div className="solid-form-wrapper">
                <Toast ref={toast} />
                <div className="solid-form-section" style={{ borderRight: params.embeded !== true ? '1px solid var(--primary-light-color' : '' }} >
                    <form style={{ width: '100%' }} onSubmit={formik.handleSubmit}>
                        <div className="solid-form-header">
                            {params.id === "new" ? (
                                <>
                                    <div className="flex align-items-center gap-3">
                                        {params.embeded !== true && <BackButton />}
                                        <div className="form-wrapper-title"> {createHeaderTitle}</div>
                                    </div>
                                    <div className="gap-3 flex">
                                        {params.embeded !== true &&
                                            actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                            !formViewLayout.attrs.readonly &&
                                            formik.dirty &&
                                            <div>
                                                <Button
                                                    label="Save"
                                                    size="small"
                                                    onClick={() => showError()}
                                                    type="submit"
                                                />
                                            </div>
                                        }
                                        {/* {params.embeded !== true &&
                                        actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
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
                                            />
                                        </div>
                                    } */}

                                        {/* Inline */}
                                        {params.embeded == true &&
                                            actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                            !formViewLayout.attrs.readonly &&
                                            formik.dirty &&
                                            <div>
                                                <Button
                                                    label="Save"
                                                    size="small"
                                                    onClick={() => {
                                                        setRedirectToList(false);
                                                        showError()
                                                    }}
                                                    type="submit"
                                                />
                                            </div>
                                        }
                                        {params.embeded == true &&
                                            <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' />

                                        }
                                        {params.embeded !== true &&
                                            <SolidCancelButton />
                                        }
                                        {formActionDropdown()}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex align-items-center gap-3">
                                        {params.embeded !== true && <BackButton />}
                                        <div className="form-wrapper-title"> {editHeaderTitle}</div>
                                    </div>
                                    <div className="gap-3 flex">
                                        {params.embeded !== true && viewMode === "view" &&
                                            <div>
                                                <Button
                                                    label="Edit"
                                                    size="small"
                                                    onClick={() => updateViewMode("edit")}
                                                    type="button"
                                                />
                                            </div>
                                        }

                                        {params.embeded !== true &&
                                            actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                            !formViewLayout.attrs.readonly &&
                                            formik.dirty &&
                                            <div>
                                                <Button
                                                    label="Save"
                                                    size="small"
                                                    onClick={() => showError()}
                                                    type="submit"
                                                />
                                            </div>
                                        }

                                        {/* Inline */}
                                        {params.embeded == true &&
                                            actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                            !formViewLayout.attrs.readonly &&
                                            formik.dirty &&
                                            <div>
                                                <Button
                                                    label="Save"
                                                    size="small"
                                                    onClick={() => showError()}
                                                    type="submit"
                                                />
                                            </div>
                                        }
                                        {/* {params.embeded !== true &&
                                        actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
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
                                            />
                                        </div>
                                    } */}
                                        {params.embeded == true &&
                                            actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                                            !formViewLayout.attrs.readonly &&
                                            <div>
                                                <Button
                                                    size="small"
                                                    type="button"
                                                    label="Delete"
                                                    severity="danger"
                                                    onClick={() => setDeleteDialogVisible(true)}
                                                />
                                            </div>
                                        }
                                        {params.embeded == true &&
                                            <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' />

                                        }
                                        {params.embeded !== true &&
                                            <SolidCancelButton />
                                        }
                                        {formActionDropdown()}
                                    </div>
                                </>
                            )}
                        </div>
                        {/* {params.embeded !== true &&
                        <SolidBreadcrumb
                            solidViewData={solidFormViewMetaData?.data?.solidView?.model}
                            initialEntityData={initialEntityData}
                        />
                    } */}
                        {params.embeded !== true &&
                            // <div className="solid-form-stepper">
                            <SolidFormHeader
                                // solidFormViewMetaData={solidFormViewMetaData?.data?.solidView?.model}
                                solidFormViewMetaData={solidFormViewMetaData}
                                initialEntityData={initialEntityData}
                                modelName={params.modelName}
                                id={params.id}
                            />
                            // </div>
                        }
                        <div className="p-4 solid-form-content">
                            {DynamicHeaderComponent && <DynamicHeaderComponent />}
                            {renderFormDynamically(formViewMetaData)}
                        </div>
                    </form>
                    {isShowChatter === true &&
                        <Button
                            icon="pi pi-chevron-right"
                            size="small"
                            text
                            className="chatter-collapse-btn"
                            style={{ width: 30 }}
                            onClick={() => setShowChatter(false)}
                        />
                    }
                </div>
                {params.embeded !== true &&
                    <div className={`chatter-section ${isShowChatter === false ? 'collapsed' : ''}`}>
                        {isShowChatter === false ?
                            <div className="flex flex-column gap-2 justify-content-center p-2">
                                <div className="chatter-collapsed-content">
                                    Chatter/Audit Trail
                                </div>
                                <Button
                                    icon="pi pi-chevron-left"
                                    size="small"
                                    className="px-0"
                                    style={{ width: 30 }}
                                    onClick={() => setShowChatter(true)}
                                />
                            </div>
                            : <SolidChatter />
                        }
                    </div>
                }
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
                <Dialog
                    visible={isLayoutDialogVisible}
                    header="Change Form Layout"
                    modal
                    onHide={() => setLayoutDialogVisible(false)}
                    contentStyle={{
                        width: 800
                    }}
                >
                    <SolidFormUserViewLayout solidFormViewMetaData={solidFormViewMetaData} setLayoutDialogVisible={setLayoutDialogVisible} />
                </Dialog>
                {openLightbox &&
                    <Lightbox
                        open={openLightbox}
                        plugins={[Counter, Download]}
                        close={() => setOpenLightbox(false)}
                        slides={lightboxUrls}
                    />
                }
            </div>
        );
    }
};

export default SolidFormView;