"use client";

import { useConfirmForgotPasswordMutation } from "@/redux/api/authApi";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useContext, useRef } from "react";
import * as Yup from "yup";
import { LayoutContext } from "../layout/context/layoutcontext";


const SolidResetPassword = ({ verificationToken, username }: { verificationToken?: any, username?: any }) => {
    const { layoutConfig } = useContext(LayoutContext);
    const { authLayout } = layoutConfig;
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
                console.log("Paylod", payload);
                const response = await confirmForgotPassword(payload).unwrap();
                if (response?.statusCode === 200) {
                    showToast("success", "Login Successfull", "Password Updated Successfully")
                    router.push('/auth/login');
                } else (
                    showToast("error", "Login Error", response.error)
                )
            } catch (err: any) {
                console.log("Error", err);
                showToast("error", "Login Error", err?.data ? err?.data?.message : "Something Went Wrong");
            }
        },
    });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <>
            <Toast ref={toast} />
            <div className={`auth-container ${authLayout === 'Center' ? 'center' : 'side'}`}>
                {authLayout === 'Center' &&
                    <div className="flex justify-content-center">
                        <div className="solid-logo flex align-items-center gap-3">
                            <img
                                alt="solid logo"
                                src={'/images/SS-Logo-1 1.png'}
                                className="position-relative img-fluid"
                            />
                            <div>
                                <p className="solid-logo-title">
                                    Solid<br />Starters
                                </p>
                            </div>
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${authLayout === 'Center' ? 'text-center' : 'text-left'}`}>Create New Password</h2>
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
                    <div className="flex flex-column gap-2 mt-4" style={{}}>
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
                    </div>
                </form>
            </div>
            <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    {'<'} Back to <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div>
        </>
    );
};

export default SolidResetPassword;