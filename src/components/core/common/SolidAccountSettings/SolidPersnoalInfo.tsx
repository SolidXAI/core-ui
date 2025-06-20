"use client"

import { useGetUserQuery, useUpdateUserProfileMutation } from "@/redux/api/userApi";
import { useFormik } from "formik";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";


export const SolidPersnoalInfo = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toast = useRef<Toast>(null);

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const userId = useSelector((state: any) => state.auth?.user?.user?.id);

    const { data: userData, isLoading } = useGetUserQuery(userId);
    const [updateUser] = useUpdateUserProfileMutation();

    const initialValues = {
        fullName: userData?.data?.fullName ?? "",
        profilePicture: userData?.data?._media?.profilePicture?._full_url ?? null,
    };

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                formData.append("fullName", values.fullName);

                if (values.profilePicture && values.profilePicture instanceof File) {
                    formData.append("profilePicture", values.profilePicture);
                    delete values.profilePicture;
                }

                const response = await updateUser({ data: formData }).unwrap();
                if (response?.statusCode === 200) {
                    showToast("success", "Profile Updated", "Profile updated successfully");
                }else{
                    showToast("error", "Failed", "Failed to update profile");
                }
                // Optionally show success toast
            } catch (error) {
                showToast("error", "Error", "Something went wrong");
                console.error("Update failed", error);
                // Optionally show error toast
            }
        },
    });

    const getInitials = (value: string) => {
        if (!value) return "";

        const email = value.includes('@') ? value.split('@')[0] : value;
        return email[0]?.toUpperCase() || "";
    };

    const getColorFromInitials = (initials: string) => {
        let hash = 0;
        for (let i = 0; i < initials.length; i++) {
            hash = initials.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 60%)`;
    };
    const value = userData?.data?.email;
    const initials = getInitials(value);
    const bgColor = getColorFromInitials(initials);

    return (
        <form onSubmit={formik.handleSubmit} className="h-full flex flex-column justify-content-between">
            <Toast ref={toast} />
            <div>
                <div>
                    <label className="form-field-label mb-2 font-bold">Profile Picture</label>
                    <div className="flex align-items-center gap-3">
                        <Avatar
                            image={userData?.data?._media?.profilePicture?._full_url || undefined}
                            label={!userData?.data?._media ? initials : undefined}
                            size="xlarge"
                            shape="circle"
                            style={{
                                backgroundColor: !userData?.data?._media ? bgColor : undefined,
                                color: '#ffffff'
                            }}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="small"
                                severity="secondary"
                                label="Upload Avatar"
                                outlined
                                className="small-button"
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.svg"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        formik.setFieldValue("profilePicture", file);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="small"
                                severity="danger"
                                icon="pi pi-trash"
                                outlined
                                className="small-button"
                                onClick={() => formik.setFieldValue("profilePicture", null)}
                            />
                        </div>
                    </div>
                </div>
                <div className='mt-4' style={{ borderBottom: '1px dashed #D8E2EA' }}></div>
                <div className="mt-4">
                    <label className="form-field-label mb-2 font-bold">Details</label>
                    <div className="grid">
                        <div className="col-5">
                            <label className="form-field-label mb-2">Name</label>
                            <InputText
                                name="fullName"
                                value={formik.values.fullName}
                                onChange={formik.handleChange}
                                className="w-full"
                            />
                        </div>
                        <div className="col-5">
                            <label className="form-field-label mb-2">Email</label>
                            <InputText disabled placeholder={userData?.data?.email} value={userData?.data?.email}
                                className="w-full" />
                        </div>
                        <div className="col-5">
                            <label className="form-field-label mb-2">Contact Number</label>
                            <InputText disabled placeholder={userData?.data?.mobile} value={userData?.data?.mobile}
                                className="w-full" />
                        </div>
                        <div className="col-5">
                            <label className="form-field-label mb-2">Role</label>
                            {/* <InputText disabled placeholder={user?.user?.roles
                                ?.filter((role: any) => role !== "Internal User")
                                .join(" | ")}
                                className="w-full"
                            /> */}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <Button
                    type="submit"
                    size="small"
                    label="Save"
                />
            </div>
        </form>
    )
}