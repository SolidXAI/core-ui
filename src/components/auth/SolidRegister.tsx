import { useInitateRegisterMutation, useRegisterMutation } from "../../redux/api/authApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { Form, Formik } from "formik";
import Link from "../common/Link";
import { useRouter } from "../../hooks/useRouter";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { formatTimeLeft } from "../../helpers/resendOtpHelper";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import { env } from "../../adapters/env";
import { showToast } from "../../redux/features/toastSlice";
import { AuthTabs } from "./AuthTabs";
import { useDispatch } from "react-redux";
import { SolidButton, SolidDivider, SolidInput, SolidMessage, SolidPasswordInput, SolidSpinner } from "../shad-cn-ui";
import { useAuthSettings } from "./AuthSettingsContext";

interface AuthModesProps {
    passwordBasedAuth: boolean;
    passwordLessAuth: boolean;
    showNameFieldsForRegistration?: boolean;
}

const SolidRegister = () => {
    const envPasswordHelperText = env("NEXT_PUBLIC_PASSWORD_COMPLEXITY_DESC");
    const [activeIndex, setActiveIndex] = useState(0);
    const { solidSettingsData } = useAuthSettings();

    const [showOverlay, setShowOverlay] = useState(false);

    const dispatch = useDispatch();

    const router = useRouter();

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const [register, { isLoading, error, isSuccess, data }] = useRegisterMutation();

    const [initiateRegister] = useInitateRegisterMutation();

    const showError = () => {
        if (error) {
            if ("data" in error) {
                const apiError = error as FetchBaseQueryError;
                // @ts-ignore
                const errorMessages = Array.isArray(apiError.data?.message) ? apiError.data?.message : [apiError.data?.message];
                dispatch(showToast({
                    severity: "error",
                    summary: ERROR_MESSAGES.ERROR,
                    detail: errorMessages.join(", "),
                    life: 10000
                }));
            } else {
                const serializedError = error as Error;
                dispatch(showToast({
                    severity: "error",
                    summary: ERROR_MESSAGES.ERROR,
                    detail: serializedError.message || ERROR_MESSAGES.ERROR_OCCURED,
                    life: 10000
                }));
            }
        }
    };

    useEffect(() => {
        if (error) {
            showError();
        }
    }, [error]);

    // useEffect(() => {
    //     if (isSuccess) {
    //             router.replace("/auth/login");
    //     }
    // }, [isSuccess])

    const PasswordSignup = ({ showNameFieldsForRegistration }: { showNameFieldsForRegistration?: boolean }) => {
        console.log("showNameFieldsForRegistration", showNameFieldsForRegistration);
        return (
            <Formik
                initialValues={{
                    username: "",
                    email: "",
                    password: "",
                    firstName: "",
                    lastName: ""
                }}

                validationSchema={Yup.object({
                    username: showNameFieldsForRegistration
                        ? Yup.string().notRequired()
                        : Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('User Name')),

                    firstName: showNameFieldsForRegistration
                        ? Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('First Name'))
                        : Yup.string().notRequired(),

                    lastName: showNameFieldsForRegistration
                        ? Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Last Name '))
                        : Yup.string().notRequired(),

                    email: Yup.string()
                        .email(ERROR_MESSAGES.FIELD_INVALID('email address'))
                        .required(ERROR_MESSAGES.FIELD_REUQIRED('Email')),
                    password: Yup.string()
                        .required(ERROR_MESSAGES.FIELD_REUQIRED('Password'))
                        .min(8, ERROR_MESSAGES.PASSWORD_CHARACTER(8))
                        .matches(/[a-z]/, ERROR_MESSAGES.PASSWORD_CONTAIN('lowercase'))
                        .matches(/[A-Z]/, ERROR_MESSAGES.PASSWORD_CONTAIN('uppercase'))
                        .matches(/\d/, ERROR_MESSAGES.PASSWORD_CONTAIN('one', 'number'))
                        .matches(/[@$!%*?&#^(){}[\]|\\/~`+=<>:;'"_,.-]/, ERROR_MESSAGES.PASSWORD_CONTAIN('special', 'character')),
                })}

                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        let userData: any = {
                            email: values.email,
                            password: values.password,
                        };
                        if (showNameFieldsForRegistration) {
                            const fullName = `${values.firstName || ""} ${values.lastName || ""}`.trim();
                            const username = `${values.firstName || ""}${values.lastName || ""}`.trim().toLowerCase();
                            console.log("fullName, username", fullName, username);
                            userData = {
                                ...userData,
                                fullName,
                                username
                            };
                        } else {
                            userData = {
                                ...userData,
                                username: values.username,
                            };
                        }
                        const response = await register(userData).unwrap();

                        if (response?.statusCode === 200) {
                            dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.USER_REGISTER, detail: response?.data?.message }));
                            setShowOverlay(true);
                            setTimeout(() => {
                                router.push(`/auth/login`);
                            }, 3000);
                        } else {
                            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
                        }
                    } catch (err: any) {
                        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.EMAIL_ALREADY_TAKEN, detail: err?.data ? err?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG }));
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        {showNameFieldsForRegistration ? (
                            <>
                                {/* first + last name inline */}
                                <div className="flex gap-2 mt-3">
                                    <div className="flex flex-column w-full gap-2">
                                        <label className="solid-auth-input-label">First Name</label>
                                        <SolidInput
                                            id="firstName"
                                            name="firstName"
                                            placeholder="First Name"
                                            onChange={formik.handleChange}
                                            value={formik.values.firstName}
                                            aria-invalid={!!formik.errors.firstName}
                                            autoComplete="off"
                                        />
                                        {isFormFieldValid(formik, "firstName") && (
                                            <SolidMessage severity="error" text={formik.errors.firstName?.toString()} />
                                        )}
                                    </div>

                                    <div className="flex flex-column w-full gap-2">
                                        <label className="solid-auth-input-label">Last Name</label>
                                        <SolidInput
                                            id="lastName"
                                            name="lastName"
                                            placeholder="Last Name"
                                            onChange={formik.handleChange}
                                            value={formik.values.lastName}
                                            aria-invalid={!!formik.errors.lastName}
                                            autoComplete="off"
                                        />
                                        {isFormFieldValid(formik, "lastName") && (
                                            <SolidMessage severity="error" text={formik.errors.lastName?.toString()} />
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* username (only if name fields not shown) */}
                                <div>
                                    <div className="flex flex-column gap-2 mt-3">
                                        <label className="solid-auth-input-label">Username</label>
                                        <SolidInput
                                            id="username"
                                            name="username"
                                            placeholder="username"
                                            onChange={formik.handleChange}
                                            value={formik.values.username}
                                            aria-invalid={!!formik.errors.username}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {isFormFieldValid(formik, "username") &&
                                        <SolidMessage severity="error" text={formik.errors.username?.toString()} />}
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div>
                            <div className="flex flex-column gap-2 mt-3">
                                <label className="solid-auth-input-label">Email</label>
                                <SolidInput
                                    id="email"
                                    name="email"
                                    placeholder="Yourgmail@123.com"
                                    onChange={formik.handleChange}
                                    value={formik.values.email}
                                    aria-invalid={!!formik.errors.email}
                                    autoComplete="off"
                                />
                            </div>
                            {isFormFieldValid(formik, "email") &&
                                <SolidMessage severity="error" text={formik.errors.email?.toString()} />}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex flex-column gap-2 mt-3">
                                <label className="solid-auth-input-label">Password</label>
                                <SolidPasswordInput
                                    id="password"
                                    name="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    toggle
                                    className="w-full"
                                    aria-invalid={!!formik.errors.password}
                                    autoComplete="off"
                                />
                            </div>
                            {isFormFieldValid(formik, "password") &&
                                <SolidMessage severity="error" text={formik.errors.password?.toString()} />}
                        </div>
                        {/* <SolidPasswordHelperText text={solidSettingsData?.data?.authenticationPasswordComplexityDescription} /> */}
                        <div className="mt-4">
                            <SolidButton className="w-full font-light auth-submit-button" label="Sign Up" disabled={formik.isSubmitting} loading={formik.isSubmitting} type="submit" />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const PasswordLessSignup = () => {
        const registrationValidationSource: "email" | "mobile" =
            solidSettingsData?.data?.passwordlessRegistrationValidateWhat === "mobile" ? "mobile" : "email";
        const isMobile = registrationValidationSource === "mobile";

        return (
            <Formik
                initialValues={{
                    username: "",
                    email: "",
                    mobile: "",
                }}
                validationSchema={Yup.object({
                    username: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('"User Name')),
                    email: isMobile
                        ? Yup.string().notRequired()
                        : Yup.string()
                            .email(ERROR_MESSAGES.FIELD_INVALID('email address'))
                            .required(ERROR_MESSAGES.FIELD_REUQIRED('Email')),
                    mobile: isMobile
                        ? Yup.string()
                            .matches(/^[+0-9][0-9\s-]{6,}$/, ERROR_MESSAGES.FIELD_INVALID('mobile number'))
                            .required(ERROR_MESSAGES.FIELD_REUQIRED('Mobile'))
                        : Yup.string().notRequired(),
                })}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        const identifier = isMobile ? values.mobile : values.email;
                        const RESEND_OTP_KEY = `resendOtpRegister_${identifier}`;
                        const RESEND_OTP_TIMER_MIN = parseFloat(env("NEXT_PUBLIC_RESEND_OTP_TIMER") || '0.5');
                        const RESEND_OTP_TIMER = Math.round(RESEND_OTP_TIMER_MIN * 60);
                        const payload: Record<string, any> = {
                            username: values.username,
                            validationSources: [registrationValidationSource],
                        };
                        if (isMobile) {
                            payload.mobile = values.mobile;
                        } else {
                            payload.email = values.email;
                        }
                        const storedTimeStr = localStorage.getItem(RESEND_OTP_KEY);
                        const now = Date.now();
                        if (storedTimeStr) {
                            const lastSent = parseInt(storedTimeStr, 10);
                            const elapsed = Math.floor((now - lastSent) / 1000);
                            const remaining = RESEND_OTP_TIMER - elapsed;

                            if (remaining > 0) {
                                const formatted = formatTimeLeft(remaining);
                                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.PLEASE_WAIT, detail: ERROR_MESSAGES.OPT_FORMAT(formatted) }));
                                setSubmitting(false);
                                return; //  Prevent request
                            }
                        }
                        const response = await initiateRegister(payload).unwrap(); // Call mutation trigger

                        if (response?.statusCode === 200) {
                            dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.OPT_SEND, detail: response?.data?.message }));
                            localStorage.setItem(`resendOtpRegister_${identifier}`, Date.now().toString());
                            const params = new URLSearchParams({
                                username: values.username,
                                type: registrationValidationSource,
                                identifier,
                            });
                            if (isMobile) {
                                params.set("mobile", values.mobile);
                            } else {
                                params.set("email", values.email);
                            }
                            router.push(`/auth/initiate-register?${params.toString()}`);
                        } else {
                            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
                        }
                    } catch (err: any) {
                        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: err?.data ? err?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG }));
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="username" className="solid-auth-input-label">Username</label>
                            <SolidInput
                                id="username"
                                name="username"
                                placeholder="username"
                                onChange={formik.handleChange}
                                value={formik.values.username}
                                aria-invalid={!!formik.errors.username}
                                autoComplete="off"
                            />
                            {isFormFieldValid(formik, "username") && <SolidMessage
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.username?.toString()}
                            />}
                        </div>
                        {isMobile ? (
                            <div className="flex flex-column gap-2 mt-3">
                                <label htmlFor="mobile" className="solid-auth-input-label">Mobile</label>
                                <SolidInput
                                    id="mobile"
                                    name="mobile"
                                    placeholder="+1 555 123 4567"
                                    onChange={formik.handleChange}
                                    value={formik.values.mobile}
                                    aria-invalid={!!formik.errors.mobile}
                                    autoComplete="off"
                                />
                                {isFormFieldValid(formik, "mobile") && <SolidMessage
                                    className="text-red-500 text-sm"
                                    severity="error"
                                    text={formik?.errors?.mobile?.toString()}
                                />}
                            </div>
                        ) : (
                            <div className="flex flex-column gap-2 mt-3">
                                <label htmlFor="email" className="solid-auth-input-label">Email</label>
                                <SolidInput
                                    id="email"
                                    name="email"
                                    placeholder="Yourgmail@123.com"
                                    onChange={formik.handleChange}
                                    value={formik.values.email}
                                    aria-invalid={!!formik.errors.email}
                                    autoComplete="off"
                                />
                                {isFormFieldValid(formik, "email") && <SolidMessage
                                    className="text-red-500 text-sm"
                                    severity="error"
                                    text={formik?.errors?.email?.toString()}
                                />}
                            </div>
                        )}
                        <div className="mt-4">
                            <SolidButton className="w-full font-light auth-submit-button" label="Sign Up" disabled={formik.isSubmitting} loading={formik.isSubmitting} type="submit" />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const RenderAuthModes: React.FC<AuthModesProps> = ({ passwordBasedAuth, passwordLessAuth, showNameFieldsForRegistration }) => {
        if (passwordBasedAuth && passwordLessAuth) {
            return (
                <AuthTabs
                    activeIndex={activeIndex}
                    onChange={setActiveIndex}
                    tabs={[
                        {
                            key: "with-password",
                            label: "With Password",
                            content: <PasswordSignup showNameFieldsForRegistration={showNameFieldsForRegistration} />,
                        },
                        { key: "without-password", label: "Without Password", content: <PasswordLessSignup /> },
                    ]}
                />
            );
        } else if (passwordBasedAuth) {
            return <PasswordSignup showNameFieldsForRegistration={showNameFieldsForRegistration} />;
        } else if (passwordLessAuth) {
            return <PasswordLessSignup />;
        } else {
            return <p>No authentication method available</p>;
        }
    };
    const isAnyOAuthEnabled = !!(
        solidSettingsData?.data?.iamGoogleOAuthEnabled ||
        solidSettingsData?.data?.iamFacebookOAuthEnabled ||
        solidSettingsData?.data?.iamAppleOAuthEnabled ||
        solidSettingsData?.data?.iamMicrosoftOAuthEnabled
    );
    return (
        <div className="">
            {/* Overlay UI */}
            <div className={`auth-container position-relative ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                {showOverlay && (
                    <div className="absolute top-0 left-0 w-full h-full flex align-items-center justify-content-center register-success-popup">
                        <div className="register-success-card">
                            <div className="register-success-badge">Account created</div>
                            <SolidSpinner className="auth-success-spinner" size={32} />
                            <div className="register-success-copy">
                                <h3 className="register-success-title">Preparing your sign-in</h3>
                                <p className="register-success-text">
                                    Your profile has been created successfully. We&apos;re taking you to the login screen now.
                                </p>
                            </div>
                            <div className="register-success-progress" aria-hidden="true">
                                <span className="register-success-progress-bar" />
                            </div>
                        </div>
                    </div>
                )}
                <h2 className="solid-auth-title">Create your account</h2>
                <p className="solid-auth-helper">Enter your details below to create your account</p>
                {/* <p className="solid-auth-subtitle text-sm">By continuing, you agree to the <Link href={'#'}>Terms of Service</Link> and acknowledge you’ve read our  <Link href={'#'}>Privacy Policy.</Link> </p> */}
                <RenderAuthModes passwordBasedAuth={solidSettingsData?.data?.passwordBasedAuth} passwordLessAuth={solidSettingsData?.data?.passwordLessAuth} showNameFieldsForRegistration={solidSettingsData?.data?.showNameFieldsForRegistration} />
                {isAnyOAuthEnabled && (
                    <>
                        <div className="solid-auth-divider flex align-items-center gap-2 my-4">
                            <SolidDivider className="flex-1" />
                            <span className="text-sm text-500">Or continue with</span>
                            <SolidDivider className="flex-1" />
                        </div>
                        <SocialMediaLogin
                            googleEnabled={solidSettingsData?.data?.iamGoogleOAuthEnabled}
                            facebookEnabled={solidSettingsData?.data?.iamFacebookOAuthEnabled}
                            appleEnabled={solidSettingsData?.data?.iamAppleOAuthEnabled}
                            microsoftEnabled={solidSettingsData?.data?.iamMicrosoftOAuthEnabled}
                        />
                    </>
                )}
            </div>
            <div className="text-center mt-3 md:mt-4">
                <div className="text-sm text-400 secondary-dark-color">
                    Already have an account? <Link className="font-bold" href="/auth/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default SolidRegister;
