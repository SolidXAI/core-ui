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
import Image from 'next/image';
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import { useDropzone } from 'react-dropzone';


export const GeneralSettings = () => {
    const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

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
        forceChangePasswordOnFirstLogin: solidSettingsData?.data?.system?.forceChangePasswordOnFirstLogin ?? false
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
                                                            {isAppLogoDragActive ?
                                                                <div className='solid-dropzone'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M11 16V7.85L8.4 10.45L7 9L12 4L17 9L15.6 10.45L13 7.85V16H11ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="#666666" />
                                                                    </svg>
                                                                    <div className='font-bold mt-2'>
                                                                        Drag and Drop or <span className='text-primary'> Logo</span> to upload
                                                                    </div>
                                                                    <p>Supported format:PNG, JPG, JPEG, SVG, WEBP | Max size: 2 MB</p>
                                                                    <small className='mb-2'>Note: 200px image width is ideal.</small>
                                                                    <div>
                                                                        <Button outlined size='small' severity='secondary' label='Click to Browse' type="button" />
                                                                    </div>
                                                                </div>
                                                                :
                                                                <div className='solid-dropzone'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M11 16V7.85L8.4 10.45L7 9L12 4L17 9L15.6 10.45L13 7.85V16H11ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="#666666" />
                                                                    </svg>
                                                                    <div className='font-bold mt-2'>
                                                                        Drag and Drop or <span className='text-primary'> Logo</span> to upload
                                                                    </div>
                                                                    <p>Supported format:PNG, JPG, JPEG, SVG, WEBP | Max size: 2 MB</p>
                                                                    <small className='mb-2'>Note: 200px image width is ideal.</small>
                                                                    <div>
                                                                        <Button outlined size='small' severity='secondary' label='Click to Browse' type="button" />
                                                                    </div>
                                                                </div>
                                                            }
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
                                                                    <Image
                                                                        src={src}
                                                                        alt="App Logo"
                                                                        width={200}
                                                                        height={120}
                                                                        style={{ objectFit: "contain", maxHeight: 150 }}
                                                                        unoptimized
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                        {formik.values.appLogo && (
                                                            <Button
                                                                label="Remove"
                                                                severity="danger"
                                                                icon="pi pi-times"
                                                                size="small"
                                                                className="mt-2"
                                                                onClick={removeAppLogo}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <p className='font-bold ' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Company Logo </p>
                                                    <div>
                                                        <div {...getCompanyLogoRootProps()} className="solid-dropzone-wrapper" style={{ borderRadius: 8 }}>
                                                            <input {...getCompanyLogoInputProps()} />
                                                            {isCompanyLogoDragActive ?
                                                                <div className='solid-dropzone'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M11 16V7.85L8.4 10.45L7 9L12 4L17 9L15.6 10.45L13 7.85V16H11ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="#666666" />
                                                                    </svg>
                                                                    <div className='font-bold mt-2'>
                                                                        Drag and Drop or <span className='text-primary'> Company Logo</span> to upload
                                                                    </div>
                                                                    <p>Supported format:PNG, JPG, JPEG, SVG, WEBP | Max size: 2 MB</p>
                                                                    <small className='mb-2'>Note: 200px image width is ideal.</small>
                                                                    <div>
                                                                        <Button outlined size='small' severity='secondary' label='Click to Browse' type="button" />
                                                                    </div>
                                                                </div>
                                                                :
                                                                <div className='solid-dropzone'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M11 16V7.85L8.4 10.45L7 9L12 4L17 9L15.6 10.45L13 7.85V16H11ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="#666666" />
                                                                    </svg>
                                                                    <div className='font-bold mt-2'>
                                                                        Drag and Drop or <span className='text-primary'> Company Logo</span> to upload
                                                                    </div>
                                                                    <p>Supported format:PNG, JPG, JPEG, SVG, WEBP | Max size: 2 MB</p>
                                                                    <small className='mb-2'>Note: 200px image width is ideal.</small>
                                                                    <div>
                                                                        <Button outlined size='small' severity='secondary' label='Click to Browse' type="button" />
                                                                    </div>
                                                                </div>
                                                            }
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
                                                                    <Image
                                                                        src={src}
                                                                        alt="Company Logo"
                                                                        width={200}
                                                                        height={120}
                                                                        style={{ objectFit: "contain", maxHeight: 150 }}
                                                                        unoptimized
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                        {formik.values.companylogo && (
                                                            <Button
                                                                label="Remove"
                                                                severity="danger"
                                                                icon="pi pi-times"
                                                                size="small"
                                                                className="mt-2"
                                                                onClick={removeCompanyLogo}
                                                            />
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
                                </>
                            }
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}