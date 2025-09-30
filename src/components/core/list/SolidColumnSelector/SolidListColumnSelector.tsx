// @ts-nocheck
"use client"
import { useFormik } from 'formik';
import { Checkbox } from 'primereact/checkbox';
import React, { useRef, useState } from 'react'
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';
import { Toast } from "primereact/toast";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import styles from './SolidListColumnSelector.module.css'
import { ColumnDragActiveIcon } from './ColumnDragActiveIcon';
import { ColumnSelectorFooter } from './ColumnSelectorFooter';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { CustomizeAttributeActionButton } from './CustomizeAttributeActionButton';

interface FieldMetadata {
    displayName: string;
}

interface FilterColumns {
    name: string;
    key: string;
}

export const SolidListColumnSelector = ({ listViewMetaData, customizeLayout }: any) => {
    const toast = useRef<Toast>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [editingColumnKey, setEditingColumnKey] = useState<string | null>(null);
    const [columnJsonData, setColumnJsonData] = useState<Record<string, any>>({});

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

    const [fields, setFields] = useState<FilterColumns[]>(() => {
        const selectedOrder = solidView.layout.children.map((child: any) => child.attrs.name);

        const allColumns: FilterColumns[] = Object.entries(solidFieldsMetadata).map(([key, field]) => ({
            name: field.displayName,
            key,
        }));

        const selectedFields: FilterColumns[] = [];
        const remainingFields: FilterColumns[] = [];

        const usedKeys = new Set<string>();

        // First, add selected fields in the order of solidView
        for (const key of selectedOrder) {
            const column = allColumns.find(col => col.key === key);
            if (column) {
                selectedFields.push(column);
                usedKeys.add(key);
            }
        }

        // Then, add remaining fields that are not selected
        for (const col of allColumns) {
            if (!usedKeys.has(col.key)) {
                remainingFields.push(col);
            }
        }

        return [...selectedFields, ...remainingFields];
    });

    // Helper function to get column JSON
    const getColumnJson = (columnKey: string) => {
        // First check if we have existing data in columnJsonData
        if (columnJsonData[columnKey]) {
            return columnJsonData[columnKey];
        }

        // Otherwise, find it in the current children or create default
        const existingChild = solidView.layout.children.find((child: any) => child.attrs.name === columnKey);
        if (existingChild) {
            return existingChild.attrs;
        }

        // Create default structure
        const fieldMeta = solidFieldsMetadata[columnKey];

        return {
            name: columnKey,
            label: fieldMeta?.displayName || columnKey,
        };
    };


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
            const newChildren = fields
                .filter(col => selectedKeys.includes(col.key))
                .map(({ key }) => {
                    // Use the edited JSON data if available
                    if (columnJsonData[key]) {
                        return {
                            type: 'field',
                            attrs: columnJsonData[key]
                        };
                    }

                    const existingChild = currentChildren.find((child: any) => child.attrs.name === key);
                    if (existingChild) return existingChild;

                    return {
                        type: 'field',
                        attrs: {
                            name: key,
                            label: allFieldMeta[key]?.displayName || key,
                        },
                    };
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
                }
            } catch (error) {
                console.error("Error updating user view:", error);
            }
        },
    });

    const onDragEnd = (result: DropResult) => {
        setIsDragging(false);
        if (!result.destination) return;
        const reordered = [...fields];
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setFields(reordered);
    };

    const handleJsonChange = (columnKey: string, value: string) => {
        try {
            const parsed = JSON.parse(value);
            setColumnJsonData(prev => ({
                ...prev,
                [columnKey]: parsed
            }));
        } catch (error) {
            // Invalid JSON, don't update state
            console.error("Invalid JSON:", error);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <form onSubmit={formik.handleSubmit} className="flex flex-column gap-1 px-2">
                <DragDropContext onDragEnd={onDragEnd} onDragStart={() => setIsDragging(true)}>
                    <Droppable droppableId="columns">
                        {(provided): React.ReactElement => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`flex flex-column cogwheel-column-filter px-1 ${isDragging ? styles.SolidColumnDragContextActive : ''}`}
                                style={{ maxHeight: 400, overflowY: 'auto' }}
                            >
                                {fields.map((column, index) => (
                                    <Draggable key={column.key} draggableId={column.key} index={index}>
                                        {(provided, snapshot): React.ReactElement => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`px-3 py-2 ${snapshot.isDragging ? styles.SolidColumnDraggedActiveElement : ''}`}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                }}
                                            >
                                                <div className='flex align-items-center justify-content-between gap-3'>
                                                    <div className='flex align-items-center gap-1'>
                                                        <Checkbox
                                                            inputId={column.key}
                                                            name="selectedColumns"
                                                            value={column}
                                                            onChange={() => {
                                                                const isChecked = formik.values.selectedColumns.some(item => item.key === column.key);
                                                                formik.setFieldValue(
                                                                    "selectedColumns",
                                                                    isChecked
                                                                        ? formik.values.selectedColumns.filter(item => item.key !== column.key)
                                                                        : [...formik.values.selectedColumns, column]
                                                                );
                                                            }}
                                                            checked={formik.values.selectedColumns.some(item => item.key === column.key)}
                                                            className="text-base flex align-items-center"
                                                        />
                                                        <label htmlFor={column.key} className="ml-2 text-base">
                                                            {column.name}
                                                        </label>
                                                    </div>
                                                    <div className='flex gap-3'>
                                                        <ColumnDragActiveIcon active={snapshot.isDragging} />
                                                        {process.env.NEXT_PUBLIC_CUSTOMIZE_LIST_COLUMN_ATTRS === "true" && formik.values.selectedColumns.some(item => item.key === column.key) &&
                                                            <CustomizeAttributeActionButton
                                                                isActive={editingColumnKey === column.key}
                                                                onClick={() => setEditingColumnKey(editingColumnKey === column.key ? null : column.key)}
                                                            />
                                                        }
                                                    </div>
                                                </div>
                                                {editingColumnKey === column.key &&
                                                    <div className='mt-2 border-round-sm overflow-hidden'>
                                                        <CodeMirror
                                                            value={JSON.stringify(getColumnJson(column.key), null, 2)}
                                                            style={{ fontSize: '10px' }}
                                                            theme={oneDark}
                                                            extensions={[javascript(), EditorView.lineWrapping]}
                                                            onChange={(value) => handleJsonChange(column.key, value)}
                                                        />
                                                    </div>
                                                }
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <ColumnSelectorFooter customizeLayout={customizeLayout} />
            </form>
        </>
    )
}