'use client';
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { FileReaderExt } from "@/components/common/FileReaderExt";
import Link from "next/link";
import { downloadMediaFile } from "@/helpers/downloadMediaFile";
import { SolidMediaSingleFieldWidgetProps } from "@/types/solid-core";
import { Dialog } from "primereact/dialog";

export const SolidFormFieldViewMediaMultipleWidget = ({ formik, fieldContext }: SolidMediaSingleFieldWidgetProps) => {
    const [fileDetails, setFileDetails] = useState<{ name: string; type: string; size: number, id: number, fileUrl: string }[]>([]);
    const [isShowAllFiles, setShowAllFiles] = useState(false);
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const className = fieldLayoutInfo.attrs?.className || 'field col-12';
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;

    useEffect(() => { formik.setFieldValue(fieldLayoutInfo.attrs.name, "false") }, [])

    const formatFileSize = (size: number) => {
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

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

    return (
        <div className={className}>
            {showFieldLabel != false &&
                <label htmlFor={fieldLayoutInfo.attrs.name} className="form-field-label mt-4 font-medium">{fieldLabel}
                </label>
            }
            {fileDetails.length > 0 &&
                <div className="solid-file-view-wrapper">
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
                            <div key={fileId} className="solid-file-view-wrapper">
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

        </div>
    );
}