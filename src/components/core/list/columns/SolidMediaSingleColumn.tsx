"use client";
import { Column } from "primereact/column";
import { SolidListViewColumnParams } from '../SolidListViewColumn';

const SolidMediaSingleColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
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
            className="text-sm"
            sortable={column.attrs.sortable}
            filter={filterable}
            dataType={columnDataType}
            showFilterOperator={showFilterOperator}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );

};

export default SolidMediaSingleColumn;