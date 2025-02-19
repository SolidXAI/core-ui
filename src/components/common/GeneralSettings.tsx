"use client"
import { useCreateSolidSettingsMutation, useUpdateSolidSettingsMutation } from '@/redux/api/solidSettingsApi';
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import { Toast } from 'primereact/toast';
import { useRef } from 'react'

export const GeneralSettings = ({ solidSettingsData }: { solidSettingsData: any }) => {
    console.log("solidSettingsData", solidSettingsData);

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
                        formData.append(key, value.toString().toLowerCase());
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

    const booleanOptions = [
        { label: "True", value: true },
        { label: "False", value: false },
    ]

    const justifyOptions = [
        { icon: 'pi pi-align-left', value: 'left' },
        { icon: 'pi pi-align-center', value: 'Center' },
        { icon: 'pi pi-align-right', value: 'Right' },
    ];

    const justifyTemplate = (option: any) => {
        return <i className={option.icon}></i>;
    }

    return (
        <div className="page-parent-wrapper p-4">
            <Toast ref={toast} />
            <h3>General Settings</h3>
            <div className="formgrid grid">
                <div className="col-7">
                    <form onSubmit={formik.handleSubmit}>
                        <div className="formgrid grid">
                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Allow Public Registration</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="iamAllowPublicRegistration"
                                            value={formik.values.iamAllowPublicRegistration}
                                            onChange={(e) => formik.setFieldValue("iamAllowPublicRegistration", e.value)}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Password Registration Enabled</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="iamPasswordRegistrationEnabled"
                                            value={formik.values.iamPasswordRegistrationEnabled}
                                            onChange={(e) => formik.setFieldValue("iamPasswordRegistrationEnabled", e.value)}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Passwordless Registration Enabled</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="iamPasswordLessRegistrationEnabled"
                                            value={formik.values.iamPasswordLessRegistrationEnabled}
                                            onChange={(e) => formik.setFieldValue("iamPasswordLessRegistrationEnabled", e.value)}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Google OAuth Enabled</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="iamGoogleOAuthEnabled"
                                            value={formik.values.iamGoogleOAuthEnabled}
                                            onChange={(e) => formik.setFieldValue("iamGoogleOAuthEnabled", e.value)}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Use queue for sending emails</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="shouldQueueEmails"
                                            value={formik.values.shouldQueueEmails}
                                            onChange={(e) => formik.setFieldValue("shouldQueueEmails", e.value)}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Use queue for sending SMS</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="shouldQueueSms"
                                            onChange={(e) => formik.setFieldValue("shouldQueueSms", e.value)}
                                            value={formik.values.shouldQueueSms}
                                            options={booleanOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Authentication Pages Theme</label>
                                    </div>
                                    <div className="col-7">
                                        <div className="theme-buttons mt-2">
                                            <Button
                                                type="button"
                                                label="Solid Light"
                                                outlined={formik.values.authPagesTheme !== "light"}
                                                onClick={() => formik.setFieldValue("authPagesTheme", "light")}
                                            />
                                            <Button
                                                type="button"
                                                label="Solid Dark"
                                                outlined={formik.values.authPagesTheme !== "dark"}
                                                onClick={() => formik.setFieldValue("authPagesTheme", "dark")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 mt-3">
                                <div className="formgrid grid align-items-center">
                                    <div className="col-5">
                                        <label className="form-field-label">Authentication Pages Theme</label>
                                    </div>
                                    <div className="col-7">
                                        <SelectButton
                                            name="authPagesLayout"
                                            value={
                                                formik.values.authPagesLayout === "left"
                                                    ? "left"
                                                    : formik.values.authPagesLayout.charAt(0).toUpperCase() + formik.values.authPagesLayout.slice(1)
                                            }
                                            onChange={(e) => formik.setFieldValue("authPagesLayout", e.value)}
                                            itemTemplate={justifyTemplate}
                                            optionLabel="value"
                                            options={justifyOptions}
                                        />
                                    </div>
                                </div>
                            </div>
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
                        <Button type="submit" label="Save" className="mt-3" />
                    </form>
                </div>
            </div>
        </div>
    )
}