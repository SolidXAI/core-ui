"use client"

import { useDeleteMediaMutation } from "@/redux/api/mediaApi";
import { useGetUserQuery, useUpdateUserProfileMutation } from "@/redux/api/userApi";
import { useFormik } from "formik";
import { AutoComplete } from "primereact/autocomplete";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import styles from './SolidAccountSettings.module.css'


export const SolidPersonalInfo = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useRef<Toast>(null);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [replaceDialogVisible, setReplaceDialogVisible] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const userId = useSelector((state: any) => state.auth?.user?.user?.id);
    const { data: userData, refetch } = useGetUserQuery(userId);

    const [
        deleteMedia,
    ] = useDeleteMediaMutation();
    const [updateUser] = useUpdateUserProfileMutation();

    const showToast = (severity: "success" | "error" | "info", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const initialValues = {
        fullName: userData?.data?.fullName ?? "",
        profilePicture: userData?.data?._media?.profilePicture[0]?._full_url ?? null,
    };

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                if (values.fullName !== initialValues.fullName) {
                    formData.append("fullName", values.fullName);
                }

                if (values.profilePicture && values.profilePicture instanceof File) {
                    formData.append("profilePicture", values.profilePicture);
                }

                if (!formData.has("fullName") && !formData.has("profilePicture")) {
                    showToast("info", "No Changes", "No updates were made.");
                    return;
                }

                const response = await updateUser({ data: formData }).unwrap();
                if (response?.statusCode === 200) {
                    showToast("success", "Profile Updated", "Profile updated successfully");
                    refetch();
                    formik.resetForm();
                    setPreviewImage(null);
                } else {
                    showToast("error", "Failed", "Failed to update profile");
                }
            } catch (error) {
                showToast("error", "Error", "Something went wrong");
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

    const handleFileChange = (file: File) => {
        const existing = userData?.data?._media?.profilePicture?.[0];
        if (existing) {
            setPendingFile(file);
            setReplaceDialogVisible(true);
        } else {
            formik.setFieldValue("profilePicture", file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };


    const handleDeleteAvatar = () => {
        const existing = userData?.data?._media?.profilePicture?.[0];
        if (existing) {
            setDeleteDialogVisible(true);
        } else {
            formik.setFieldValue("profilePicture", null);
            setPreviewImage(null);
        }
    };

    const confirmReplace = async () => {
        const existing = userData?.data?._media?.profilePicture?.[0];
        try {
            if (existing?.id) {
                await deleteMedia(existing.id).unwrap();
            }

            if (pendingFile) {
                formik.setFieldValue("profilePicture", pendingFile);
                setTimeout(() => {
                    formik.submitForm();
                }, 0);
            }

        } catch (error) {
            showToast("error", "Error", "Failed to delete image.");
        }

        setReplaceDialogVisible(false);
        setPendingFile(null);
    };

    const confirmDelete = async () => {
        const existing = userData?.data?._media?.profilePicture?.[0];
        if (existing?.id) {
            try {
                await deleteMedia(existing.id).unwrap();
                showToast("success", "Deleted", "Profile picture removed.");
                refetch();
            } catch {
                showToast("error", "Error", "Failed to delete image.");
            }
        }

        formik.setFieldValue("profilePicture", null);
        setPreviewImage(null);
        setDeleteDialogVisible(false);
    };

    return (
        <form onSubmit={formik.handleSubmit} className="h-full flex flex-column justify-content-between">
            <Toast ref={toast} />
            <div>
                <div>
                    <label className="form-field-label mb-2 font-bold">Profile Picture</label>
                    <div className="flex align-items-center gap-3">
                        {previewImage ? (
                            <Avatar image={previewImage} shape="circle"
                                style={{
                                    height: '5rem',
                                    width: '5rem'
                                }}
                            />
                        ) : userData?.data?._media?.profilePicture?.[0]?._full_url ? (
                            <div className="relative">
                                <Avatar
                                    image={userData?.data?._media?.profilePicture?.[0]?._full_url}
                                    shape="circle"
                                    style={{
                                        height: '5rem',
                                        width: '5rem'
                                    }}
                                />
                                <div className={styles.SolidRemoveProfile} onClick={handleDeleteAvatar}>
                                    <span className="pi pi-times" />
                                </div>
                            </div>
                        ) : (
                            <Avatar
                                label={initials}
                                size="xlarge"
                                shape="circle"
                                style={{
                                    backgroundColor: bgColor,
                                    color: '#ffffff',
                                    height: '5rem',
                                    width: '5rem'
                                }}
                            />
                        )}

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
                                    if (file) handleFileChange(file);
                                }}
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
                            <AutoComplete
                                multiple
                                disabled
                                value={userData?.data?.roles?.map((role: any) => role.name) || []}
                            />

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
            <Dialog
                header={<h5 className='m-0 font-bold'>Replace Profile Picture</h5>}
                visible={replaceDialogVisible}
                headerClassName="px-4 py-3 secondary-border-bottom"
                contentClassName="p-0"
                style={{ width: '25vw' }}
                modal
                onHide={() => setReplaceDialogVisible(false)}
            >
                <div className="p-4">
                    Do you want to replace the existing profile picture?
                    <div className="flex justify-content-start mt-4 gap-2">
                        <Button size="small" label="Confirm" severity="danger" onClick={confirmReplace} />
                        <Button size="small" outlined label="Cancel" onClick={() => setReplaceDialogVisible(false)} />
                    </div>
                </div>
            </Dialog>

            <Dialog
                header={<h5 className='m-0 font-bold'>Delete Profile Picture</h5>}
                visible={deleteDialogVisible}
                headerClassName="px-4 py-3 secondary-border-bottom"
                contentClassName="p-0"
                style={{ width: '25vw' }}
                modal
                onHide={() => setDeleteDialogVisible(false)}
            >
                <div className="p-4">
                    Do you want to delete your profile picture?
                    <div className="flex justify-content-start mt-4 gap-2">
                        <Button size="small" label="Confirm" severity="danger" onClick={confirmDelete} />
                        <Button size="small" outlined label="Cancel" onClick={() => setDeleteDialogVisible(false)} />
                    </div>
                </div>
            </Dialog>

        </form>
    )
}