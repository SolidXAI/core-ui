
import React, { useState } from 'react';
import { Volume2 } from "lucide-react";
import { Column } from "../SolidDataTable";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { SolidMediaListFieldWidgetProps } from '../../../../types/solid-core';
import { getExtensionComponent } from '../../../../helpers/registry';
import { SolidFileTypeIcon } from '../../../../helpers/fileTypeIcon';
import { getMediaPreviewKind, isLightboxMediaKind, type MediaPreviewKind } from '../../../../helpers/mediaType';
import { openMediaInNewTab } from '../../../../helpers/mediaUrl';

// Media component with fallback for broken links
const MediaWithFallback = ({
    src,
    alt,
    fileName,
    previewKind,
    onClick
}: {
    src: string;
    alt: string;
    fileName?: string;
    previewKind: MediaPreviewKind;
    onClick: (event: React.MouseEvent) => void
}) => {
    const [isBroken, setIsBroken] = useState(false);

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        onClick(event);
    };

    if (!isBroken) {
        if (previewKind === "image") {
            return (
                <img
                    src={src}
                    alt={alt}
                    className="rounded shadow-md"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover", cursor: "pointer" }}
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
                    style={{ objectFit: "cover", cursor: "pointer" }}
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
                    style={{ width: 40, height: 40, cursor: "pointer" }}
                    onClick={handleClick}
                >
                    <Volume2 size={18} className="text-gray-600" />
                </div>
            );
        }
    }

    // fallback icon (docs/others)
    return (
        <div
            style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={handleClick}
        >
            <SolidFileTypeIcon fileUrl={src} fileName={fileName} size={24} />
        </div>
    );
};

// Main column renderer
const SolidMediaSingleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            body={(rowData) => {
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultMediaSingleListWidget';
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
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </>
                )
            }}
            sortable={column.attrs.sortable}
            showFilterOperator={false}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        />
    );
};

export default SolidMediaSingleColumn;

// Default widget for single media field
export const DefaultMediaSingleListWidget = ({
    rowData,
    solidListViewMetaData,
    fieldMetadata,
    column,
    setLightboxUrls,
    setOpenLightbox
}: SolidMediaListFieldWidgetProps) => {
    if (!rowData?._media?.[fieldMetadata.name]) return null;
    const isArchivedRecord = rowData?.deletedAt !== null && rowData?.deletedAt !== undefined;
    const mediaFiles = rowData._media[fieldMetadata.name].map((file: any) => {
        const fileUrl = file?._full_url;
        const previewKind = getMediaPreviewKind({
            url: fileUrl,
            fileName: file?.originalFileName,
            mimeType: file?.mimeType,
        });
        return {
            fileUrl,
            fileName: file?.originalFileName,
            previewKind,
            opensInLightbox: isLightboxMediaKind(previewKind),
            lightboxType: previewKind === "video" ? "video" : undefined,
        };
    });

    const firstFile = mediaFiles[0];
    if (!firstFile?.fileUrl) return <div style={{ height: 40, width: 40 }} />;
    return (
        <MediaWithFallback
            src={firstFile.fileUrl}
            alt="media"
            fileName={firstFile.fileName}
            previewKind={firstFile.previewKind}
            onClick={(event) => {
                event.stopPropagation();
                if (isArchivedRecord) return;
                if (firstFile.opensInLightbox) {
                    setLightboxUrls([{
                        src: firstFile.fileUrl,
                        downloadUrl: firstFile.fileUrl,
                        type: firstFile.lightboxType
                    }]);
                    setOpenLightbox(true);
                    return;
                }

                openMediaInNewTab(firstFile.fileUrl);
            }}
        />
    );
};
