
import { DropzonePlaceholder } from "../../../../components/common/DropzonePlaceholder";
import { DropzoneUpload } from "../../../../components/common/DropzoneUpload";
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
import { useDispatch } from "react-redux";
import { useDropzone } from "react-dropzone";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import { FileReaderExt } from "../../../../components/common/FileReaderExt";
import getAcceptedFileTypes, { getAllowedMediaExtensionsErrorMessage } from "../../../../helpers/getAcceptedFileTypes";
import { downloadMediaFile } from "../../../../helpers/downloadMediaFile";
import { getExtensionComponent } from "../../../../helpers/registry";
import { openMediaInNewTab } from "../../../../helpers/mediaUrl";
import { getMediaPreviewKind, isLightboxMediaKind } from "../../../../helpers/mediaType";
import { SolidFormFieldWidgetProps, SolidMediaFormFieldWidgetProps } from "../../../../types/solid-core";
import { SolidFieldTooltip } from "../../../../components/common/SolidFieldTooltip";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { showToast } from "../../../../redux/features/toastSlice";
import styles from "./solidFields.module.css";
import { SolidIcon } from "../../../shad-cn-ui";
import { buildMediaFieldKey, getPersistedMediaId } from "./mediaFieldUtils";

export class SolidMediaMultipleField implements ISolidField {

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

    validationSchema(): Yup.Schema {

        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.label ?? fieldMetadata.displayName;

        let schema: Yup.ArraySchema<any, any, any, any>;  // Correctly specifying type arguments for ArraySchema
        if (fieldMetadata.required) {
            // For required fields: disallow null, undefined, and empty arrays
            schema = Yup.array()
                .of(
                    Yup.mixed<File | object>()
                        .required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel))
                        .test(
                            ERROR_MESSAGES.FILE_OBJECT,
                            ERROR_MESSAGES.MUST_BE_FILE_OBJECT(fieldLabel),
                            (value) =>
                                value instanceof File || typeof value === "object" // Validate File or object
                        )
                )
                .min(1, ERROR_MESSAGES.FIELD_MUST_HAVE_ITEM(fieldLabel)); // Ensure array has at least one item
        } else {
            // For optional fields: allow null, undefined, or an empty array
            schema = Yup.array()
                .of(
                    Yup.mixed<File | object>()
                        .nullable() // Allow null explicitly
                        .test(
                            ERROR_MESSAGES.FILE_OBJECT,
                            ERROR_MESSAGES.MUST_BE_FILE_OBJECT(fieldLabel),
                            (value) =>
                                value === null || // Allow null
                                value === undefined || // Allow undefined
                                value instanceof File || // Allow File
                                typeof value === "object" // Allow object
                        )
                )
                .nullable() // Allow null array explicitly
                .test(
                    ERROR_MESSAGES.EMPTY_VALID_ARRAY,
                    ERROR_MESSAGES.CONTAIN_EMPTY_ARRAY_OR_FILE_OBECT(fieldLabel),
                    (value) => value === null || value === undefined || Array.isArray(value)
                );
        }


        return schema;
    }

    render(formik: FormikObject) {
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];
        const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) {
            editWidget = 'DefaultMediaMultipleFormEditWidget';
        }
        if (!viewWidget) {
            viewWidget = 'DefaultMediaMultipleFormViewWidget';
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


export const DefaultMediaMultipleFormEditWidget = ({ formik, fieldContext, setLightboxUrls, setOpenLightbox }: SolidMediaFormFieldWidgetProps) => {
    type MediaFileDetail = { name: string; type: string; size: number; mediaId: number | string | null; fileKey: string; fileUrl: string };

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const viewMode: string = fieldContext.viewMode;
    const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly ? fieldContext.readOnly : fieldLayoutInfo.attrs.readonly;
    const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
    const fieldReadonly = fieldLayoutInfo.attrs?.readonly;
    const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
    const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;
    const isFieldDisabled = formDisabled || fieldDisabled;
    const isFieldReadonly = formReadonly || fieldReadonly || readOnlyPermission;

    const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
    const [fileDetails, setFileDetails] = useState<MediaFileDetail[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);
    const mediaConfig = solidFormViewMetaData?.data;

    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };
    const [deleteMedia] = useDeleteMediaMutation();
    const dispatch = useDispatch();
    useEffect(() => {
        const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];
        if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
            setFileDetails([]);
            return;
        }

        const objectUrls: string[] = [];
        const details = fieldValue
            .map((file: File | any): MediaFileDetail | null => {
                if (file instanceof File) {
                    const fileUrl = URL.createObjectURL(file);
                    objectUrls.push(fileUrl);
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        mediaId: null,
                        fileKey: buildMediaFieldKey(file),
                        fileUrl,
                    };
                }

                const fileUrl = file?._full_url;
                if (!fileUrl) {
                    return null;
                }

                return {
                    name: file.originalFileName,
                    type: file.mimeType,
                    size: file.fileSize,
                    mediaId: getPersistedMediaId(file),
                    fileKey: buildMediaFieldKey(file),
                    fileUrl,
                };
            })
            .filter((detail): detail is MediaFileDetail => detail !== null);

        setFileDetails(details);

        return () => {
            objectUrls.forEach((fileUrl) => URL.revokeObjectURL(fileUrl));
        };
    }, [formik.values, fieldLayoutInfo.attrs.name]);

    const handleDropImages = (acceptedFiles: any[]) => {
        if (!acceptedFiles.length) return;
        setFileSizeError(null);
        const existingFiles = Array.isArray(formik?.values[fieldLayoutInfo.attrs.name])
            ? formik.values[fieldLayoutInfo.attrs.name]
            : [];
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
        });

        fieldContext.onChange(
            {
                target: {
                    name: fieldLayoutInfo.attrs.name,
                    value: [...existingFiles, ...acceptedFiles],
                    type: "text",
                },
            } as any,
            "onFieldChange"
        );
    };

    const confirmDeleteFile = (fileId: string) => {
        setSelectedFileId(fileId);
        setDeleteImageDialogVisible(true);
    };

    const deleteFile = async () => {
        if (!selectedFileId) {
            return;
        }

        const currentFiles = Array.isArray(formik?.values[fieldLayoutInfo.attrs.name])
            ? formik.values[fieldLayoutInfo.attrs.name]
            : [];
        const fileToDelete = currentFiles.find((file: File | any) => buildMediaFieldKey(file) === selectedFileId);

        if (!fileToDelete) {
            setDeleteImageDialogVisible(false);
            setShowAllFiles(false);
            setSelectedFileId(null);
            return;
        }

        try {
            const persistedMediaId = getPersistedMediaId(fileToDelete);
            if (persistedMediaId !== null) {
                await deleteMedia(persistedMediaId).unwrap();
            }

            const nextValue = currentFiles.filter((file: File | any) => buildMediaFieldKey(file) !== selectedFileId);
            fieldContext.onChange(
                {
                    target: {
                        name: fieldLayoutInfo.attrs.name,
                        value: nextValue,
                        type: "text",
                    },
                } as any,
                "onFieldChange"
            );
            setFileDetails((prev) => prev.filter((file) => file.fileKey !== selectedFileId));
        } catch (error: any) {
            console.error(ERROR_MESSAGES.ERROR_DELETING_FILE, error);
            dispatch(showToast({
                severity: "error",
                summary: "Delete Failed",
                detail: error?.data?.message || error?.message || ERROR_MESSAGES.ERROR_DELETING_FILE,
                life: 4000,
            }));
        }

        setDeleteImageDialogVisible(false);
        setShowAllFiles(false);
        setSelectedFileId(null);
    };

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop: handleDropImages,
        onDropRejected: (fileRejections) => {
            const rejection = fileRejections[0];
            const sizeError = rejection.errors.find(err => err.code === 'file-too-large');
            if (sizeError) {
                setFileSizeError(ERROR_MESSAGES.FILE_TOO_LAREG(fieldMetadata.mediaMaxSizeKb));
            } else {
                const invalidTypeError = rejection.errors.find((error) => error.code === "file-invalid-type");
                setFileSizeError(
                    (invalidTypeError && getAllowedMediaExtensionsErrorMessage(fieldMetadata.mediaAllowedExtensions))
                    || rejection.errors[0]?.message
                    || ERROR_MESSAGES.FILE_NOT_ACCEPT
                );
            }
        },
        accept: getAcceptedFileTypes(fieldMetadata.mediaTypes, fieldMetadata.mediaAllowedExtensions, mediaConfig),
        maxSize: fieldMetadata.mediaMaxSizeKb * 1024,
    });

    const isFormFieldValid = (formik: any, fieldName: string) => formik.touched[fieldName] && formik.errors[fieldName];

    const [isShowAllFiles, setShowAllFiles] = useState(false);
    let DynamicWidget = getExtensionComponent("SolidFormFieldViewMediaMultipleWidget");
    const widgetProps = {
        formik: formik,
        fieldContext: fieldContext,
        setLightboxUrls: setLightboxUrls,
        setOpenLightbox: setOpenLightbox
    }

    const handleFileView = (url: any) => {
        const previewKind = getMediaPreviewKind({
            url: url?.fileUrl,
            fileName: url?.name,
            mimeType: url?.type,
        });

        if (isLightboxMediaKind(previewKind)) {
            setLightboxUrls?.([
                {
                    src: url.fileUrl,
                    downloadUrl: url.fileUrl,
                    type: previewKind === "video" ? "video" : undefined
                },
            ]);
            setOpenLightbox?.(true);
            return;
        }

        openMediaInNewTab(url?.fileUrl);
    }


    return (
        <div style={readOnlyPermission === true ? { filter: 'opacity(50%)', pointerEvents: 'none' } : {}}>
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
                            mediaAllowedExtensions={fieldMetadata.mediaAllowedExtensions}
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
            </div>
            {fileDetails.length > 0 &&
                <div className={`${styles.mediaAttachmentCard} mt-4`}>
                    <div className={`${styles.mediaAttachmentRow} flex items-center md:gap-2`}>
                        <FileReaderExt fileDetails={fileDetails[0]} />
                        <div className={`${styles.mediaAttachmentMeta} w-full`}>
                            <div className="flex items-start justify-between gap-4">
                                <button
                                    type="button"
                                    className={styles.mediaAttachmentName}
                                    onClick={() => handleFileView(fileDetails[0])}
                                    title={fileDetails[0].name}
                                >
                                    {fileDetails[0].name}
                                </button>
                                <div className={`${styles.mediaAttachmentActions} flex items-center gap-2`}>
                                        <button
                                            type="button"
                                            className="solid-file-icon-btn"
                                            disabled={isFieldDisabled || isFieldReadonly}
                                            aria-label="Download file"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                downloadMediaFile(fileDetails[0]?.fileUrl, fileDetails[0]?.name);
                                            }}
                                        >
                                            <SolidIcon name="si-download" aria-hidden />
                                        </button>
                                    <button
                                        type="button"
                                        className="solid-file-icon-btn is-danger"
                                        disabled={isFieldDisabled || isFieldReadonly}
                                        aria-label="Remove file"
                                        onClick={() => confirmDeleteFile(fileDetails[0].fileKey)}
                                    >
                                        <SolidIcon name="si-times" aria-hidden />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.mediaAttachmentSize}>
                                {formatFileSize(fileDetails[0].size)}
                            </div>
                        </div>
                    </div>
                </div>
            }

            {fileDetails.length > 1 &&
                <div className="flex items-center mt-1">
                    <p className="m-0">
                        {fileDetails.length - 1} items
                    </p>
                    <div>
                        <SolidButton type="button" size="sm" variant="ghost" onClick={() => setShowAllFiles(true)}>
                            View
                        </SolidButton>
                    </div>
                </div>
            }

            <SolidDialog
                open={isShowAllFiles}
                onOpenChange={setShowAllFiles}
                style={{ minWidth: 450 }}
            >
                <SolidDialogHeader>
                    <SolidDialogTitle>Items Uploaded</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogBody>
                {fileDetails.length > 1 &&
                    fileDetails.map((file, index) => {
                        const fileId = file.fileKey;
                        return (
                            <div key={fileId} className={index === fileDetails.length - 1 ? "" : "mb-3"}>
                                <div className={styles.mediaAttachmentCard}>
                                    <div className={`${styles.mediaAttachmentRow} flex items-center md:gap-2`}>
                                        <FileReaderExt fileDetails={file} />
                                        <div className={`${styles.mediaAttachmentMeta} w-full`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <button
                                                    type="button"
                                                    className={styles.mediaAttachmentName}
                                                    onClick={() => handleFileView(file)}
                                                    title={file.name}
                                                >
                                                    {file.name}
                                                </button>
                                                <div className={`${styles.mediaAttachmentActions} flex items-center gap-2`}>
                                                    <button
                                                        type="button"
                                                        className="solid-file-icon-btn"
                                                        disabled={isFieldDisabled || isFieldReadonly}
                                                        aria-label="Download file"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            downloadMediaFile(file?.fileUrl, file?.name);
                                                        }}
                                                    >
                                                        <SolidIcon name="si-download" aria-hidden />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="solid-file-icon-btn is-danger"
                                                        disabled={isFieldDisabled || isFieldReadonly}
                                                        aria-label="Remove file"
                                                        onClick={() => confirmDeleteFile(fileId)}
                                                    >
                                                        <SolidIcon name="si-times" aria-hidden />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.mediaAttachmentSize}>
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
                </SolidDialogBody>
            </SolidDialog>
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
                    <p className="solid-shadcn-dialog-text">Are you sure you want to delete this file?</p>
                </SolidDialogBody>
                <SolidDialogFooter className="solid-shadcn-dialog-actions">
                    <SolidButton variant="destructive" size="sm" autoFocus onClick={deleteFile}>
                        Delete
                    </SolidButton>
                    <SolidButton variant="outline" size="sm" onClick={() => setDeleteImageDialogVisible(false)}>
                        Cancel
                    </SolidButton>
                </SolidDialogFooter>
            </SolidDialog>
        </div>
    );
}

export const DefaultMediaMultipleFormViewWidget = ({ formik, fieldContext, setLightboxUrls, setOpenLightbox }: SolidMediaFormFieldWidgetProps) => {
    const [fileDetails, setFileDetails] = useState<{ name: string; type: string; size: number; id: number | string; fileUrl: string }[]>([]);
    const [isShowAllFiles, setShowAllFiles] = useState(false);
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field w-full px-2 pt-2';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    // useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

    useEffect(() => {
        const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];
        if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
            setFileDetails([]);
            return;
        }

        const objectUrls: string[] = [];
        const details = fieldValue
            .map((file: File | any) => {
                if (file instanceof File) {
                    const fileUrl = URL.createObjectURL(file);
                    objectUrls.push(fileUrl);
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        id: `${file.name}-${file.size}`,
                        fileUrl,
                    };
                }

                const fileUrl = file?._full_url;
                if (!fileUrl) {
                    return null;
                }

                return {
                    name: file.originalFileName,
                    type: file.mimeType,
                    size: file.fileSize,
                    id: file.id,
                    fileUrl,
                };
            })
            .filter(Boolean) as { name: string; type: string; size: number; id: number | string; fileUrl: string }[];

        setFileDetails(details);

        return () => {
            objectUrls.forEach((fileUrl) => URL.revokeObjectURL(fileUrl));
        };
    }, [formik.values, fieldLayoutInfo.attrs.name]);

    const handleFileView = (url: any) => {
        const previewKind = getMediaPreviewKind({
            url: url?.fileUrl,
            fileName: url?.name,
            mimeType: url?.type,
        });

        if (isLightboxMediaKind(previewKind)) {
            setLightboxUrls?.([
                {
                    src: url.fileUrl,
                    downloadUrl: url.fileUrl,
                    type: previewKind === "video" ? "video" : undefined
                },
            ]);
            setOpenLightbox?.(true);
            return;
        }

        openMediaInNewTab(url?.fileUrl);
    }

    const renderMediaFileCard = (file: { name: string; type: string; size: number; id: number | string; fileUrl: string }, className = "") => (
        <div className={`${styles.mediaAttachmentCard} ${className}`.trim()}>
            <div className={`${styles.mediaAttachmentRow} flex items-center md:gap-2`}>
                <FileReaderExt fileDetails={file} />
                <div className={`${styles.mediaAttachmentMeta} w-full`}>
                    <div className="flex items-start justify-between gap-4">
                        <button
                            type="button"
                            className={styles.mediaAttachmentName}
                            onClick={() => handleFileView(file)}
                            title={file.name}
                        >
                            {file.name}
                        </button>
                        <div className={`${styles.mediaAttachmentActions} flex items-center md:gap-2`}>
                            <button
                                type="button"
                                className="solid-file-icon-btn"
                                aria-label="Download file"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    downloadMediaFile(file?.fileUrl, file?.name);
                                }}
                            >
                                <SolidIcon name="si-download" aria-hidden />
                            </button>
                        </div>
                    </div>
                    <div className={styles.mediaAttachmentSize}>
                        {formatFileSize(file.size)}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.fieldViewWrapper}>
            {showFieldLabel != false &&
                <p className={`${styles.fieldViewLabel} form-field-label`}>
                    {fieldLabel}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </p>
            }
            {fileDetails.length > 0 &&
                renderMediaFileCard(fileDetails[0], styles.mediaAttachmentCardView)
            }

            {fileDetails.length > 1 &&
                <div className="flex items-center mt-1">
                    <p className="m-0">
                        {fileDetails.length - 1} items
                    </p>
                    <div>
                        <SolidButton type="button" size="sm" variant="ghost" onClick={() => setShowAllFiles(true)}>
                            View
                        </SolidButton>
                    </div>
                </div>
            }

            <SolidDialog
                open={isShowAllFiles}
                onOpenChange={setShowAllFiles}
                style={{ minWidth: 450 }}
            >
                <SolidDialogHeader>
                    <SolidDialogTitle>Items Uploaded</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogBody>
                {fileDetails.length > 1 &&
                    fileDetails.map((file, index) => {
                        const fileId = `${file.name}-${file.size}`;
                        return (
                            <div key={fileId} className={index === fileDetails.length - 1 ? "" : "mb-3"}>
                                {renderMediaFileCard(file)}
                            </div>
                        );
                    })
                }
                </SolidDialogBody>
            </SolidDialog>

        </div>
    );
}
