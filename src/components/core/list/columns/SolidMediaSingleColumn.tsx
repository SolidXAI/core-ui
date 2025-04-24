'use client';
import React, { useState } from 'react';
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { classNames } from 'primereact/utils';
import { SolidListFieldWidgetProps, SolidMediaListFieldWidgetProps } from '@/types/solid-core';
import { getExtensionComponent } from '@/helpers/registry';

const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

const MediaWithFallback = ({ src, alt, onClick }: { src: string; alt: string; onClick: (event: React.MouseEvent) => void }) => {
    const [isBroken, setIsBroken] = useState(false);

    return (
        <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isBroken && isImageFile(src) ? (
                <img
                    src={src}
                    alt={alt}
                    className="shadow-2 border-round"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                    onError={() => setIsBroken(true)}
                    onClick={onClick}
                />
            ) : (
                <i className={classNames(isImageFile(src) ? "pi pi-image" : "pi pi-file", "text-3xl text-gray-400")}></i>
            )}
        </div>
    );
};

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
            }
            }
            sortable={column.attrs.sortable}
            showFilterOperator={false}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        />
    );
};

export default SolidMediaSingleColumn;


export const DefaultMediaSingleListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidMediaListFieldWidgetProps) => {
    if (!rowData?._media?.[fieldMetadata.name]) return null;
    const mediaUrls = rowData._media[fieldMetadata.name].map((i: any) => i._full_url);

    return (
        mediaUrls.length > 0 ? (
            <MediaWithFallback
                src={mediaUrls[0]}
                alt="media"
                onClick={(event) => {
                    event.stopPropagation();
                    setLightboxUrls([{ src: mediaUrls[0], downloadUrl: mediaUrls[0] }]);
                    setOpenLightbox(true);
                }}
            />
        ) : (
            <div
                style={{ height: 40, width: 40 }}
            >
            </div>
        )
    );
};