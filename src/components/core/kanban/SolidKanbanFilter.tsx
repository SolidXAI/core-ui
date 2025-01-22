"use client";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { SolidKanbanViewSearchColumn } from "./SolidKanbanViewSearchColumn";


export const SolidKanbanFilter = ({ solidKanbanViewMetaData, handleApplyFilter, filterValues, setFilterValues }: any) => {

    const [fieldsList, setFieldsList] = useState<any[]>([]);


    useEffect(() => {
        if (solidKanbanViewMetaData) {
            const arrayOfFields = Object.entries(solidKanbanViewMetaData.data.solidFieldsMetadata).map(([key, value]) => {
                return { label: key, value: key }
            })
            setFieldsList(arrayOfFields);
        }
    }, [solidKanbanViewMetaData])

    const addEnumValue = () => {
        setFilterValues([...filterValues, { field: '', operator: '', value: '' }]);
    };

    const updateEnumValues = (index: number, field: keyof { field: string; operator: string; value: string }, value: string) => {
        const updatedSpecification = filterValues.map((filterValue: any, i: number) =>
            i === index ? { ...filterValue, [field]: value } : filterValue
        );
        setFilterValues(updatedSpecification);
    };


    const deleteEnumValue = (index: number) => {
        if (filterValues.length > 1) {
            const updatedRows = filterValues.filter((_: any, rowIndex: number) => rowIndex !== index);
            setFilterValues(updatedRows)
        } else {
        }
    };


    return (
        <div className="grid formgrid">
            <div className="col-12">
                <div className="flex flex-column gap-2">
                    {filterValues && filterValues.map((filterValue: any, index: number) => (
                        <div key={index} className="flex align-items-center gap-2">
                            {/* <InputText
                                value={filterValue.field}
                                onChange={(e) => updateEnumValues(index, 'field', e.target.value)}
                                placeholder="Enter Display"
                                className="p-inputtext-sm small-input w-full"
                            // onBlur={(e: any) => handleBlurAndUpdateState(e, formik.setFieldValue, formik.values, formik)}
                            /> */}
                            <Dropdown
                                value={filterValue.field}
                                onChange={e => {
                                    console.log("e.value", e.value);

                                    // setFieldName({ name: e.value.name, type: e.value.type })
                                    // onChange(rule.id, 'fieldName', e.value.name)
                                    updateEnumValues(index, 'field', e.value)
                                }}
                                options={fieldsList}
                                optionLabel='label'
                                optionValue='value'
                                placeholder="Select Field" className="w-full md:w-14rem" />
                            {/* <InputText
                                value={filterValue.value}
                                onChange={(e) => updateEnumValues(index, 'value', e.target.value)}
                                placeholder="Enter Value"
                                className="p-inputtext-sm small-input w-full"
                            // onBlur={(e: any) => handleBlurAndUpdateState(e, formik.setFieldValue, formik.values, formik)}
                            /> */}
                            <SolidKanbanViewSearchColumn solidKanbanViewMetaData={solidKanbanViewMetaData} fieldMetadata={solidKanbanViewMetaData.data.solidFieldsMetadata[filterValue.field]} updateEnumValues={updateEnumValues} index={index} enumValue={filterValue}></SolidKanbanViewSearchColumn>
                            <Button
                                icon="pi pi-plus"
                                size="small"
                                className="small-button"
                                onClick={addEnumValue}
                                type="button"
                            />
                            {/* Trash Button to delete the row */}
                            <Button
                                icon="pi pi-trash"
                                size="small"
                                className="small-button"
                                onClick={() => deleteEnumValue(index)}
                                outlined
                                severity="danger"
                                type="button"
                            />
                        </div>
                    ))}

                    <Button onClick={() => handleApplyFilter(filterValues)}>Apply</Button>

                </div>

            </div>
        </div>
    )

}