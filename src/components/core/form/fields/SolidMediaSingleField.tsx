
import { DropzonePlaceholder } from "../../../../components/common/DropzonePlaceholder";
import { useDeleteMediaMutation } from "../../../../redux/api/mediaApi";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import {
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../../shad-cn-ui/SolidDialog";
import { SolidMessage } from "../../../shad-cn-ui/SolidMessage";
import { SolidProgressBar } from "../../../shad-cn-ui/SolidProgressBar";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { FileReaderExt } from "../../../../components/common/FileReaderExt";
import getAcceptedFileTypes from "../../../../helpers/getAcceptedFileTypes";
import { downloadMediaFile } from "../../../../helpers/downloadMediaFile";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidMediaFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import styles from "./solidFields.module.css";
import { SolidIcon } from "../../../shad-cn-ui";

export class SolidMediaSingleField implements ISolidField {

    private fieldContext: SolidFieldProps;
    private setLightboxUrls?: (urls: { src: string; downloadUrl: string }[]) => void;
    private setOpenLightbox?: (open: boolean) => void;
    constructor(fieldContext: SolidFieldProps, setLightboxUrls?: (urls: { src: string; downloadUrl: string }[]) => void,
        setOpenLightbox?: (open: boolean) => void) {
        this.fieldContext = fieldContext;
        this.setLightboxUrls = setLightboxUrls;
        this.setOpenLightbox = setOpenLightbox;
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

    validationSchema(): Yup.Schema {
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
                .required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                .test(
                    ERROR_MESSAGES.FILE_OBJECT,
                    ERROR_MESSAGES.MUST_BE_FILE_OBJECT(fieldLabel),
                    (value) =>
                        value instanceof File || typeof value === "object" // Validate File or object
                );
        } else {
            // For optional fields: allow null or undefined
            schema = Yup.mixed<any>()
                .nullable() // Allow null explicitly
                .test(
                    ERROR_MESSAGES.FILE_OBJECT,
                    ERROR_MESSAGES.MUST_BE_FILE_OBJECT(fieldLabel),
                    (value) =>
                        value === null || // Allow null
                        value === undefined || // Allow undefined
                        value instanceof File || // Allow File
                        value === 'false' ||
                        typeof value === "object" // Allow object
                );
        }
        return schema;

    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultMediaSingleFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultMediaSingleFormViewWidget';
        }
        const viewMode: string = this.fieldContext.viewMode;


        return (
            <>
                <div className={className}>
                    {viewMode === "view" &&
                        this.renderExtensionRenderMode(viewWidget, formik)
                    }
                    {viewMode === "edit" &&
                        <>
                            {editWidget &&
                                this.renderExtensionRenderMode(editWidget, formik)
                            }
                        </>
                    }
                </div>
            </>
        );
    }


    renderExtensionRenderMode(widget: string, formik: FormikObject) {
        let DynamicWidget = getExtensionComponent(widget);
        const widgetProps: SolidMediaFormFieldWidgetProps = {
            formik: formik,
            fieldContext: this.fieldContext,
            setLightboxUrls: this.setLightboxUrls,
            setOpenLightbox: this.setOpenLightbox
        }
        return (
            <>
                {DynamicWidget && <DynamicWidget {...widgetProps} />}
            </>
        )
    }
}





export const DefaultMediaSingleFormEditWidget = ({ formik, fieldContext, setLightboxUrls, setOpenLightbox }: SolidMediaFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const viewMode: string = fieldContext.viewMode;

    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

    const isFieldDisabled = formDisabled || fieldDisabled;
    const isFieldReadonly = formReadonly || fieldReadonly || readOnlyPermission;

    const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
    const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();
    const [fileDetails, setFileDetails] = useState<{ name: string; type: string, fileUrl: string, fileSize: number } | null>(null);
    const [isReplaceImageDialogVisible, setReplaceImageDialogVisible] = useState(false);
    const [newFileToUpload, setNewFileToUpload] = useState<any>(null);
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);

    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

    const [
        deleteMedia,
        { isLoading: isMediaDeleted, isSuccess: isDeleteMediaSuceess, isError: isMediaDeleteError, error: mediaDeleteError, data: DeletedMedia },
    ] = useDeleteMediaMutation();

    const handleCancelUpload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (imageToBeDeletedData) {
            deleteMedia(imageToBeDeletedData);
        }
        e.stopPropagation();
        setFileDetails(null);
        if (fieldContext.updateFieldValue) {
            fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, null);
        } else {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, null);
            formik.setFieldTouched(fieldLayoutInfo.attrs.name, true, false);
        }
        setDeleteImageDialogVisible(false);
    };

    const handleDropImage = (acceptedFiles: any[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setFileSizeError(null);
        if (fileDetails) {
            // If a file is already uploaded, show the confirmation dialog
            setNewFileToUpload(file);
            setReplaceImageDialogVisible(true);
        } else {
            // If no file is present, proceed with upload
            uploadFile(file);
        }
    };

    const uploadFile = (file: File) => {
        setFileDetails({
            name: file.name,
            type: file.type,
            fileUrl: URL.createObjectURL(file),
            fileSize: file.size
        });

        const reader = new FileReader();
        reader.readAsDataURL(file);
        if (fieldContext.updateFieldValue) {
            fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, file);
        } else {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, file);
            formik.setFieldTouched(fieldLayoutInfo.attrs.name, true, false);
        }
    };

    const handleReplaceFile = () => {
        // Delete the existing file first
        if (imageToBeDeletedData) {
            deleteMedia(imageToBeDeletedData);
        }
        setFileDetails(null);
        if (fieldContext.updateFieldValue) {
            fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, null);
        } else {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, null);
            formik.setFieldTouched(fieldLayoutInfo.attrs.name, true, false);
        }

        // Proceed with uploading new file
        if (newFileToUpload) {
            uploadFile(newFileToUpload);
            setNewFileToUpload(null);
        }

        setReplaceImageDialogVisible(false);
    };

    useEffect(() => {
        const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];

        if (fieldValue && typeof fieldValue === "object") {
            let fileUrl = "";
            let fileName = "Unknown File";
            let fileSize = 0;

            if (fieldValue instanceof File) {
                fileUrl = URL.createObjectURL(fieldValue);
                fileName = fieldValue.name;
                fileSize = fieldValue.size;
            } else if (fieldValue._full_url) {
                fileUrl = fieldValue._full_url;
                fileName = fieldValue.originalFileName;
                fileSize = fieldValue.fileSize;
            }

            setFileDetails({
                name: fileName,
                type: fieldValue.mimeType ? fieldValue.mimeType : fieldValue.type,
                fileUrl,
                fileSize
            });

            // Set file ID for delete operation
            setImageToBeDeletedData(fieldValue.id);

            // Ensure formik has the correct value
            if (fieldContext.updateFieldValue) {
                fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, fieldValue, false);
            } else {
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
        onDropRejected: (fileRejections) => {
            const rejection = fileRejections[0];
            const sizeError = rejection.errors.find(err => err.code === 'file-too-large');
            if (sizeError) {
                setFileSizeError(ERROR_MESSAGES.FILE_TOO_LAREG(fieldMetadata.mediaMaxSizeKb));
            } else {
                setFileSizeError(rejection.errors[0]?.message || ERROR_MESSAGES.FILE_NOT_ACCEPT);
            }
        },
        accept: getAcceptedFileTypes(fieldMetadata.mediaTypes),
        maxSize: fieldMetadata.mediaMaxSizeKb * 1024,
        disabled: isFieldDisabled || isFieldReadonly
    });

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
    let DynamicWidget = getExtensionComponent("SolidFormFieldViewMediaSingleWidget");
    const widgetProps = {
        formik: formik,
        fieldContext: fieldContext,
        setLightboxUrls: setLightboxUrls,
        setOpenLightbox: setOpenLightbox
    }

    const handleFileView = (url: any) => {
        const downloadOnlyExt = [
            "txt", "zip", "rar",
            "doc", "docx",
            "xls", "xlsx",
            "ppt", "pptx"
        ];

        const fileUrl = url?.fileUrl || "";
        const cleanUrl = fileUrl.split("?")[0];
        const ext = cleanUrl.split(".").pop()?.toLowerCase();

        if (ext && downloadOnlyExt.includes(ext)) {
            const link = document.createElement('a');
            link.href = url.fileUrl;
            link.download = ''; // or specify a file name like 'file.pdf'
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } else {
            setLightboxUrls?.([
                { src: url.fileUrl, downloadUrl: url.fileUrl },
            ]);
            setOpenLightbox?.(true);
        }
    }


    return (
        <div style={(isFieldDisabled === true || isFieldReadonly === true) ? { filter: 'opacity(50%)', pointerEvents: 'none' } : {}}>
            <div className={`${styles.fieldWrapper} relative`}>
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>{fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                        {/* &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>} */}
                    </label>
                }
                <div className="relative">
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
                            <SolidMessage severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                        </div>
                    )}
                </div>
                {
                    fileSizeError &&
                    <SolidMessage severity="error" text={fileSizeError?.toString()} />
                }
                {fileDetails && (
                    <div className={`${styles.mediaAttachmentCard} mt-4`}>
                        <div className={`${styles.mediaAttachmentRow} flex align-items-center md:gap-2`}>
                            <FileReaderExt fileDetails={fileDetails} />
                            <div className={`${styles.mediaAttachmentMeta} w-full`}>
                                <div className="flex align-items-start justify-content-between gap-3">
                                    <button
                                        type="button"
                                        className={styles.mediaAttachmentName}
                                        onClick={() => handleFileView(fileDetails)}
                                        title={fileDetails.name}
                                    >
                                        {fileDetails.name}
                                    </button>
                                    <div className={`${styles.mediaAttachmentActions} flex align-items-center gap-2`}>
                                        <button
                                            type="button"
                                            className="solid-file-icon-btn"
                                            disabled={isFieldDisabled || isFieldReadonly}
                                            aria-label="Download file"
                                            onClick={() => downloadMediaFile(fileDetails?.fileUrl, fileDetails?.name)}
                                        >
                                            <SolidIcon name="si-download" aria-hidden />
                                        </button>
                                        <button
                                            type="button"
                                            className="solid-file-icon-btn is-danger"
                                            disabled={isFieldDisabled || isFieldReadonly}
                                            aria-label="Remove file"
                                            onClick={() => setDeleteImageDialogVisible(true)}
                                        >
                                            <SolidIcon name="si-times" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.mediaAttachmentSize}>
                                    {fileDetails && formatFileSize(fileDetails.fileSize)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <SolidDialog
                open={isDeleteImageDialogVisible}
                onOpenChange={setDeleteImageDialogVisible}
                className="solid-shadcn-confirm-dialog"
            >
                <SolidDialogHeader className="solid-shadcn-dialog-head">
                    <SolidDialogTitle>Confirm Delete</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogSeparator className="solid-shadcn-dialog-sep" />
                <SolidDialogBody className="solid-shadcn-dialog-body">
                    <p className="solid-shadcn-dialog-text">Are you sure you want to delete media?</p>
                </SolidDialogBody>
                <SolidDialogFooter className="solid-shadcn-dialog-actions">
                    <SolidButton variant="destructive" size="sm" autoFocus onClick={handleCancelUpload}>
                        Delete
                    </SolidButton>
                    <SolidButton variant="outline" size="sm" onClick={() => setDeleteImageDialogVisible(false)}>
                        Cancel
                    </SolidButton>
                </SolidDialogFooter>
            </SolidDialog>
            <SolidDialog
                open={isReplaceImageDialogVisible}
                onOpenChange={setReplaceImageDialogVisible}
                className="solid-shadcn-confirm-dialog"
            >
                <SolidDialogHeader className="solid-shadcn-dialog-head">
                    <SolidDialogTitle>Replace Media</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogSeparator className="solid-shadcn-dialog-sep" />
                <SolidDialogBody className="solid-shadcn-dialog-body">
                    <p className="solid-shadcn-dialog-text">A media file is already uploaded. Do you want to delete it and upload a new one?</p>
                </SolidDialogBody>
                <SolidDialogFooter className="solid-shadcn-dialog-actions">
                    <SolidButton variant="destructive" size="sm" onClick={handleReplaceFile}>
                        Replace
                    </SolidButton>
                    <SolidButton variant="outline" size="sm" onClick={() => setReplaceImageDialogVisible(false)}>
                        Cancel
                    </SolidButton>
                </SolidDialogFooter>
            </SolidDialog>
        </div>
    );
}

export const DefaultMediaSingleFormViewWidget = ({ formik, fieldContext, setLightboxUrls, setOpenLightbox }: SolidMediaFormFieldWidgetProps) => {
    const [fileDetails, setFileDetails] = useState<{ name: string; type: string, fileUrl: string, fileSize: number } | null>(null);
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    // useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

    useEffect(() => {
        const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];

        if (fieldValue && typeof fieldValue === "object") {
            let fileUrl = "";
            let fileName = "Unknown File";
            let fileSize = 0;

            if (fieldValue instanceof File) {
                fileUrl = URL.createObjectURL(fieldValue);
                fileName = fieldValue.name;
                fileSize = fieldValue.size;
            } else if (fieldValue._full_url) {
                fileUrl = fieldValue._full_url;
                fileName = fieldValue.originalFileName;
                fileSize = fieldValue.fileSize;
            }

            setFileDetails({
                name: fileName,
                type: fieldValue.mimeType ? fieldValue.mimeType : fieldValue.type,
                fileUrl,
                fileSize
            });
            // Ensure formik has the correct value
            if (fieldContext.updateFieldValue) {
                fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, fieldValue, false);
            } else {
                formik.setFieldValue(fieldLayoutInfo.attrs.name, fieldValue);
            }
        }
    }, [formik.values, fieldLayoutInfo.attrs.name]);

    const handleFileView = (url: any) => {
        const downloadOnlyExt = [
            "txt", "zip", "rar",
            "doc", "docx",
            "xls", "xlsx",
            "ppt", "pptx"
        ];

        const fileUrl = url?.fileUrl || "";
        const cleanUrl = fileUrl.split("?")[0];
        const ext = cleanUrl.split(".").pop()?.toLowerCase();

        if (ext && downloadOnlyExt.includes(ext)) {
            const link = document.createElement('a');
            link.href = url.fileUrl;
            link.download = ''; // or specify a file name like 'file.pdf'
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } else {
            setLightboxUrls?.([
                { src: url.fileUrl, downloadUrl: url.fileUrl },
            ]);
            setOpenLightbox?.(true);
        }
    }

    return (
        <div className={`${styles.fieldViewWrapper} relative`}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldViewLabel} form-field-label`}>{fieldLabel}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            }

            {fileDetails && (
                <div className={`${styles.mediaAttachmentCard} ${styles.mediaAttachmentCardView} mt-4`}>
                    <div className={`${styles.mediaAttachmentRow} flex align-items-center md:gap-2`}>
                        <FileReaderExt fileDetails={fileDetails} />
                        <div className={`${styles.mediaAttachmentMeta} w-full`}>
                            <div className="flex align-items-start justify-content-between gap-3">
                                <button
                                    type="button"
                                    className={styles.mediaAttachmentName}
                                    onClick={() => handleFileView(fileDetails)}
                                    title={fileDetails.name}
                                >
                                    {fileDetails.name}
                                </button>
                                <div className={`${styles.mediaAttachmentActions} flex align-items-center md:gap-2`}>
                                    <button
                                        type="button"
                                        className="solid-file-icon-btn"
                                        aria-label="Download file"
                                        onClick={() => downloadMediaFile(fileDetails?.fileUrl, fileDetails?.name)}
                                    >
                                        <SolidIcon name="si-download" aria-hidden />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.mediaAttachmentSize}>
                                {fileDetails && formatFileSize(fileDetails.fileSize)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
