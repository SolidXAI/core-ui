
import React, { useState } from 'react';
import { Volume2 } from "lucide-react";
import { Column } from "../SolidDataTable";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { SolidMediaListFieldWidgetProps } from '../../../../types/solid-core';
import { getExtensionComponent } from '../../../../helpers/registry';
import { FileReaderExt } from '../../../../components/common/FileReaderExt';
import { SolidDialog, SolidDialogBody, SolidDialogClose, SolidDialogHeader, SolidDialogTitle, SolidIcon } from "../../../shad-cn-ui";
import { SolidFileTypeIcon } from '../../../../helpers/fileTypeIcon';
import { getMediaPreviewKind, isLightboxMediaKind, type MediaPreviewKind } from '../../../../helpers/mediaType';
import { openMediaInNewTab } from '../../../../helpers/mediaUrl';
import { downloadMediaFile } from '../../../../helpers/downloadMediaFile';



// Thumbnail preview component
const MediaPreview = ({
    src,
    fileName,
    previewKind,
    onClick
}: {
    src: string;
    fileName?: string;
    previewKind: MediaPreviewKind;
    onClick: (event: React.MouseEvent) => void
}) => {
    const [isBroken, setIsBroken] = useState(false);

    const handleClick = (event: React.MouseEvent) => {
        onClick(event);
    };

    if (!isBroken) {
        if (previewKind === "image") {
            return (
                <img
                    src={src}
                    alt="media"
                    className="rounded shadow-md"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                    onError={() => setIsBroken(true)}
                    onClick={handleClick}
                />
            );
        }

        if (previewKind === "video") {
            return (
                <video
                    src={src}
                    width={40}
                    height={40}
                    className="rounded shadow-md"
                    style={{ objectFit: "cover" }}
                    onError={() => setIsBroken(true)}
                    onClick={handleClick}
                    muted
                />
            );
        }

        if (previewKind === "audio") {
            return (
                <div
                    className="flex items-center justify-center rounded bg-gray-100 shadow-md"
                    style={{ width: 40, height: 40 }}
                    onClick={handleClick}
                >
                    <Volume2 size={18} className="text-gray-600" />
                </div>
            );
        }
    }

    return (
        <div
            style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={handleClick}
        >
            <SolidFileTypeIcon fileUrl={src} fileName={fileName} size={24} />
        </div>
    );
};


const SolidMediaMultipleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            body={(rowData) => {
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultMediaMultipleListWidget';
                }
                let DynamicWidget = getExtensionComponent(viewWidget);
                const widgetProps: SolidMediaListFieldWidgetProps = {
                    rowData,
                    solidListViewMetaData,
                    fieldMetadata,
                    column,
                    setLightboxUrls,
                    setOpenLightbox
                }
                return (
                    <>
                        {
                            DynamicWidget && <DynamicWidget {...widgetProps} />
                        }
                    </>
                )
            }}
            sortable={column.attrs.sortable}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        />
    );
};

export default SolidMediaMultipleColumn;

// Default multiple widget
export const DefaultMediaMultipleListWidget = ({ rowData, fieldMetadata, setLightboxUrls, setOpenLightbox }: SolidMediaListFieldWidgetProps) => {
    const [isShowAllFiles, setShowAllFiles] = useState(false);

    if (!rowData?._media?.[fieldMetadata.name]) return null;
    const isArchivedRecord = rowData?.deletedAt !== null && rowData?.deletedAt !== undefined;

    const fullrecord = rowData._media[fieldMetadata.name]?.map((file: any) => ({
        name: file.originalFileName,
        type: file.mimeType,
        size: file.fileSize,
        id: file.id,
        fileUrl: file?._full_url,
        previewKind: getMediaPreviewKind({
            url: file?._full_url,
            fileName: file?.originalFileName,
            mimeType: file?.mimeType,
        })
    }));


    const formatFileSize = (size: number) =>
        size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;


    const handleFileView = (file: any) => {
        if (isArchivedRecord) return;

        if (isLightboxMediaKind(file?.previewKind)) {
            setLightboxUrls?.([{
                src: file.fileUrl,
                downloadUrl: file.fileUrl,
                type: file.previewKind === "video" ? "video" : undefined
            }]);
            setOpenLightbox?.(true);
            return;
        }

        openMediaInNewTab(file?.fileUrl);
    };

    const renderMediaFileCard = (file: any, className = "") => (
        <div className={`solid-media-attachment-card ${className}`.trim()}>
            <div className={`solid-media-attachment-row flex items-center md:gap-2`}>
                <FileReaderExt fileDetails={file} />
                <div className={`solid-media-attachment-meta w-full`}>
                    <div className="flex items-start justify-between gap-4">
                        <button
                            type="button"
                            className="solid-media-attachment-name"
                            onClick={() => handleFileView(file)}
                            title={file.name}
                        >
                            {file.name}
                        </button>
                        <div className={`solid-media-attachment-actions flex items-center md:gap-2`}>
                            <button
                                type="button"
                                className="solid-file-icon-btn"
                                aria-label="Download file"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (isArchivedRecord) return;
                                    downloadMediaFile(file?.fileUrl, file?.name);
                                }}
                            >
                                <SolidIcon name="si-download" aria-hidden />
                            </button>
                        </div>
                    </div>
                    <div className="solid-media-attachment-size">
                        {formatFileSize(file.size)}
                    </div>
                </div>
            </div>
        </div>
    );


    return fullrecord.length > 0 ? (
        <div className='flex items-end gap-2'>

            <MediaPreview
                src={fullrecord[0]?.fileUrl}
                fileName={fullrecord[0]?.name}
                previewKind={fullrecord[0]?.previewKind}
                onClick={(event) => {
                    event.stopPropagation();
                    handleFileView(fullrecord[0]);
                }}
            />

            {fullrecord?.length > 1 && <span
                style={{
                    color: "#0895CD",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginLeft: "4px"
                }}
                onClick={(event) => {
                    event.stopPropagation();
                    if (isArchivedRecord) return;
                    setShowAllFiles(true);
                }}
            >
                +{fullrecord.length - 1}
            </span>
            }



            {/* VIEW ALL DIALOG */}
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
                    {fullrecord?.map((file: any, index: number) => {
                        const fileId = `${file.name}-${file.size}`;
                        return (
                            <div key={fileId} className={index === fullrecord.length - 1 ? "" : "mb-3"}>
                                {renderMediaFileCard(file)}
                            </div>
                        )
                    })}
                </SolidDialogBody>
            </SolidDialog>
        </div>
    ) : (
        <div style={{ height: 40, width: 40 }} />
    );
};
