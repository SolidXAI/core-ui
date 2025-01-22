"use client";
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
        const className = fieldLayoutInfo.attrs?.className || 'col-12 s-field';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;

        const [imagesPreview, setImagesPreview] = useState<Array<string | ArrayBuffer>>([]);
        const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
        const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();

        const fieldDisabled = fieldLayoutInfo.attrs?.disabled;
        const fieldReadonly = fieldLayoutInfo.attrs?.readonly;

        const formDisabled = solidFormViewMetaData.data.solidView?.layout?.attrs?.disabled;
        const formReadonly = solidFormViewMetaData.data.solidView?.layout?.attrs?.readonly;

        const [
            deleteMedia,
            { isLoading: isMediaDeleted, isSuccess: isDeleteMediaSuceess, isError: isMediaDeleteError, error: mediaDeleteError, data: DeletedMedia },
        ] = useDeleteMediaMutation();

        useEffect(() => {
            // Sync imagesPreview with Formik's field value on mount/update
            if (formik.values[fieldLayoutInfo.attrs.name]) {
                const existingFiles = formik.values[fieldLayoutInfo.attrs.name] || [];
                const urls = existingFiles.map((file: File | any) => {
                    if (file instanceof File) {
                        return URL.createObjectURL(file); // Generate preview URL for file
                    }
                    if (typeof file === 'object') {
                        return file; // Handle existing URL strings
                    }
                });
                setImagesPreview(urls);
            }
        }, [formik.values, fieldLayoutInfo.attrs.name]);

        const handleDrop = (acceptedFiles: File[]) => {
            const currentFiles = formik.values[fieldLayoutInfo.attrs.name] || [];
            const updatedFiles = [...currentFiles, ...acceptedFiles];
            formik.setFieldValue(fieldLayoutInfo.attrs.name, updatedFiles);
        };


        const handleDelete = () => {
            imageToBeDeletedData.e.stopPropagation();
            const currentFiles = formik.values[fieldLayoutInfo.attrs.name] || [];
            const updatedFiles = currentFiles.filter((_: any, i: number) => i !== imageToBeDeletedData.index);
            formik.setFieldValue(fieldLayoutInfo.attrs.name, updatedFiles);
            if (!(currentFiles[imageToBeDeletedData.index] instanceof File)) {
                deleteMedia(currentFiles[imageToBeDeletedData.index].id);
            }
            setDeleteImageDialogVisible(false);

        };

        const {
            getRootProps,
            getInputProps,
            isDragActive,
        } = useDropzone({
            onDrop: handleDrop,
            accept: { "image/jpeg": [], "image/png": [] },
            maxSize: 2 * 1024 * 1024,
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

        return (
            <div className={className}>
                <div className="justify-content-center align-items-center">
                    <label htmlFor={fieldLayoutInfo.attrs.name}>{fieldLabel}

                        &nbsp;   {fieldDescription && <span className="form_field_help">({fieldDescription}) </span>}
                    </label>
                </div>
                <div className="s-input">
                    <div
                        {...getRootProps()}
                        className="dropzone p-3 border-1 border-round surface-border"
                    >
                        <input {...getInputProps()}
                        />
                        {isDragActive ? (
                            <DropzonePlaceholder />

                        ) : imagesPreview.length > 0 ? (
                            <div className="flex overflow-auto gap-3">
                                {imagesPreview.map((preview, index) => (
                                    <div key={index} className="relative">

                                        <img
                                            src={imageFormatHandler(preview) as string}
                                            alt={`Preview ${index + 1}`}
                                            className="bg-white h-10rem w-14rem"
                                        />
                                        <Button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteImageDialogVisible(true);
                                                const data = {
                                                    index, e
                                                }
                                                setImageToBeDeletedData(data)
                                            }}
                                            icon="pi pi-trash"
                                            severity="secondary"
                                            outlined
                                            className="absolute right-0 top-0 bg-white z-5 m-2"
                                            style={{ height: 25, width: 25 }}
                                        />
                                        <DropzoneUpload />

                                    </div>
                                ))}
                            </div>
                        ) :
                            <DropzonePlaceholder />
                        }
                    </div>

                    {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                        <Message severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                    )}
                </div>
                <Dialog
                    visible={isDeleteImageDialogVisible}
                    header="Confirm Delete"
                    modal
                    footer={() => (
                        <div className="flex justify-content-center">
                            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={handleDelete} />
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
