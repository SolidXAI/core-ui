"use client"
import { Button } from 'primereact/button'
import styles from './SolidImport.module.css'
import { useCreateImportSyncMutation, useLazyGetImportMappingInfoQuery } from '@/redux/api/importTransactionApi';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

export const SolidImportTransaction = ({ setImportTransactionContext, transactionId }: any) => {
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
    const [createImportSync, { isLoading: isImporting }] = useCreateImportSyncMutation();

    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

    useEffect(() => {
        if (transactionId) {
            trigger({ id: transactionId });
        }
    }, [transactionId]);

    useEffect(() => {
        const defaultMapping: Record<string, string> = {};
        mappingInfo?.data?.importableFields.forEach((field: any) => {
            defaultMapping[field.name] = field.name;
        });
        setFieldMapping(defaultMapping);
    }, [mappingInfo?.data?.importableFields]);

    const dropdownOptions = mappingInfo?.data?.importableFields.map((field: any) => ({
        label: field.displayName,
        value: field.name,
    }));

    const handleChange = (fileField: string, selectedField: string) => {
        setFieldMapping((prev) => ({
            ...prev,
            [fileField]: selectedField,
        }));
    };

    const handleImportTransaction = async () => {
        try {
            const result = await createImportSync({
                id: transactionId
            }).unwrap();
            if (result?.statusCode) {
                showToast("success", "Import", "File Import Successfully");
            } else {
                showToast("error", "Failed", "Failed to Import file")
            }
        } catch (error) {
            showToast("error", "Failed", "Something went wrong")
        }
    };

    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                <div className='grid m-0' style={{ height: '100%', overflowY: 'auto' }}>
                    <div className="col-6 font-bold p-3 relative" style={{ background: 'var(--gray-100)', borderBottom: '1px solid var(--primary-light-color)' }}>
                        File Column
                        <div className={styles.TransactionsHeaderDivider}></div>
                    </div>
                    <div className="col-6 font-bold p-3" style={{ background: 'var(--gray-100)', borderBottom: '1px solid var(--primary-light-color)' }}>
                        SolidX Field
                    </div>
                    {mappingInfo?.data?.importableFields.map((field: any) => (
                        <React.Fragment key={field.name}>
                            <div className="col-6 py-2 px-3 flex flex-column justify-content-center" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                <div className="font-medium text-primary">{field.displayName}</div>
                                <div className="text-sm" style={{ color: 'var(--solid-grey-500)' }}>{field.name}</div>
                            </div>
                            <div className="col-6 py-2 px-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                <Dropdown
                                    value={fieldMapping[field.name]}
                                    options={dropdownOptions}
                                    onChange={(e) => handleChange(field.name, e.value)}
                                    className='w-full p-inputtext-sm'
                                    placeholder="Select field"
                                />
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div className='mt-3 flex align-items-center gap-3'>
                <Button
                    label='Import'
                    size='small'
                    onClick={handleImportTransaction}
                    loading={isImporting}
                    disabled={isImporting}
                />
                <Button label='Cancel' size='small' outlined onClick={() => setImportTransactionContext(false)} />
            </div>
        </div>
    )
}