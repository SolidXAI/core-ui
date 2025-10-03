"use client"
import { handleLogout } from '@/nextAuth/handleLogout';
import { useChangePasswordMutation } from '@/redux/api/authApi';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { useMemo, useRef } from 'react';
import * as Yup from 'yup';
import { SolidPasswordHelperText } from '../SolidPasswordHelperText';

export const SolidChangePassword = ({ solidSettingsData }: any) => {
    const toast = useRef<Toast>(null);
    const [changePassword] = useChangePasswordMutation();

    const session: any = useSession();
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const envPasswordRegex = process.env.NEXT_PUBLIC_PASSWORD_REGEX;

    // Try backend regex first, then env, then fallback
    const effectiveRegex = useMemo(() => {
        try {
            const backendRegex = solidSettingsData?.data?.system?.authenticationPasswordRegex;
            if (backendRegex) {
                const unescaped = JSON.parse(`"${backendRegex}"`);
                return new RegExp(unescaped);
            }
            if (envPasswordRegex) {
                const unescaped = JSON.parse(`"${envPasswordRegex}"`);
                return new RegExp(unescaped);
            }
        } catch (error) {
            console.error("Invalid password regex:", error);
        }
        return null;
    }, [solidSettingsData, envPasswordRegex]);

    const validationSchema = useMemo(() => {
        const newPasswordValidation = effectiveRegex
            ? Yup.string()
                .matches(
                    effectiveRegex,
                    solidSettingsData?.data?.system?.authenticationPasswordRegexErrorMessage ||
                    "Password does not meet complexity requirements"
                )
                .required("New password is required")
            : Yup.string()
                .min(6, "Password must be at least 6 characters")
                .required("New password is required");

        return Yup.object({
            email: Yup.string().email("Invalid email format").required("Email is required"),
            currentPassword: Yup.string()
                .min(6, "Password must be at least 6 characters")
                .required("Current password is required"),
            newPassword: newPasswordValidation,
            confirmPassword: Yup.string()
                .oneOf([Yup.ref("newPassword")], "Passwords must match")
                .required("Confirm password is required"),
            id: Yup.number().required("User ID is required"),
        });
    }, [effectiveRegex, solidSettingsData]);

    const formik = useFormik({
        initialValues: {
            email: session?.data?.user?.user?.email,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            id: session?.data?.user?.user?.id,
        },
        validationSchema,
        onSubmit: async (values, { setErrors, resetForm }) => {
            try {
                const payload = {
                    id: values.id,
                    email: session?.data?.user?.user?.email,
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                };

                const response = await changePassword(payload).unwrap();
                if (response?.error) {
                    showToast("error", "Error", response.error)
                    setErrors({
                        currentPassword: "Incorrect Current Password",
                        newPassword: "Passwords must match",
                        confirmPassword: "Passwords must match",
                    })
                } else {
                    showToast("success", "Password Change Successfully", "Password Change Successfully");
                    handleLogout(toast)
                    resetForm();
                }
            } catch (err: any) {
                showToast("error", err?.data?.message, err?.data?.data?.message ? err?.data?.data?.message : err?.data?.message);
            }
        },
    });
    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <form onSubmit={formik.handleSubmit} className="h-full flex flex-column justify-content-between">
            <Toast ref={toast} />
            <div>
                <div className='grid'>
                    <div className='col-5'>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="currentPassword" className="solid-auth-input-label">Current Password</label>
                            <Password
                                id="currentPassword"
                                name="currentPassword"
                                value={formik.values.currentPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                toggleMask
                                invalid={!!formik.errors.currentPassword}
                                inputClassName="w-full"
                                feedback={false}
                            />
                            {isFormFieldValid(formik, "currentPassword") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.currentPassword?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-2 mt-4">
                            <label htmlFor="password" className="solid-auth-input-label">New Password</label>
                            <Password
                                id="newPassword"
                                name="newPassword"
                                value={formik.values.newPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                toggleMask
                                invalid={!!formik.errors.newPassword}
                                inputClassName="w-full"
                                feedback={false}
                            />
                            {isFormFieldValid(formik, "newPassword") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.newPassword?.toString()}
                            />}
                        </div>
                        <div className="flex flex-column gap-2 mt-4">
                            <label htmlFor="password" className="solid-auth-input-label">Confirm New Password</label>
                            <Password
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                toggleMask
                                invalid={!!formik.errors.confirmPassword}
                                inputClassName="w-full"
                                feedback={false}
                            />
                            {isFormFieldValid(formik, "confirmPassword") && <Message
                                className="text-red-500 text-sm"
                                severity="error"
                                text={formik?.errors?.confirmPassword?.toString()}
                            />}
                        </div>
                    </div>
                </div>
                <SolidPasswordHelperText text={solidSettingsData?.data?.system?.authenticationPasswordComplexityDescription} />
            </div>
            <div>
                <Button type='submit' size='small' label="Change Password" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
            </div>
        </form>
    )
}