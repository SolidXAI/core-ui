"use client";

import { AppTitle } from "@/helpers/AppTitle";
import { useConfirmOtpLoginMutation } from "@/redux/api/authApi";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputOtp } from "primereact/inputotp";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useEffect, useRef } from "react";
import * as Yup from "yup";

const SolidInitialLoginOtp = ({ email }: { email: string }) => {
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery();
    useEffect(() => {
        trigger("")
    }, [trigger])
    const [initiateOtpLogin] = useConfirmOtpLoginMutation();

    const toast = useRef<Toast>(null);
    const router = useRouter();

    const validationSchema = Yup.object({
        otp: Yup.string()
            .matches(/^\d{6}$/, "OTP must be a 6-digit number")
            .required("OTP is required"),
    });

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <>
            <Toast ref={toast} />
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`} style={{ minWidth: 480 }}>
                {solidSettingsData?.data?.authPagesLayout === 'center' &&
                    <div className="flex justify-content-center">
                        <div className="solid-logo flex align-items-center gap-3">
                            <img
                                alt="solid logo"
                                src={'/images/SS-Logo-1 1.png'}
                                className="position-relative img-fluid"
                            />
                            <AppTitle title={solidSettingsData} />
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'text-center' : 'text-left'}`}>OTP Verification</h2>
                <p className="solid-auth-subtitle text-sm">
                    Please enter the OTP sent to your email to complete verification
                </p>
                <>
                    <Formik
                        initialValues={{
                            otp: "",
                        }}
                        validationSchema={validationSchema}
                        onSubmit={async (values, { setSubmitting }) => {
                            try {
                                const payload = {
                                    type: "email",
                                    identifier: email,
                                    otp: values.otp
                                };

                                const response = await initiateOtpLogin(payload).unwrap(); // Call mutation trigger

                                if (response?.statusCode === 200) {
                                    showToast("success", "Login Successfully", "Login");
                                    router.push(`/admin/core/solid-core/user/list`);
                                } else {
                                    showToast("error", "Login Error", response.error);
                                }
                            } catch (err: any) {
                                showToast("error", "Login Error", err?.data ? err?.data?.message : "Something Went Wrong");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {(formik) => (
                            <Form>
                                <div className="flex flex-column gap-2 px-3">
                                    <label htmlFor="otp" className="solid-auth-input-label">Enter OTP</label>
                                    <InputOtp
                                        value={formik.values.otp}
                                        onChange={(e) => formik.setFieldValue("otp", e.value)}
                                        length={6}
                                        style={{ width: '100%' }}
                                    />
                                    {isFormFieldValid(formik, "otp") && (
                                        <Message className="text-red-500 text-sm" severity="error" text={formik.errors.otp?.toString()} />
                                    )}
                                    <div className="flex align-items-center justify-content-between">
                                        <Button type="button" icon='pi pi-refresh' iconPos="left" link label="Resend Code" className="px-0 text-sm font-normal" />
                                        <p className="m-0 text-sm text-color">
                                            Time left: 00:28
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button type="submit" className="w-full font-light auth-submit-button" label="Verify" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>
            </div>
            <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    {'<'} Back to <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div>
        </>
    );
};

export default SolidInitialLoginOtp;