"use client";
import { useState } from "react";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useResolveS3UrlMutation } from "@/redux/api/fieldApi";

/**
 * SolidS3FileViewerWidget (PrimeReact version)
 */
export const SolidS3FileViewerWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const value = formik.values[fieldLayoutInfo.attrs.name];
    const fileType = fieldLayoutInfo.attrs.fileType?.toLowerCase();
    const downloadAllowed = fieldLayoutInfo.attrs.downloadAllowed !== false;
    const bucketName = fieldLayoutInfo.attrs.bucketName;
    const isPrivate = fieldLayoutInfo.attrs.isPrivate;

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const [resolveS3Url] = useResolveS3UrlMutation();

    const fetchS3Url = async () => {
        setIsLoading(true);
        try {
            const result = await resolveS3Url({
                modelName: fieldContext.modelName,
                fieldName: fieldContext.fieldMetadata.name,
                modelRecordId: fieldContext?.data?.id,
                fileType: fileType,
                bucketName: bucketName,
                isPrivate: isPrivate,
                s3Key: value
            }).unwrap();

            setIsLoading(false);
            if (result.statusCode == "200") {
                return result.data.url;
            }
        } catch (e) {
            console.error("Failed to resolve S3 URL:", e);
            setIsLoading(false);
            return null;
        }
    };

    const handleDownload = async () => {
        if (isLoading) return;
        const url = await fetchS3Url();
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.download = value?.split("/").pop() || "file";
        a.click();
    };

    const handleView = async () => {
        if (isLoading) return;

        const url = await fetchS3Url();
        if (!url) return;
        setPreviewUrl(url);
        setOpen(true);
    };

    const isImage = ["jpeg", "jpg", "png", "gif", "webp"].includes(fileType);
    const isPDF = fileType === "pdf";
    const isDownloadOnly = ["xlsx", "xls", "csv", "doc", "docx"].includes(fileType);

    return (
        <div className="mt-2 flex flex-col gap-2">
            <p className="m-0 form-field-label font-medium">{fieldLabel}</p>

            {value ? (
                <div className="flex gap-3 items-center">
                    {(isImage || isPDF) && (
                        <Button
                            icon="pi pi-eye"
                            type="button"
                            className="text-left gap-1"
                            style={{width:"260px"}}
                            loading={isLoading}
                            tooltip={value}
                            disabled={isLoading}
                            label={`View ${fileType}`}
                            size="small"
                            iconPos="left"
                            onClick={handleView}
                        />
                    )}

                    {downloadAllowed && (
                        <Button
                            icon="pi pi-download"
                            type="button"
                            className="text-left gap-1"
                            loading={isLoading}
                            tooltip={`Download ${value?.split("/").pop()}`}
                            disabled={isLoading}
                            onClick={handleDownload}
                        />
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No file uploaded</p>
            )}

            {/* Preview Modal */}
            <Dialog
                header={`Preview ${fileType}`}
                visible={open}
                modal
                style={{ width: "80vw" }}
                onHide={() => setOpen(false)}
            >
                {/* 📄 PDF PREVIEW – using PDF.js viewer */}
                {previewUrl && isPDF && (
                    <iframe
                        src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(previewUrl)}`}
                        style={{
                            width: "100%",
                            height: "80vh",
                            border: "none"
                        }}
                    />
                )}
            </Dialog>
        </div>
    );
};
