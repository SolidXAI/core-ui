import { Schema } from "yup";
import { FormikObject, ISolidField, SolidFieldProps } from "./ISolidField";
import * as Yup from 'yup';
import { Tooltip } from "primereact/tooltip";
import { Message } from "primereact/message";
import { DropzonePlaceholder } from "@/components/common/DropzonePlaceholder";
import { DropzoneUpload } from "@/components/common/DropzoneUpload";
import { Button } from "primereact/button";
import { useDropzone } from "react-dropzone";
import { useEffect, useState } from "react";
import { useDeleteMediaMutation } from "@/redux/api/mediaApi";
import { Dialog } from "primereact/dialog";

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
        const className = fieldLayoutInfo.attrs?.className || 'col-12 s-field';
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
        const fieldDescription = fieldLayoutInfo.attrs.description ?? fieldMetadata.description;
        const solidFormViewMetaData = this.fieldContext.solidFormViewMetaData;

        const [isDeleteImageDialogVisible, setDeleteImageDialogVisible] = useState(false);
        const [imageToBeDeletedData, setImageToBeDeletedData] = useState<any>();
        const [imagesPreview, setImagesPreview] = useState<string | ArrayBuffer | null>(null);

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

        const handleDropImage = (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                formik.setFieldValue(fieldLayoutInfo.attrs.name, file);
            } else {
                console.error("No file was accepted");
            }
        };

        useEffect(() => {
            const fieldValue = formik?.values[fieldLayoutInfo.attrs.name];

            if (fieldValue instanceof File) {
                setImagesPreview(URL.createObjectURL(fieldValue)); // Generate preview URL for file
            }
            if (typeof fieldValue === 'object') {
                setImagesPreview(fieldValue); // Generate preview URL for file
            }
            if (!fieldValue) {
                setImagesPreview(null);
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
                        <input {...getInputProps()} />

                        {isDragActive ? (
                            <DropzonePlaceholder />
                        ) : imagesPreview ? (
                            <div className="relative">
                                <img
                                    src={imageFormatHandler(imagesPreview) as string}
                                    alt="Banner Image"
                                    className="bg-white h-10rem w-14rem"
                                />
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteImageDialogVisible(true);
                                        const data = {
                                            e, imagesPreview
                                        }
                                        setImageToBeDeletedData(data)
                                    }}
                                    icon="pi pi-trash"
                                    severity="secondary"
                                    outlined
                                    aria-label="Bookmark"
                                    className="absolute right-0 top-0 bg-white z-5 m-2"
                                    style={{
                                        height: 25,
                                        width: 25,
                                    }}
                                />
                                <DropzoneUpload />
                            </div>
                        ) : (
                            <DropzonePlaceholder />
                        )}
                        { }
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
            </div>
        );
    }
}
