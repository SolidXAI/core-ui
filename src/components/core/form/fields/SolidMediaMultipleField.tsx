'use client';
import { DropzonePlaceholder } from "@/components/common/DropzonePlaceholder";
import { DropzoneUpload } from "@/components/common/DropzoneUpload";
import { useDeleteMediaMutation } from "@/redux/api/mediaApi";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as Yup from 'yup';
import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { FileReaderExt } from "@/components/common/FileReaderExt";
import { ProgressBar } from "primereact/progressbar";
export class SolidMediaMultipleField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        // @ts-ignore
        for (let i = 0; i < value.length; i++) {
            // @ts-ignore
            const file = value[i];
            if (file instanceof File) {
                formData.append(fieldLayoutInfo.attrs.name, file);
            }
        }
    }

    initialValue(): any {
        const mediaUrls = this.fieldContext.data && this.fieldContext.data._media && this.fieldContext.data._media[this.fieldContext.field.attrs.name].map((i: any) => i)
        return mediaUrls;
    }

    validationSchema(): Schema {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.label ?? fieldMetadata.displayName;

        let schema: Yup.ArraySchema<any, any, any, any>;  // Correctly specifying type arguments for ArraySchema
        if (fieldMetadata.required) {
            // For required fields: disallow null, undefined, and empty arrays
            schema = Yup.array()
                .of(
                    Yup.mixed<File | object>()
                        .required(`${fieldLabel} is required.`)
                        .test(
                            "file-or-object",
                            `${fieldLabel} must be a file or an object.`,
                            (value) =>
                                value instanceof File || typeof value === "object" // Validate File or object
                        )
                )
                .min(1, `${fieldLabel} must have at least one item.`); // Ensure array has at least one item
        } else {
            // For optional fields: allow null, undefined, or an empty array
            schema = Yup.array()
                .of(
                    Yup.mixed<File | object>()
                        .nullable() // Allow null explicitly
                        .test(
                            "file-or-object",
                            `${fieldLabel} must be a file, an object, or empty.`,
                            (value) =>
                                value === null || // Allow null
                                value === undefined || // Allow undefined
                                value instanceof File || // Allow File
                                typeof value === "object" // Allow object
                        )
                )
                .nullable() // Allow null array explicitly
                .test(
                    "is-empty-or-valid-array",
                    `${fieldLabel} must be an empty array or contain only files/objects.`,
                    (value) => value === null || value === undefined || Array.isArray(value)
                );
        }


        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;
        const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

        const [imagesPreview, setImagesPreview] = useState<Array<string | ArrayBuffer>>([]);
        const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
        const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();
        const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
        const [uploadCompleted, setUploadCompleted] = useState<Record<string, boolean>>({});
        const [fileDetails, setFileDetails] = useState<{ name: string; type: string; size: number }[]>([]);
        const [uploadedSize, setUploadedSize] = useState<Record<string, string>>({});
        const [totalSize, setTotalSize] = useState<Record<string, string>>({});
        const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

        const formatFileSize = (size: number) => {
            return size >= 1024 * 1024
                ? `${(size / (1024 * 1024)).toFixed(1)} MB`
                : `${(size / 1024).toFixed(1)} KB`;
        };
        const [
            deleteMedia,
            { isLoading: isMediaDeleted, isSuccess: isDeleteMediaSuceess, isError: isMediaDeleteError, error: mediaDeleteError, data: DeletedMedia },
        ] = useDeleteMediaMutation();

        useEffect(() => {
            const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];
            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                const urls: string[] = [];
                const details: { name: string; type: string; size: number }[] = [];
                const progress: Record<string, number> = {};
                const completed: Record<string, boolean> = {};

                fieldValue.forEach((file: File | any) => {
                    if (file instanceof File) {
                        // New file (from local upload)
                        urls.push(URL.createObjectURL(file));
                        details.push({ name: file.name, type: file.type, size: file.size });
                    } else if (typeof file === "object" && file._full_url) {
                        urls.push(file._full_url);
                        details.push({
                            name: file.relativeUri || "Unknown", // Use relativeUri or fallback
                            type: file.mediaStorageProviderMetadata?.type || "Unknown", // Extract type if available
                            size: 0, // API doesn't provide size, set 0 or fetch from metadata if available
                        });
                    }
                });
                details.forEach(file => {
                    progress[`${file.name}-${file.size}`] = 100;
                    completed[`${file.name}-${file.size}`] = true;
                });
                setUploadProgress(progress);
                setUploadCompleted(completed);
                setImagesPreview(urls);
                setFileDetails(details);
            }
        }, [formik.values, fieldLayoutInfo.attrs.name]);

        const handleDropImages = (acceptedFiles: File[]) => {
            if (!acceptedFiles.length) return;

            const newFileDetails = [...fileDetails];
            const newUploadProgress = { ...uploadProgress };
            const newUploadedSize = { ...uploadedSize };
            const newTotalSize = { ...totalSize };
            const newUploadCompleted = { ...uploadCompleted };

            acceptedFiles.forEach((file) => {
                const fileId = `${file.name}-${file.size}`; // Unique identifier for tracking each file

                newFileDetails.push({ name: file.name, type: file.type, size: file.size });
                newUploadProgress[fileId] = 0;
                newUploadedSize[fileId] = "0 KB";
                newTotalSize[fileId] = formatFileSize(file.size);
                newUploadCompleted[fileId] = false;

                const reader = new FileReader();

                reader.onloadstart = () => {
                    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
                    setUploadedSize((prev) => ({ ...prev, [fileId]: "0 KB" }));
                };

                reader.onprogress = (event) => {
                    if (event.loaded && event.total) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress((prev) => ({ ...prev, [fileId]: percent }));
                        setUploadedSize((prev) => ({ ...prev, [fileId]: formatFileSize(event.loaded) }));
                    }
                };

                reader.onloadend = () => {
                    setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
                    setUploadCompleted((prev) => ({ ...prev, [fileId]: true }));
                    setUploadedSize((prev) => ({ ...prev, [fileId]: newTotalSize[fileId] }));
                };

                reader.readAsDataURL(file);
            });

            setFileDetails(newFileDetails);
            setUploadProgress(newUploadProgress);
            setUploadedSize(newUploadedSize);
            setTotalSize(newTotalSize);
            setUploadCompleted(newUploadCompleted);

            formik.setFieldValue(fieldLayoutInfo.attrs.name, acceptedFiles);
        };


        const handleCancelUpload = (fileId: string) => {
            setFileDetails((prev) => prev.filter((file) => fileId !== `${file.name}-${file.size}`));
            setUploadProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
            });
            setUploadCompleted((prev) => {
                const newCompleted = { ...prev };
                delete newCompleted[fileId];
                return newCompleted;
            });
            setUploadedSize((prev) => {
                const newSize = { ...prev };
                delete newSize[fileId];
                return newSize;
            });
            setTotalSize((prev) => {
                const newSize = { ...prev };
                delete newSize[fileId];
                return newSize;
            });
            formik.setFieldValue(fieldLayoutInfo.attrs.name, fileDetails.filter((file) => `${file.name}-${file.size}` !== fileId));
        };

        const confirmDeleteFile = (fileId: any) => {
            setSelectedFileId(fileId);
            setDeleteImageDialogVisible(true);
        };

        const deleteFile = () => {
            if (selectedFileId) {
                handleCancelUpload(selectedFileId);
                setDeleteImageDialogVisible(false);
                setSelectedFileId(null);
            }
        };
        const {
            getRootProps,
            getInputProps,
            isDragActive,
        } = useDropzone({
            onDrop: handleDropImages,
            accept: {
                "image/jpeg": [],
                "image/png": [],
            },
            maxSize: 2 * 1024 * 1024, // 2MB
        });

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];


        const imageFormatHandler = (preview: any) => {
            if (typeof preview === 'string') {
                return preview; // Existing URLs
            }
            if (preview instanceof File) {
                return URL.createObjectURL(preview); // Generate preview URL for File
            }
            if (typeof preview === "object") {
                return preview._full_url
            }
            return ""; // Fallback for invalid cases
        }

        const [isShowAllFiles, setShowAllFiles] = useState(false);
        return (
            <div className={className}>
                <div className="flex flex-column gap-2 mt-4">
                    {showFieldLabel != false &&
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}

                            &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>}
                        </label>
                    }
                    <div
                        {...getRootProps()}
                        className="solid-dropzone-wrapper"
                    >
                        <input {...getInputProps()} />
                        <DropzonePlaceholder />
                    </div>
                </div>
                {fileDetails.length > 0 &&
                    <div className="solid-file-upload-wrapper">
                        <div className="flex align-items-center gap-2">
                            <FileReaderExt fileDetails={fileDetails[0]} />
                            <div className="w-full flex flex-column gap-1">
                                <div className="flex align-items-center justify-content-between">
                                    <div className="font-bold">{fileDetails[0].name}</div>
                                    <div
                                        className="cancel-upload-button"
                                        onClick={() => confirmDeleteFile(`${fileDetails[0].name}-${fileDetails[0].size}`)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                            <path d="M0.6 6L0 5.4L2.4 3L0 0.6L0.6 0L3 2.4L5.4 0L6 0.6L3.6 3L6 5.4L5.4 6L3 3.6L0.6 6Z" fill="#4B4D52" />
                                        </svg>
                                    </div>
                                </div>
                                {uploadCompleted[`${fileDetails[0].name}-${fileDetails[0].size}`] ? (
                                    <div className="flex align-items-center gap-2 text-sm">
                                        {totalSize[`${fileDetails[0].name}-${fileDetails[0].size}`]} of {totalSize[`${fileDetails[0].name}-${fileDetails[0].size}`]}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M9.16 12.76L13.39 8.53L12.55 7.69L9.16 11.08L7.45 9.37L6.61 10.21L9.16 12.76ZM10 16C9.17 16 8.39 15.8424 7.66 15.5272C6.93 15.2124 6.295 14.785 5.755 14.245C5.215 13.705 4.7876 13.07 4.4728 12.34C4.1576 11.61 4 10.83 4 10C4 9.17 4.1576 8.39 4.4728 7.66C4.7876 6.93 5.215 6.295 5.755 5.755C6.295 5.215 6.93 4.7874 7.66 4.4722C8.39 4.1574 9.17 4 10 4C10.83 4 11.61 4.1574 12.34 4.4722C13.07 4.7874 13.705 5.215 14.245 5.755C14.785 6.295 15.2124 6.93 15.5272 7.66C15.8424 8.39 16 9.17 16 10C16 10.83 15.8424 11.61 15.5272 12.34C15.2124 13.07 14.785 13.705 14.245 14.245C13.705 14.785 13.07 15.2124 12.34 15.5272C11.61 15.8424 10.83 16 10 16Z" fill="#722ED1" />
                                        </svg>
                                        Completed
                                    </div>
                                ) : (
                                    <div className="flex align-items-center gap-2 text-sm">
                                        {uploadedSize[`${fileDetails[0].name}-${fileDetails[0].size}`]} of {totalSize[`${fileDetails[0].name}-${fileDetails[0].size}`]}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M7.375 10.5V5.40625L5.75 7.03125L4.875 6.125L8 3L11.125 6.125L10.25 7.03125L8.625 5.40625V10.5H7.375ZM4.25 13C3.90625 13 3.61198 12.8776 3.36719 12.6328C3.1224 12.388 3 12.0938 3 11.75V9.875H4.25V11.75H11.75V9.875H13V11.75C13 12.0938 12.8776 12.388 12.6328 12.6328C12.388 12.8776 12.0938 13 11.75 13H4.25Z" fill="black" />
                                        </svg>
                                        Uploading {uploadProgress[`${fileDetails[0].name}-${fileDetails[0].size}`]}% Completed
                                    </div>
                                )}
                            </div>
                        </div>
                        <ProgressBar
                            value={uploadProgress[`${fileDetails[0].name}-${fileDetails[0].size}`]}
                            showValue={false}
                            style={{ height: 4 }}
                            className="mt-2"
                        />
                    </div>
                }

                {fileDetails.length > 1 &&
                    <div className="flex align-items-center">
                        <p className="m-0">
                            {fileDetails.length - 1} items {uploadCompleted ? 'Uploaded' : 'Uploading'}
                        </p>
                        <div>
                            <Button type="button" text label="View" onClick={() => setShowAllFiles(true)} />
                        </div>
                    </div>
                }

                <Dialog
                    visible={isShowAllFiles}
                    header="Items Uploaded"
                    modal
                    onHide={() => setShowAllFiles(false)}
                    style={{ minWidth: 450 }}
                >
                    {fileDetails.length > 1 &&
                        fileDetails.map((file, index) => {
                            const fileId = `${file.name}-${file.size}`;
                            return (
                                <div key={fileId} className="solid-file-upload-wrapper">
                                    <div className="flex align-items-center gap-2">
                                        <FileReaderExt fileDetails={file} />
                                        <div className="w-full flex flex-column gap-1">
                                            <div className="flex align-items-center justify-content-between">
                                                <div className="font-bold">{file.name}</div>
                                                <div
                                                    className="cancel-upload-button"
                                                    onClick={() => confirmDeleteFile(fileId)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                        <path d="M0.6 6L0 5.4L2.4 3L0 0.6L0.6 0L3 2.4L5.4 0L6 0.6L3.6 3L6 5.4L5.4 6L3 3.6L0.6 6Z" fill="#4B4D52" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {uploadCompleted[fileId] ? (
                                                <div className="flex align-items-center gap-2 text-sm">
                                                    {totalSize[fileId]} of {totalSize[fileId]}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                                        <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                                    </svg>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M9.16 12.76L13.39 8.53L12.55 7.69L9.16 11.08L7.45 9.37L6.61 10.21L9.16 12.76ZM10 16C9.17 16 8.39 15.8424 7.66 15.5272C6.93 15.2124 6.295 14.785 5.755 14.245C5.215 13.705 4.7876 13.07 4.4728 12.34C4.1576 11.61 4 10.83 4 10C4 9.17 4.1576 8.39 4.4728 7.66C4.7876 6.93 5.215 6.295 5.755 5.755C6.295 5.215 6.93 4.7874 7.66 4.4722C8.39 4.1574 9.17 4 10 4C10.83 4 11.61 4.1574 12.34 4.4722C13.07 4.7874 13.705 5.215 14.245 5.755C14.785 6.295 15.2124 6.93 15.5272 7.66C15.8424 8.39 16 9.17 16 10C16 10.83 15.8424 11.61 15.5272 12.34C15.2124 13.07 14.785 13.705 14.245 14.245C13.705 14.785 13.07 15.2124 12.34 15.5272C11.61 15.8424 10.83 16 10 16Z" fill="#722ED1" />
                                                    </svg>
                                                    Completed
                                                </div>
                                            ) : (
                                                <div className="flex align-items-center gap-2 text-sm">
                                                    {uploadedSize[fileId]} of {totalSize[fileId]}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                                        <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                                    </svg>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M7.375 10.5V5.40625L5.75 7.03125L4.875 6.125L8 3L11.125 6.125L10.25 7.03125L8.625 5.40625V10.5H7.375ZM4.25 13C3.90625 13 3.61198 12.8776 3.36719 12.6328C3.1224 12.388 3 12.0938 3 11.75V9.875H4.25V11.75H11.75V9.875H13V11.75C13 12.0938 12.8776 12.388 12.6328 12.6328C12.388 12.8776 12.0938 13 11.75 13H4.25Z" fill="black" />
                                                    </svg>
                                                    Uploading {uploadProgress[fileId]}% Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ProgressBar
                                        value={uploadProgress[fileId]}
                                        showValue={false}
                                        style={{ height: 4 }}
                                        className="mt-2"
                                    />
                                </div>
                            );
                        })
                    }
                </Dialog>
                {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                    <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                )}
                <Dialog
                    visible={isDeleteImageDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={deleteFile} />
                            <Button label="No" icon="pi pi-times" className='small-button' onClick={() => setDeleteImageDialogVisible(false)} />
                        </div>
                    )}
                    onHide={() => setDeleteImageDialogVisible(false)}
                >
                    <p>Are you sure you want to delete image?</p>
                </Dialog>
            </div >
        );
    }
}