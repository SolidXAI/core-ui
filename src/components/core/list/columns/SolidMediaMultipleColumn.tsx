'use client';
import React from 'react';
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { Button } from 'primereact/button';
import { SolidMediaListFieldWidgetProps } from '@/types/solid-core';
import { getExtensionComponent } from '@/helpers/registry';

const SolidMediaMultipleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    // const filterable = column.attrs.filterable;
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
            }
            }            // className="text-sm"
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



export const DefaultMediaMultipleListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidMediaListFieldWidgetProps) => {
    if (!rowData?._media?.[fieldMetadata.name]) return null;

    const imageUrls = rowData._media[fieldMetadata.name].map((i: any) => i._full_url);

    return (
        imageUrls.length > 0 ?
            <div className='flex gap-2 align-items-end'>
                <img
                    src={imageUrls[0]}
                    alt={`image-multiple`}
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