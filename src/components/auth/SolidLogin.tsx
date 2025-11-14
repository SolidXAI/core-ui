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
import { useContext, useEffect, useRef, useState } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { LayoutContext } from "../layout/context/layoutcontext";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { useInitateLoginMutation } from "@/redux/api/authApi";
import { AppTitle } from "@/helpers/AppTitle";
import Image from "next/image";
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import { formatTimeLeft } from "@/helpers/resendOtpHelper";
import { ERROR_MESSAGES } from "@/constants/error-messages";
// import { Checkbox } from "primereact/checkbox";
interface AuthTabsProps {
    iamPasswordRegistrationEnabled: boolean;
    passwordlessRegistration: boolean;
}
const SolidLogin = ({ signInValidatorLabel, signInValidatorPlaceholder }: any) => {
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery();
    const [initiateLogin] = useInitateLoginMutation();
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])
    const toast = useRef<Toast>(null);
    const router = useRouter();

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

    const PasswordLogin = () => {
        return (
            <Formik
                initialValues={{
                    email: "",
                    // email: initialEmail,
                    password: "",
                    // rememberMe: rememberMe,
                }}
                enableReinitialize={false}
                validationSchema={Yup.object({
                    email: Yup.string()
                        .email("Invalid email address")
                        .required("Email is required"),
                    password: Yup.string().required("Password is required"),
                })}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    try {
                        // Handle Remember Me
                        // if (values.rememberMe) {
                        //     localStorage.setItem("rememberedEmail", values.email);
                        // } else {
                        //     localStorage.removeItem("rememberedEmail");
                        // }
                        const response = await signIn("credentials", {
                            redirect: false,
                            email: values.email,
                            password: values.password,
                        });

                        if (response?.error) {                            
                            showToast("error", ERROR_MESSAGES.LOGIN_ERROR, response.error);
                            setErrors({
                                email: ERROR_MESSAGES.INVALID_CREDENTIALS,
                                password: ERROR_MESSAGES.INVALID_CREDENTIALS,
                            });
                        } else {
                            showToast("success", ERROR_MESSAGES.LOGIN_SUCCESS, ERROR_MESSAGES.DASHBOARD_REDIRECTING);
                            router.push(`${process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL}`);
                        }
                    } catch (error: any) {
                        showToast("error", ERROR_MESSAGES.LOGIN_ERROR, error?.data ? error?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG);
                    } finally {
                        setSubmitting(false); // Re-enable the button after submission
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">{signInValidatorLabel ? signInValidatorLabel : "Username or Email"}</label>
                            <InputText
                                id="email"
                                name="email"
                                placeholder={signInValidatorPlaceholder ? signInValidatorPlaceholder : "Email ID"}
                                onChange={formik.handleChange}
                                value={formik.values.email}
                                invalid={!!formik.errors.email}
                                onBlur={formik.handleBlur}
                            />
                            {isFormFieldValid(formik, "email") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.email?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-1 mt-4" style={{}}>
                            <label htmlFor="password" className="solid-auth-input-label">Password</label>
                            <Password
                                id="password"
                                name="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                toggleMask
                                invalid={!!formik.errors.password}
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
                        <div className="mt-4 flex align-items-center justify-content-between">
                            {/* <div className="flex align-items-center gap-2">
                                <Checkbox
                                    inputId="rememberMe"
                                    name="rememberMe"
                                    checked={formik.values.rememberMe}
                                    onChange={formik.handleChange}
                                />
                                <label htmlFor="rememberMe" className="solid-auth-input-label">Remember me</label>
                            </div> */}
                            <div></div>
                            <Link href={"/auth/initiate-forgot-password"} className="solid-auth-input-label font-bold">Forgot Password?</Link>
                        </div>
                        <div className="mt-4">
                            <Button className="w-full font-light auth-submit-button" label="Sign In" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const PasswordLessLogin = () => {
        return (
            <Formik
                initialValues={{
                    email: "",
                }}
                validationSchema={Yup.object({
                    email: Yup.string()
                        .email("Invalid email address")
                })}
                enableReinitialize={false}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    try {
                        const RESEND_OTP_KEY = `resendOtpLogin_${values.email}`;
                        const RESEND_OTP_TIMER_MIN = parseFloat(process.env.NEXT_PUBLIC_RESEND_OTP_TIMER || '0.5');
                        const RESEND_OTP_TIMER = Math.round(RESEND_OTP_TIMER_MIN * 60);
                        const payload = {
                            type: "email",
                            identifier: values.email,
                        };
                        const storedTimeStr = localStorage.getItem(RESEND_OTP_KEY);
                        const now = Date.now();
                        if (storedTimeStr) {
                            const lastSent = parseInt(storedTimeStr, 10);
                            const elapsed = Math.floor((now - lastSent) / 1000);
                            const remaining = RESEND_OTP_TIMER - elapsed;

                            if (remaining > 0) {
                                const formatted = formatTimeLeft(remaining);
                                showToast(
                                    "error",
                                    ERROR_MESSAGES.PLEASE_WAIT,
                                    ERROR_MESSAGES.OPT_FORMAT(formatted)
                                );
                                setSubmitting(false);
                                return; //  Prevent request
                            }
                        }
                        const response = await initiateLogin(payload).unwrap(); // Call mutation trigger

                        if (response?.statusCode === 200) {
                            showToast("success", "OTP sent Successfully", response?.data?.message);
                            const email = values.email;
                            localStorage.setItem(`resendOtpLogin_${email}`, Date.now().toString());
                            router.push(`/auth/initiate-login?email=${email}`);
                        } else {
                            showToast("error",ERROR_MESSAGES.LOGIN_ERROR, response.error);
                        }
                    } catch (err: any) {
                        showToast("error", ERROR_MESSAGES.LOGIN_ERROR, err?.data ? err?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG);
                        setErrors({
                            email: "Invalid Credentials",
                        });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">{signInValidatorLabel ? signInValidatorLabel : "Username or Email"}</label>
                            <InputText
                                id="email"
                                name="email"
                                placeholder={signInValidatorPlaceholder ? signInValidatorPlaceholder : "Email ID"}
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
                        <div className="mt-4 text-right">
                            <Link href={"/auth/initiate-forgot-password"} className="solid-auth-input-label">Forgot Password?</Link>
                        </div>
                        <div className="mt-4">
                            <Button className="w-full font-light auth-submit-button" label="Sign In" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const AuthTabs: React.FC<AuthTabsProps> = ({ iamPasswordRegistrationEnabled, passwordlessRegistration }) => {
        if (iamPasswordRegistrationEnabled && passwordlessRegistration) {
            return (
                <TabView className="solid-auth-tabview"
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                >
                    <TabPanel header="With Password">
                        <PasswordLogin />
                    </TabPanel>
                    <TabPanel header="Without Password">
                        <PasswordLessLogin />
                    </TabPanel>
                </TabView>
            );
        } else if (iamPasswordRegistrationEnabled) {
            return <PasswordLogin />;
        } else if (passwordlessRegistration) {
            return <PasswordLessLogin />;
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
                        <div className={`solid-logo flex align-items-center ${solidSettingsData?.data?.appLogoPosition}`}>
                            <Image
                                alt="solid logo"
                                src={solidSettingsData?.data?.appLogo || SolidLogo}
                                className="relative"
                                fill
                            />
                        </div>
                    </div>
                }
                <h2 className={`solid-auth-title ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'text-center mt-4' : 'text-left'}`}>Sign In To Your Account</h2>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}

                <AuthTabs iamPasswordRegistrationEnabled={solidSettingsData?.data?.iamPasswordRegistrationEnabled} passwordlessRegistration={solidSettingsData?.data?.passwordlessRegistration} />
                {solidSettingsData?.data?.iamGoogleOAuthEnabled &&
                    <>
                        <Divider align="center">
                            <div className="inline-flex align-items-center">
                                OR
                            </div>
                        </Divider>
                        <SocialMediaLogin />
                    </>
                }
            </div>
            {solidSettingsData?.data?.allowPublicRegistration && <div className=" mt-5">
                <div className="text-sm text-center text-400 secondary-dark-color">
                    Don’t have an account ? <Link className="font-bold" href="/auth/register">Sign Up</Link>
                </div>
            </div>}
        </div>
    );
};

export default SolidLogin;