"use client";

import { SolidCancelButton } from "@/components/common/CancelButton";
import { permissionExpression } from "@/helpers/permissions";
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
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SolidFormWidgetProps, SolidLoadForm, SolidUiEventResponse } from "@/types/solid-core";
import { SolidPasswordField } from "./fields/SolidPasswordField";
import { SolidEmailField } from "./fields/SolidEmailField";
import { Panel } from "primereact/panel";
import { SolidFormStepper } from "@/components/common/SolidFormStepper";
import { SolidFormHeader } from "@/components/common/SolidFormHeader";
import { SolidFormUserViewLayout } from "./SolidFormUserViewLayout";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { SolidChatter } from "../chatter/SolidChatter";
import { SolidFormActionHeader } from "./SolidFormActionHeader";
import { SolidFormViewShimmerLoading } from "./SolidFormViewShimmerLoading";
import { useSelector } from "react-redux";
import { hasAnyRole } from "@/helpers/rolesHelper";
import SolidChatterLocaleTabView from "../locales/SolidChatterLocaleTabView";
import { ConfirmDialog } from "primereact/confirmdialog";
import { SolidXAIIcon } from "../solid-ai/SolidXAIIcon";
import { SolidXAIModule } from "../solid-ai/SolidXAIModule";
import { ERROR_MESSAGES } from "@/constants/error-messages";

export type SolidFormViewProps = {
    moduleName: string;
    modelName: string;
    id: string;
    embeded: boolean;
    handlePopupClose?: any,
    customCreateHandler?: any
    inlineCreateAutoSave?: boolean,
    customLayout?: any,
    parentData?: any,
    redirectToPath?: string,
    onEmbeddedFormSave?: () => void,
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

export const getLayoutFieldsAsObject = (layout: any[]): any => {
    const allFields = layout.flatMap(getLayoutFields);
    return allFields.reduce((result, field) => {
        if (field.attrs.name) {
            result[field.attrs.name] = { ...field };
        }
        return result;
    }, {});
}
export const getActualFieldMetadata = (key: string, solidFieldsMetadata: Record<string, any>) => {
    if (solidFieldsMetadata[key]) {
        return solidFieldsMetadata[key];
    }

    if (key.endsWith("Confirm")) {
        const baseKey = key.slice(0, -"Confirm".length); // Remove "Confirm"
        if (solidFieldsMetadata[baseKey]) {
            return solidFieldsMetadata[baseKey];
        }
    }

    return null; // or handle fallback
};


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
const SolidField = ({ formik, field, fieldMetadata, initialEntityData, solidFormViewMetaData, modelName, readOnly, viewMode, onChange, onBlur, parentData, setLightboxUrls, setOpenLightbox, onEmbeddedFormSave }: any) => {
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
    if (parentData) {
        fieldContext.parentData = parentData;
    }
    if (onEmbeddedFormSave) {
        fieldContext.onEmbeddedFormSave = onEmbeddedFormSave;
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

const SolidNotebook = ({ children, activeTab, embeded }: any) => {
    // const childrenArray = children;
    // const childrenArray = React.Children.toArray(children).filter(Boolean);
    const childrenArray = React.Children.toArray(children).filter(child => !!child);

    const router = useRouter();

    // Local state to manage active tab in embedded context
    const [localActiveTab, setLocalActiveTab] = useState(activeTab);

    const activeIndex = useMemo(() => {
        return childrenArray.findIndex((child: any) => {
            return child.key === (embeded ? localActiveTab : activeTab);
        });
    }, [childrenArray, activeTab, localActiveTab, embeded]);

    const handleTabChange = (e: any) => {
        const selectedChild = childrenArray[e.index] as any;
        const newTabLabel = selectedChild?.key;

        if (newTabLabel) {
            if (!embeded) {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('activeTab', newTabLabel);
                const updatedPath = currentUrl.toString();
                router.push(updatedPath);
            } else {
                // Update the active tab state locally for embedded view
                setLocalActiveTab(newTabLabel);
            }
        }
    };


    return (
        <div className="solid-tab-view w-full">
            <TabView activeIndex={activeIndex >= 0 ? activeIndex : 0} onTabChange={handleTabChange}>
                {/* {children} */}
                {childrenArray}
            </TabView>
        </div>
    )
};

const SolidDynamicWidget = ({ widgetName, formik, field, solidFormViewMetaData, solidFormViewData }: any) => {
    const solidView = solidFormViewMetaData.data.solidView;
    const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;

    let DynamicWidget = getExtensionComponent(widgetName);

    const widgetProps: SolidFormWidgetProps = {
        formData: formik.values,
        field: field,
        fieldsMetadata: solidFieldsMetadata,
        viewMetadata: solidView,
        formViewData: solidFormViewData
    }

    return (
        <div className="solid-tab-view w-full">
            {DynamicWidget && <DynamicWidget {...widgetProps} />}
        </div>
    )
};


const SolidPage = ({ attrs, children, key, formik, fields }: any) => {
    const fieldsName = fields.map((f: any) => f.attrs.name);
    const errorCount = formik.submitCount > 0 ? fieldsName.filter((name: any) => !!formik.errors[name]).length : 0;
    const label = (
        <span style={{ color: errorCount > 0 ? 'red' : 'inherit' }}>
            {attrs.label}{errorCount > 0 && ` (${errorCount})`}
        </span>
    );


    return (

        <TabPanel key={key} header={label} >
            <div className="p-fluid">{children}</div>
        </TabPanel>
    )

};

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
    const { user } = useSelector((state: any) => state.auth);
    const pathname = usePathname();
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const searchParams = useSearchParams();
    const [confirmVisible, setConfirmVisible] = useState(false);
    const confirmResolveRef = useRef<(value: boolean) => void>();
    const [redirectToList, setRedirectToList] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
    const [defaultEntityLocaleId, setDefaultEntityLocaleId] = useState<string | null>(null);
    const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [isLayoutDialogVisible, setLayoutDialogVisible] = useState(false);
    const [published, setPublished] = useState<string | null>(null);
    const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"view" | "edit">(params.embeded === true ? "edit" : "view");
    const [createMode, setCreateMode] = useState<boolean>(false);
    const [openLightbox, setOpenLightbox] = useState(false);
    const [lightboxUrls, setLightboxUrls] = useState([]);
    const [isShowChatter, setShowChatter] = useState(false);
    const [chatterLocaleWidth, setChatterLocaleWidth] = useState(380); // default width
    const [isResizingChatterLocale, setIsResizingChatterLocale] = useState(false);

    const [solidWorkflowFieldValue, setSolidWorkflowFieldValue] = useState<string>("");
    const [defaultTabViewOptionIndex, setDefaultTabViewOptionIndex] = useState<number>(1);
    const errorFields: string[] = [];

    const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
    const op = useRef(null);
    useEffect(() => {
        const stored = localStorage.getItem('chatter_locale_width');
        if (stored) {
            setChatterLocaleWidth(parseInt(stored, 10));
        }
    }, []);
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingChatterLocale) return;
            const newWidth = window.innerWidth - e.clientX;
            const clampedWidth = Math.max(280, Math.min(newWidth, 700));
            setChatterLocaleWidth(clampedWidth);
            localStorage.setItem('chatter_locale_width', clampedWidth.toString());
        };

        const handleMouseUp = () => {
            setIsResizingChatterLocale(false);
        };

        if (isResizingChatterLocale) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingChatterLocale]);


    useEffect(() => {
        const mode = searchParams.get('viewMode');
        const locale = searchParams.get('locale');
        const defaultEntityLocaleIdn = searchParams.get('defaultEntityLocaleId');
        if (params.id === 'new' && !locale) {
            setViewMode('edit');
            setCreateMode(true);
            return;
        }

        if (locale) {
            setSelectedLocale(locale);
        }

        if (defaultEntityLocaleIdn) {
            setDefaultEntityLocaleId(defaultEntityLocaleIdn);
        }

        // Set the viewMode based on the URL
        if (mode === 'view' || mode === 'edit') {
            setViewMode(mode);
        } else {
            setViewMode('view'); // Default to 'view' if no valid mode is provided
        }
    }, [searchParams, params.id]);

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
                    permissionExpression(params.modelName, 'create'),
                    permissionExpression(params.modelName, 'delete'),
                    permissionExpression(params.modelName, 'update'),
                    permissionExpression(params.modelName, 'findOne'),
                    permissionExpression('chatterMessage', 'findMany')
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
    //         errors.push({ field: this.fieldMetadata.name, error: `Invalid ids in ${ commandFieldName } ` });
    //     }
    // }y
    const entityApi = createSolidEntityApi(params.modelName);
    const {
        useCreateSolidEntityMutation,
        useDeleteSolidEntityMutation,
        useGetSolidEntityByIdQuery,
        useUpdateSolidEntityMutation,
        usePatchUpdateSolidEntityMutation
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

    const [
        patchEntity,
        { isSuccess: isEntityPatchSuceess, isError: isEntityPatchError, error: entityPatchError },
    ] = usePatchUpdateSolidEntityMutation();

    // - - - - - - - - - - - -- - - - - - - - - - - - METADATA here
    // Get the form view layout & metadata first. 
    const formViewMetaDataQs = qs.stringify({ ...params, viewType: 'form', defaultEntityLocaleId: defaultEntityLocaleId }, {
        encodeValuesOnly: true,
    });
    const [formViewMetaData, setFormViewMetaData] = useState({});
    const [formViewLayout, setFormViewLayout] = useState<any>(null);
    const {
        data: solidFormViewMetaData,
        isLoading: solidFormViewMetaDataIsLoading
    } = useGetSolidViewLayoutQuery(formViewMetaDataQs);
    const [refreshChatterMessage, setRefreshChatterMessage] = useState<boolean>(true);
    useEffect(() => {
        if (
            isEntityCreateSuccess == true ||
            isEntityUpdateSuceess == true ||
            isEntityDeleteSuceess == true
        ) {
            setRefreshChatterMessage(true);
            if (params.embeded == true && params.onEmbeddedFormSave) {
                params.onEmbeddedFormSave();
            }
            // Close The pop in case the form is used in embeded form
            if (params.embeded == true) {
                params.handlePopupClose()
            }
            if (redirectToList === true) {
                if (params.redirectToPath) {
                    router.push(params.redirectToPath);
                    window.location.reload();
                } else {
                    const segments = pathname.split('/').filter(Boolean); // Split and filter empty segments
                    const newPath = '/' + segments.slice(0, -2).join('/') + '/list'; // Remove last segment and add "/all"
                    router.push(newPath);
                }
            }
        }
    }, [isEntityCreateSuccess, isEntityUpdateSuceess, isEntityDeleteSuceess]);

    useEffect(() => {

        if (solidFormViewMetaData?.data?.solidView?.model?.internationalisation) {
            setDefaultTabViewOptionIndex(0)
            const matchedLocale = solidFormViewMetaData?.data?.applicableLocales?.find((x: any) => x.isDefault === 'yes');
            //this is to attach default locale when adding data in popup view where relations exists
            if (!selectedLocale && matchedLocale && !searchParams.get('locale')) {
                setSelectedLocale(matchedLocale.locale);
            }
        }

    }, [params.modelName, solidFormViewMetaData])

    function isFetchBaseQueryErrorWithErrorResponse(error: any): error is FetchBaseQueryError & { data: ErrorResponseData } {
        return error && typeof error === 'object' && 'data' in error && 'message' in error.data;
    }

    useEffect(() => {
        const handleError = (errorToast: any) => {
            let errorMessage: any = [ERROR_MESSAGES.ERROR_OCCURED];

            if (isFetchBaseQueryErrorWithErrorResponse(errorToast)) {
                errorMessage = errorToast.data.message;
            } else {
                errorMessage = [ERROR_MESSAGES.SOMETHING_WRONG];
            }

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                sticky: true,
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

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            ...(severity === "error"
            ? { sticky: true }            // stays until user closes
            : { life: 3000 }),
        });
    };

    const confirmDialogWithPromise = () => {
        return new Promise<boolean>((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmVisible(true);
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
                //  const fieldMetadata = getActualFieldMetadata(key, solidFieldsMetadata);
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
                if (value !== undefined && value !== null && key.endsWith("Confirm")) {
                    formData.append(key, String(value))
                }

            });

            let solidWorkflowField = solidFormViewMetaData?.data?.solidView?.layout?.attrs?.workflowField;
            if (params.id !== "new") {
                if (solidFormViewMetaData?.data?.solidFormViewWorkflowData) {
                    if (solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.type === "selectionStatic") {
                        formData.append(solidWorkflowField, solidWorkflowFieldValue);
                    }
                    if (solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.type === "many-to-one") {
                        formData.append(`${solidWorkflowField}Id`, solidWorkflowFieldValue);
                    }
                }
            }
            if (solidFormViewMetaData?.data?.solidView?.model?.internationalisation) {
                if (selectedLocale && !formData.has('localeName')) {
                    formData.append('localeName', selectedLocale);
                }
                if (defaultEntityLocaleId) {
                    formData.append('defaultEntityLocaleId', defaultEntityLocaleId.toString());
                }
            }
            if (solidFormViewMetaData?.data?.solidView?.model?.draftPublishWorkflow) {
                if (published) {
                    formData.append('publishedAt', published);
                }
            }
            if (params.inlineCreateAutoSave === true) {
                params.customCreateHandler(formData);
            } else {
                if (params.id === 'new') {
                    // default locale
                    const result = await createEntity(formData).unwrap();
                    showToast("success", ERROR_MESSAGES.FORM_SAVED, ERROR_MESSAGES.FORM_SAVED_SUCCESSFULLY);
                    // if (!params.embeded && result?.data?.id) {
                    //     const newPathname = pathname.replace(/new$/, result.data.id);

                    //     const params = new URLSearchParams(searchParams.toString());
                    //     params.set("viewMode", "view");

                    //     const updatedUrl = `${newPathname}?${params.toString()}`;
                    //     await router.push(updatedUrl, { scroll: false });

                    //     setViewMode("view")
                    // }
                    if (!params.embeded) {
                        const currentUrl = new URL(window.location.href);
                        currentUrl.pathname = currentUrl.pathname.replace(/new$/, result?.data?.id);
                        const updatedUrl = currentUrl.toString();
                        router.push(updatedUrl);
                        const updatedPath = currentUrl.toString();
                        setViewMode("view")
                    }
                    return result;
                }
                else {
                    // updateEntity({ id: +params.id, data: formData });
                    const result = await updateEntity({ id: +params.id, data: formData }).unwrap();
                    // const result = await updateEntity({ id: +params.id, data: formData }).unwrap();
                    if (!params.embeded) {
                        showToast("success", ERROR_MESSAGES.FORM_UPDATE, ERROR_MESSAGES.FORM_UPDATE_SUCCESSFULLY);
                        if (result?.statusCode === 200) {
                            updateViewMode("view")
                        }
                    }
                    return result;

                }
            }

        } catch (err) {
            console.error(ERROR_MESSAGES.ENTITY_FAILED, err);
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
    useEffect(() => {
        if (errorFields?.length > 0) {
            showFieldError();
        }
    }, [errorFields])


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
        if (formViewLayout.attrs?.workflowField && solidFieldsMetadata[formViewLayout.attrs.workflowField]?.type === 'relation' && solidFieldsMetadata[formViewLayout.attrs.workflowField]?.relationType === 'many-to-one') {
            toPopulate.push(solidFieldsMetadata[formViewLayout.attrs.workflowField].name);
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
        const handleDynamicLayout = async () => {
            if (solidFormViewMetaData) {
                let formLayout = solidFormViewMetaData;
                let customLayout = params?.customLayout;
                const dynamicHeader = solidFormViewMetaData?.data?.solidView?.layout?.onFormLayoutLoad;
                let DynamicFunctionComponent = null;
                const event: SolidLoadForm = {
                    parentData: params?.parentData,
                    fieldsMetadata: solidFormViewMetaData,
                    formData: solidFormViewData?.data,
                    type: 'onFormLayoutLoad',
                    viewMetadata: solidFormViewMetaData?.data?.solidView,
                    formViewLayout: formViewLayout
                }
                if (dynamicHeader) {
                    DynamicFunctionComponent = getExtensionFunction(dynamicHeader);
                    if (DynamicFunctionComponent) {
                        try {
                            const updatedFormLayout: SolidUiEventResponse = await DynamicFunctionComponent(event);
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
                                customLayout = updatedFormLayout.newLayout;
                            }
                        } catch (error) {
                            console.error(ERROR_MESSAGES.DYNAMIC_FUNCTION_ERROR, error);
                        }
                    }
                }
                setFormViewMetaData(formLayout);
                setPublished(solidFormViewData?.data?.publishedAt)
                if (params.customLayout) {
                    setFormViewLayout(customLayout);
                } else {
                    setFormViewLayout(formLayout.data.solidView.layout);
                }
            }
        };
        const handleDynamicFunction = async () => {
            const dynamicHeader = solidFormViewMetaData?.data?.solidView?.layout?.onFormDataLoad;
            let DynamicFunctionComponent = null;
            let formViewData = solidFormViewData?.data;

            const event: SolidLoadForm = {
                fieldsMetadata: solidFormViewMetaData,
                formData: solidFormViewData?.data,
                type: "onFormDataLoad",
                viewMetadata: solidFormViewMetaData?.data?.solidView,
                formViewLayout: formViewLayout
            };

            if (dynamicHeader) {
                DynamicFunctionComponent = getExtensionFunction(dynamicHeader);
                if (DynamicFunctionComponent) {
                    const updatedFormData: SolidUiEventResponse = await DynamicFunctionComponent(event);

                    if (updatedFormData && updatedFormData?.dataChanged && updatedFormData?.newFormData) {
                        formViewData = updatedFormData.newFormData;
                    }
                }
                if (formViewData) {
                    setInitialEntityData(formViewData);
                }
            }
        };

        const handleOnFormLoad = async () => {
            const onFormLoadHandler = solidFormViewMetaData?.data?.solidView?.layout?.onFormLoad;
            let DynamicFunctionComponent = null;
            let formLayout = solidFormViewMetaData;
            let customLayout = params?.customLayout;
            let formViewData = solidFormViewData?.data;

            const event: SolidLoadForm = {
                parentData: params?.parentData,
                fieldsMetadata: solidFormViewMetaData,
                formData: solidFormViewData?.data,
                type: 'onFormLoad',
                viewMetadata: solidFormViewMetaData?.data?.solidView,
                formViewLayout: formViewLayout
            };

            if (onFormLoadHandler) {
                DynamicFunctionComponent = getExtensionFunction(onFormLoadHandler);
                if (DynamicFunctionComponent) {
                    try {
                        const result: SolidUiEventResponse = await DynamicFunctionComponent(event);
                        if (result && result?.layoutChanged && result?.newLayout) {
                            const newFormLayout = {
                                ...formLayout,
                                data: {
                                    ...formLayout.data,
                                    solidView: {
                                        ...formLayout.data.solidView,
                                        layout: result.newLayout
                                    }
                                }
                            };
                            formLayout = newFormLayout;
                            customLayout = result.newLayout;
                            setFormViewMetaData(formLayout);

                            if (params.customLayout) {
                                setFormViewLayout(customLayout);
                            } else {
                                setFormViewLayout(formLayout.data.solidView.layout);
                            }
                        }
                        if (result && result?.dataChanged && result?.newFormData) {
                            formViewData = result.newFormData;
                            setInitialEntityData(formViewData);
                        }
                    } catch (error) {
                        console.error(ERROR_MESSAGES.ON_FORM_LOAD, error);
                    }
                }
            }
        };

        handleDynamicLayout();
        handleDynamicFunction();
        handleOnFormLoad();
    }, [solidFormViewMetaData, solidFormViewData]);

    useEffect(() => {
        if (solidFormViewData) {
            setInitialEntityData(solidFormViewData.data);
        }
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

        return <SolidFormViewShimmerLoading />;
    }
    // At this point everything required to render the form is loaded, so we go ahead and start rendering things dynamically...
    else {

        // Initialize formik...
        const solidView = solidFormViewMetaData.data.solidView;
        const solidFieldsMetadata = solidFormViewMetaData.data.solidFieldsMetadata;

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
            if (params.parentData) {
                fieldContext.parentData = params.parentData;
            }
            let solidField = fieldFactory(fieldMetadata?.type, fieldContext);
            if (!fieldMetadata?.type) {
                const errorMessage = formLayoutField?.attrs?.label ? formLayoutField?.attrs?.label : formLayoutField.attrs.name;
                if (!errorFields.includes(errorMessage)) {
                    // errorFields.push(errorMessage);
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

            // TODO: check if there is a change handler registered with this form view, load it and fire it.
            let changeHandler = solidView.layout.attrs[eventType];
            if (!changeHandler) {
                changeHandler = solidView.layout[eventType];
            }

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
                        viewMetadata: solidView,
                        formViewLayout: formViewLayout
                    }

                    // Invoke the dynamic change handler: 
                    // TODO: encapsulate in try/catch, catch the exception render in the UI as an error & stop form rendering.
                    const updatedFormInfo: SolidUiEventResponse = await dynamicChangeHandler(event);

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
                            return updatedFormViewMetadata;
                        });
                    }
                }
                else {
                    // TODO: Show an error popup and stop form rendering ideallly...
                    console.log(ERROR_MESSAGES.UNABLE_LOAD_DYNAMIC_MODULE, changeHandler);
                }
            }
        }

        // Now render the form dynamically...
        const renderFormElementDynamically: any = (element: any, solidFormViewMetaData: any) => {
            let { type, attrs, body, children } = element;

            // const key = attrs?.name ?? generateRandomKey();
            const key = attrs?.label;
            let visible = attrs?.visible;
            if (visible === undefined || visible === null) {
                visible = true;
            }
            // console.log(`Resolved visibility of form element ${ key } to ${ visible } `);
            // console.log(`Form element ${ key }: `, attrs);
            const visibleToRole = attrs?.roles || [];

            if (visibleToRole.length > 0) {
                if (!hasAnyRole(user?.user?.roles, visibleToRole)) {
                    return <></>
                }
            }

            switch (type) {
                case "form":
                    if (!children)
                        children = [];
                    return <div key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</div>;
                case "div":
                    if (!children)
                        children = [];
                    return <div key={key} {...attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</div>
                case "span":
                    return <span key={key} {...attrs}>{body}</span>
                case "p":
                    return <p key={key} className={attrs?.className} {...attrs}>{body}</p>
                case "h1":
                    return <h1 key={key} {...attrs}>{body}</h1>
                case "h2":
                    return <h2 key={key} {...attrs}>{body}</h2>
                case "ul":
                    if (!children)
                        children = [];
                    return <ul key={key} {...attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</ul>
                case "li":
                    return <li key={key} {...attrs}>{body}</li>
                case "sheet":
                    return <SolidSheet key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</SolidSheet>;
                case "group":
                    if (visible === true) {
                        return <SolidGroup key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</SolidGroup>;
                    }
                case "row":
                    if (visible === true) {
                        return <SolidRow key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</SolidRow>;
                    }
                case "column":
                    if (visible === true) {
                        return <SolidColumn key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</SolidColumn>;
                    }
                case "field": {
                    if (visible === true) {

                        // const fieldMetadata = solidFieldsMetadata[attrs.name];
                        const fieldMetadata = solidFormViewMetaData.data.solidFieldsMetadata[attrs.name];
                        // Read only permission if there is no update permission on model and router doesnt contains new
                        const readOnlyPermission = !actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) && params.id !== "new";
                        return <SolidField
                            key={attrs.name}
                            field={element}
                            formik={formik}
                            fieldMetadata={fieldMetadata}
                            initialEntityData={solidFormViewData ? solidFormViewData.data : {}}
                            solidFormViewMetaData={solidFormViewMetaData}
                            modelName={params.modelName}
                            readOnly={readOnlyPermission}
                            viewMode={viewMode}
                            onChange={formFieldOnXXX}
                            onBlur={formFieldOnXXX}
                            setLightboxUrls={setLightboxUrls}
                            setOpenLightbox={setOpenLightbox}
                            parentData={params.parentData}
                            onEmbeddedFormSave={() => setRefreshChatterMessage(true)}
                        />;
                    }
                }
                case "notebook":
                    if (visible === true) {
                        return <SolidNotebook key={key} activeTab={searchParams.get("activeTab") || ""} embeded={params.embeded}>{children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData, formik))}</SolidNotebook>;
                    }
                case "page":
                    if (visible === true) {
                        const fields = children.flatMap((child: any) => getLayoutFields(child));
                        const pageChildren = children.map((element: any) => renderFormElementDynamically(element, solidFormViewMetaData));
                        return SolidPage({ children: pageChildren, attrs: attrs, key: key, formik: formik, fields });
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
                                solidFormViewData={solidFormViewData}
                            />
                        }
                    }

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
        // TODO: This was simply to demonstrate how we can use dynamic components, we will remove this and use it in a more sensible way in the layout. 
        // TODO: to demonstrated this you can simply add the below to the layout of the book form view.
        // TODO: "header": "BookFormViewDynamicComponent",
        const dynamicHeader = solidView.layout?.header;
        let DynamicHeaderComponent = null;
        if (dynamicHeader) {
            DynamicHeaderComponent = getExtensionComponent(dynamicHeader);
        }
        const customFormComponentEdit = solidView.layout.attrs.customFormComponentEdit;
        const customFormComponentNew = solidView.layout.attrs.customFormComponentNew;
        let DynamicFormComponentEdit = null;
        let DynamicFormComponentNew = null;
        if (customFormComponentEdit) {
            DynamicFormComponentEdit = getExtensionComponent(customFormComponentEdit);
        }
        if (customFormComponentNew) {
            DynamicFormComponentNew = getExtensionComponent(customFormComponentNew);
        }

        const handleChatterExpandClick = (option?: string) => {
            setShowChatter(true);
            if (option === 'locale') {
                setDefaultTabViewOptionIndex(0);
            } else if (option === 'chatter') {
                setDefaultTabViewOptionIndex(1);
                setRefreshChatterMessage(true);
            } else {
                setDefaultTabViewOptionIndex(2);
            }
        };

        //en 4 null
        const handleLocaleChangeRedirect = (
            locale: string,
            defaultEntityLocaleId: string,
            viewMode: string,
        ) => {
            let newViewMode = viewMode;
            const defaultApplicableLocales = solidFormViewMetaData?.data?.applicableLocales || [];
            //fr 4
            const matchingLocale = defaultApplicableLocales.find(
                (loc: any) =>
                    loc.defaultEntityLocaleId &&
                    loc.entityId &&
                    loc.locale === locale
            );
            // Extract the base path from the current pathname, removing query params if any
            const basePath = pathname.split('?')[0];

            // Determine entity part of the path (new or existing entityId)
            const entityPart = matchingLocale?.entityId ?? 'new';
            if (entityPart === 'new' && viewMode === 'view') {
                newViewMode = 'edit'
            } else if (entityPart !== 'new' && viewMode === 'view') {
                newViewMode = 'view'
            } else {
                newViewMode = 'edit'
            }
            // Construct new pathname using existing basePath and replacing entity segment
            const updatedPath = basePath.replace(/\/form\/[^/]+/, `/form/${entityPart}`);

            const queryParams = new URLSearchParams({
                viewMode: newViewMode,
                locale,
                defaultEntityLocaleId,
            });

            router.push(`${updatedPath}?${queryParams.toString()}`, { scroll: false });
        };

        const handleConfirmAccept = () => {
            confirmResolveRef.current?.(true);
            setConfirmVisible(false);
        };

        const handleConfirmReject = () => {
            confirmResolveRef.current?.(false);
            setConfirmVisible(false);
        };
        const handleDraftPublishWorkFlow = async (type: string) => {
            const userChoice = await confirmDialogWithPromise();
            if (!userChoice) return; // Optional: handle cancel
            let finalPublishedValue = type === 'publish' ? new Date().toISOString() : '';
            setPublished(finalPublishedValue);
            let formdata = new FormData();
            formdata.append('publishedAt', finalPublishedValue)
            const result = await patchEntity({ id: +params.id, data: formdata }).unwrap();
            setPublished(result?.data?.publishedAt);
            if (type === 'publish') {
                showToast("success", ERROR_MESSAGES.SAVED, ERROR_MESSAGES.MARK_PUBLISH);
                //todo: patch request
            } else {
                showToast("success", ERROR_MESSAGES.SAVED, ERROR_MESSAGES.MARK_UNPUBLISH);
            }
        }

        const isVideoOrAudio = (url: string) => {
            // Remove query params if present
            const cleanUrl = url.split("?")[0];
            const ext = cleanUrl.split(".").pop()?.toLowerCase();

            // Combined list of supported media extensions
            const mediaExt = ["mp4", "webm", "ogg", "mov", "mp3", "wav", "m4a", "aac"];

            return ext ? mediaExt.includes(ext) : false;
        };

        const controlsList = ["nodownload", "nofullscreen", "noremoteplayback"];
        const slides = lightboxUrls.map((item: any) => {
            const url = item.src || item.downloadUrl || "";
            if (isVideoOrAudio(url)) {
                return {
                    type: "video" as const,
                    sources: [{ src: url, type: "video/mp4", }],
                };
            }
            return { src: url };
        });

        const hasMedia = slides.some((s) => s.type === "video");


        console.log("lightbox urls", slides);

        return (
            <div className="solid-form-wrapper">
                <Toast ref={toast} />
                <div className="solid-form-section" style={{ borderRight: params.embeded !== true ? '1px solid var(--primary-light-color)' : '' }} >
                    <form style={{ width: '100%' }} onSubmit={formik.handleSubmit}>
                        <SolidFormActionHeader
                            formik={formik}
                            params={params}
                            actionsAllowed={actionsAllowed}
                            formViewLayout={formViewLayout}
                            solidView={solidView}
                            solidFormViewMetaData={solidFormViewMetaData}
                            initialEntityData={solidFormViewData ? solidFormViewData.data : {}}
                            setDeleteDialogVisible={setDeleteDialogVisible}
                            setLayoutDialogVisible={setLayoutDialogVisible}
                            setRedirectToList={setRedirectToList}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            solidWorkflowFieldValue={solidWorkflowFieldValue}
                            setSolidWorkflowFieldValue={setSolidWorkflowFieldValue}
                            draftEnabled={solidFormViewMetaData?.data?.solidView?.model?.draftPublishWorkflow}
                            publish={published}
                            internationalisationEnabled={solidFormViewMetaData?.data?.solidView?.model?.internationalisation}
                            handleDraftPublishWorkFlow={handleDraftPublishWorkFlow}
                        />
                        <div className={`p-3 md:p-4 solid-form-content ${params.embeded === true ? 'h-auto' : ''}`} style={{ maxHeight: params.embeded === true ? '80vh' : '', overflowY: 'auto' }}>
                            {DynamicHeaderComponent && <DynamicHeaderComponent />}
                            {params.id === 'new' && DynamicFormComponentNew ? (
                                <DynamicFormComponentNew params={params} />
                            ) : params.id !== 'new' && DynamicFormComponentEdit ? (
                                <DynamicFormComponentEdit params={params} />
                            ) : (
                                renderFormDynamically(formViewMetaData)
                            )}
                        </div>
                    </form>
                </div>
                {params.embeded !== true &&
                    <div className={`chatter-section ${isShowChatter === false ? 'collapsed' : ''}`} style={{ width: chatterLocaleWidth }}>
                        {isShowChatter && (
                            <div
                                style={{
                                    width: 5,
                                    cursor: 'col-resize',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    zIndex: 9,
                                }}
                                onMouseDown={() => setIsResizingChatterLocale(true)}
                            />
                        )}
                        {isShowChatter === true &&
                            <Button
                                icon="pi pi-angle-double-right"
                                size="small"
                                text
                                className="chatter-collapse-btn"
                                style={{ width: 30, height: 30, aspectRatio: '1/1' }}
                                onClick={() => setShowChatter(false)}
                            />
                        }
                        {isShowChatter === false ?
                            <div className="flex flex-column gap-2 justify-content-center p-2">
                                {/*if solidview Internationalisation is enabled then show the locale tab */}
                                {solidFormViewMetaData?.data?.solidView?.model?.internationalisation &&
                                    <div className="chatter-collapsed-content" onClick={() => handleChatterExpandClick('locale')}>
                                        Internationalisation
                                    </div>}
                                <div className="chatter-collapsed-content" onClick={() => handleChatterExpandClick('chatter')}>
                                    Audit Trail
                                </div>
                                {
                                    process.env.NEXT_PUBLIC_ENABLE_SOLIDX_AI === 'true' &&
                                    (
                                        <div className="chatter-collapsed-content" onClick={() => handleChatterExpandClick('solidx-ai')}>
                                            <div className="flex gap-2"> <SolidXAIIcon /> SolidX AI </div>
                                        </div>
                                    )
                                }
                                <Button
                                    icon="pi pi-chevron-left"
                                    size="small"
                                    className="px-0"
                                    style={{ width: 30 }}
                                    onClick={() => handleChatterExpandClick('default')}
                                />
                            </div>
                            :
                            <SolidChatterLocaleTabView
                                createMode={createMode}
                                setSelectedLocale={setSelectedLocale}
                                selectedLocale={selectedLocale}
                                solidFormViewMetaData={solidFormViewMetaData}
                                id={params.id}
                                refreshChatterMessage={refreshChatterMessage}
                                setRefreshChatterMessage={setRefreshChatterMessage}
                                activeTab={defaultTabViewOptionIndex}
                                viewMode={viewMode}
                                defaultEntityLocaleId={defaultEntityLocaleId}
                                handleLocaleChangeRedirect={handleLocaleChangeRedirect}
                                solidFormViewData={solidFormViewData}
                                published={published}
                                actionsAllowed={actionsAllowed}
                            />
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
                        plugins={
                            hasMedia
                                ? [Counter, Download, Video] // add Video plugin if needed
                                : [Counter, Download]
                        }
                        close={() => setOpenLightbox(false)}
                        slides={[...slides]}
                        {...(hasMedia && {
                            video: {
                                controls: true,
                                playsInline: true,
                                autoPlay: false,
                                loop: false,
                                muted: false,
                                disablePictureInPicture: false,
                                disableRemotePlayback: false,
                                controlsList: controlsList.join(" "),
                                crossOrigin: "anonymous",
                                preload: "auto",
                            },
                        })}
                    />
                }

                <ConfirmDialog
                    visible={confirmVisible}
                    onHide={() => setConfirmVisible(false)}
                    header="Confirmation"
                    acceptLabel="Yes, confrim"
                    rejectLabel="No, cancel"
                    acceptClassName="p-button-danger"
                    rejectClassName="p-button-text"
                    position="center"
                    accept={handleConfirmAccept}
                    reject={handleConfirmReject}
                    message={
                        <div className="flex flex-col items-center justify-center text-center space-y-3">
                            <p className="text-gray-800 text-base">
                                Are you sure you want to {published !== null ? 'unpublish' : 'publish'}?
                            </p>
                        </div>
                    }
                />
            </div>
        );
    }
};

export default SolidFormView;