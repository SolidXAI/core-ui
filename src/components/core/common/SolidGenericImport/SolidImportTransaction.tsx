
import { CircleX, MoveRight } from 'lucide-react'
import styles from './SolidImport.module.css'
import { useCreateImportSyncMutation, useLazyGetImportMappingInfoQuery, usePatchUpdateImportTransactionMutation } from '../../../../redux/api/importTransactionApi';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../../redux/features/toastSlice';
import { ERROR_MESSAGES } from '../../../../constants/error-messages';
import { SolidButton, SolidSelect, SolidSpinner } from '../../../shad-cn-ui';
export const SolidImportTransaction = ({ setImportStatusResult, transactionId, setImportStep }: any) => {
    const dispatch = useDispatch();
    const [trigger, { data: mappingInfo, isLoading }] = useLazyGetImportMappingInfoQuery();
    const [patchUpdateImportTransaction] = usePatchUpdateImportTransactionMutation();
    const [createImportSync, { isLoading: isImporting }] = useCreateImportSyncMutation();
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [visibleHeaders, setVisibleHeaders] = useState<string[]>([]);

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


    const dropdownOptions = (mappingInfo?.data?.importableFields ?? []).map((field: any) => ({
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

                    if (importResult?.data?.status === "import_succeeded") {
                        setImportStatusResult(importResult)
                        setImportStep(4);
                    }
                    if (importResult?.data?.status === "import_failed") {
                        setImportStatusResult(importResult);
                        setImportStep(4);
                    }
                } catch (importError: any) {
                    dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.IMPORT_ERROR, detail: importError?.data?.error }));
                }

                // Async
            }
        } catch (error: any) {
            const errorMessage = error?.data?.error || ERROR_MESSAGES.SOMETHING_WRONG;
            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.ERROR, detail: errorMessage }));
        }
    };

    const sampleRecords = mappingInfo?.data?.sampleImportedRecordInfo ?? [];
    const visibleSampleRecords = sampleRecords?.filter((sample: any) => visibleHeaders.includes(sample.cellHeader));

    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                {isLoading ? (
                    <div className="solid-import-loading-state">
                        <SolidSpinner size={22} label="Loading mapping info" />
                    </div>
                ) : visibleSampleRecords.length > 0 ? (
                    <div className='solid-import-mapping-shell'>
                        <div className="solid-import-mapping-intro">
                            <div>
                                <h5 className='solid-primary-black-text solid-import-section-title'>Map file columns</h5>
                                <p className='solid-import-section-copy m-0'>Match each incoming column to the correct SolidX field before the import runs.</p>
                            </div>
                            <div className="solid-import-mapping-count">
                                {visibleSampleRecords.length} column{visibleSampleRecords.length > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className='solid-import-mapping-table'>
                            <div className={`solid-import-mapping-head ${styles.ImportTableHeader}`}>
                                <div className="solid-import-mapping-head-cell">File Column</div>
                                <div className="solid-import-mapping-head-cell">SolidX Field</div>
                            </div>
                            <div className="solid-import-mapping-body">
                                {visibleSampleRecords.map((sample: any) => {
                                    const fieldMeta = mappingInfo.data.importableFields.find(
                                        (f: any) => f.name === fieldMapping[sample.cellHeader]
                                    );
                                    const isRequired = fieldMeta?.required;

                                    return (
                                        <div key={sample.cellHeader} className="solid-import-mapping-row">
                                            <div className="solid-import-mapping-source">
                                                <div className="solid-import-mapping-source-title">{sample.cellHeader}</div>
                                                <div className="solid-import-mapping-source-value">{sample.cellValue || "No sample value"}</div>
                                            </div>
                                            <div className="solid-import-mapping-target">
                                                <div className="solid-import-mapping-target-controls">
                                                    <SolidSelect
                                                        value={fieldMapping[sample.cellHeader]}
                                                        options={dropdownOptions}
                                                        onChange={(e) => handleChange(sample.cellHeader, e.value)}
                                                        className="w-full"
                                                        placeholder="Select field"
                                                    />
                                                    {!isRequired ? (
                                                        <button
                                                            type="button"
                                                            className="solid-import-mapping-remove"
                                                            onClick={() => handleRemoveRow(sample.cellHeader)}
                                                            title="Remove this row"
                                                        >
                                                            <CircleX size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="solid-import-mapping-remove-placeholder" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='solid-import-empty-state'>
                        <h4 className='text-center px-2'>No sample import records found</h4>
                        <p>Upload a file first and then continue to mapping.</p>
                    </div>
                )}
            </div>
            <div className='solid-import-actions'>
                <p className="solid-import-actions-copy">Confirm the mapping and start the import.</p>
                <SolidButton
                    type="button"
                    size='small'
                    onClick={handleImportTransaction}
                    loading={isImporting}
                    disabled={isImporting || mappingInfo?.data?.sampleImportedRecordInfo?.length === 0}
                    rightIcon={<MoveRight size={14} />}
                >
                    Import
                </SolidButton>
            </div>
        </div>
    )
}
