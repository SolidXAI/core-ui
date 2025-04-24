"use client"
import { useBulkUpdateSolidSettingsMutation, useCreateSolidSettingsMutation, useLazyGetSolidSettingsQuery, useUpdateSolidSettingsMutation } from '@/redux/api/solidSettingsApi';
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useEffect, useRef } from 'react'
import { CancelButton } from './CancelButton';
import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from 'primereact/radiobutton';
import { handleError } from '@/helpers/ToastContainer';
import { usePathname } from 'next/navigation';

export const GeneralSettings = () => {
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
        allowPublicRegistration: solidSettingsData?.data?.allowPublicRegistration || false,
        iamPasswordRegistrationEnabled: solidSettingsData?.data?.iamPasswordRegistrationEnabled || false,
        passwordlessRegistration: solidSettingsData?.data?.passwordlessRegistration || false,
        activateUserOnRegistration: solidSettingsData?.data?.activateUserOnRegistration || false,
        iamGoogleOAuthEnabled: solidSettingsData?.data?.iamGoogleOAuthEnabled || false,
        shouldQueueEmails: solidSettingsData?.data?.shouldQueueEmails || false,
        shouldQueueSms: solidSettingsData?.data?.shouldQueueSms || false,
        authPagesTheme: solidSettingsData?.data?.authPagesTheme || "light",
        authPagesLayout: solidSettingsData?.data?.authPagesLayout || "center",
        appTnc: solidSettingsData?.data?.appTnc || "",
        appPrivacyPolicy: solidSettingsData?.data?.appPrivacyPolicy || "",
        defaultRole: solidSettingsData?.data?.defaultRole || "Admin",
        appTitle: solidSettingsData?.data?.appTitle || "SolidX",
        appDescription: solidSettingsData?.data?.appDescription || "appDescription",
    };
    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const updatedSettings: Record<string, any> = {};

                const currentSettings = solidSettingsData?.data || {};

                // Compare values and collect only changed ones
                Object.entries(values).forEach(([key, value]) => {
                    const currentValue = currentSettings[key];

                    // Handle boolean, string, null values consistently
                    const normalizedCurrent = currentValue === undefined || currentValue === null ? "" : currentValue;
                    const normalizedValue = value === undefined || value === null ? "" : value;

                    if (normalizedCurrent !== normalizedValue) {
                        updatedSettings[key] = value;
                    }
                });
                
                if (Object.keys(updatedSettings).length === 0) {
                    showToast("success", "No Changes", "No settings were updated");
                    return;
                }
                const response = await bulkUpdateSolidSettings({
                    data: { settings: updatedSettings },
                }).unwrap();
                if (response.statusCode === 200) {
                    showToast("success", "Ypdated", "Settings updated")
                }

            } catch (error) {
                showToast("error", "Failed", "Something went wrong");
            }
        },
    })

    const showError = async () => {
        const errors = await formik.validateForm(); // Trigger validation and get the updated errors
        const errorMessages = Object.values(errors);

        if (errorMessages.length > 0 && toast.current) {
            handleError(errorMessages)
        }
    }
    useEffect(() => {

    }, [pathname])

    return (
        <div className="page-parent-wrapper">
            <Toast ref={toast} />
            <div className="solid-form-wrapper">
                <div className="solid-form-section">
                    <form onSubmit={formik.handleSubmit}>
                        <div className="page-header secondary-border-bottom">
                            <div className="form-wrapper-title">Settings</div>
                            <div className="gap-3 flex">
                                <Button label="Save" size="small" onClick={() => showError()} type="submit" />
                                <CancelButton />
                            </div>
                        </div>
                        <div className="p-4 solid-form-content">
                            {pathname.includes("app-settings") &&
                                <>
                                    <p className='font-bold ' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>App Logo </p>
                                    <div className='formgrid grid'>
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">App Logo</label>
                                                        </div>
                                                        {/* <div className="col-7">
                                                <InputText
                                                    type="text"
                                                    id="appTitle"
                                                    name="appTitle"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.appTitle}
                                                />
                                            </div> */}
                                                    </div>
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
                                                            <label className="form-field-label">App Title</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appTitle"
                                                                name="appTitle"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appTitle}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-5">
                                                            <label className="form-field-label">Description</label>
                                                        </div>
                                                        <div className="col-7">
                                                            <InputText
                                                                type="text"
                                                                id="appDescription"
                                                                name="appDescription"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.appDescription}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>

                                    <p className='font-bold mt-4' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Policies Links </p>
                                    <div className='formgrid grid'>
                                        <div className='col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-6 mt-3">
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
                                        </div>
                                    </div>
                                    <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
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