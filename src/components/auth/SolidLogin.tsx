import { Form, Formik } from "formik";
import { signIn } from "../../adapters/auth/index";
import Link from "../common/Link";
import { useRouter } from "../../hooks/useRouter";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { SocialMediaLogin } from "../common/SocialMediaLogin";
import { useInitateLoginMutation } from "../../redux/api/authApi";
import { formatTimeLeft } from "../../helpers/resendOtpHelper";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import { useLazyGetAuthSettingsQuery } from "../../redux/api/solidSettingsApi";
import { env } from "../../adapters/env";
import { showToast } from "../../redux/features/toastSlice";
import { AuthTabs } from "./AuthTabs";
import { loadSession } from "../../adapters/auth/storage";
import { hasAnyRole } from "../../helpers/rolesHelper";
import { useDispatch } from "react-redux";
import { SolidButton, SolidDivider, SolidInput, SolidMessage, SolidPasswordInput, SolidRadioGroup } from "../shad-cn-ui";

interface AuthModesProps {
    passwordBasedAuth: boolean;
    passwordLessAuth: boolean;
}
const SolidLogin = ({ signInValidatorLabel, signInValidatorPlaceholder }: any) => {

    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery();
    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])

    const [initiateLogin] = useInitateLoginMutation();
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        sessionStorage.removeItem("app-mounted");
    }, [])
    const dispatch = useDispatch();
    const router = useRouter();

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];
    const emailOrUsernameRegex = /^[a-zA-Z0-9._]{2,30}$/;

    const PasswordLogin = () => {
        return (
            <Formik
                initialValues={{
                    identifier: "",
                    // email: initialEmail,
                    password: "",
                    // rememberMe: rememberMe,
                }}
                enableReinitialize={false}
                validationSchema={Yup.object({
                    identifier: Yup.string()
                        .required(ERROR_MESSAGES.FIELD_REUQIRED("Email or Username"))
                        .test(
                            "email-or-username",
                            ERROR_MESSAGES.FIELD_INVALID("email or username"),
                            (value) => {
                                // if (!value) return false;

                                const isEmail = Yup.string().email().isValidSync(value);
                                const isUsername = emailOrUsernameRegex.test(value);

                                return isEmail || isUsername;
                            }
                        ),
                    password: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Password")),
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
                            identifier: values.identifier,
                            password: values.password,
                        });

                        if (response?.error) {
                            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
                            setErrors({
                                identifier: ERROR_MESSAGES.INVALID_CREDENTIALS,
                                password: ERROR_MESSAGES.INVALID_CREDENTIALS,
                            });
                        } else {
                            dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.LOGIN_SUCCESS, detail: ERROR_MESSAGES.DASHBOARD_REDIRECTING }));
                            const session = loadSession();
                            const isAdmin = hasAnyRole(session?.user?.roles, ["Admin"]);
                            const isDev = env("VITE_SOLIDX_ENV") === "dev";
                            const redirectUrl = isAdmin && isDev ? "/studio" : (env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin");
                            router.push(redirectUrl);
                        }
                    } catch (error: any) {
                        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: error?.data ? error?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG }));
                    } finally {
                        setSubmitting(false); // Re-enable the button after submission
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="email" className="solid-auth-input-label">{signInValidatorLabel ? signInValidatorLabel : "Username or Email"}</label>
                            <SolidInput
                                id="identifier"
                                name="identifier"
                                placeholder={signInValidatorPlaceholder ? signInValidatorPlaceholder : "Email or Username"}
                                onChange={formik.handleChange}
                                value={formik.values.identifier}
                                onBlur={formik.handleBlur}
                                aria-invalid={!!isFormFieldValid(formik, "identifier")}
                                className="w-full"
                            />
                            {isFormFieldValid(formik, "identifier") && (
                                <SolidMessage
                                    className="text-red-500 text-sm"
                                    severity="error"
                                    text={formik?.errors?.identifier?.toString()}
                                />
                            )}
                        </div>
                        <div className="flex flex-column gap-1 mt-4" style={{}}>
                            <div className="flex align-items-center justify-content-between">
                                <label htmlFor="password" className="solid-auth-input-label">Password</label>
                                <Link href={"/auth/initiate-forgot-password"} className="solid-auth-inline-link">Forgot your password?</Link>
                            </div>
                            <SolidPasswordInput
                                id="password"
                                name="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                toggle
                                className="w-full"
                                aria-invalid={!!isFormFieldValid(formik, "password")}
                            />
                            {isFormFieldValid(formik, "password") && (
                                <SolidMessage
                                    className="text-red-500 text-sm"
                                    severity="error"
                                    text={formik?.errors?.password?.toString()}
                                />
                            )}
                        </div>
                        {/* <div className="flex align-items-center mt-4">
                                    <Checkbox inputId="remember" onChange={(e: any) => setChecked(e.checked)} checked={checked} />
                                    <label htmlFor="remember" className="ml-2">Remember me</label>
                                </div> */}
                        <div className="mt-4">
                            <SolidButton
                                type="submit"
                                className="w-full font-light auth-submit-button"
                                label="Sign In"
                                disabled={formik.isSubmitting}
                                loading={formik.isSubmitting}
                            />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const PasswordLessLogin = () => {
        const validationType = solidSettingsData?.data?.passwordlessLoginValidateWhat || "email";
        const [selectedAuthMethod, setSelectedAuthMethod] = useState<"email" | "mobile">("email");

        const getFieldConfig = () => {
            if (validationType === "selectable") {
                if (selectedAuthMethod === "mobile") {
                    return {
                        label: "Mobile Number / Username",
                        placeholder: "Enter your mobile number or username",
                        type: "mobile",
                        // validationSchema: Yup.string()
                        //     .matches(/^[0-9]{10}$/, ERROR_MESSAGES.FIELD_INVALID('mobile number'))
                        //     .required(ERROR_MESSAGES.FIELD_REUQIRED('Mobile number'))
                    };
                } else {
                    return {
                        label: "Email Address / Username",
                        placeholder: "Enter your email or username",
                        type: "email",
                        // validationSchema: Yup.string()
                        //     .email(ERROR_MESSAGES.FIELD_INVALID('email address'))
                        //     .required(ERROR_MESSAGES.FIELD_REUQIRED('Email'))
                    };
                }
            }
            switch (validationType) {
                case "mobile":
                    return {
                        label: signInValidatorLabel || "Mobile Number / Username",
                        placeholder: signInValidatorPlaceholder || "Enter your mobile number / username",
                        type: "mobile",
                        // validationSchema: Yup.string()
                        //     .matches(/^[0-9]{10}$/, ERROR_MESSAGES.FIELD_INVALID('mobile number'))
                        //     .required(ERROR_MESSAGES.FIELD_REUQIRED('Mobile number'))
                    };
                case "email":
                default:
                    return {
                        label: signInValidatorLabel || "Email / Username",
                        placeholder: signInValidatorPlaceholder || "Email ID / username",
                        type: "email",
                        // validationSchema: Yup.string()
                        //     .email(ERROR_MESSAGES.FIELD_INVALID('email address'))
                        //     .required(ERROR_MESSAGES.FIELD_REUQIRED('Email'))
                    };
            }
        };

        const fieldConfig = getFieldConfig();
        return (
            <Formik
                initialValues={{
                    identifier: "",
                }}
                // validationSchema={
                //     fieldConfig.validationSchema 
                //     ? Yup.object({
                //           identifier: fieldConfig.validationSchema
                //       })
                //     : Yup.object({
                //           identifier: Yup.string().required("required"),
                //       })
                //   }
                validationSchema={
                    Yup.object({ identifier: Yup.string().required("required") })
                }
                enableReinitialize={false}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                    try {
                        const RESEND_OTP_KEY = `resendOtpLogin_${values.identifier}`;
                        const RESEND_OTP_TIMER_MIN = parseFloat(env("NEXT_PUBLIC_RESEND_OTP_TIMER") || '0.5');
                        const RESEND_OTP_TIMER = Math.round(RESEND_OTP_TIMER_MIN * 60);

                        // Use selectedAuthMethod for selectable, otherwise use fieldConfig.type
                        const authType = validationType === "selectable" ? selectedAuthMethod : fieldConfig.type;

                        const payload: { identifier: string; type?: string } = {
                            identifier: values.identifier,
                        };
                        if (validationType === "selectable") {
                            payload.type = selectedAuthMethod;
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
                        const response = await initiateLogin(payload).unwrap(); // Call mutation trigger

                        if (response?.statusCode === 200) {
                            dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.OPT_RESEND, detail: response?.data?.message }));
                            const identifier = values.identifier;
                            localStorage.setItem(`resendOtpLogin_${identifier}`, Date.now().toString());
                            router.push(`/auth/initiate-login?identifier=${encodeURIComponent(identifier)}&type=${authType}`);
                        } else {
                            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
                        }
                    } catch (err: any) {
                        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: err?.data ? err?.data?.message : ERROR_MESSAGES.SOMETHING_WRONG }));
                        setErrors({
                            identifier: "Invalid Credentials",
                        });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {(formik) => (
                    <Form>
                        {/* Radio buttons for selectable type */}
                        {validationType === "selectable" && (
                            <div className="flex flex-column gap-3 mt-3">
                                <label className="solid-auth-input-label">Select Authentication Method</label>
                                <SolidRadioGroup
                                    name="authMethod"
                                    value={selectedAuthMethod}
                                    options={[
                                        { label: "Email / Username", value: "email" },
                                        { label: "Mobile / Username", value: "mobile" },
                                    ]}
                                    onChange={(value) => {
                                        setSelectedAuthMethod(value);
                                        formik.setFieldValue("identifier", "");
                                    }}
                                    className="solid-auth-radio-options flex gap-4 flex-wrap"
                                />
                            </div>
                        )}
                        <div className="flex flex-column gap-2 mt-3">
                            <label htmlFor="identifier" className="solid-auth-input-label">{fieldConfig.label}</label>
                            <SolidInput
                                id="identifier"
                                name="identifier"
                                placeholder={fieldConfig.placeholder}
                                onChange={formik.handleChange}
                                value={formik.values.identifier}
                                onBlur={formik.handleBlur}
                                aria-invalid={!!isFormFieldValid(formik, "identifier")}
                                className="w-full"
                            />
                            {isFormFieldValid(formik, "identifier") && (
                                <SolidMessage
                                    className="text-red-500 text-sm"
                                    severity="error"
                                    text={formik?.errors?.identifier?.toString()}
                                />
                            )}
                        </div>
                        <div className="mt-4">
                            <SolidButton
                                type="submit"
                                className="w-full font-light auth-submit-button"
                                label="Sign In"
                                disabled={formik.isSubmitting}
                                loading={formik.isSubmitting}
                            />
                        </div>
                    </Form>
                )}
            </Formik>
        )
    }

    const RenderAuthModes: React.FC<AuthModesProps> = ({ passwordBasedAuth, passwordLessAuth }) => {
        if (passwordBasedAuth && passwordLessAuth) {
            return (
                <AuthTabs
                    activeIndex={activeIndex}
                    onChange={setActiveIndex}
                    tabs={[
                        { key: "with-password", label: "With Password", content: <PasswordLogin /> },
                        { key: "without-password", label: "Without Password", content: <PasswordLessLogin /> },
                    ]}
                />
            );
        } else if (passwordBasedAuth) {
            return <PasswordLogin />;
        } else if (passwordLessAuth) {
            return <PasswordLessLogin />;
        } else {
            return <p>No authentication method available</p>;
        }
    };

    return (
        <div className="">
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                <h2 className="solid-auth-title">Login to your account</h2>
                <p className="solid-auth-helper">Enter your credentials below to login to your account</p>

                <RenderAuthModes passwordBasedAuth={solidSettingsData?.data?.passwordBasedAuth} passwordLessAuth={solidSettingsData?.data?.passwordLessAuth} />
                {solidSettingsData?.data?.iamGoogleOAuthEnabled && (
                    <>
                        <div className="solid-auth-divider flex align-items-center gap-2 my-4">
                            <SolidDivider className="flex-1" />
                            <span className="text-sm text-500">Or continue with</span>
                            <SolidDivider className="flex-1" />
                        </div>
                        <SocialMediaLogin />
                    </>
                )}
            </div>
            {solidSettingsData?.data?.allowPublicRegistration && <div className="mt-3 md:mt-5">
                <div className="text-sm text-center text-400 secondary-dark-color">
                    Don’t have an account ? <Link className="font-bold" href="/auth/register">Sign Up</Link>
                </div>
            </div>}
        </div>
    );
};

export default SolidLogin;
