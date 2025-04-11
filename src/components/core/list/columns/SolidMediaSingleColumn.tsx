'use client';
import React, { useState } from 'react';
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { classNames } from 'primereact/utils';

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

    const mediaBodyTemplate = (product: any) => {
        if (!product?._media?.[fieldMetadata.name]) return null;
        const mediaUrls = product._media[fieldMetadata.name].map((i: any) => i._full_url);

        return (
            mediaUrls.length > 0 ? (
                <MediaWithFallback
                    src={mediaUrls[0]}
                    alt="product-media"
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

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            body={mediaBodyTemplate}
            sortable={column.attrs.sortable}
            showFilterOperator={false}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        />
    );
};

export default SolidMediaSingleColumn;
