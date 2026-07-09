import { AlertTriangle, CircleX, MoveRight } from 'lucide-react'
import styles from './SolidImport.module.css'
import { useCreateImportSyncMutation, useLazyGetImportMappingInfoQuery, usePatchUpdateImportTransactionMutation } from '../../../../redux/api/importTransactionApi';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../../redux/features/toastSlice';
import { ERROR_MESSAGES } from '../../../../constants/error-messages';
import { SolidButton, SolidSelect, SolidSpinner } from '../../../shad-cn-ui';


const getImportMessage = (value: unknown, fallback: string): string => {
    if (Array.isArray(value)) {
        const normalized: string[] = value.map((item) => getImportMessage(item, "")).filter((item) => item.trim() !== "");
        return normalized.length > 0 ? normalized.join(", ") : fallback;
    }

    if (value && typeof value === "object") {
        const errorValue = (value as any).error ?? (value as any).message ?? (value as any).detail;
        if (errorValue !== undefined) {
            return getImportMessage(errorValue, fallback);
        }

        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    }

    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
};

const getSampleCellPreview = (value: unknown): string => {
    if (value === undefined || value === null || value === "") {
        return ERROR_MESSAGES.IMPORT_NO_SAMPLE_VALUE;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
        return String(value);
    }

    if (Array.isArray(value)) {
        const normalized: string[] = value
            .map((item) => getSampleCellPreview(item))
            .filter((item) => item !== ERROR_MESSAGES.IMPORT_NO_SAMPLE_VALUE);
        return normalized.length > 0 ? normalized.join(", ") : ERROR_MESSAGES.IMPORT_NO_SAMPLE_VALUE;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === "object") {
        if ("result" in (value as any) && (value as any).result !== undefined && (value as any).result !== null) {
            return getSampleCellPreview((value as any).result);
        }

        if ("value" in (value as any) && (value as any).value !== undefined && (value as any).value !== null) {
            return getSampleCellPreview((value as any).value);
        }

        if ("label" in (value as any) && typeof (value as any).label === "string") {
            return (value as any).label;
        }

        if ("formula" in (value as any) && typeof (value as any).formula === "string") {
            return (value as any).formula;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return ERROR_MESSAGES.IMPORT_UNSUPPORTED_SAMPLE_VALUE;
        }
    }

    return String(value);
};

export const SolidImportTransaction = ({ setImportStatusResult, transactionId, setImportStep }: any) => {
    const dispatch = useDispatch();
    const [trigger, { data: mappingInfo, isLoading, isError: isMappingInfoError, error: mappingInfoError }] = useLazyGetImportMappingInfoQuery();
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

    const importableFields = mappingInfo?.data?.importableFields ?? [];
    const dropdownOptions = importableFields.map((field: any) => ({
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

    const visibleMappingEntries = Object.entries(fieldMapping).filter(([header]) => visibleHeaders.includes(header));
    const mappedEntries = visibleMappingEntries.filter(([, fieldName]) => typeof fieldName === "string" && fieldName.trim() !== "");
    const mappedFieldCounts = mappedEntries.reduce<Record<string, number>>((acc, [, fieldName]) => {
        const normalizedFieldName = fieldName.trim();
        acc[normalizedFieldName] = (acc[normalizedFieldName] ?? 0) + 1;
        return acc;
    }, {});
    const duplicateMappedFieldNames = Object.entries(mappedFieldCounts)
        .filter(([, count]) => count > 1)
        .map(([fieldName]) => fieldName);
    const requiredImportableFields = importableFields.filter((field: any) => field.required);
    const missingRequiredFields = requiredImportableFields.filter(
        (field: any) => !mappedFieldCounts[field.name]
    );
    const totalImportableFieldCount = importableFields.length;
    const mappedImportableFieldCount = Object.keys(mappedFieldCounts).length;
    const unmappedImportableFieldCount = Math.max(totalImportableFieldCount - mappedImportableFieldCount, 0);

    const handleImportTransaction = async () => {
        if (mappedEntries.length === 0) {
            dispatch(showToast({
                severity: "error",
                summary: ERROR_MESSAGES.IMPORT_ERROR,
                detail: ERROR_MESSAGES.IMPORT_NO_MATCHED_COLUMNS,
            }));
            return;
        }

        if (duplicateMappedFieldNames.length > 0) {
            dispatch(showToast({
                severity: "error",
                summary: ERROR_MESSAGES.IMPORT_ERROR,
                detail: ERROR_MESSAGES.IMPORT_DUPLICATE_FIELD_MAPPING,
            }));
            return;
        }

        if (missingRequiredFields.length > 0) {
            const errorDetail = ERROR_MESSAGES.IMPORT_REQUIRED_FIELD_MAPPING_MESSAGE(missingRequiredFields.length);
            dispatch(showToast({
                severity: "error",
                summary: ERROR_MESSAGES.IMPORT_ERROR,
                detail: errorDetail,
            }));
            return;
        }

        if (unmappedImportableFieldCount > 0) {
            const errorDetail = ERROR_MESSAGES.IMPORT_MAPPING_INCOMPLETE_MESSAGE(unmappedImportableFieldCount);
            dispatch(showToast({
                severity: "error",
                summary: ERROR_MESSAGES.IMPORT_ERROR,
                detail: errorDetail,
            }));
            return;
        }

        try {
            const mappingArray = mappedEntries.map(([header, fieldName]) => ({
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
    const autoMappedCount = sampleRecords.filter((sample: any) =>
        typeof sample?.defaultMappedFieldName === "string" && sample.defaultMappedFieldName.trim() !== ""
    ).length;

    let mappingWarningMessage: string | null = null;
    let mappingWarningTitle: string | null = null;

    if (visibleSampleRecords.length > 0) {
        if (duplicateMappedFieldNames.length > 0) {
            mappingWarningTitle = ERROR_MESSAGES.IMPORT_MAPPING_INCOMPLETE_TITLE;
            mappingWarningMessage = ERROR_MESSAGES.IMPORT_DUPLICATE_FIELD_MAPPING;
        } else if (missingRequiredFields.length > 0) {
            mappingWarningTitle = ERROR_MESSAGES.IMPORT_REQUIRED_FIELD_MAPPING_TITLE;
            mappingWarningMessage = ERROR_MESSAGES.IMPORT_REQUIRED_FIELD_MAPPING_MESSAGE(missingRequiredFields.length);
        } else if (autoMappedCount === 0 && mappedImportableFieldCount === 0) {
            mappingWarningTitle = ERROR_MESSAGES.IMPORT_TEMPLATE_MISMATCH_TITLE;
            mappingWarningMessage = ERROR_MESSAGES.IMPORT_TEMPLATE_MISMATCH_MESSAGE;
        } else if (unmappedImportableFieldCount > 0) {
            mappingWarningTitle = ERROR_MESSAGES.IMPORT_MAPPING_INCOMPLETE_TITLE;
            mappingWarningMessage = ERROR_MESSAGES.IMPORT_MAPPING_INCOMPLETE_MESSAGE(unmappedImportableFieldCount);
        }
    }

    const mappingErrorMessage = getImportMessage(
        (mappingInfoError as any)?.data?.error ?? (mappingInfoError as any)?.data?.message,
        ERROR_MESSAGES.IMPORT_FILE_READ_FAILED
    );
    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                {isLoading ? (
                    <div className="solid-import-loading-state">
                        <SolidSpinner size={22} label="Loading mapping info" />
                    </div>
                ) : isMappingInfoError ? (
                    <div className='solid-import-empty-state solid-import-empty-state-danger'>
                        <h4 className='text-center px-2'>{ERROR_MESSAGES.IMPORT_UNABLE_TO_READ_FILE}</h4>
                        <p>{mappingErrorMessage}</p>
                    </div>
                ) : visibleSampleRecords.length > 0 ? (
                    <div className='solid-import-mapping-shell'>
                        <div className="solid-import-mapping-intro">
                            <div>
                                <h5 className='solid-primary-black-text solid-import-section-title'>Map file columns</h5>
                                <p className='solid-import-section-copy m-0'>Match each incoming column to the correct SolidX field before the import runs.</p>
                            </div>
                            <div className="solid-import-mapping-count">
                                {totalImportableFieldCount} importable field{totalImportableFieldCount > 1 ? 's' : ''}
                            </div>
                        </div>
                        {mappingWarningMessage ? (
                            <div className="solid-import-mapping-alert" role="alert">
                                <div className="solid-import-mapping-alert-icon">
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="solid-import-mapping-alert-copy">
                                    {mappingWarningTitle ? (
                                        <p className="solid-import-mapping-alert-title">{mappingWarningTitle}</p>
                                    ) : null}
                                    <p className="solid-import-mapping-alert-text">{mappingWarningMessage}</p>
                                </div>
                            </div>
                        ) : null}
                        <div className='solid-import-mapping-table'>
                            <div className={`solid-import-mapping-head ${styles.ImportTableHeader}`}>
                                <div className="solid-import-mapping-head-cell">File Column</div>
                                <div className="solid-import-mapping-head-cell">SolidX Field</div>
                            </div>
                            <div className="solid-import-mapping-body">
                                {visibleSampleRecords.map((sample: any) => {
                                    const fieldMeta = importableFields.find(
                                        (f: any) => f.name === fieldMapping[sample.cellHeader]
                                    );
                                    const isRequired = fieldMeta?.required;
                                    const samplePreview = getSampleCellPreview(sample.cellValue);

                                    return (
                                        <div key={sample.cellHeader} className="solid-import-mapping-row">
                                            <div className="solid-import-mapping-source">
                                                <div className="solid-import-mapping-source-title">{sample.cellHeader}</div>
                                                <div className="solid-import-mapping-source-value" title={samplePreview}>{samplePreview}</div>
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
                    disabled={isImporting || isMappingInfoError || mappingInfo?.data?.sampleImportedRecordInfo?.length === 0}
                    rightIcon={<MoveRight size={14} />}
                >
                    Import
                </SolidButton>
            </div>
        </div>
    )
}
