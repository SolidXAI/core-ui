'use client';
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { FileReaderExt } from "@/components/common/FileReaderExt";
import Link from "next/link";
import { downloadMediaFile } from "@/helpers/downloadMediaFile";
import { SolidMediaSingleFieldWidgetProps } from "@/types/solid-core";

export const SolidFormFieldViewMediaSingleWidget = ({ formik, fieldContext }: SolidMediaSingleFieldWidgetProps) => {
    const [fileDetails, setFileDetails] = useState<{ name: string; type: string, fileUrl: string, fileSize: number } | null>(null);
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

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
                type: fieldValue.mimeType,
                fileUrl,
                fileSize
            });
            // Ensure formik has the correct value
            formik.setFieldValue(fieldLayoutInfo.attrs.name, fieldValue);
        }
    }, [formik.values, fieldLayoutInfo.attrs.name]);

    return (
        <div className={className}>
            <div className="flex flex-column gap-2 mt-4 relative">
                {showFieldLabel != false &&
                    <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label">{fieldLabel}
                    </label>
                }

                {fileDetails && (
                    <div className="solid-file-view-wrapper mt-4">
                        <div className="flex align-items-center gap-2">
                            <FileReaderExt fileDetails={fileDetails} />
                            <div className="w-full flex flex-column gap-1">
                                <div className="flex align-items-start justify-content-between">
                                    <Link className="font-normal w-9 text-primary" href={fileDetails.fileUrl} target="_blank">{fileDetails.name}</Link>
                                    <div className="flex align-items-center gap-2">
                                        <div>
                                            <Button
                                                type="button"
                                                text
                                                icon={"pi pi-download"}
                                                size="small"
                                                severity="secondary"
                                                // className="p-2"
                                                style={{
                                                    height: 16,
                                                    width: 16
                                                }}
                                                onClick={() => downloadMediaFile(fileDetails?.fileUrl, fileDetails?.name)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex align-items-center gap-2 text-sm">
                                    {fileDetails && formatFileSize(fileDetails.fileSize)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}