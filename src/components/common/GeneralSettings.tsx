import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useCallback, useEffect, useState } from 'react'
import { CancelButton } from './CancelButton';
import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from 'primereact/radiobutton';
import { usePathname } from "../../hooks/usePathname";
import { InputTextarea } from 'primereact/inputtextarea';
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import AuthScreenRightBackgroundImage from '../../resources/images/auth/solid-left-layout-bg.png';
import AuthScreenLeftBackgroundImage from '../../resources/images/auth/solid-right-layout-bg.png';
import AuthScreenCenterBackgroundImage from '../../resources/images/auth/solid-login-light.png';
import { useDropzone } from 'react-dropzone';
import { Divider } from 'primereact/divider';
import { SettingDropzoneActivePlaceholder } from './SolidSettings/SettingDropzoneActivePlaceholder';
import { SolidUploadedImage } from './SolidSettings/SolidUploadedImage';
import { SettingsImageRemoveButton } from './SolidSettings/SettingsImageRemoveButton';
import { Dropdown } from 'primereact/dropdown';
import { AiModelConfigTab, ModelConfig } from './SolidSettings/LlmSettings/AiModelConfigTab';
import { useDispatch, useSelector } from 'react-redux';
import { ERROR_MESSAGES } from '../../constants/error-messages';
import { useBulkUpdateSolidSettingsMutation, useLazyGetSolidSettingsQuery } from '../../redux/api/solidSettingsApi';
import { env } from "../../adapters/env";
import { showToast } from '../../redux/features/toastSlice';


export const GeneralSettings = () => {
    const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
    const [authScreenRightBackgroundImagePreview, setAuthScreenRightBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenLeftBackgroundImagePreview, setAuthScreenLeftBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenCenterBackgroundImagePreview, setAuthScreenCenterBackgroundImagePreview] = useState<string | null>(null);
    const dispatch = useDispatch()

    const [trigger, { data: solidSettingsData }] = useLazyGetSolidSettingsQuery();

    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])
    const pathname = usePathname();
    const [bulkUpdateSolidSettings] = useBulkUpdateSolidSettingsMutation();
    const initialValues = {
        appLogo: solidSettingsData?.data?.appLogo ?? null,
        companylogo: solidSettingsData?.data?.companylogo ?? null,
        passwordlessRegistrationValidateWhat: solidSettingsData?.data?.passwordlessRegistrationValidateWhat ?? "email",
        passwordlessLoginValidateWhat: solidSettingsData?.data?.passwordlessLoginValidateWhat ?? "email",
        allowPublicRegistration: solidSettingsData?.data?.allowPublicRegistration ?? false,
        passwordBasedAuth: solidSettingsData?.data?.passwordBasedAuth ?? false,
        passwordLessAuth: solidSettingsData?.data?.passwordLessAuth ?? false,
        activateUserOnRegistration: solidSettingsData?.data?.activateUserOnRegistration ?? false,
        iamGoogleOAuthEnabled: solidSettingsData?.data?.iamGoogleOAuthEnabled ?? false,
        // shouldQueueEmails: solidSettingsData?.data?.shouldQueueEmails ?? false,
        // shouldQueueSms: solidSettingsData?.data?.shouldQueueSms ?? false,
        authPagesTheme: solidSettingsData?.data?.authPagesTheme ?? "light",
        authPagesLayout: solidSettingsData?.data?.authPagesLayout ?? "center",
        defaultRole: solidSettingsData?.data?.defaultRole ?? "Admin",
        appLogoPosition: solidSettingsData?.data?.appLogoPosition ?? "in_form_view",
        showAuthContent: solidSettingsData?.data?.showAuthContent ?? false,
        appTitle: solidSettingsData?.data?.appTitle ?? "SolidX",
        appSubtitle: solidSettingsData?.data?.appSubtitle ?? "Welcome To",
        appDescription: solidSettingsData?.data?.appDescription ?? "appDescription",
        showLegalLinks: solidSettingsData?.data?.showLegalLinks ?? false,
        appTnc: solidSettingsData?.data?.appTnc ?? null,
        appPrivacyPolicy: solidSettingsData?.data?.appPrivacyPolicy ?? null,
        enableDarkMode: solidSettingsData?.data?.enableDarkMode ?? false,
        copyright: solidSettingsData?.data?.copyright ?? null,
        forceChangePasswordOnFirstLogin: solidSettingsData?.data?.forceChangePasswordOnFirstLogin ?? false,
        contactSupportEmail: solidSettingsData?.data?.contactSupportEmail ?? null,
        contactSupportDisplayName: solidSettingsData?.data?.contactSupportDisplayName ?? null,
        contactSupportIcon: solidSettingsData?.data?.contactSupportIcon ?? null,
        authScreenRightBackgroundImage: solidSettingsData?.data?.authScreenRightBackgroundImage ?? null,
        authScreenLeftBackgroundImage: solidSettingsData?.data?.authScreenLeftBackgroundImage ?? null,
        authScreenCenterBackgroundImage: solidSettingsData?.data?.authScreenCenterBackgroundImage ?? null,
        solidXGenAiCodeBuilderConfig: solidSettingsData?.data?.solidXGenAiCodeBuilderConfig ?? {
            fastModel: { provider: "", availableProviders: [] },
            defaultProvider: { provider: "", availableProviders: [] },
        }
        // llmProvider: solidSettingsData?.data?.llmProvider ?? null,
        // llModelName: solidSettingsData?.data?.llModelName ?? null,
        // llmProviderApiKey: solidSettingsData?.data?.llmProviderApiKey ?? null,
        // llmProviderBaseURL: solidSettingsData?.data?.llmProviderBaseURL ?? null,
        // llmModelIdentifier: solidSettingsData?.data?.llmModelIdentifier ?? null


    };
    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {

                const updatedSettingsArray: Array<{ key: string; value: string; type: string }> = [];
                const currentSettings = solidSettingsData || {};

                const formData = new FormData();

                // Compare changed fields
                Object.entries(values).forEach(([key, value]) => {
                    const currentValue = currentSettings[key];

                    const normalizedCurrent = currentValue ?? "";
                    const normalizedValue = value ?? "";

                    if (normalizedCurrent !== normalizedValue) {
                        // If file, append to formData and use placeholder value in JSON
                        if (value instanceof File) {
                            formData.append(key, value);
                            updatedSettingsArray.push({
                                key,
                                value: "",
                                type: "system",
                            });
                        } else {
                            updatedSettingsArray.push({
                                key,
                                value: typeof value === "string" ? value : JSON.stringify(value),
                                type: "system",
                            });
                        }
                    }
                });

                if (updatedSettingsArray.length === 0) {
                    dispatch(showToast({ severity: "success", summary: "No Changes", detail: "No settings were updated" }));
                    return;
                }

                // Append settings array to formData
                formData.append("settings", JSON.stringify(updatedSettingsArray));

                // Call API
                const response = await bulkUpdateSolidSettings({ data: formData }).unwrap();

                if (response.statusCode === 200) {
                    dispatch(showToast({ severity: "success", summary: "Updated", detail: "Settings updated" }));
                    trigger("")
                }

            } catch (error: any) {
                console.log("Error updating settings:", error);
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FAILED, detail: error?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG }));
            }
        },
    });

    const showError = async () => {
        const errors = await formik.validateForm();
        const errorMessages = Object.values(errors);

        if (errorMessages.length > 0) {
            dispatch(showToast({ severity: 'error', summary: 'Error', detail: Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages }));
        }
    }
    useEffect(() => {

    }, [pathname])

    const positionMap: Record<'left' | 'center' | 'right', string> = {
        left: 'The form will appear on the left side of the screen, while the banner will be positioned on the right side',
        center: 'The form will be centered in the middle of the screen for balanced alignment',
        right: 'The form will appear on the right side of the screen, and the banner will be positioned on the left side'
    };

    const onAppLogoDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    dispatch(showToast({ severity: "error", summary: "File too large", detail: "Maximum file size is 2MB" }));
                    return;
                }
                formik.setFieldValue("appLogo", file);
                setAppLogoPreview(URL.createObjectURL(file));
            }
        },
        [formik]
    );

    const onCompanyLogoDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                dispatch(showToast({ severity: "error", summary: "File too large", detail: "Maximum file size is 2MB" }));
                return;
            }
            formik.setFieldValue("companylogo", file);
            setCompanyLogoPreview(URL.createObjectURL(file));
        }
    }, [formik]);

    const {
        getRootProps: getAppLogoRootProps,
        getInputProps: getAppLogoInputProps,
        isDragActive: isAppLogoDragActive
    } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/svg+xml': ['.svg'],
            'image/webp': ['.webp']
        },
        multiple: false,
        onDrop: onAppLogoDrop
    });
    const {
        getRootProps: getCompanyLogoRootProps,
        getInputProps: getCompanyLogoInputProps,
        isDragActive: isCompanyLogoDragActive
    } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/svg+xml': ['.svg'],
            'image/webp': ['.webp']
        },
        multiple: false,
        onDrop: onCompanyLogoDrop
    });

    const removeAppLogo = () => {
        formik.setFieldValue("appLogo", null);
        if (appLogoPreview) {
            URL.revokeObjectURL(appLogoPreview);
            setAppLogoPreview(null);
        }
    };

    const removeCompanyLogo = () => {
        formik.setFieldValue("companylogo", null);
        if (companyLogoPreview) {
            URL.revokeObjectURL(companyLogoPreview);
            setCompanyLogoPreview(null);
        }
    };


    const onAuthScreenRightBackgroundImageDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FILE_LARGE, detail: ERROR_MESSAGES.MAX_FILE_SIZE }));
                    return;
                }
                formik.setFieldValue("authScreenRightBackgroundImage", file);
                setAuthScreenRightBackgroundImagePreview(URL.createObjectURL(file));
            }
        },
        [formik]
    );

    const onAuthScreenLeftBackgroundImageDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FILE_LARGE, detail: ERROR_MESSAGES.MAX_FILE_SIZE }));
                return;
            }
            formik.setFieldValue("authScreenLeftBackgroundImage", file);
            setAuthScreenLeftBackgroundImagePreview(URL.createObjectURL(file));
        }
    }, [formik]);

    const onAuthScreenCenterBackgroundImageDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FILE_LARGE, detail: ERROR_MESSAGES.MAX_FILE_SIZE }));
                return;
            }
            formik.setFieldValue("authScreenCenterBackgroundImage", file);
            setAuthScreenCenterBackgroundImagePreview(URL.createObjectURL(file));
        }
    }, [formik]);

    const {
        getRootProps: getAuthScreenRightBackgroundImageRootProps,
        getInputProps: getAuthScreenRightBackgroundImageInputProps,
        isDragActive: isAuthScreenRightBackgroundImageDragActive
    } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/svg+xml': ['.svg'],
            'image/webp': ['.webp']
        },
        multiple: false,
        onDrop: onAuthScreenRightBackgroundImageDrop
    });

    const {
        getRootProps: getAuthScreenLeftBackgroundImageRootProps,
        getInputProps: getAuthScreenLeftBackgroundImageInputProps,
        isDragActive: isAuthScreenLeftBackgroundImageDragActive
    } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/svg+xml': ['.svg'],
            'image/webp': ['.webp']
        },
        multiple: false,
        onDrop: onAuthScreenLeftBackgroundImageDrop
    });

    const {
        getRootProps: getAuthScreenCenterBackgroundImageRootProps,
        getInputProps: getAuthScreenCenterBackgroundImageInputProps,
        isDragActive: isAuthScreenCenterBackgroundImageDragActive
    } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/svg+xml': ['.svg'],
            'image/webp': ['.webp']
        },
        multiple: false,
        onDrop: onAuthScreenCenterBackgroundImageDrop
    });

    const removeAuthScreenRightBackgroundImage = () => {
        formik.setFieldValue("authScreenRightBackgroundImage", null);
        if (authScreenRightBackgroundImagePreview) {
            URL.revokeObjectURL(authScreenRightBackgroundImagePreview);
            setAuthScreenRightBackgroundImagePreview(null);
        }
    };

    const removeAuthScreenLeftBackgroundImage = () => {
        formik.setFieldValue("authScreenLeftBackgroundImage", null);
        if (authScreenLeftBackgroundImagePreview) {
            URL.revokeObjectURL(authScreenLeftBackgroundImagePreview);
            setAuthScreenLeftBackgroundImagePreview(null);
        }
    };

    const removeAuthScreenCenterBackgroundImage = () => {
        formik.setFieldValue("authScreenCenterBackgroundImage", null);
        if (authScreenCenterBackgroundImagePreview) {
            URL.revokeObjectURL(authScreenCenterBackgroundImagePreview);
            setAuthScreenCenterBackgroundImagePreview(null);
        }
    };



    const handleModelConfigChange = (modelType: "fastModel" | "defaultProvider", config: ModelConfig) => {
        formik.setFieldValue("solidXGenAiCodeBuilderConfig", {
            ...formik.values.solidXGenAiCodeBuilderConfig,
            [modelType]: config,
        });
    };


    return (
        <div className="page-parent-wrapper">
            <div className="solid-form-wrapper">
                <div className="solid-form-section">
                    <form onSubmit={formik.handleSubmit}>
                        <div className="page-header secondary-border-bottom">
                            <div className="form-wrapper-title ">Settings</div>
                            <div className="gap-3 flex">
                                {formik.dirty &&
                                    <Button label="Save" size="small" onClick={() => showError()} type="submit" />
                                }
                                <CancelButton />
                            </div>
                        </div>
                        <div className="px-4 py-3 md:p-4 solid-form-content">
                            {pathname.includes("app-settings") &&
                                <>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6">
                                                    <p className='font-bold ' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>App Logo </p>
                                                    <div>
                                                        <div {...getAppLogoRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                            <input {...getAppLogoInputProps()} />
                                                            {/* {isAppLogoDragActive && */}
                                                            <SettingDropzoneActivePlaceholder />
                                                            {/* } */}
                                                        </div>
                                                        <div className="mt-2">
                                                            {(() => {
                                                                const logoSrc = (SolidLogo as any).src || SolidLogo;

                                                                let src = appLogoPreview
                                                                    ? appLogoPreview
                                                                    : formik.values.appLogo
                                                                        ? formik.values.appLogo
                                                                        : logoSrc

                                                                const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");

                                                                if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                    src = `${env("API_URL")}/${src}`;
                                                                }
                                                                return (
                                                                    <SolidUploadedImage src={src} className='solid-app-logo' />
                                                                );
                                                            })()}
                                                        </div>
                                                        {formik.values.appLogo && (
                                                            <SettingsImageRemoveButton onClick={removeAppLogo} />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <p className='font-bold ' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Company Logo </p>
                                                    <div>
                                                        <div {...getCompanyLogoRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                            <input {...getCompanyLogoInputProps()} />
                                                            {/* {isCompanyLogoDragActive && */}
                                                            <SettingDropzoneActivePlaceholder />
                                                            {/* } */}
                                                        </div>
                                                        <div className="mt-2">
                                                            {(() => {
                                                                const logoSrc = (SolidLogo as any).src || SolidLogo;

                                                                let src = companyLogoPreview
                                                                    ? companyLogoPreview
                                                                    : formik.values.companylogo
                                                                        ? formik.values.companylogo
                                                                        : logoSrc

                                                                const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");

                                                                if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                    src = `${env("API_URL")}/${src}`;
                                                                }

                                                                return (
                                                                    <SolidUploadedImage src={src} className='solid-compony-logo' />
                                                                );
                                                            })()}
                                                        </div>
                                                        {formik.values.companylogo && (
                                                            <SettingsImageRemoveButton onClick={removeCompanyLogo} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>App Logo Position</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="flex align-items-center gap-3">
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        inputId="appLogoPosition-in_form_view"
                                                        name="appLogoPosition"
                                                        value="in_form_view"
                                                        checked={formik.values.appLogoPosition === "in_form_view"}
                                                        onChange={(e) => formik.setFieldValue("appLogoPosition", e.value)}
                                                    />
                                                    <label htmlFor="appLogoPosition-in_form_view" className="ml-2">In Form View</label>
                                                </div>
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        inputId="appLogoPosition-in_image_view"
                                                        name="appLogoPosition"
                                                        value="in_image_view"
                                                        checked={formik.values.appLogoPosition === "in_image_view"}
                                                        onChange={(e) => formik.setFieldValue("appLogoPosition", e.value)}
                                                    />
                                                    <label htmlFor="appLogoPosition-in_image_view" className="ml-2">In Image View</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Title & Description Details </p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Show Details on Authentication Screen</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="showAuthContent"
                                                                checked={formik.values.showAuthContent}
                                                                onChange={(e) => formik.setFieldValue("showAuthContent", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">App Title</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appTitle"
                                                                name="appTitle"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appTitle}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6 mt-4">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">App Subtitle</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appSubtitle"
                                                                name="appSubtitle"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appSubtitle}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6 mt-4">
                                                    <div className="formgrid grid align-items-start">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Description</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputTextarea
                                                                rows={3}
                                                                id="appDescription"
                                                                name="appDescription"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appDescription}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6 mt-4">
                                                    <div className="formgrid grid align-items-start">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Copyright</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputTextarea
                                                                rows={3}
                                                                id="copyright"
                                                                name="copyright"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.copyright}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>

                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Legal Links</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Show Legal Links</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="showLegalLinks"
                                                                checked={formik.values.showLegalLinks}
                                                                onChange={(e) => formik.setFieldValue("showLegalLinks", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 py-2 md:py-0">
                                                            <label className="form-field-label">Terms and Conditions Link</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appTnc"
                                                                name="appTnc"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appTnc}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Privacy Policy Link</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appPrivacyPolicy"
                                                                name="appPrivacyPolicy"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appPrivacyPolicy}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Theme</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-10 lg:col-5">
                                                            <label className="form-field-label">Enable Dark Mode</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="enableDarkMode"
                                                                checked={formik.values.enableDarkMode}
                                                                onChange={(e) => formik.setFieldValue("enableDarkMode", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                            {pathname.includes("authentication-settings") &&
                                <>
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>User Authentication  </p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Public Registration</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="allowPublicRegistration"
                                                                checked={formik.values.allowPublicRegistration}
                                                                onChange={(e) => formik.setFieldValue("allowPublicRegistration", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Password Based Authentication</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="passwordBasedAuth"
                                                                checked={formik.values.passwordBasedAuth}
                                                                onChange={(e) => formik.setFieldValue("passwordBasedAuth", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Password Less Authentication</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="passwordLessAuth"
                                                                checked={formik.values.passwordLessAuth}
                                                                onChange={(e) => formik.setFieldValue("passwordLessAuth", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Auto Activate User on Registration </label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="activateUserOnRegistration"
                                                                checked={formik.values.activateUserOnRegistration}
                                                                onChange={(e) => formik.setFieldValue("activateUserOnRegistration", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Allow Login/ Signup with Google </label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="iamGoogleOAuthEnabled"
                                                                checked={formik.values.iamGoogleOAuthEnabled}
                                                                onChange={(e) => formik.setFieldValue("iamGoogleOAuthEnabled", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Force Password change on first Login </label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="forceChangePasswordOnFirstLogin"
                                                                checked={formik.values.forceChangePasswordOnFirstLogin}
                                                                onChange={(e) => formik.setFieldValue("forceChangePasswordOnFirstLogin", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {formik.values.passwordLessAuth === true &&
                                                    <div className="col-12 mt-3">
                                                        <div className="formgrid grid align-items-center">
                                                            <div className="col-12 sm:col-12 lg:col-5 xl:col-5">
                                                                <label className="form-field-label">Password Less Registration Method</label>
                                                            </div>
                                                            <div className='col-12 sm:col-12 lg:col-6 xl:col-6'>
                                                                <div className="flex align-items-center gap-3 mt-3 lg:mt-0">
                                                                    <div className="flex align-items-center">
                                                                        <RadioButton
                                                                            inputId="passwordlessRegistrationValidateWhat-email"
                                                                            name="passwordlessRegistrationValidateWhat"
                                                                            value="email"
                                                                            checked={formik.values.passwordlessRegistrationValidateWhat === "email"}
                                                                            onChange={(e) => formik.setFieldValue("passwordlessRegistrationValidateWhat", e.value)}
                                                                        />
                                                                        <label htmlFor="passwordlessRegistrationValidateWhat-email" className="ml-2">Email</label>
                                                                    </div>
                                                                    <div className="flex align-items-center">
                                                                        <RadioButton
                                                                            inputId="passwordlessRegistrationValidateWhat-mobile"
                                                                            name="passwordlessRegistrationValidateWhat"
                                                                            value="mobile"
                                                                            checked={formik.values.passwordlessRegistrationValidateWhat === "mobile"}
                                                                            onChange={(e) => formik.setFieldValue("passwordlessRegistrationValidateWhat", e.value)}
                                                                        />
                                                                        <label htmlFor="passwordlessRegistrationValidateWhat-mobile" className="ml-2">Mobile</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                                {formik.values.passwordLessAuth === true &&
                                                    <div className="col-12 mt-3">
                                                        <div className="formgrid grid align-items-center">
                                                            <div className="col-12 sm:col-12 lg:col-5 xl:col-5">
                                                                <label className="form-field-label">Password Less Login Method</label>
                                                            </div>
                                                            <div className='col-12 sm:col-12 lg:col-6 xl:col-6'>
                                                                <div className="flex align-items-center gap-3 mt-3 lg:mt-0">
                                                                    <div className="flex align-items-center">
                                                                        <RadioButton
                                                                            inputId="passwordlessLoginValidateWhat-email"
                                                                            name="passwordlessLoginValidateWhat"
                                                                            value="email"
                                                                            checked={formik.values.passwordlessLoginValidateWhat === "email"}
                                                                            onChange={(e) => formik.setFieldValue("passwordlessLoginValidateWhat", e.value)}
                                                                        />
                                                                        <label htmlFor="passwordlessLoginValidateWhat-email" className="ml-2">Email</label>
                                                                    </div>
                                                                    <div className="flex align-items-center">
                                                                        <RadioButton
                                                                            inputId="passwordlessLoginValidateWhat-mobile"
                                                                            name="passwordlessLoginValidateWhat"
                                                                            value="mobile"
                                                                            checked={formik.values.passwordlessLoginValidateWhat === "mobile"}
                                                                            onChange={(e) => formik.setFieldValue("passwordlessLoginValidateWhat", e.value)}
                                                                        />
                                                                        <label htmlFor="passwordlessLoginValidateWhat-mobile" className="ml-2">Mobile</label>
                                                                    </div>
                                                                    <div className="flex align-items-center">
                                                                        <RadioButton
                                                                            inputId="passwordlessLoginValidateWhat-selectable"
                                                                            name="passwordlessLoginValidateWhat"
                                                                            value="selectable"
                                                                            checked={formik.values.passwordlessLoginValidateWhat === "selectable"}
                                                                            onChange={(e) => formik.setFieldValue("passwordlessLoginValidateWhat", e.value)}
                                                                        />
                                                                        <label htmlFor="passwordlessLoginValidateWhat-selectable" className="ml-2">Selectable</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Authentication Screen Layout</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="flex align-items-center gap-3">
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        inputId="authPagesLayout-left"
                                                        name="authPagesLayout"
                                                        value="left"
                                                        checked={formik.values.authPagesLayout === "left"}
                                                        onChange={(e) => formik.setFieldValue("authPagesLayout", e.value)}
                                                    />
                                                    <label htmlFor="authPagesLayout-left" className="ml-2">Left</label>
                                                </div>
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        inputId="authPagesLayout-center"
                                                        name="authPagesLayout"
                                                        value="center"
                                                        checked={formik.values.authPagesLayout === "center"}
                                                        onChange={(e) => formik.setFieldValue("authPagesLayout", e.value)}
                                                    />
                                                    <label htmlFor="authPagesLayout-center" className="ml-2">Center</label>
                                                </div>
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        inputId="authPagesLayout-right"
                                                        name="authPagesLayout"
                                                        value="right"
                                                        checked={formik.values.authPagesLayout === "right"}
                                                        onChange={(e) => formik.setFieldValue("authPagesLayout", e.value)}
                                                    />
                                                    <label htmlFor="authPagesLayout-right" className="ml-2">Right</label>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm font-bold">Note : {positionMap[formik.values.authPagesLayout as 'left' | 'center' | 'right']}</p>
                                        </div>
                                    </div>
                                    {formik.values.authPagesLayout === "center" && <></>}
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-8 lg:col-6">
                                                    <p className='font-bold ' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>{formik.values.authPagesLayout === "center" ? "Background" : "Banner"} Image</p>
                                                    {formik.values.authPagesLayout === "left" &&
                                                        <div>
                                                            <div {...getAuthScreenLeftBackgroundImageRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                                <input {...getAuthScreenLeftBackgroundImageInputProps()} />
                                                                {/* {isAuthScreenLeftBackgroundImageDragActive && */}
                                                                <SettingDropzoneActivePlaceholder note={"Recommended: 724×724px | Aspect ratio: 1:1"} />
                                                                {/* } */}
                                                            </div>
                                                            <div className="mt-2">
                                                                {(() => {
                                                                    const logoSrc = (AuthScreenLeftBackgroundImage as any).src || AuthScreenLeftBackgroundImage;

                                                                    let src = authScreenLeftBackgroundImagePreview
                                                                        ? authScreenLeftBackgroundImagePreview
                                                                        : formik.values.authScreenLeftBackgroundImage
                                                                            ? formik.values.authScreenLeftBackgroundImage
                                                                            : logoSrc

                                                                    const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");

                                                                    if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                        src = `${env("API_URL")}/${src}`;
                                                                    }
                                                                    return (
                                                                        <SolidUploadedImage src={src} height={400} width={400} maxHeight={400} />
                                                                    );
                                                                })()}
                                                            </div>
                                                            {formik.values.authScreenLeftBackgroundImage && (
                                                                <SettingsImageRemoveButton onClick={removeAuthScreenLeftBackgroundImage} />
                                                            )}
                                                        </div>
                                                    }
                                                    {formik.values.authPagesLayout === "right" &&
                                                        <div>
                                                            <div {...getAuthScreenRightBackgroundImageRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                                <input {...getAuthScreenRightBackgroundImageInputProps()} />
                                                                {/* {isAuthScreenRightBackgroundImageDragActive && */}
                                                                <SettingDropzoneActivePlaceholder note={"Recommended: 724×724px | Aspect ratio: 1:1"} />
                                                                {/* } */}
                                                            </div>
                                                            <div className="mt-2">
                                                                {(() => {
                                                                    const logoSrc = (AuthScreenRightBackgroundImage as any).src || AuthScreenRightBackgroundImage;

                                                                    let src = authScreenRightBackgroundImagePreview
                                                                        ? authScreenRightBackgroundImagePreview
                                                                        : formik.values.authScreenRightBackgroundImage
                                                                            ? formik.values.authScreenRightBackgroundImage
                                                                            : logoSrc

                                                                    const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");

                                                                    if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                        src = `${env("API_URL")}/${src}`;
                                                                    }
                                                                    return (
                                                                        <SolidUploadedImage src={src} height={400} width={400} maxHeight={400} />
                                                                    );
                                                                })()}
                                                            </div>
                                                            {formik.values.authScreenRightBackgroundImage && (
                                                                <SettingsImageRemoveButton onClick={removeAuthScreenRightBackgroundImage} />
                                                            )}
                                                        </div>
                                                    }
                                                    {formik.values.authPagesLayout === "center" &&
                                                        <div>
                                                            <div {...getAuthScreenCenterBackgroundImageRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                                <input {...getAuthScreenCenterBackgroundImageInputProps()} />
                                                                <SettingDropzoneActivePlaceholder note={"Recommended: 1440px × 724px | Aspect ratio: 2:1"} />
                                                            </div>
                                                            <div className="mt-2">
                                                                {(() => {
                                                                    const logoSrc = (AuthScreenCenterBackgroundImage as any).src || AuthScreenCenterBackgroundImage;

                                                                    let src = authScreenCenterBackgroundImagePreview
                                                                        ? authScreenCenterBackgroundImagePreview
                                                                        : formik.values.authScreenCenterBackgroundImage
                                                                            ? formik.values.authScreenCenterBackgroundImage
                                                                            : logoSrc

                                                                    const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");

                                                                    if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                        src = `${env("API_URL")}/${src}`;
                                                                    }
                                                                    return (
                                                                        <SolidUploadedImage src={src} height={300} width={600} maxHeight={300} />
                                                                    );
                                                                })()}
                                                            </div>
                                                            {formik.values.authScreenCenterBackgroundImage && (
                                                                <SettingsImageRemoveButton onClick={removeAuthScreenCenterBackgroundImage} />
                                                            )}
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-2 lg:mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    {solidSettingsData?.data?.enableDarkMode === true &&
                                        <>
                                            <p className='font-bold mt-3 lg:mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Authentication Screen Theme</p>
                                            <div className='formgrid grid'>
                                                <div className='col-12 lg:col-10 xl:col-8'>
                                                    <div className="flex align-items-center gap-3">
                                                        <div className="flex align-items-center">
                                                            <RadioButton
                                                                inputId="theme-light"
                                                                name="authPagesTheme"
                                                                value="light"
                                                                checked={formik.values.authPagesTheme === "light"}
                                                                onChange={(e) => formik.setFieldValue("authPagesTheme", e.value)}
                                                            />
                                                            <label htmlFor="theme-light" className="ml-2">Solid Light</label>
                                                        </div>
                                                        <div className="flex align-items-center">
                                                            <RadioButton
                                                                inputId="theme-dark"
                                                                name="authPagesTheme"
                                                                value="dark"
                                                                checked={formik.values.authPagesTheme === "dark"}
                                                                onChange={(e) => formik.setFieldValue("authPagesTheme", e.value)}
                                                            />
                                                            <label htmlFor="theme-dark" className="ml-2">Solid Dark</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    }
                                </>
                            }

                            {pathname.includes("misc-settings") &&
                                <>
                                {/* 
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Misc Details</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6 pb-3 md:pb-0">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5 ">
                                                            <label className="form-field-label">Use queue for sending emails</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="shouldQueueEmails"
                                                                checked={formik.values.shouldQueueEmails}
                                                                onChange={(e) => formik.setFieldValue("shouldQueueEmails", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-5 pb-2">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Use queue for sending SMS</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="shouldQueueSms"
                                                                checked={formik.values.shouldQueueSms}
                                                                onChange={(e) => formik.setFieldValue("shouldQueueSms", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Divider />
                                 */}
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Contact Support</p>
                                    <div className='formgrid grid'>
                                        <div className="col-12 lg:col-10 xl:col-8">
                                            <div className='formgrid grid'>
                                                <div className="col-12 md:col-6 pb-3 md:pb-0">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Contact Support Email</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="contactSupportEmail"
                                                                name="contactSupportEmail"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.contactSupportEmail}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Display Name</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <InputText
                                                                type="text"
                                                                id="contactSupportDisplayName"
                                                                name="contactSupportDisplayName"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.contactSupportDisplayName}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                            {pathname.includes("ai-settings") &&
                                <AiSettingsSection
                                    fastModelConfig={formik.values.solidXGenAiCodeBuilderConfig.fastModel ?? { provider: "", availableProviders: [] }}
                                    intelligentModelConfig={formik.values.solidXGenAiCodeBuilderConfig.defaultProvider ?? { provider: "", availableProviders: [] }}
                                    onFastModelChange={(config) => handleModelConfigChange("fastModel", config)}
                                    onIntelligentModelChange={(config) => handleModelConfigChange("defaultProvider", config)}
                                />
                            }
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

const AI_TABS = [
    { key: "fastModel" as const, label: "Fast Model", icon: "⚡", title: "Fast Model" },
    { key: "defaultProvider" as const, label: "Intelligent Model", icon: "🧠", title: "Intelligent Model (Reasoning & tool use)" },
];

interface AiSettingsSectionProps {
    fastModelConfig: ModelConfig;
    intelligentModelConfig: ModelConfig;
    onFastModelChange: (config: ModelConfig) => void;
    onIntelligentModelChange: (config: ModelConfig) => void;
}

const AiSettingsSection = ({ fastModelConfig, intelligentModelConfig, onFastModelChange, onIntelligentModelChange }: AiSettingsSectionProps) => {
    const [activeTab, setActiveTab] = useState<"fastModel" | "defaultProvider">("fastModel");

    const activeConfig = activeTab === "fastModel" ? fastModelConfig : intelligentModelConfig;
    const activeOnChange = activeTab === "fastModel" ? onFastModelChange : onIntelligentModelChange;
    const activeTitle = AI_TABS.find(t => t.key === activeTab)?.title ?? "";

    return (
        <>
            <p className="font-bold mb-4" style={{ fontSize: 16, color: "var(--solid-setting-title)" }}>
                AI Model Configuration
            </p>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--surface-border, #e2e8f0)", marginBottom: 24 }}>
                {AI_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            color: activeTab === tab.key ? "var(--primary-color, #6366f1)" : "var(--text-color-secondary, #64748b)",
                            borderBottom: activeTab === tab.key ? "2px solid var(--primary-color, #6366f1)" : "2px solid transparent",
                            marginBottom: -1,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "color 0.15s",
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div style={{ maxWidth: 680, border: "1px solid var(--surface-border, #e2e8f0)", borderRadius: 12, padding: 28 }}>
                <p className="font-bold mb-4" style={{ fontSize: 15, margin: "0 0 20px 0" }}>{activeTitle}</p>
                <AiModelConfigTab config={activeConfig} onChange={activeOnChange} />
            </div>
        </>
    );
};
