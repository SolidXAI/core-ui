'use client';
import React from 'react';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { FormEvent } from "primereact/ts-helpers";
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';

const SolidMediaSingleColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
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
                <img
                    src={imageUrls[0]}
                    alt="product-image-single"
                    className="shadow-2 border-round"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                    onClick={(event) => {
                        event.stopPropagation();
                        setLightboxUrls([{ src: imageUrls[0], downloadUrl: imageUrls[0] }]);
                        setOpenLightbox(true);
                    }}
                />
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

export default SolidMediaSingleColumn;