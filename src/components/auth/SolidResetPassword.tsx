"use client";

import { AppTitle } from "@/helpers/AppTitle";
import { useConfirmForgotPasswordMutation } from "@/redux/api/authApi";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { useFormik } from "formik";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef } from "react";
import * as Yup from "yup";
import SolidLogo from '../../resources/images/SS-Logo.png'

const SolidResetPassword = () => {
    const searchParams = useSearchParams();
    const verificationToken = searchParams.get('token');
    const decodedUsername = searchParams.get('username');
    const username = decodedUsername ? decodeURIComponent(decodedUsername) : '';
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery();
    useEffect(() => {
        trigger("")
    }, [trigger])
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const [confirmForgotPassword] = useConfirmForgotPasswordMutation();
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const validationSchema = Yup.object({
        password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
        confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    });

    const formik = useFormik({
        initialValues: {
            username: username,
            password: "",
            confirmPassword: "",
            verificationToken: verificationToken,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const payload = {
                    username: values.username,
                    password: values.password,
                    verificationToken: values.verificationToken,
                };
                const response = await confirmForgotPassword(payload).unwrap();
                if (response?.statusCode === 200) {
                    showToast("success", "Login Successfull", "Password Updated Successfully")
                    router.push('/auth/login');
                } else (
                    showToast("error", "Login Error", response.error)
                )
            } catch (err: any) {
                showToast("error", "Login Error", err?.data ? err?.data?.message : "Something Went Wrong");
            }
        },
    });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <>
            <Toast ref={toast} />
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                {solidSettingsData?.data?.authPagesLayout === 'center' &&
                    <div className="flex justify-content-center">
                        <div className={`solid-logo flex align-items-center ${solidSettingsData?.data?.appLogo_POSITION}`}>
                            <Image
                                alt="solid logo"
                                src={solidSettingsData?.data?.appLogo ?? SolidLogo}
                                className="relative"
                                fill
                            />
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'text-center' : 'text-left'}`}>Create New Password</h2>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}
                <form onSubmit={formik.handleSubmit}>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="password" className="solid-auth-input-label">New Password</label>
                        <Password
                            id="password"
                            name="password"
                            placeholder="***************"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            toggleMask
                            className={classNames("", {
                                "p-invalid": isFormFieldValid(formik, "password"),
                            })}
                            inputClassName="w-full"
                            feedback={false}
                        />
                        {isFormFieldValid(formik, "password") && <Message
                            className="text-red-500 text-sm"
                            severity="error"
                            text={formik?.errors?.password?.toString()}
                        />}
                    </div>
                    <div className="flex flex-column gap-1 mt-4" style={{}}>
                        <label htmlFor="password" className="solid-auth-input-label">Confirm Password</label>
                        <Password
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="***************"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            toggleMask
                            className={classNames("", {
                                "p-invalid": isFormFieldValid(formik, "confirmPassword"),
                            })}
                            inputClassName="w-full"
                            feedback={false}
                        />
                        {isFormFieldValid(formik, "confirmPassword") && <Message
                            className="text-red-500 text-sm"
                            severity="error"
                            text={formik?.errors?.confirmPassword?.toString()}
                        />}
                    </div>
                    {/* <div className="flex align-items-center mt-4">
                                        <Checkbox inputId="remember" onChange={(e: any) => setChecked(e.checked)} checked={checked} />
                                        <label htmlFor="remember" className="ml-2">Remember me</label>
                                    </div> */}
                    <div className="mt-4">
                        <Button className="w-full font-light auth-submit-button" label="Reset Password" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        <Button type="button" label="Back" className="w-full auth-back-button text-center mt-1" link onClick={() => (window.location.href = '/auth/login')} />
                    </div>
                </form>
            </div>
            {/* <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    {'<'} Back to <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div> */}
        </>
    );
};

export default SolidResetPassword;