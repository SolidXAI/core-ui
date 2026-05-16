import { useConfirmOtpRegisterMutation, useInitateRegisterMutation } from "../../redux/api/authApi";
import { Form, Formik } from "formik";
import { useRouter } from "../../hooks/useRouter";
import { useSearchParams } from "../../hooks/useSearchParams";
import { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import * as Yup from "yup";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import { env } from "../../adapters/env";
import { showToast } from "../../redux/features/toastSlice";
import { SolidButton, SolidIcon, SolidMessage, SolidOtpInput } from "../shad-cn-ui";
import { useAuthSettings } from "./AuthSettingsContext";

const SolidInitiateRegisterOtp = () => {
    const searchParams = useSearchParams();
    const { solidSettingsData } = useAuthSettings();
    const settingValidationType = solidSettingsData?.data?.passwordlessRegistrationValidateWhat === "mobile" ? "mobile" : "email";
    const queryType = searchParams.get('type');
    const validationType: "email" | "mobile" = queryType === "mobile" || queryType === "email"
        ? (queryType as "email" | "mobile")
        : settingValidationType;
    const tempEmail = searchParams.get('email');
    const email = tempEmail ? decodeURIComponent(tempEmail) : '';
    const tempMobile = searchParams.get('mobile');
    const mobile = tempMobile ? decodeURIComponent(tempMobile) : '';
    const tempIdentifier = searchParams.get('identifier');
    const identifier = tempIdentifier
        ? decodeURIComponent(tempIdentifier)
        : (validationType === "mobile" ? mobile : email);
    const RESEND_OTP_KEY = `resendOtpRegister_${identifier}`;
    const RESEND_OTP_TIMER_MIN = parseFloat(env("NEXT_PUBLIC_RESEND_OTP_TIMER") || '0.5');
    const RESEND_OTP_TIMER = Math.round(RESEND_OTP_TIMER_MIN * 60);
    const username = searchParams.get('username') || '';


    const [initiateResendOTP] = useInitateRegisterMutation();
    const [initiateOtpRegister] = useConfirmOtpRegisterMutation();
    const dispatch = useDispatch();
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(RESEND_OTP_TIMER);
    const [resendEnabled, setResendEnabled] = useState(false);

    useEffect(() => {

        // Set timer if not already set (e.g., after login)
        const storedTime = localStorage.getItem(RESEND_OTP_KEY);
        if (!storedTime) {
            localStorage.setItem(RESEND_OTP_KEY, Date.now().toString());
        }

        const lastSent = storedTime ? parseInt(storedTime, 10) : Date.now();
        const elapsed = Math.floor((Date.now() - lastSent) / 1000);
        const remaining = RESEND_OTP_TIMER - elapsed;

        if (remaining > 0) {
            setTimeLeft(remaining);
            setResendEnabled(false);
        } else {
            setTimeLeft(0);
            setResendEnabled(true);
        }
    }, [identifier]);

    useEffect(() => {
        if (resendEnabled || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setResendEnabled(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resendEnabled, timeLeft]);

    const validationSchema = Yup.object({
        otp: Yup.string()
            .matches(/^\d{6}$/, ERROR_MESSAGES.OTP_CHARACTER(6))
            .required(ERROR_MESSAGES.FIELD_REUQIRED('OTP')),
    });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    const handleResendOtp = async () => {
        try {
            const payload: Record<string, any> = {
                username: username,
                validationSources: [validationType],
            };
            if (validationType === "mobile") {
                payload.mobile = identifier;
            } else {
                payload.email = identifier;
            }

            const response = await initiateResendOTP(payload).unwrap();

            if (response?.statusCode === 200) {
                // dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.OPT_RESEND, detail: response?.data?.message }));
                localStorage.setItem(RESEND_OTP_KEY, Date.now().toString());
                setTimeLeft(RESEND_OTP_TIMER);
                setResendEnabled(false);
            } else {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: response.error }));
            }
        } catch (err: any) {
            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LOGIN_ERROR, detail: err?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG }));
        }
    };

    return (
        <>
            <div className={`auth-container ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'center' : 'side'}`}>
                <h2 className="solid-auth-title">OTP verification</h2>
                <p className="solid-auth-helper">
                    Please enter the OTP sent to your {validationType === "mobile" ? "mobile" : "email"} to complete verification{" "}
                    <span className="solid-auth-helper-emphasis">{identifier}</span>
                </p>
                <>
                    <Formik
                        initialValues={{
                            otp: "",
                        }}
                        validationSchema={validationSchema}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            try {
                                const payload = {
                                    type: validationType,
                                    identifier,
                                    otp: values.otp
                                };

                                const response = await initiateOtpRegister(payload).unwrap(); // Call mutation trigger

                                if (response?.statusCode === 200) {
                                    localStorage.removeItem(`resendOtpRegister_${identifier}`);
                                    dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.LOGIN_SUCCESSFULLY, detail: "Login" }));
                                    router.push(`/auth/login`);
                                } else {
                                    dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.INAVLID_OTP, detail: response.error }));
                                    setErrors({
                                        otp: ERROR_MESSAGES.INAVLID_OTP,
                                    });
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
                                <div className="solid-auth-otp-field">
                                    <div className="solid-auth-otp-top">
                                        <label htmlFor="otp" className="solid-auth-input-label">Verification code</label>
                                        <SolidButton
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="solid-auth-otp-resend"
                                            onClick={handleResendOtp}
                                            disabled={!resendEnabled}
                                            leftIcon={<SolidIcon name="si-refresh" aria-hidden />}
                                        >
                                            Resend code
                                        </SolidButton>
                                    </div>
                                    <SolidOtpInput
                                        id="otp"
                                        className="solid-auth-otp-input"
                                        value={formik.values.otp}
                                        onChange={(nextValue) => formik.setFieldValue("otp", nextValue)}
                                        length={6}
                                        integerOnly
                                        invalid={!!formik.errors.otp}
                                    />
                                    {isFormFieldValid(formik, "otp") && (
                                        <SolidMessage className="text-red-500 text-sm" severity="error" text={formik.errors.otp?.toString()} />
                                    )}
                                    <p className="solid-auth-otp-time">
                                        {resendEnabled
                                            ? "You can resend now."
                                            : `Time left: ${Math.floor(timeLeft / 60)
                                                .toString()
                                                .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`}
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <SolidButton
                                        type="submit"
                                        className="w-full font-light auth-submit-button"
                                        label="Verify"
                                        disabled={formik.isSubmitting}
                                        loading={formik.isSubmitting}
                                    />
                                    <SolidButton
                                        type="button"
                                        label="Back"
                                        className="w-full auth-back-button text-center mt-1"
                                        text
                                        onClick={() => (window.location.href = '/auth/login')}
                                    />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </>
            </div>
            {/* <div className="text-center mt-5">
            <div className="text-sm text-400 secondary-dark-color">
                {'<'} Back to <Link className="font-bold" href="/auth/login">Sign In</Link>
            </div>
        </div> */}
        </>
    );
};

export default SolidInitiateRegisterOtp;
