"use client";

import { Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useContext, useRef, useState } from "react";
import * as Yup from "yup";
import { LayoutContext } from "../layout/context/layoutcontext";


const SolidLogin = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { authLayout } = layoutConfig;
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState<boolean>(false);

    const validationSchema = Yup.object({
        email: Yup.string()
            .email("Invalid email address")
            .required("Email is required"),
        password: Yup.string().required("Password is required"),
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
        <div className="">
            <Toast ref={toast} />
            <div className={`auth-container ${authLayout === 'Center' ? 'center' : 'side'}`}>
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
                <h2 className="solid-auth-title text-center">Sign In To Your Account</h2>
                <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p>
                <>
                    <Formik
                        initialValues={{
                            email: "",
                            password: "",
                        }}
                        validationSchema={validationSchema}
                        onSubmit={async (values) => {
                            // Handle form submission
                            const email = values.email;
                            const password = values.password;

                            const response = await signIn("credentials", {
                                redirect: false,
                                email,
                                password,
                            });
                            if (response?.error) {
                                showToast("error", "Login Error", response.error);
                            } else {
                                showToast("success", "Login Success", "Redirecting to dashboard...");
                                router.push("/admin/core/solid-core/user/list");
                            }

                        }}
                    >
                        {(formik) => (
                            <Form>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="email" className="solid-auth-input-label">Username or Email</label>
                                    <InputText
                                        id="email"
                                        name="email"
                                        placeholder="Email ID"
                                        onChange={formik.handleChange}
                                        value={formik.values.email}
                                    />
                                    {isFormFieldValid(formik, "email") && <Message
                                        className="text-red-500 text-sm"
                                        severity="error"
                                        text={formik?.errors?.email?.toString()}
                                    />}
                                </div>
                                <div className="flex flex-column gap-2 mt-4" style={{}}>
                                    <label htmlFor="password" className="solid-auth-input-label">Password</label>
                                    <Password
                                        id="password"
                                        placeholder="***************"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            formik.setFieldValue("password", e.target.value);
                                        }}
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
                                {/* <div className="flex align-items-center mt-4">
                                        <Checkbox inputId="remember" onChange={(e: any) => setChecked(e.checked)} checked={checked} />
                                        <label htmlFor="remember" className="ml-2">Remember me</label>
                                    </div> */}
                                <div className="mt-4 text-right">
                                    <Link href={"/auth/forgot-password"} className="solid-auth-input-label">Forgot Password?</Link>
                                </div>
                                <div className="mt-4">
                                    <Button className="w-full font-light" label="Sign In" />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>
            </div>
            <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    Don’t have an account ? <Link className="font-bold" href="/auth/register">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default SolidLogin;