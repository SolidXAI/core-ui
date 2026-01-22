'use client';
import { FilterMatchMode } from 'primereact/api';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { FormEvent } from "primereact/ts-helpers";
import { getNumberOfInputs, SolidListViewColumnParams } from '../SolidListViewColumn';
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { SolidListFieldWidgetProps } from '@solid-ui/types/solid-core';
import { getExtensionComponent } from '@solid-ui/helpers/registry';
import SolidTableRowCell from '../SolidTableRowCell';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

export const dateFilterMatchModeOptions = [
    { label: 'Equals', value: FilterMatchMode.EQUALS },
    { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
    { label: 'Less Than', value: FilterMatchMode.LESS_THAN },
    { label: 'Less Than Or Equal', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO },
    { label: 'Greater Than', value: FilterMatchMode.GREATER_THAN },
    { label: 'Greater Than Or Equal', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    { label: 'In', value: FilterMatchMode.IN },
    { label: 'Not In', value: FilterMatchMode.NOT_IN },
    { label: 'Between', value: FilterMatchMode.BETWEEN }
];

const SolidDateColumn = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => {
    const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';
    const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        const numberOfInputs = getNumberOfInputs(options.filterModel.matchMode);

        return (
            <SolidVarInputsFilterElement
                values={options.value}
                onChange={(e: FormEvent<Date>) => options.filterCallback(e, options.index)}
                numberOfInputs={numberOfInputs}
                inputType={InputTypes.Date}
                solidListViewMetaData={solidListViewMetaData}
                fieldMetadata={fieldMetadata}
                column={column}
            >
            </SolidVarInputsFilterElement >
        )
    };

    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
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
            filterMatchModeOptions={dateFilterMatchModeOptions}
            filterElement={filterTemplate}
            filterPlaceholder={`Search by ${fieldMetadata.displayName}`}
            // style={{ minWidth: "12rem" }}
            // headerClassName="table-header-fs"
            header={() => {
                return (<div style={{ maxWidth: truncateAfter ? `${truncateAfter}ch` : '30ch', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{header}</div>)
            }}
            body={(rowData) => {
                let viewWidget = column.attrs.viewWidget;
                if (!viewWidget) {
                    viewWidget = 'DefaultDateListWidget';
                }
                let DynamicWidget = getExtensionComponent(viewWidget);
                const widgetProps: SolidListFieldWidgetProps = {
                    rowData,
                    solidListViewMetaData,
                    fieldMetadata,
                    column
                }
                return (
                    <>
                        {DynamicWidget && <DynamicWidget {...widgetProps} />}
                    </>
                )
            }
            }
        ></Column>
    );

};

export default SolidDateColumn;



export function parseIsoDate(value: string): Date | null {
    if (!value || typeof value !== "string") return null;

    // Fast reject (avoids false positives)
    if (!value.includes("T")) return null;

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}


export const DefaultDateListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const truncateAfter = solidListViewMetaData?.data?.solidView?.layout?.attrs?.truncateAfter;
    let displayValue = rowData[fieldMetadata.name];
    const parsedDate = parseIsoDate(displayValue);
    const solidSettingsData = useSelector((state: any) => state.settingsState?.solidSettings);

    if (parsedDate) {
        const format = column?.attrs?.format as string | undefined || solidSettingsData?.dateFormat;
        if (format) {
            displayValue = dayjs(parsedDate).format(format);
        }
        else {
            displayValue = parsedDate.toLocaleString();
        }
    }

    return (
        <SolidTableRowCell
            value={displayValue}
            truncateAfter={truncateAfter}
        />
    );
};
