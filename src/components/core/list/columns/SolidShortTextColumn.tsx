'use client';
import { FilterMatchMode } from 'primereact/api';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { FormEvent } from "primereact/ts-helpers";
import { getNumberOfInputs, SolidListViewColumnParams } from '../SolidListViewColumn';
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import SolidTableRowCell from '../SolidTableRowCell';

const SolidShortTextColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidListViewColumnParams) => {
    const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'Starts With', value: FilterMatchMode.STARTS_WITH },
        { label: 'Contains', value: FilterMatchMode.CONTAINS },
        { label: 'Not Contains', value: FilterMatchMode.NOT_CONTAINS },
        { label: 'Ends With', value: FilterMatchMode.ENDS_WITH },
        { label: 'Equals', value: FilterMatchMode.EQUALS },
        { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN }
    ];
    const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        const numberOfInputs = getNumberOfInputs(options.filterModel.matchMode);

        return (
            <SolidVarInputsFilterElement
                values={options.value}
                onChange={(e: FormEvent<HTMLInputElement>) => options.filterCallback(e, options.index)}
                numberOfInputs={numberOfInputs}
                inputType={InputTypes.Text}
                solidListViewMetaData={solidListViewMetaData}
                fieldMetadata={fieldMetadata}
                column={column}
            >
            </SolidVarInputsFilterElement >
        )
    };

    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter
    const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <Column
            key={fieldMetadata.name}
            field={fieldMetadata.name}
            // header={header}
            // className="text-sm"
            sortable={column.attrs.sortable}
            // filter={filterable}
            dataType={columnDataType}
            showFilterOperator={showFilterOperator}
            filterMatchModeOptions={filterMatchModeOptions}
            filterElement={filterTemplate}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            // style={{ minWidth: "12rem" }}
            // headerClassName="table-header-fs"
            header={() => {
                return (<div style={{ maxWidth: truncateAfter ? `${truncateAfter}ch` : '30ch', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{header}</div>)
            }}
            body={(rowData) => {
                const renderMode = column.attrs.renderMode || "text";
                const data = rowData;
              
                if (renderMode === "text") {
                    return <SolidTableRowCell
                        value={rowData[fieldMetadata.name]}
                        truncateAfter={truncateAfter}
                    />
                } else {
                    return (
                        <img
                        src={data[fieldMetadata.name]}
                        alt="product-image-single"
                        className="shadow-2 border-round"
                        width={40}
                        height={40}
                        style={{ objectFit: "cover" }}
                        onClick={(event) => {
                            event.stopPropagation();
                             setLightboxUrls([{ src: data[fieldMetadata.name], downloadUrl: data[fieldMetadata.name] }]);
                            setOpenLightbox(true);
                        }}
                    />
                    );
                }
            }}
        ></Column >
    );

};

export default SolidShortTextColumn;