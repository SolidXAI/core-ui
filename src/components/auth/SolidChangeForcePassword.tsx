"use client"
import { useChangePasswordMutation } from '@/redux/api/authApi';
import { useFormik } from 'formik';
import { signOut, useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useRef } from 'react';
import * as Yup from 'yup';
const SolidChangeForcePassword = () => {
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
    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email format').required('Email is required'),
        currentPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('Current password is required'),
        newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
        confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required'),
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
        onSubmit: async (values) => {
            try {
                const payload = {
                    id: values.id,
                    email: values.email,
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                };
                // Call the mutation and handle the response
                const response = await changePassword(payload).unwrap(); // Await the API call and unwrap to handle errors.
                if (response?.statusCode === 200) {
                    showToast("success", "Force Password Change Success", "Password Change Successfully");
                    signOut({ callbackUrl: "/auth/login" })
                } else (
                    showToast("error", "Login Error", response.error)
                )
            } catch (err:any) {
                showToast("error", "Login Failed", err?.data?.message);
            }
        },
    });
    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    return (
        <>
            <Toast ref={toast} />

            <form onSubmit={formik.handleSubmit} className='d-flex flex-column gap-3 auth-form'>
                <div className="flex flex-column gap-2 mt-2">
                    <label htmlFor="email" className="solid-auth-input-label">Email Id</label>
                    <InputText
                        id="email"
                        name="email"
                        placeholder="Email ID"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        readOnly
                    />
                </div>
                <div className="flex flex-column gap-2 mt-4" style={{}}>
                    <label htmlFor="currentPassword" className="solid-auth-input-label">Current Password</label>
                    <Password
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="***************"
                        value={formik.values.currentPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        toggleMask
                        className={classNames("", {
                            "p-invalid": isFormFieldValid(formik, "password"),
                        })}
                        inputClassName="w-full"
                        feedback={false}
                    />
                    {isFormFieldValid(formik, "currentPassword") && <Message
                        className="text-red-500 text-sm"
                        severity="error"
                        text={formik?.errors?.currentPassword?.toString()}
                    />}
                </div>
                <div className="flex flex-column gap-2 mt-4" style={{}}>
                    <label htmlFor="password" className="solid-auth-input-label">New Password</label>
                    <Password
                        id="newPassword"
                        name="newPassword"
                        placeholder="***************"
                        value={formik.values.newPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        toggleMask
                        className={classNames("", {
                            "p-invalid": isFormFieldValid(formik, "newPassword"),
                        })}
                        inputClassName="w-full"
                        feedback={false}
                    />
                    {isFormFieldValid(formik, "newPassword") && <Message
                        className="text-red-500 text-sm"
                        severity="error"
                        text={formik?.errors?.newPassword?.toString()}
                    />}
                </div>
                <div className="flex flex-column gap-2 mt-4" style={{}}>
                    <label htmlFor="password" className="solid-auth-input-label">Confirm Password</label>
                    <Password
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="***************"
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        toggleMask
                        className={classNames("", {
                            "p-invalid": isFormFieldValid(formik, "confirmPassword"),
                        })}
                        inputClassName="w-full"
                        feedback={false}
                    />
                    {isFormFieldValid(formik, "confirmPassword") && <Message
                        className="text-red-500 text-sm"
                        severity="error"
                        text={formik?.errors?.confirmPassword?.toString()}
                    />}
                </div>
                <div className="mt-4">
                    <Button className="w-full font-light auth-submit-button" label="Change Password" disabled={formik.isSubmitting} loading={formik.isSubmitting} />
                </div>
            </form>
        </>
    )
}
export default SolidChangeForcePassword