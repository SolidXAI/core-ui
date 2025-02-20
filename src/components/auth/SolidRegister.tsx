"use client";

import { useRegisterMutation } from "@/redux/api/authApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { ChangeEventHandler, useContext, useEffect, useRef, useState } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { LayoutContext } from "../layout/context/layoutcontext";

const SolidRegister = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { authLayout } = layoutConfig;
    const toast = useRef<Toast>(null);
    const [password, setPassword] = useState("");
    const [checked, setChecked] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
    });

    const validationSchema = Yup.object({
        username: Yup.string().required("User Name is required"),
        email: Yup.string()
            .email("Invalid email address")
            .required("Email is required"),
        password: Yup.string().required("Password is required"),
    });

    const router = useRouter();

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const [register, { isLoading, error, isSuccess, data }] = useRegisterMutation();

    const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const initialValues = {
        username: "",
        email: "",
        password: "",
    }

    const formik = useFormik({
        initialValues,
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const userData = {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                };

                await register(userData);
            } catch (err) {
                console.log('inside', err);
            }
        }
    });

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
                <h2 className={`solid-auth-title ${authLayout === 'Center' ? 'text-center' : 'text-left'}`}>Sign Up To Your Account</h2>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}
                <>
                    <form onSubmit={formik.handleSubmit}>
                        {/* <div className="grid">
                            <div className="col-6">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="email" className="solid-auth-input-label">First Name</label>
                                    <InputText
                                        id="username"
                                        name="username"
                                        placeholder="username"
                                        onChange={formik.handleChange}
                                        value={formik.values.username}
                                    />
                                    {isFormFieldValid(formik, "username") && <Message
                                        className="text-red-500 text-sm"
                                        severity="error"
                                        text={formik?.errors?.username?.toString()}
                                    />}
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="email" className="solid-auth-input-label">Last Name</label>
                                    <InputText
                                        id="email"
                                        name="email"
                                        placeholder="Yourgmail@123.com"
                                        onChange={formik.handleChange}
                                        value={formik.values.email}
                                    />
                                    {isFormFieldValid(formik, "email") && <Message
                                        className="text-red-500 text-sm"
                                        severity="error"
                                        text={formik?.errors?.email?.toString()}
                                    />}
                                </div>
                            </div>
                        </div> */}
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">Username</label>
                            <InputText
                                id="username"
                                name="username"
                                placeholder="username"
                                onChange={formik.handleChange}
                                value={formik.values.username}
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
                                placeholder="***************"
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
                        <div className="mt-4">
                            <Button className="w-full font-light auth-submit-button" label="Sign Up"  disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        </div>
                    </form>
                </>
                <Divider align="center">
                    <div className="inline-flex align-items-center">
                        or
                    </div>
                </Divider>
                <SocialMediaLogin />
            </div>
            <div className="text-center mt-5">
                <div className="text-sm text-400 secondary-dark-color">
                    Already have an account ? <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div>
        </>
    );
};

export default SolidRegister;