"use client"
import { Button } from 'primereact/button'
import styles from './SolidImport.module.css'
import { useCreateImportSyncMutation, useLazyGetImportMappingInfoQuery, usePatchUpdateImportTransactionMutation } from '@/redux/api/importTransactionApi';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';

export const SolidImportTransaction = ({ setImportTransactionContext, transactionId, setOpenImportDialog }: any) => {
    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };
    const [trigger, { data: mappingInfo, isLoading, isError }] = useLazyGetImportMappingInfoQuery();
    const [patchUpdateImportTransaction] = usePatchUpdateImportTransactionMutation();
    const [createImportSync, { isLoading: isImporting }] = useCreateImportSyncMutation();
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [visibleHeaders, setVisibleHeaders] = useState<string[]>([]);
    const [showImportStatusDialog, setShowImportStatusDialog] = useState(false);
    const [importStatusResult, setImportStatusResult] = useState<any>(null)

    useEffect(() => {
        if (transactionId) {
            trigger({ id: transactionId });
        }
    }, [transactionId]);

    useEffect(() => {
        const defaultMapping: Record<string, string> = {};
        const headers: string[] = [];
        mappingInfo?.data?.sampleImportedRecordInfo?.forEach((sample: any) => {
            defaultMapping[sample.cellHeader] = sample.defaultMappedFieldName || "";
            headers.push(sample.cellHeader);
        });
        setFieldMapping(defaultMapping);
        setVisibleHeaders(headers);
    }, [mappingInfo?.data]);


    const dropdownOptions = mappingInfo?.data?.importableFields.map((field: any) => ({
        label: field.displayName,
        value: field.name,
    }));

    const handleChange = (cellHeader: string, selectedField: string) => {
        setFieldMapping((prev) => ({
            ...prev,
            [cellHeader]: selectedField,
        }));
    };

    const handleRemoveRow = (cellHeader: string) => {
        setVisibleHeaders((prev) => prev.filter(header => header !== cellHeader));
        setFieldMapping((prev) => {
            const updated = { ...prev };
            delete updated[cellHeader];
            return updated;
        });
    };

    const handleImportTransaction = async () => {
        try {
            const mappingArray = Object.entries(fieldMapping).map(([header, fieldName]) => ({
                header,
                fieldName,
            }));

            const patchData = {
                status: "mapping_created",
                mapping: JSON.stringify(mappingArray),
            };
            const patchResult = await patchUpdateImportTransaction({
                id: transactionId,
                data: patchData,
            }).unwrap();
            if (patchResult?.statusCode === 200) {

                // Sync
                try {
                    const importResult = await createImportSync({ id: transactionId }).unwrap();
                    if (importResult?.statusCode === 200) {
                        setImportStatusResult(importResult)
                        setShowImportStatusDialog(true);
                    } else {
                        showToast("error", "Failed", "Failed to Import Records");
                        setShowImportStatusDialog(true);
                    }
                } catch (importError: any) {
                    showToast("error", "Import Error", importError?.data?.error);
                }

                // Async
            }
        } catch (error: any) {
            const errorMessage = error?.data?.error || "Something went wrong while updating mapping";
            showToast("error", "Error", errorMessage);
        }
    };

    const handleSuccessSyncImport = () => {
        setShowImportStatusDialog(false);
        setOpenImportDialog(false);
        setTimeout(() => {
            window.location.reload();
        }, 300);
    }

    const sampleRecords = mappingInfo?.data?.sampleImportedRecordInfo ?? [];

    return (
        <div>
            <Toast ref={toast} />
            <div className={styles.SolidImportContextWrapper}>
                <div className='grid m-0 relative'>
                    <div className={`col-6 font-bold p-3 ${styles.ImportTableHeader}`}>
                        File Column
                        <div className={styles.TransactionsHeaderDivider}></div>
                    </div>
                    <div className={`col-6 font-bold p-3 ${styles.ImportTableHeader}`}>
                        SolidX Field
                    </div>
                    {sampleRecords.length > 0 ? (
                        sampleRecords
                            ?.filter((sample: any) => visibleHeaders.includes(sample.cellHeader))
                            .map((sample: any) => {
                                const fieldMeta = mappingInfo.data.importableFields.find(
                                    (f: any) => f.name === fieldMapping[sample.cellHeader]
                                );
                                const isRequired = fieldMeta?.required;
                                // {sampleRecords.length > 0 ? (
                                //    sampleRecords    
                                //     ?.filter((sample: any) => visibleHeaders.includes(sample.cellHeader))
                                //     ?.sort((a: any, b: any) => {
                                //         const aRequired = mappingInfo.data.importableFields.find((f: any) => f.name === fieldMapping[a.cellHeader])?.required;
                                //         const bRequired = mappingInfo.data.importableFields.find((f: any) => f.name === fieldMapping[b.cellHeader])?.required;
                                //         return (bRequired ? 1 : 0) - (aRequired ? 1 : 0); // true comes before false
                                //     })
                                //     .map((sample: any) => {
                                //         const fieldMeta = mappingInfo.data.importableFields.find(
                                //             (f: any) => f.name === fieldMapping[sample.cellHeader]
                                //         );
                                //         const isRequired = fieldMeta?.required;
                                return (
                                    <React.Fragment key={sample.cellHeader}>
                                        <div
                                            className="col-6 py-2 px-3 flex flex-column justify-content-center"
                                            style={{ borderBottom: "1px solid var(--gray-100)" }}
                                        >
                                            <div className="font-medium text-primary">{sample.cellHeader}</div>
                                            <div className="text-sm" style={{ color: "var(--solid-grey-500)" }}>
                                                {sample.cellValue || ""}
                                            </div>
                                        </div>
                                        <div className="col-6 py-2 px-3 flex align-items-center gap-2" style={{ borderBottom: "1px solid var(--gray-100)" }}>
                                            <Dropdown
                                                value={fieldMapping[sample.cellHeader]}
                                                options={dropdownOptions}
                                                onChange={(e) => handleChange(sample.cellHeader, e.value)}
                                                className="w-full p-inputtext-sm"
                                                placeholder="Select field"
                                            />
                                            {!isRequired ? (
                                                <span
                                                    onClick={() => handleRemoveRow(sample.cellHeader)}
                                                    title="Remove this row"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <rect width="16" height="16" rx="8" fill="#F0F0F0" />
                                                        <path d="M5.6 11L5 10.4L7.4 8L5 5.6L5.6 5L8 7.4L10.4 5L11 5.6L8.6 8L11 10.4L10.4 11L8 8.6L5.6 11Z" fill="#4B4D52" />
                                                    </svg>
                                                </span>
                                            )
                                                :
                                                <span style={{ height: 16, width: 16 }}></span>
                                            }
                                        </div>
                                    </React.Fragment>
                                );
                            })
                    ) : (
                        <div className='col-12 flex flex-column align-items-center'>
                            <h4>No Sample Imported Record Info Found</h4>
                            <p>Please Add Records</p>
                        </div>
                    )}
                </div>
            </div>
            <div className='mt-3 flex align-items-center gap-3'>
                <Button
                    label='Import'
                    size='small'
                    onClick={handleImportTransaction}
                    loading={isImporting}
                    disabled={isImporting || mappingInfo?.data?.sampleImportedRecordInfo?.length === 0}
                />
                <Button label='Cancel' size='small' outlined onClick={() => setImportTransactionContext(false)} />
            </div>
            <Dialog header="Import Status" headerClassName='px-3 py-2' contentClassName='p-0' visible={showImportStatusDialog} style={{ width: '30vw' }} onHide={() => { if (!showImportStatusDialog) return; setShowImportStatusDialog(false); }}>
                <Divider className='m-0' />
                <div className='flex flex-column align-items-center mt-3 px-3 pt-3 pb-4'>
                    <h2>Import Successfull</h2>
                    <p>{importStatusResult?.data?.importedIds.length} Records Imported</p>
                    <Button
                        label='Show Imported Records'
                        size='small'
                        onClick={() => handleSuccessSyncImport()}
                    />
                </div>
            </Dialog>
        </div>
    )
}