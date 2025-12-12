"use client";
import { useState } from "react";
import { SolidFormFieldWidgetProps } from "@/types/solid-core";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useResolveS3UrlMutation } from "@/redux/api/fieldApi";
import PDFViewer from "@/components/core/common/PDFViewer";

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
    const isPrivate = fieldLayoutInfo.attrs.isPrivate ? fieldLayoutInfo.attrs.isPrivate : "false";
    const modelName = fieldLayoutInfo.attrs.modelName;
    const fieldName = fieldLayoutInfo.attrs.fieldName;
    const s3KeyFieldName = fieldLayoutInfo.attrs.s3KeyFieldName;

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const [resolveS3Url] = useResolveS3UrlMutation();

    const fetchS3Url = async () => {

        console.log("fetcch url called");
        setIsLoading(true);
        try {

            const result = await resolveS3Url({
                modelName: modelName,
                fieldName: fieldName,
                fieldValue: value,
                s3KeyFieldName: s3KeyFieldName,
                fileType: fileType,
                bucketName: bucketName,
                isPrivate: isPrivate
            }).unwrap();

            setIsLoading(false);
            if (result.statusCode == "200") {
                console.log("fetcch url success", result.data.url);
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
        a.target = "_blank";       // <-- open in new tab
        a.rel = "noopener noreferrer"; // <-- security best practice
        a.click();
    };

    const handleView = async () => {
        console.log("isLoading in view", isLoading);
        if (isLoading) return;
        console.log("isLoading in view", isLoading);
        const url = await fetchS3Url();
        console.log("url after fetch success", url);
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
                            style={{ width: "100%" }}
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

            <Dialog
                header={value}
                visible={open}
                modal
                style={{ width: "80vw", maxHeight: "90vh" }}
                onHide={() => setOpen(false)}
                headerClassName='p-1 form-wrapper-title'
                contentClassName='p-0'
                contentStyle={{ borderRadius: 6 }}

            >
                {previewUrl && isImage && (
                    // container limits height and enables vertical scrolling only
                    <div
                        style={{
                            maxHeight: "75vh",     // control visible area inside dialog
                            overflowY: "auto",     // allow vertical scroll when image is taller
                            overflowX: "hidden",   // avoid horizontal scroll
                        }}
                        className="flex justify-center items-start"
                    >
                        <img
                            src={previewUrl}
                            alt={value}
                            style={{
                                width: "100%",   // take available width of the container
                                height: "100%",  // preserve aspect ratio (do not change height)
                                display: "block",
                            }}
                        />
                    </div>
                )}

                {previewUrl && isPDF && (
                    // <PDFViewer url={previewUrl} />
                    <div
                        style={{
                            width: "100%",
                            height: "75vh",      // control visible height inside dialog
                            overflow: "hidden",  // iframe handles scrolling
                        }}
                    >
                        <iframe
                            src={previewUrl}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    </div>
                )}
            </Dialog>

        </div>
    );
};
