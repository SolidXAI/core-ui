'use client';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { Dropdown } from 'primereact/dropdown';
import { SolidListViewColumnParams } from '../SolidListViewColumn';

const SolidBooleanColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'boolean';

    const booleanOptions = [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
    ];



    // Custom filter template for Boolean column
    const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown
                value={options.value}
                options={booleanOptions}
                onChange={(e) => options.filterCallback(e.value)}
                placeholder="Select"
                className="p-column-filter"
            />
        );
    };

    // Custom body template for Boolean column
    const bodyTemplate = (rowData: any) => {
        return rowData.isActive ? 'Yes' : 'No';
    };

    const header = column.attrs.label ?? fieldMetadata.displayName;


    // TODO: filterTemplate, bodyTemplate & filterMatchModeOptions to be provided.

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
            // filterMatchModeOptions={filterMatchModeOptions}
            filterElement={filterTemplate}
            body={bodyTemplate}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            style={{ minWidth: "12rem" }}
            headerClassName="table-header-fs"
        ></Column>
    );
};

export default SolidBooleanColumn;