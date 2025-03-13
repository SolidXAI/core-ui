"use client";

import { useInitateRegisterMutation, useRegisterMutation } from "@/redux/api/authApi";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { TabPanel, TabView } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { AppTitle } from "@/helpers/AppTitle";
import Image from "next/image";
import SolidLogo from '../../resources/images/SS-Logo.png'

interface AuthTabsProps {
    iamPasswordRegistrationEnabled: boolean;
    iamPasswordLessRegistrationEnabled: boolean;
}

const SolidRegister = () => {
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery();
    useEffect(() => {
        trigger("")
    }, [trigger])
    const toast = useRef<Toast>(null);

    const router = useRouter();

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const [register, { isLoading, error, isSuccess, data }] = useRegisterMutation();

    const [initiateOtpRegister] = useInitateRegisterMutation();

    const showError = () => {
        if (error) {
            if ("data" in error) {
                const apiError = error as FetchBaseQueryError;
                const errorMessages = Array.isArray(apiError.data?.message)
                    ? apiError.data?.message
                    : [apiError.data?.message];

                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: errorMessages.join(", "),
                    life: 3000,
                });
            } else {
                const serializedError = error as Error;
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: serializedError.message || "An error occurred",
                    life: 3000,
                });
            }
        }
    };

    useEffect(() => {
        if (error) {
            showError();
        }
    }, [error]);

    useEffect(() => {
        if (isSuccess) {
            router.replace("/auth/login");
        }
    }, [isSuccess])
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const PasswordSignup = () => {
        return (
            <Formik
                initialValues={{
                    username: "",
                    email: "",
                    password: "",
                }}
                validationSchema={Yup.object({
                    username: Yup.string().required("User Name is required"),
                    email: Yup.string()
                        .email("Invalid email address")
                        .required("Email is required"),
                    password: Yup.string().required("Password is required"),
                })}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    try {
                        const userData = {
                            username: values.username,
                            email: values.email,
                            password: values.password,
                        };

                        const response = await register(userData).unwrap();
                        if (response?.statusCode === 200) {
                            showToast("success", "User Registered", response?.data?.message);
                            setTimeout(() => {
                                router.push(`/auth/login`);
                            }, 3000);
                        } else {
                            showToast("error", "Login Error", response.error);
                            // setErrors({
                            //     username: 'Invalid email or password',
                            //     email: "Invalid email or password",
                            //     password: "Invalid email or password",
                            // });
                        }
                    } catch (err: any) {
                        showToast("error", "Login Conflict", err?.data ? err?.data?.message : "Something Went Wrong");
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">Username</label>
                            <InputText
                                id="username"
                                name="username"
                                placeholder="username"
                                onChange={formik.handleChange}
                                value={formik.values.username}
                                invalid={!!formik.errors.username}
                            />
                            {isFormFieldValid(formik, "username") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.username?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">Email</label>
                            <InputText
                                id="email"
                                name="email"
                                placeholder="Yourgmail@123.com"
                                onChange={formik.handleChange}
                                value={formik.values.email}
                                invalid={!!formik.errors.email}
                            />
                            {isFormFieldValid(formik, "email") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.email?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="password" className="solid-auth-input-label">Password</label>
                            <Password
                                id="password"
                                name="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                toggleMask
                                inputClassName="w-full"
                                feedback={false}
                                invalid={!!formik.errors.password}
                            />
                            {isFormFieldValid(formik, "password") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.password?.toString()}
                            />}
                        </div>
                        <div className="mt-4">
                            <Button className="w-full font-light auth-submit-button" label="Sign Up" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const PasswordLessSignup = () => {
        return (
            <Formik
                initialValues={{
                    username: "",
                    email: "",
                }}
                validationSchema={Yup.object({
                    username: Yup.string().required("User Name is required"),
                    email: Yup.string()
                        .email("Invalid email address")
                        .required("Email is required"),
                })}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        const payload = {
                            username: values.username,
                            email: values.email,
                            validationSources: ["email"]
                        };

                        const response = await initiateOtpRegister(payload).unwrap(); // Call mutation trigger

                        if (response?.statusCode === 200) {
                            showToast("success", "OTP sent Successfully", response?.data?.message);
                            const email = values.email;
                            router.push(`/auth/initiate-register?email=${email}`);
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
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">Username</label>
                            <InputText
                                id="username"
                                name="username"
                                placeholder="username"
                                onChange={formik.handleChange}
                                value={formik.values.username}
                                invalid={!!formik.errors.username}
                            />
                            {isFormFieldValid(formik, "username") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.username?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">Email</label>
                            <InputText
                                id="email"
                                name="email"
                                placeholder="Yourgmail@123.com"
                                onChange={formik.handleChange}
                                value={formik.values.email}
                                invalid={!!formik.errors.email}
                            />
                            {isFormFieldValid(formik, "email") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.email?.toString()}
                            />}
                        </div>
                        <div className="mt-4">
                            <Button className="w-full font-light auth-submit-button" label="Sign Up" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const AuthTabs: React.FC<AuthTabsProps> = ({ iamPasswordRegistrationEnabled, iamPasswordLessRegistrationEnabled }) => {
        if (iamPasswordRegistrationEnabled && iamPasswordLessRegistrationEnabled) {
            return (
                <TabView className="solid-auth-tabview">
                    <TabPanel header="With Password">
                        <PasswordSignup />
                    </TabPanel>
                    <TabPanel header="Without Password">
                        <PasswordLessSignup />
                    </TabPanel>
                </TabView>
            );
        } else if (iamPasswordRegistrationEnabled) {
            return <PasswordSignup />;
        } else if (iamPasswordLessRegistrationEnabled) {
            return <PasswordLessSignup />;
        } else {
            return <p>No authentication method available</p>;
        }
    };
    return (
        <div className="">
            <Toast ref={toast} />
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                {solidSettingsData?.data?.authPagesLayout === 'center' &&
                    <div className="flex justify-content-center">
                        <div className="solid-logo flex align-items-center gap-3">
                            <Image
                                alt="solid logo"
                                src={SolidLogo}
                                className="relative"
                                fill
                            />
                            <AppTitle title={solidSettingsData} />
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'text-center' : 'text-left'}`}>Sign Up</h2>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}
                <AuthTabs iamPasswordRegistrationEnabled={solidSettingsData?.data?.iamPasswordRegistrationEnabled} iamPasswordLessRegistrationEnabled={solidSettingsData?.data?.iamPasswordLessRegistrationEnabled} />
                {solidSettingsData?.data?.iamGoogleOAuthEnabled &&
                    <>
                        <Divider align="center">
                            <div className="inline-flex align-items-center">
                                or
                            </div>
                        </Divider>
                        <SocialMediaLogin />
                    </>
                }
            </div>
            <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    Already have an account ? <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default SolidRegister;