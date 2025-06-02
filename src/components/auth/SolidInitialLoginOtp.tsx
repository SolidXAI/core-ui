"use client";

import { AppTitle } from "@/helpers/AppTitle";
import { useConfirmOtpLoginMutation } from "@/redux/api/authApi";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { Form, Formik } from "formik";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { InputOtp } from "primereact/inputotp";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useEffect, useRef } from "react";
import * as Yup from "yup";
import SolidLogo from '../../resources/images/SS-Logo.png'
import { signIn } from "next-auth/react";

const SolidInitialLoginOtp = () => {
    const searchParams = useSearchParams();
    const tempEmail = searchParams.get('email');
    const email = tempEmail ? decodeURIComponent(tempEmail) : '';
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
                        <div className={`solid-logo flex align-items-center ${process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION}`}>
                            <Image
                                alt="solid logo"
                                src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                                className="relative"
                                fill
                            />
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'text-center mt-4' : 'text-left'}`}>OTP Verification</h2>
                <p className="solid-auth-subtitle text-sm">
                    Please enter the OTP sent to your email to complete verification
                </p>
                <>
                    <Formik
                        initialValues={{
                            otp: "",
                        }}
                        validationSchema={validationSchema}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            try {
                                const payload = {
                                    type: "email",
                                    identifier: email,
                                    otp: values.otp
                                };

                                const response = await initiateOtpLogin(payload).unwrap(); // Call mutation trigger

                                if (response?.statusCode === 200) {
                                    const otpResponse = await signIn("credentials", {
                                        redirect: false,
                                        accessToken: response?.data?.accessToken,
                                        email: response?.data?.user?.email,
                                    });

                                    if (otpResponse?.error) {
                                        showToast("error", "Login Error", otpResponse.error);
                                    } else {
                                        showToast("success", "Login Success", "Redirecting to dashboard...");
                                        router.push(`${process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL}`);
                                    }
                                } else {
                                    showToast("error", "Invalid OTP", response.error);
                                    setErrors({
                                        otp: "Invalid OTP",
                                    });
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
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="otp" className="solid-auth-input-label">Enter OTP</label>
                                    <InputOtp
                                        value={formik.values.otp}
                                        onChange={(e) => formik.setFieldValue("otp", e.value)}
                                        length={6}
                                        style={{ width: '100%' }}
                                        invalid={!!formik.errors.otp}
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
                                    <Button type="button" label="Back" className="w-full auth-back-button text-center mt-1" link onClick={() => (window.location.href = '/auth/login')} />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>
            </div>
            {/* <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    {'<'} Back to <Link className="font-bold" href="/auth/login">Back</Link>
                </div>
            </div> */}
        </>
    );
};

export default SolidInitialLoginOtp;