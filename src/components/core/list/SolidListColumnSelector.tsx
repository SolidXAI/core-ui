"use client"
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import React, { useEffect, useRef, useState } from 'react'
import qs from "qs";
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';
import { Toast } from "primereact/toast";

interface FieldMetadata {
    displayName: string;
}

interface FilterColumns {
    name: string;
    key: string;
}

export const SolidListColumnSelector = ({ listViewMetaData }: any) => {
    const toast = useRef<Toast>(null);

    const entityApi = createSolidEntityApi('userViewMetadata');
    const {
        useUpsertSolidEntityMutation
    } = entityApi;

    const [upsertUserView, { isLoading, error: viewCreateError, isSuccess, data: data }] = useUpsertSolidEntityMutation();
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    if (!listViewMetaData) {
        return;
    }
    if (!listViewMetaData.data) {
        return;
    }

    const solidView = listViewMetaData?.data?.solidView;

    // This is a key value map of field name vs field metadata.
    const solidFieldsMetadata = listViewMetaData?.data?.solidFieldsMetadata as Record<string, FieldMetadata>;


    if (!solidView || !solidFieldsMetadata) {
        return;
    }

    const checkedFieldNames = new Set(solidView.layout.children.map((col: { attrs: { name: string } }) => col.attrs.name));

    const solidListColumns: FilterColumns[] = Object.entries(solidFieldsMetadata).map(([key, field]) => ({
        name: field.displayName,
        key,
    }));

    const formik = useFormik({
        initialValues: {
            selectedColumns: solidListColumns.filter(col => checkedFieldNames.has(col.key)),
        },
        onSubmit: async (values) => {
            const selectedKeys = values.selectedColumns.map(col => col.key);

            // Step 1: Extract current children
            const currentChildren = solidView.layout.children;

            // Step 2: Create a map of all available metadata
            const allFieldMeta = solidFieldsMetadata;

            // Step 3: Filter children to include only selected keys
            const newChildren = selectedKeys.map((key) => {
                const existingChild = currentChildren.find((child: any) => child.attrs.name === key);
                if (existingChild) {
                    return existingChild; // keep original config
                } else {
                    // construct a new one if it wasn't in the original
                    return {
                        type: 'field',
                        attrs: {
                            name: key,
                            label: allFieldMeta[key]?.displayName || key,
                            sortable: true,
                            filterable: true,
                        }
                    };
                }
            });

            // Now build updated solidView
            const updatedView = {
                layout: {
                    ...solidView.layout,
                    children: newChildren
                }
            };

            try {
                if (listViewMetaData?.data?.solidView?.id) {
                    // Update existing user view
                    const response = await upsertUserView({
                        viewMetadataId: listViewMetaData?.data?.solidView?.id,
                        layout: JSON.stringify(updatedView.layout),
                    }).unwrap();
                    if (response.statusCode === 200) {
                        showToast("success", "Layout", "Form Layout Updated successfully!");
                        window.location.reload();
                    }
                    console.log("Successfully updated:", response);
                } else {
                    // Create new user view
                    console.log("Error:");
                }
            } catch (error) {
                console.error("Error updating user view:", error);
            }

            console.log("Updated solidView", updatedView);

        },
    });

    return (
        <>
            <Toast ref={toast} />
            <form onSubmit={formik.handleSubmit} className="flex flex-column gap-1 p-1">
                <div className="flex flex-column gap-3 px-3 cogwheel-column-filter" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {solidListColumns.map((column) => {
                        return (
                            <div key={column.key} className="flex align-items-center gap-1">
                                <Checkbox
                                    inputId={column.key}
                                    name="selectedColumns"
                                    value={column}
                                    onChange={(e) => {
                                        const isChecked = formik.values.selectedColumns.some(item => item.key === column.key);
                                        formik.setFieldValue(
                                            "selectedColumns",
                                            isChecked
                                                ? formik.values.selectedColumns.filter(item => item.key !== column.key)
                                                : [...formik.values.selectedColumns, column]
                                        );
                                    }}
                                    checked={formik.values.selectedColumns.some(item => item.key === column.key)}
                                    className="text-base"
                                />
                                <label htmlFor={column.key} className="ml-2 text-base">
                                    {column.name}
                                </label>
                            </div>
                        );
                    })}
                </div>
                <div className="p-3 flex gap-2">
                    <Button type='submit' label="Apply" size="small" />
                    <Button type='button' outlined label="Cancel" size="small"
                        // @ts-ignore
                        onClick={(e) => op.current.hide(e)}
                    />
                </div>
            </form>
        </>
    )
}