"use client"
import { useCreateSolidSettingsMutation, useUpdateSolidSettingsMutation } from '@/redux/api/solidSettingsApi';
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

export const GeneralSettings = ({ solidSettingsData }: { solidSettingsData: any }) => {
    const pathname = usePathname();
    const [updateSolidSettings] = useUpdateSolidSettingsMutation();
    const [
        createSolidSettings,
    ] = useCreateSolidSettingsMutation();
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
        iamAllowPublicRegistration: solidSettingsData?.data?.records?.[0]?.iamAllowPublicRegistration || false,
        iamPasswordRegistrationEnabled: solidSettingsData?.data?.records?.[0]?.iamPasswordRegistrationEnabled || false,
        iamPasswordLessRegistrationEnabled: solidSettingsData?.data?.records?.[0]?.iamPasswordLessRegistrationEnabled || false,
        iamActivateUserOnRegistration: solidSettingsData?.data?.records?.[0]?.iamActivateUserOnRegistration || false,
        iamGoogleOAuthEnabled: solidSettingsData?.data?.records?.[0]?.iamGoogleOAuthEnabled || false,
        shouldQueueEmails: solidSettingsData?.data?.records?.[0]?.shouldQueueEmails || false,
        shouldQueueSms: solidSettingsData?.data?.records?.[0]?.shouldQueueSms || false,
        authPagesTheme: solidSettingsData?.data?.records?.[0]?.authPagesTheme || "light",
        authPagesLayout: solidSettingsData?.data?.records?.[0]?.authPagesLayout || "center",
        appTnc: solidSettingsData?.data?.records?.[0]?.appTnc || "",
        appPrivacyPolicy: solidSettingsData?.data?.records?.[0]?.appPrivacyPolicy || "",
        iamDefaultRole: solidSettingsData?.data?.records?.[0]?.iamDefaultRole || "Admin",
        appTitle: solidSettingsData?.data?.records?.[0]?.appTitle || "SolidX",
        appDescription: solidSettingsData?.data?.records?.[0]?.appDescription || "appDescription",
    };
    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log("Formik Values:", formik.values);
            try {
                const formData = new FormData()
                Object.entries(values).forEach(([key, value]) => {
                    if (typeof value === "boolean") {
                        formData.append(key, value ? "true" : "");
                    } else {
                        formData.append(key, value.toString());
                    }
                });
                if (solidSettingsData?.data?.records?.length > 0) {
                    await updateSolidSettings({
                        id: solidSettingsData?.data?.records?.[0]?.id,
                        data: formData,
                    }).unwrap()
                    showToast("success", "Success", "General Settings Updated");
                } else {
                    createSolidSettings(formData)
                    showToast("success", "Success", "General Settings Created");
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
    console.log("pathname", pathname);

    return (
        <div className="page-parent-wrapper">
            <Toast ref={toast} />
            <div className="solid-form-wrapper">
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
                                                            name="iamAllowPublicRegistration"
                                                            checked={formik.values.iamAllowPublicRegistration}
                                                            onChange={(e) => formik.setFieldValue("iamAllowPublicRegistration", e.value)}
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
                                                            name="iamPasswordLessRegistrationEnabled"
                                                            checked={formik.values.iamPasswordLessRegistrationEnabled}
                                                            onChange={(e) => formik.setFieldValue("iamPasswordLessRegistrationEnabled", e.value)}
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
                                                            name="iamActivateUserOnRegistration"
                                                            checked={formik.values.iamActivateUserOnRegistration}
                                                            onChange={(e) => formik.setFieldValue("iamActivateUserOnRegistration", e.value)}
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
    )
}