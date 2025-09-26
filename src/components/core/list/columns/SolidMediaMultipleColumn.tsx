'use client';
import React, { useState } from 'react';
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { Button } from 'primereact/button';
import { SolidMediaListFieldWidgetProps } from '@/types/solid-core';
import { getExtensionComponent } from '@/helpers/registry';
import { classNames } from 'primereact/utils';

// Helpers
const isImageFile = (url: string) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
const isVideoFile = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);
const isAudioFile = (url: string) => /\.(mp3|wav|ogg)$/i.test(url);

// Thumbnail preview component
const MediaPreview = ({ src, onClick }: { src: string; onClick: (event: React.MouseEvent) => void }) => {
    const [isBroken, setIsBroken] = useState(false);

    if (!isBroken) {
        if (isImageFile(src)) {
            return (
                <img
                    src={src}
                    alt="media"
                    className="shadow-2 border-round"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                    onError={() => setIsBroken(true)}
                    onClick={onClick}
                />
            );
        }

        if (isVideoFile(src)) {
            return (
                <video
                    src={src}
                    width={40}
                    height={40}
                    className="shadow-2 border-round"
                    style={{ objectFit: "cover" }}
                    onError={() => setIsBroken(true)}
                    onClick={onClick}
                    muted
                />
            );
        }

        if (isAudioFile(src)) {
            return (
                <div
                    className="shadow-2 border-round flex align-items-center justify-content-center bg-gray-100"
                    style={{ width: 40, height: 40 }}
                    onClick={onClick}
                >
                    <i className="pi pi-volume-up text-xl text-gray-600"></i>
                </div>
            );
        }
    }

    // fallback icon
    return (
        <div
            style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
            <i className={classNames("pi pi-file", "text-3xl text-gray-400")}></i>
        </div>
    );
};

// Column Component
const SolidMediaMultipleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    const filterable = false;
    const showFilterOperator = false;
    const columnDataType = undefined;
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
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </>
                )
            }}
            sortable={column.attrs.sortable}
            dataType={columnDataType}
            showFilterOperator={showFilterOperator}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        />
    );
};

export default SolidMediaMultipleColumn;

// Default multiple widget
export const DefaultMediaMultipleListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidMediaListFieldWidgetProps) => {
    if (!rowData?._media?.[fieldMetadata.name]) return null;

    const mediaUrls = rowData._media[fieldMetadata.name].map((i: any) => i._full_url);

    return (
        mediaUrls.length > 0 ?
            <div className='flex gap-2 align-items-end'>
                <MediaPreview
                    src={mediaUrls[0]}
                    onClick={(event) => {
                        event.stopPropagation();
                        const urlsWithType = mediaUrls.map((src: string) => {
                            return { src, downloadUrl: src };
                        });

                        setLightboxUrls(urlsWithType);
                        setOpenLightbox(true);
                    }}
                />
                <Button
                    type='button'
                    text
                    size='small'
                    label='View All'
                    className='view-media-button'
                    onClick={(event) => {
                        event.stopPropagation();

                        const urlsWithType = mediaUrls.map((src: string) => {
                            return { src, downloadUrl: src };
                        });

                        setLightboxUrls(urlsWithType);
                        setOpenLightbox(true);
                    }}
                />
            </div>
            :
            <div style={{ height: 40, width: 40 }} />
    );
};
