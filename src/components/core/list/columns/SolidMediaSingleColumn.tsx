'use client';
import React from 'react';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { SolidListViewColumnParams } from '../SolidListViewColumn';
import { FormEvent } from "primereact/ts-helpers";
import { FilterMatchMode } from 'primereact/api';

const SolidMediaSingleColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    // const filterable = column.attrs.filterable;

    const filterable = false;
    const showFilterOperator = false;
    const columnDataType = undefined;
    const header = column.attrs.label ?? fieldMetadata.displayName;

    const imageBodyTemplate = (product: any) => {
        if (!product?._media?.[fieldMetadata.name]) return null;

        const imageUrls = product._media[fieldMetadata.name].map((i: any) => i._full_url);

        return (
            <>
                {imageUrls.map((url: string, index: number) => (
                    <img
                        key={index}
                        src={url}
                        alt={`product-image-${index}`}
                        className="w-6rem shadow-2 border-round"
                    />
                ))}
            </>
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