import React, { useEffect, useMemo } from "react";
import qs from "qs";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { SolidButton } from "../../shad-cn-ui";

type SolidVersionHistoryProps = {
    params: {
        moduleName: string;
        modelName: string;
    };
    currentRecord: any;
    onRefresh?: () => void;
};

export const getWorkflowStatusLabel = (record: any) => {
    if (record?.isPublished) {
        return 'Published';
    }
    if (record?.publishedAt && record?.isLatest === false) {
        return 'Archived';
    }
    return 'Draft';
};

const getVersionStatusClassName = (record: any) => {
    const status = getWorkflowStatusLabel(record);
    if (status === 'Archived') return 'solid-version-status-pill--archived';
    if (status === 'Published') return 'solid-version-status-pill--published';
    return 'solid-version-status-pill--draft';
};

const formatVersionDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getUserDisplay = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'object') return value.fullName || value.name || value.id || '-';
    return value;
};

export const SolidVersionHistory = ({ params, currentRecord }: SolidVersionHistoryProps) => {
    const entityApi = useMemo(() => createSolidEntityApi(params.modelName), [params.modelName]);
    const { useLazyGetSolidEntitiesQuery } = entityApi;
    const [getVersions, { data, isLoading }] = useLazyGetSolidEntitiesQuery();
    const chainId = currentRecord?.initialEntityVersionId || currentRecord?.id;

    const fetchVersions = async () => {
        if (!chainId) return;
        const queryString = qs.stringify({
            filters: {
                $or: [
                    { initialEntityVersionId: { $eq: chainId } },
                    { id: { $eq: chainId } },
                ],
            },
            sort: ['createdAt:desc'],
            populate: ['createdBy', 'updatedBy'],
        }, { encodeValuesOnly: true });
        await getVersions(queryString);
    };

    useEffect(() => {
        fetchVersions();
    }, [chainId]);

    const openVersionInNewTab = (recordId: number | string) => {
        const versionUrl = `/admin/core/${params.moduleName}/${params.modelName}/form/${recordId}?viewMode=view`;
        window.open(versionUrl, '_blank', 'noopener,noreferrer');
    };

    const records = data?.records || [];
    const hasCopiedVersions = records.some((record: any) => String(record.id) !== String(chainId));
    const versionRecords = hasCopiedVersions ? records : [];

    if (!chainId) {
        return (
            <div className="p-3 text-sm text-color-secondary">
                Version history will be available after this record is saved.
            </div>
        );
    }

    return (
        <div className="w-full p-2">
            <div className="flex items-center justify-between gap-2 pb-2">
                <h3 className="m-0 text-base font-semibold">Version History</h3>
                <SolidButton
                    type="button"
                    size="sm"
                    variant="outline"
                    icon="si si-refresh"
                    onClick={fetchVersions}
                    loading={isLoading}
                />
            </div>
            <div className="overflow-x-auto rounded border border-[var(--surface-border)]">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--surface-ground)] text-left">
                        <tr>
                            <th className="p-2 font-semibold">Version</th>
                            <th className="p-2 font-semibold">Status</th>
                            <th className="p-2 font-semibold">Created</th>
                            <th className="p-2 font-semibold">Updated By</th>
                            <th className="p-2 font-semibold">Published</th>
                            <th className="p-2 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {versionRecords.length === 0 && (
                            <tr>
                                <td className="p-3 text-center text-color-secondary" colSpan={6}>
                                    {isLoading ? 'Loading versions...' : 'No versions found'}
                                </td>
                            </tr>
                        )}
                        {versionRecords.map((record: any) => (
                            <tr key={record.id} className="border-t border-[var(--surface-border)]">
                                <td className="p-2">#{record.id}{record.isLatest ? ' · Latest' : ''}</td>
                                <td className="p-2">
                                    <span className={`solid-version-status-pill ${getVersionStatusClassName(record)}`}>
                                        {getWorkflowStatusLabel(record)}
                                    </span>
                                </td>
                                <td className="p-2">
                                    <div>{formatVersionDate(record.createdAt)}</div>
                                    <div className="text-xs text-color-secondary">{getUserDisplay(record.createdBy)}</div>
                                </td>
                                <td className="p-2">{getUserDisplay(record.updatedBy)}</td>
                                <td className="p-2">{record.publishedAt ? formatVersionDate(record.publishedAt) : '-'}</td>
                                <td className="p-2 text-right">
                                    <SolidButton
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        icon="si si-eye"
                                        className="solid-icon-button"
                                        tooltip="Open version"
                                        aria-label="Open version"
                                        onClick={() => openVersionInNewTab(record.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
