"use client"
import { useChangePasswordMutation } from '@/redux/api/authApi';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import * as Yup from 'yup';

export const SolidChangePassword = () => {
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
    const envPasswordHelperText = process.env.NEXT_PUBLIC_PASSWORD_COMPLEXITY_DESC;
    let passwordRegex: RegExp | null = null;
    try {
        if (envPasswordRegex) {
            const unescaped = JSON.parse(`"${envPasswordRegex}"`);
            passwordRegex = new RegExp(unescaped);
        }
    } catch (error) {
        console.error("Invalid password regex in .env:", error);
    }

    const newPasswordValidation = passwordRegex
        ? Yup.string()
            .matches(passwordRegex, 'Password does not meet complexity requirements')
            .required('New password is required')
        : Yup.string().min(6, 'Password must be at least 6 characters')
            .required('New password is required');

    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email format').required('Email is required'),
        currentPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('Current password is required'),
        newPassword: newPasswordValidation,
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('newPassword')], 'Passwords must match')
            .required('Confirm password is required'),
        id: Yup.number().required('User ID is required'),
    });

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
                    resetForm();
                }
            } catch (err: any) {
                showToast("error", "Failed", err?.data?.message);
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
                {envPasswordHelperText && (
                    <div className="mt-4 text-sm grid">
                        <div className='col-9'>
                            <div className="grid">
                                {envPasswordHelperText
                                    .split('\\n')
                                    .map((text, idx) => (
                                        <div key={idx} className="col-6 pt-0">
                                            <div className='flex gap-2'><span>•</span><span>{text}</span></div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div>
                <Button type='submit' size='small' label="Change Password" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
            </div>
        </form>
    )
}