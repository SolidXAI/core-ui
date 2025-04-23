'use client';
import React from 'react';
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { Button } from 'primereact/button';

const SolidMediaMultipleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const filterable = false;
    const showFilterOperator = false;
    const columnDataType = undefined;
    const header = column.attrs.label ?? fieldMetadata.displayName;
    const imageBodyTemplate = (product: any) => {

        if (!product?._media?.[fieldMetadata.name]) return null;

        const imageUrls = product._media[fieldMetadata.name].map((i: any) => i._full_url);

        return (
            imageUrls.length > 0 ?
                <div className='flex gap-2 align-items-end'>
                    <img
                        src={imageUrls[0]}
                        alt={`product-image-multiple`}
                        className="shadow-2 border-round"
                        width={40}
                        height={40}
                        style={{ objectFit: "cover" }}
                        onClick={(event) => {
                            event.stopPropagation();
                            setLightboxUrls(imageUrls.map((img: string) => ({ src: img, downloadUrl: img })));
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
                            setLightboxUrls(imageUrls.map((img: string) => ({ src: img })));
                            setOpenLightbox(true);
                        }}
                    />
                </div>
                :
                <div
                    style={{ height: 40, width: 40 }}
                >
                </div>
        );
    };

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            header={header}
            body={imageBodyTemplate}
            // className="text-sm"
            sortable={column.attrs.sortable}
            // filter={filterable}
            dataType={columnDataType}
            showFilterOperator={showFilterOperator}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );

};

export default SolidMediaMultipleColumn;