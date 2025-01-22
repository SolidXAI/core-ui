"use client";

import { Form, Formik } from "formik";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useRef, useState } from "react";
import * as Yup from "yup";
import AuthBanner from "../common/AuthBanner";
import { SocialMediaLogin } from "../common/SocialMediaLogin";


const Login = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState<boolean>(false);
    const session = useSession();

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
        <div className="h-screen">
            <Toast ref={toast} />
            <div className="grid m-0 h-full">
                <div className="col-12 md:col-12 lg:col-6">
                    <div className="flex justify-content-center align-items-center h-full">
                        <div className="col-12 sm:col-8">
                            <h2 className="text-4xl text-semibold text-start secondary-color">Sign in to {process.env.SOLID_APP_TITLE}</h2>
                            {/* <p className="signup-desc text-center">Create your account</p> */}
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
                                                <label htmlFor="email" className="text-color-secondary">Email</label>
                                                <InputText
                                                    id="email"
                                                    name="email"
                                                    placeholder="Your Email"
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
                                                <label htmlFor="password" className="text-color-secondary">Password</label>
                                                <Password
                                                    id="password"
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value);
                                                        formik.setFieldValue("password", e.target.value);
                                                    }}
                                                    toggleMask
                                                    className={classNames("p-inputtext-sm w-full s-password-input", {
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
                                            <div className="flex align-items-center mt-4">
                                                <Checkbox inputId="remember" onChange={(e: any) => setChecked(e.checked)} checked={checked} />
                                                <label htmlFor="remember" className="ml-2">Remember me</label>
                                            </div>
                                            <div className="mt-4">
                                                <Button className="w-full secondary-bg-color" label="Sign in" style={{ borderColor: 'currentcolor' }} />
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                                <Divider align="center">
                                    <div className="inline-flex align-items-center text-400">
                                        or continue with
                                    </div>
                                </Divider>
                                <div className="text-center">
                                    <div className="text-sm text-400">
                                        Don’t have an account ? <Link href="/auth/register">Sign up</Link>
                                    </div>
                                </div>
                                <SocialMediaLogin />
                            </>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-12 lg:col-6 hidden lg:block p-0">
                    <AuthBanner></AuthBanner>
                </div>
            </div>
        </div>
    );
};

export default Login;
