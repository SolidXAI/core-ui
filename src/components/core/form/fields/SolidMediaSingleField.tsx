'use client';
import { DropzonePlaceholder } from "@/components/common/DropzonePlaceholder";
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
export class SolidMediaSingleField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    updateFormData(value: any, formData: FormData): any {
        const fieldLayoutInfo = this.fieldContext.field;
        if (value instanceof File) {
            formData.append(fieldLayoutInfo.attrs.name, value);
        }
    }

    initialValue(): any {
        const mediaUrls = this.fieldContext.data && this.fieldContext.data._media && this.fieldContext.data._media[this.fieldContext.field.attrs.name][0];
        return mediaUrls;
    }

    validationSchema(): Schema {
        // let schema: Yup.StringSchema = Yup.object();

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;

        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        // Dynamically determine the base type based on the 'required' flag

        // Define base schema
        let schema: Yup.MixedSchema<File | object>;

        if (fieldMetadata.required) {
            // For required fields: disallow null and undefined
            schema = Yup.mixed<File | object>()
                .required(`${fieldLabel} is required.`)
                .test(
                    "file-or-object",
                    `${fieldLabel} must be a file or an object.`,
                    (value) =>
                        value instanceof File || typeof value === "object" // Validate File or object
                );
        } else {
            // For optional fields: allow null or undefined
            schema = Yup.mixed<any>()
                .nullable() // Allow null explicitly
                .test(
                    "file-or-object",
                    `${fieldLabel} must be a file, an object, or empty.`,
                    (value) =>
                        value === null || // Allow null
                        value === undefined || // Allow undefined
                        value instanceof File || // Allow File
                        typeof value === "object" // Allow object
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

        const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
        const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();
        const [imagesPreview, setImagesPreview] = useState<string | ArrayBuffer | null>(null);
        const [uploadProgress, setUploadProgress] = useState<number>(0);
        const [uploadCompleted, setUploadCompleted] = useState<boolean>(false);
        const [fileDetails, setFileDetails] = useState<{ name: string; type: string } | null>(null);
        const [uploadedSize, setUploadedSize] = useState<string>("0 MB");
        const [totalSize, setTotalSize] = useState<string>("0 KB");

        const formatFileSize = (size: number) => {
            return size >= 1024 * 1024
                ? `${(size / (1024 * 1024)).toFixed(1)} MB`
                : `${(size / 1024).toFixed(1)} KB`;
        };

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        const [
            deleteMedia,
            { isLoading: isMediaDeleted, isSuccess: isDeleteMediaSuceess, isError: isMediaDeleteError, error: mediaDeleteError, data: DeletedMedia },
        ] = useDeleteMediaMutation();

        const handleDelete = () => {
            imageToBeDeletedData.e.stopPropagation();
            if (imageToBeDeletedData.imagesPreview.id) {
                deleteMedia(imageToBeDeletedData.imagesPreview.id);
            }
            formik.setFieldValue(fieldLayoutInfo.attrs.name, null);
            setDeleteImageDialogVisible(false);
        };
        const handleCancelUpload = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (imageToBeDeletedData?.imagesPreview.id) {
                deleteMedia(imageToBeDeletedData.imagesPreview.id);
            }
            e.stopPropagation();
            setUploadProgress(0);
            setUploadCompleted(false);
            setFileDetails(null);
            formik.setFieldValue(fieldLayoutInfo.attrs.name, null);
            setDeleteImageDialogVisible(false);
        };

        const handleDropImage = (acceptedFiles: File[]) => {
            // const file = acceptedFiles[0];
            // if (file) {
            //     formik.setFieldValue(fieldLayoutInfo.attrs.name, file);
            // } else {
            //     console.error("No file was accepted");
            // }
            const file = acceptedFiles[0];
            if (!file) return;

            setUploadCompleted(false);
            setUploadProgress(0);
            setTotalSize(formatFileSize(file.size));
            setUploadedSize("0 KB");
            setFileDetails({ name: file.name, type: file.type });

            const reader = new FileReader();

            reader.onloadstart = () => {
                setUploadProgress(0);
                setUploadedSize("0 KB");
            };
            reader.onprogress = (event) => {
                if (event.loaded && event.total) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                    setUploadedSize(formatFileSize(event.loaded));
                }
            };

            reader.onloadend = () => {
                setUploadProgress(100);
                setUploadCompleted(true);
                setUploadedSize(totalSize); // Set uploaded size to total size after completion
            };

            reader.readAsDataURL(file);
            formik.setFieldValue(fieldLayoutInfo.attrs.name, file);
        };

        // useEffect(() => {
        //     const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];

        //     if (fieldValue instanceof File) {
        //         setImagesPreview(URL.createObjectURL(fieldValue)); // Generate preview URL for file
        //     }
        //     if (typeof fieldValue === 'object') {
        //         setImagesPreview(fieldValue); // Generate preview URL for file
        //     }
        //     if (!fieldValue) {
        //         setImagesPreview(null);
        //     }
        // }, [formik.values, fieldLayoutInfo.attrs.name]);
        useEffect(() => {
            const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];

            if (fieldValue && typeof fieldValue === "object") {
                const fileUrl = fieldValue._full_url;
                if (typeof fileUrl === "string" && fileUrl.length > 0) {
                    const fileName = fileUrl.split("/").pop(); // Extract filename from URL
                    setFileDetails({ name: fileName || "Unknown File", type: "Uploaded File" });

                    // Set upload progress
                    setUploadProgress(100);
                    setUploadCompleted(true);

                    // Ensure Formik has the existing file URL
                    formik.setFieldValue(fieldLayoutInfo.attrs.name, fieldValue);
                }
            }
        }, [formik.values, fieldLayoutInfo.attrs.name]);


        const {
            getRootProps: getRootProps,
            getInputProps: getInputProps,
            isDragActive: isDragActive,
        } = useDropzone({
            onDrop: handleDropImage,
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
            if (typeof preview === 'object') {
                return preview._full_url
            }
            return ""; // Fallback for invalid cases
        }

        return (
            <div className={className}>
                <div className="flex flex-column gap-2 mt-4">
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                        &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>}
                    </label>
                    <div
                        {...getRootProps()}
                        className="solid-dropzone-wrapper"
                    >
                        <input {...getInputProps()} />
                        <DropzonePlaceholder />
                    </div>
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    )}
                    {fileDetails && (
                        <div className="solid-file-upload-wrapper">
                            <div className="flex align-items-center gap-2">
                                <FileReaderExt fileDetails={fileDetails} />
                                <div className="w-full flex flex-column gap-1">
                                    <div className="flex align-items-center justify-content-between">
                                        <div className="font-bold">{fileDetails.name}</div>
                                        <div className="cancel-upload-button" onClick={() => setDeleteImageDialogVisible(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                                <path d="M0.6 6L0 5.4L2.4 3L0 0.6L0.6 0L3 2.4L5.4 0L6 0.6L3.6 3L6 5.4L5.4 6L3 3.6L0.6 6Z" fill="#4B4D52" />
                                            </svg>
                                        </div>
                                    </div>
                                    {
                                        uploadCompleted ?
                                            <div className="flex align-items-center gap-2 text-sm">
                                                {totalSize} of {totalSize}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                                    <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                                </svg>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <mask id="mask0_2480_8635" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                                        <rect width="20" height="20" fill="#D9D9D9" />
                                                    </mask>
                                                    <g mask="url(#mask0_2480_8635)">
                                                        <path d="M9.16 12.76L13.39 8.53L12.55 7.69L9.16 11.08L7.45 9.37L6.61 10.21L9.16 12.76ZM10 16C9.17 16 8.39 15.8424 7.66 15.5272C6.93 15.2124 6.295 14.785 5.755 14.245C5.215 13.705 4.7876 13.07 4.4728 12.34C4.1576 11.61 4 10.83 4 10C4 9.17 4.1576 8.39 4.4728 7.66C4.7876 6.93 5.215 6.295 5.755 5.755C6.295 5.215 6.93 4.7874 7.66 4.4722C8.39 4.1574 9.17 4 10 4C10.83 4 11.61 4.1574 12.34 4.4722C13.07 4.7874 13.705 5.215 14.245 5.755C14.785 6.295 15.2124 6.93 15.5272 7.66C15.8424 8.39 16 9.17 16 10C16 10.83 15.8424 11.61 15.5272 12.34C15.2124 13.07 14.785 13.705 14.245 14.245C13.705 14.785 13.07 15.2124 12.34 15.5272C11.61 15.8424 10.83 16 10 16Z" fill="#722ED1" />
                                                    </g>
                                                </svg>
                                                Completed
                                            </div>
                                            :
                                            <div className="flex align-items-center gap-2 text-sm">
                                                {uploadedSize} of {totalSize}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                                    <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                                </svg>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M7.375 10.5V5.40625L5.75 7.03125L4.875 6.125L8 3L11.125 6.125L10.25 7.03125L8.625 5.40625V10.5H7.375ZM4.25 13C3.90625 13 3.61198 12.8776 3.36719 12.6328C3.1224 12.388 3 12.0938 3 11.75V9.875H4.25V11.75H11.75V9.875H13V11.75C13 12.0938 12.8776 12.388 12.6328 12.6328C12.388 12.8776 12.0938 13 11.75 13H4.25Z" fill="black" />
                                                </svg>
                                                Uploading ${uploadProgress}% Completed
                                            </div>
                                    }
                                </div>
                            </div>
                            <ProgressBar value={uploadProgress} showValue={false} style={{ height: 4 }} className="mt-2" />
                        </div>
                    )}
                </div>
                <Dialog
                    visible={isDeleteImageDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={handleCancelUpload} />
                            <Button label="No" icon="pi pi-times" className='small-button' onClick={() => setDeleteImageDialogVisible(false)} />
                        </div>
                    )}
                    onHide={() => setDeleteImageDialogVisible(false)}
                >
                    <p>Are you sure you want to delete image?</p>
                </Dialog>
            </div>
        );
    }
}