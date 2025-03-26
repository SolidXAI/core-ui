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
import getAcceptedFileTypes from "@/helpers/getAcceptedFileTypes";
import Link from "next/link";
import { downloadMediaFile } from "@/helpers/downloadMediaFile";
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
        const readOnlyPermission = this.fieldContext.readOnly;

        const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
        const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();
        const [fileDetails, setFileDetails] = useState<{ name: string; type: string; size: number, id: number, fileUrl: string }[]>([]);
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
                const details: { name: string; type: string; size: number, id: any, fileUrl: string }[] = [];
                const objectUrls: string[] = [];
                fieldValue.forEach((file: File | any) => {
                    if (file instanceof File) {
                        // New file (from local upload)
                        const fileUrl = URL.createObjectURL(file);
                        objectUrls.push(fileUrl); // Store URL for cleanup
                        urls.push(fileUrl);

                        details.push({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            id: `${file.name}-${file.size}`,
                            fileUrl: fileUrl // ✅ Store the generated object URL
                        });
                    } else if (typeof file === "object" && file._full_url) {
                        urls.push(file._full_url);
                        details.push({
                            name: file.originalFileName,
                            type: file.mimeType,
                            size: file.fileSize,
                            id: file.id,
                            fileUrl: file._full_url
                        });
                    }
                });
                setFileDetails(details);
            }
        }, [formik.values, fieldLayoutInfo.attrs.name]);

        const handleDropImages = (acceptedFiles: any[]) => {
            if (!acceptedFiles.length) return;
            const newFileDetails = [...fileDetails];
            acceptedFiles.forEach((file) => {
                newFileDetails.push({ name: file.name, type: file.type, size: file.size, id: file.id, fileUrl: file._full_url });
                const reader = new FileReader();
                reader.readAsDataURL(file);
            });

            setFileDetails(newFileDetails);

            formik.setFieldValue(fieldLayoutInfo.attrs.name, acceptedFiles);
        };

        const confirmDeleteFile = (fileId: any, deleteId: number) => {
            setSelectedFileId(fileId);
            setDeleteImageDialogVisible(true);
            setImageToBeDeletedData(deleteId)
        };

        const deleteFile = () => {
            if (selectedFileId && imageToBeDeletedData) {
                // Remove file from UI before making API call
                setFileDetails((prev) => prev.filter((file) => `${file.name}-${file.size}` !== selectedFileId));

                deleteMedia(imageToBeDeletedData)
                    .unwrap()
                    .then(() => {
                        // Update form state
                        formik.setFieldValue(
                            fieldLayoutInfo.attrs.name,
                            fileDetails.filter((file) => `${file.name}-${file.size}` !== selectedFileId)
                        );
                    })
                    .catch((error) => {
                        console.error("Error deleting file:", error);
                    });

                setDeleteImageDialogVisible(false);
                setShowAllFiles(false);
                setSelectedFileId(null);
            }
        };

        const {
            getRootProps,
            getInputProps,
            isDragActive,
        } = useDropzone({
            onDrop: handleDropImages,
            accept: getAcceptedFileTypes(fieldMetadata.mediaTypes),
            maxSize: fieldMetadata.mediaMaxSizeKb * 1024,
        });

        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        const [isShowAllFiles, setShowAllFiles] = useState(false);
        return (
            <div className={className} style={readOnlyPermission === true ? { filter: 'opacity(50%)', pointerEvents: 'none' } : {}}>
                <div className="flex flex-column gap-2 mt-4 relative">
                    {showFieldLabel != false &&
                        <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                            {fieldMetadata.required && <span className="text-red-500"> *</span>}
                            {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                        </label>
                    }
                    <div
                        {...getRootProps()}
                        className="solid-dropzone-wrapper"
                    >
                        <input {...getInputProps()} />
                        <DropzonePlaceholder
                            mediaTypes={fieldMetadata.mediaTypes}
                            mediaMaxSizeKb={fieldMetadata.mediaMaxSizeKb}
                        />
                    </div>
                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <div className="absolute mt-1">
                            <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                        </div>
                    )}
                </div>
                {fileDetails.length > 0 &&
                    <div className="solid-file-upload-wrapper">
                        <div className="flex align-items-center gap-2">
                            <FileReaderExt fileDetails={fileDetails[0]} />
                            <div className="w-full flex flex-column gap-1">
                                <div className="flex align-items-center justify-content-between">
                                    <Link className="font-normal w-11" href={`${fileDetails[0]?.fileUrl}`} target="_blank">{fileDetails[0].name}</Link>
                                    <div className="flex align-items-center gap-2">
                                        <div>
                                            <Button
                                                type="button"
                                                text
                                                icon={"pi pi-download"}
                                                size="small"
                                                style={{
                                                    height: 16,
                                                    width: 16
                                                }}
                                                onClick={() => downloadMediaFile(fileDetails[0]?.fileUrl, fileDetails[0]?.name)}
                                            />
                                        </div>
                                        <div>
                                            <Button
                                                type="button"
                                                text
                                                icon={"pi pi-times"}
                                                size="small"
                                                severity="secondary"
                                                // className="p-2"
                                                style={{
                                                    height: 16,
                                                    width: 16
                                                }}
                                                onClick={() => confirmDeleteFile(`${fileDetails[0].name}-${fileDetails[0].size}`, fileDetails[0].id)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex align-items-center gap-2 text-sm">
                                    {formatFileSize(fileDetails[0].size)}
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {fileDetails.length > 1 &&
                    <div className="flex align-items-center mt-1">
                        <p className="m-0">
                            {fileDetails.length - 1} items
                        </p>
                        <div>
                            <Button type="button" size="small" text label="View" onClick={() => setShowAllFiles(true)} />
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
                                                <Link className="font-normal w-11" href={file?.fileUrl} target="_blank">{file.name}</Link>
                                                <div className="flex align-items-center gap-2">
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            text
                                                            icon={"pi pi-download"}
                                                            size="small"
                                                            style={{
                                                                height: 16,
                                                                width: 16
                                                            }}
                                                            onClick={() => downloadMediaFile(file?.fileUrl, file?.name)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            text
                                                            icon={"pi pi-times"}
                                                            size="small"
                                                            severity="secondary"
                                                            // className="p-2"
                                                            style={{
                                                                height: 16,
                                                                width: 16
                                                            }}
                                                            onClick={() => confirmDeleteFile(fileId, file?.id)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex align-items-center gap-2 text-sm">
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </Dialog>
                <Dialog
                    visible={isDeleteImageDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button type="button" label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={deleteFile} />
                            <Button type="button" label="No" icon="pi pi-times" className='small-button' onClick={() => setDeleteImageDialogVisible(false)} />
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