"use client";

import { Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useContext, useRef, useState } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { LayoutContext } from "../layout/context/layoutcontext";


const SolidLogin = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { authLayout } = layoutConfig;
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const [password, setPassword] = useState('');

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
                <h2 className={`solid-auth-title ${authLayout === 'Center' ? 'text-center' : 'text-left'}`}>Sign In To Your Account</h2>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}

                <TabView>
                    <TabPanel header="Login With Password">
                        <Formik
                            initialValues={{
                                email: "",
                                password: "",
                            }}
                            validationSchema={validationSchema}
                            onSubmit={async (values, { setSubmitting }) => {
                                try {
                                    const response = await signIn("credentials", {
                                        redirect: false,
                                        email: values.email,
                                        password: values.password,
                                    });

                                    if (response?.error) {
                                        showToast("error", "Login Error", response.error);
                                    } else {
                                        showToast("success", "Login Success", "Redirecting to dashboard...");
                                        router.push("http://localhost:3001/admin/core/solid-core/user/list");
                                    }
                                } catch (error) {
                                    showToast("error", "Login Failed", "Something went wrong");
                                } finally {
                                    setSubmitting(false); // Re-enable the button after submission
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
                                        <Link href={"/auth/initiate-forgot-password"} className="solid-auth-input-label">Forgot Password?</Link>
                                    </div>
                                    <div className="mt-4">
                                        <Button className="w-full font-light auth-submit-button" label="Sign In" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </TabPanel>
                    <TabPanel header="Login Without Password">
                    </TabPanel>
                </TabView>
                <Divider align="center">
                    <div className="inline-flex align-items-center">
                        or
                    </div>
                </Divider>
                <SocialMediaLogin />
            </div>
            {/* <div className=" mt-5">
                <div className="text-sm text-center text-400 secondary-dark-color">
                    Don’t have an account ? <Link className="font-bold" href="/auth/register">Sign Up</Link>
                </div>
            </div> */}
        </div>
    );
};

export default SolidLogin;