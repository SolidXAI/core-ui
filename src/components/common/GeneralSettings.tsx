"use client"
import { useBulkUpdateSolidSettingsMutation, useCreateSolidSettingsMutation, useLazyGetSolidSettingsQuery, useUpdateSolidSettingsMutation } from '@/redux/api/solidSettingsApi';
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useCallback, useEffect, useRef, useState } from 'react'
import { CancelButton } from './CancelButton';
import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from 'primereact/radiobutton';
import { handleError } from '@/helpers/ToastContainer';
import { usePathname } from 'next/navigation';
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


export const GeneralSettings = () => {
    const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
    const [authScreenRightBackgroundImagePreview, setAuthScreenRightBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenLeftBackgroundImagePreview, setAuthScreenLeftBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenCenterBackgroundImagePreview, setAuthScreenCenterBackgroundImagePreview] = useState<string | null>(null);

    const [trigger, { data: solidSettingsData }] = useLazyGetSolidSettingsQuery()
    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])
    const pathname = usePathname();
    const [bulkUpdateSolidSettings] = useBulkUpdateSolidSettingsMutation();
    const toast = useRef<Toast>(null);

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const initialValues = {
        appLogo: solidSettingsData?.data?.system?.appLogo ?? null,
        companylogo: solidSettingsData?.data?.system?.companylogo ?? null,
        allowPublicRegistration: solidSettingsData?.data?.system?.allowPublicRegistration ?? false,
        iamPasswordRegistrationEnabled: solidSettingsData?.data?.system?.iamPasswordRegistrationEnabled ?? false,
        passwordlessRegistration: solidSettingsData?.data?.system?.passwordlessRegistration ?? false,
        activateUserOnRegistration: solidSettingsData?.data?.system?.activateUserOnRegistration ?? false,
        iamGoogleOAuthEnabled: solidSettingsData?.data?.system?.iamGoogleOAuthEnabled ?? false,
        shouldQueueEmails: solidSettingsData?.data?.system?.shouldQueueEmails ?? false,
        shouldQueueSms: solidSettingsData?.data?.system?.shouldQueueSms ?? false,
        authPagesTheme: solidSettingsData?.data?.system?.authPagesTheme ?? "light",
        authPagesLayout: solidSettingsData?.data?.system?.authPagesLayout ?? "center",
        defaultRole: solidSettingsData?.data?.system?.defaultRole ?? "Admin",
        appLogoPosition: solidSettingsData?.data?.system?.appLogoPosition ?? "in_form_view",
        showAuthContent: solidSettingsData?.data?.system?.showAuthContent ?? false,
        appTitle: solidSettingsData?.data?.system?.appTitle ?? "SolidX",
        appSubtitle: solidSettingsData?.data?.system?.appSubtitle ?? "Welcome To",
        appDescription: solidSettingsData?.data?.system?.appDescription ?? "appDescription",
        showLegalLinks: solidSettingsData?.data?.system?.showLegalLinks ?? false,
        appTnc: solidSettingsData?.data?.system?.appTnc ?? null,
        appPrivacyPolicy: solidSettingsData?.data?.system?.appPrivacyPolicy ?? null,
        enableDarkMode: solidSettingsData?.data?.system?.enableDarkMode ?? false,
        copyright: solidSettingsData?.data?.system?.copyright ?? null,
        forceChangePasswordOnFirstLogin: solidSettingsData?.data?.system?.forceChangePasswordOnFirstLogin ?? false,
        contactSupportEmail: solidSettingsData?.data?.system?.contactSupportEmail ?? null,
        contactSupportDisplayName: solidSettingsData?.data?.system?.contactSupportDisplayName ?? null,
        contactSupportIcon: solidSettingsData?.data?.system?.contactSupportIcon ?? null,
        authScreenRightBackgroundImage: solidSettingsData?.data?.system?.authScreenRightBackgroundImage ?? null,
        authScreenLeftBackgroundImage: solidSettingsData?.data?.system?.authScreenLeftBackgroundImage ?? null,
        authScreenCenterBackgroundImage: solidSettingsData?.data?.system?.authScreenCenterBackgroundImage ?? null,
        iamAutoGeneratedPassword:solidSettingsData?.data?.system?.iamAutoGeneratedPassword ?? true
    };
    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const updatedSettingsArray: Array<{ key: string; value: string; type: string }> = [];
                const currentSettings = solidSettingsData?.data?.system || {};

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
                                value: value,
                                type: "system",
                            });
                        }
                    }
                });

                if (updatedSettingsArray.length === 0) {
                    showToast("success", "No Changes", "No settings were updated");
                    return;
                }

                // Append settings array to formData
                formData.append("settings", JSON.stringify(updatedSettingsArray));

                // Call API
                const response = await bulkUpdateSolidSettings({ data: formData }).unwrap();

                if (response.statusCode === 200) {
                    showToast("success", "Updated", "Settings updated");
                }

            } catch (error) {
                showToast("error", "Failed", "Something went wrong");
            }
        },
    });


    const showError = async () => {
        const errors = await formik.validateForm();
        const errorMessages = Object.values(errors);

        if (errorMessages.length > 0 && toast.current) {
            handleError(errorMessages)
        }
    }
    useEffect(() => {

    }, [pathname])

    const positionMap: Record<'left' | 'center' | 'right', string> = {
        left: 'The form will appear on the left side of the screen, while the banner will be positioned on the right side.',
        center: 'The form will be centered in the middle of the screen for balanced alignment.',
        right: 'The form will appear on the right side of the screen, and the banner will be positioned on the left side.'
    };

    const onAppLogoDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    toast.current?.show({
                        severity: "error",
                        summary: "File too large",
                        detail: "Maximum file size is 2MB",
                        life: 3000,
                    });
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
                toast.current?.show({
                    severity: "error",
                    summary: "File too large",
                    detail: "Maximum file size is 2MB",
                    life: 3000,
                });
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
                    toast.current?.show({
                        severity: "error",
                        summary: "File too large",
                        detail: "Maximum file size is 2MB",
                        life: 3000,
                    });
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
                toast.current?.show({
                    severity: "error",
                    summary: "File too large",
                    detail: "Maximum file size is 2MB",
                    life: 3000,
                });
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
                toast.current?.show({
                    severity: "error",
                    summary: "File too large",
                    detail: "Maximum file size is 2MB",
                    life: 3000,
                });
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

    return (
        <div className="page-parent-wrapper">
            <Toast ref={toast} />
            <div className="solid-form-wrapper">
                <div className="solid-form-section">
                    <form onSubmit={formik.handleSubmit}>
                        <div className="page-header secondary-border-bottom">
                            <div className="form-wrapper-title">Settings</div>
                            <div className="gap-3 flex">
                                {formik.dirty &&
                                    <Button label="Save" size="small" onClick={() => showError()} type="submit" />
                                }
                                <CancelButton />
                            </div>
                        </div>
                        <div className="p-4 solid-form-content">
                            {pathname.includes("app-settings") &&
                                <>
                                    <div className='formgrid grid'>
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
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
                                                                    src = `${process.env.API_URL}/${src}`;
                                                                }
                                                                return (
                                                                    <SolidUploadedImage src={src} />
                                                                );
                                                            })()}
                                                        </div>
                                                        {formik.values.appLogo && (
                                                            <SettingsImageRemoveButton onClick={removeAppLogo} />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-6">
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
                                                                    src = `${process.env.API_URL}/${src}`;
                                                                }

                                                                return (
                                                                    <SolidUploadedImage src={src} />
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
                                        <div className='col-8'>
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
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Show Details on Authentication Screen</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="showAuthContent"
                                                                checked={formik.values.showAuthContent}
                                                                onChange={(e) => formik.setFieldValue("showAuthContent", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">App Title</label>
                                                        </div>
                                                        <div className="col-7">
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
                                                <div className="col-6 mt-4">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">App Subtitle</label>
                                                        </div>
                                                        <div className="col-7">
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
                                                <div className="col-6 mt-4">
                                                    <div className="formgrid grid align-items-start">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Description</label>
                                                        </div>
                                                        <div className="col-7">
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
                                                <div className="col-6 mt-4">
                                                    <div className="formgrid grid align-items-start">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Copyright</label>
                                                        </div>
                                                        <div className="col-7">
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
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Show Legal Links</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="showLegalLinks"
                                                                checked={formik.values.showLegalLinks}
                                                                onChange={(e) => formik.setFieldValue("showLegalLinks", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Terms and Conditions Link</label>
                                                        </div>
                                                        <div className="col-7">
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
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Privacy Policy Link</label>
                                                        </div>
                                                        <div className="col-7">
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
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Enable Dark Mode</label>
                                                        </div>
                                                        <div className="col-7">
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
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Public Registration</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="allowPublicRegistration"
                                                                checked={formik.values.allowPublicRegistration}
                                                                onChange={(e) => formik.setFieldValue("allowPublicRegistration", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Signup with Password</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="iamPasswordRegistrationEnabled"
                                                                checked={formik.values.iamPasswordRegistrationEnabled}
                                                                onChange={(e) => formik.setFieldValue("iamPasswordRegistrationEnabled", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Signup without Password</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="passwordlessRegistration"
                                                                checked={formik.values.passwordlessRegistration}
                                                                onChange={(e) => formik.setFieldValue("passwordlessRegistration", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Auto Activate User on Registration </label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="activateUserOnRegistration"
                                                                checked={formik.values.activateUserOnRegistration}
                                                                onChange={(e) => formik.setFieldValue("activateUserOnRegistration", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Allow Login/ Signup with Google </label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="iamGoogleOAuthEnabled"
                                                                checked={formik.values.iamGoogleOAuthEnabled}
                                                                onChange={(e) => formik.setFieldValue("iamGoogleOAuthEnabled", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Force Password change on first Login </label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="forceChangePasswordOnFirstLogin"
                                                                checked={formik.values.forceChangePasswordOnFirstLogin}
                                                                onChange={(e) => formik.setFieldValue("forceChangePasswordOnFirstLogin", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 mt-3">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Auto Generate Password</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="iamAutoGeneratedPassword"
                                                                checked={formik.values.iamAutoGeneratedPassword}
                                                                onChange={(e) => formik.setFieldValue("iamAutoGeneratedPassword", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Authentication Screen Layout</p>
                                    <div className='formgrid grid'>
                                        <div className='col-8'>
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
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
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
                                                                        src = `${process.env.API_URL}/${src}`;
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
                                                                        src = `${process.env.API_URL}/${src}`;
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
                                                                        src = `${process.env.API_URL}/${src}`;
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
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                                    {solidSettingsData?.data?.system?.enableDarkMode === true &&
                                        <>
                                            <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Authentication Screen Theme</p>
                                            <div className='formgrid grid'>
                                                <div className='col-8'>
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
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Misc Details</p>
                                    <div className='formgrid grid'>
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Use queue for sending emails</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputSwitch
                                                                name="shouldQueueEmails"
                                                                checked={formik.values.shouldQueueEmails}
                                                                onChange={(e) => formik.setFieldValue("shouldQueueEmails", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Use queue for sending SMS</label>
                                                        </div>
                                                        <div className="col-7">
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
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Contact Support</p>
                                    <div className='formgrid grid'>
                                        <div className="col-8">
                                            <div className='formgrid grid'>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Contact Support Email</label>
                                                        </div>
                                                        <div className="col-7">
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
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Display Name</label>
                                                        </div>
                                                        <div className="col-7">
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}