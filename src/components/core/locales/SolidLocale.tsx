
import React, { useEffect, useMemo, useState } from 'react';
import { SolidSelect } from "../../shad-cn-ui";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import qs from "qs";
import "./solid-locale.css";

const SolidLocale = ({ solidFormViewMetaData, id, selectedLocale, setSelectedLocale, viewMode, createMode, handleLocaleChangeRedirect,
    applicableLocales, defaultEntityLocaleId, solidFormViewData, published, workflowStatusLabel }: { solidFormViewMetaData: any, id: string, selectedLocale: any, setSelectedLocale: any, viewMode: string, createMode: boolean, handleLocaleChangeRedirect: any, applicableLocales: any, defaultEntityLocaleId: string | null, solidFormViewData: any, published: string | null, workflowStatusLabel?: string | null }) => {
    const [localeOptions, setLocaleOptions] = useState([]);
    const [defautlLocale, setDefaultLocale] = useState('');
    const userApi = useMemo(() => createSolidEntityApi("user"), []);
    const { useGetSolidEntitiesQuery: useGetUsersQuery } = userApi;

    useEffect(() => {
        if (!applicableLocales) return;
        // Set dropdown options
        const localeOptions = applicableLocales.map((x: any) => ({
            label: x.displayName,
            value: x.locale,
        }));
        setLocaleOptions(localeOptions);

        if (createMode) {
            const defaultLocale = applicableLocales.find((x: any) => x.isDefault === 'yes');
            setSelectedLocale(defaultLocale?.locale || null);
            setDefaultLocale(defaultLocale?.displayName || '');
            return;
        }

        if (viewMode === 'edit' || viewMode === 'view') {
            const matchedLocale = applicableLocales.find(
                (x: any) => String(x.entityId) === String(id)
            );
            if (matchedLocale) {
                setSelectedLocale(matchedLocale.locale);
            }
        }
    }, [applicableLocales, id, viewMode, createMode]);

    const handleLocaleChange = (newLocale: string) => {
        if (newLocale === selectedLocale) return;
        setSelectedLocale(newLocale);
        const targetDefaultEntityLocaleId = id === 'new' ? defaultEntityLocaleId : defaultEntityLocaleId || id;
        handleLocaleChangeRedirect(newLocale, targetDefaultEntityLocaleId, viewMode);
    };

    // utils/formatDate.ts
    const formatToDDMMYYWithTime = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    const data = solidFormViewData?.data;
    const isDraftPublishWorkflowEnabled = Boolean(solidFormViewMetaData?.data?.solidView?.model?.draftPublishWorkflow);
    const isInternationalisationEnabled = Boolean(solidFormViewMetaData?.data?.solidView?.model?.internationalisation);
    const isPublished = isDraftPublishWorkflowEnabled && Boolean(data?.isPublished ?? published);
    const statusLabel = workflowStatusLabel || (isPublished ? 'Published' : 'Draft');
    const publishedBy = isDraftPublishWorkflowEnabled && isPublished && data?.publishedAt ? data?.updatedBy : null;
    const documentId = data?.initialEntityVersionId || data?.id;
    const defaultLocaleMeta = applicableLocales?.find((locale: any) => locale.isDefault === 'yes');
    const defaultLocaleLabel = defaultLocaleMeta?.displayName || defautlLocale || '-';
    const activeLocaleCode = selectedLocale || '-';

    const getUserId = (value: any) => {
        if (!value) return '-';
        if (typeof value === 'object') {
            return value.id;
        }
        return value;
    };

    const auditUserIds = useMemo(() => {
        return Array.from(new Set([data?.createdBy, data?.updatedBy, publishedBy]
            .map(getUserId)
            .filter((userId) => userId !== '-' && userId !== null && userId !== undefined)
            .map((userId) => Number(userId))
            .filter((userId) => !Number.isNaN(userId))));
    }, [data?.createdBy, data?.updatedBy, publishedBy]);

    const auditUsersQuery = useMemo(() => qs.stringify({
        limit: auditUserIds.length || 1,
        fields: ['id', 'fullName', 'username', 'email'],
        filters: {
            id: {
                $in: auditUserIds,
            },
        },
    }, { encodeValuesOnly: true }), [auditUserIds.join(',')]);

    const [auditUsersById, setAuditUsersById] = useState<Map<string, any>>(new Map());
    const { data: auditUsersData } = useGetUsersQuery(auditUsersQuery, {
        skip: auditUserIds.length === 0,
    });

    useEffect(() => {
        if (auditUserIds.length === 0) {
            setAuditUsersById(new Map());
            return;
        }

        const userMap = new Map<string, any>();
        (auditUsersData?.records || []).forEach((user: any) => {
            userMap.set(String(user.id), user);
        });
        setAuditUsersById(userMap);
    }, [auditUsersData, auditUserIds.length]);

    const getUserDisplay = (value: any) => {
        if (!value) return '-';
        if (typeof value === 'object') {
            return value.fullName || value.username || value.email || value.name || value.id || '-';
        }
        const user = auditUsersById.get(String(value));
        return user?.fullName || user?.username || user?.email || value;
    };

    const InfoRow = ({ label, value }: { label: string, value: any }) => (
        <div className='solid-locale-info-row'>
            <p className="text-sm m-0 solid-locale-info-label">{label}</p>
            <p className="text-sm m-0 solid-locale-info-value">{value || '-'}</p>
        </div>
    );

    const StatusPill = ({ value }: { value: string }) => (
        <span className={`solid-workflow-pill solid-workflow-pill--${value.toLowerCase()}`}>
            {value}
        </span>
    );

    return (
        <div className="flex flex-col p-0 m-0 solid-locale-stack">
            <div className="flex justify-end gap-4">
            </div>
            {isDraftPublishWorkflowEnabled && solidFormViewData && (viewMode === 'edit') &&
                (<div className={`w-full solid-locale-status-banner ${published !== null ? 'is-published' : 'is-unpublished'}`}>
                    {published !== null ? (
                        <li className="w-full text-left list-disc solid-locale-status-copy">
                            Editing <span className="font-bold">published version</span>
                        </li>
                    ) : (
                        <li className="w-full text-left list-disc solid-locale-status-copy">
                            Editing <span className="font-bold">unpublished version</span>
                        </li>
                    )}
                </div>
                )
            }
            <div className="solid-locale-info-card">
                <div className="solid-locale-info-card-header">
                    <h3 className="solid-locale-section-title p-0 m-0">Information</h3>
                    {isDraftPublishWorkflowEnabled && <StatusPill value={statusLabel} />}
                </div>
                <div className="solid-locale-info-grid">
                    <InfoRow label="Document ID" value={documentId ? `#${documentId}` : '-'} />
                    <InfoRow label="Created At" value={formatToDDMMYYWithTime(data?.createdAt)} />
                    <InfoRow label="Created By" value={getUserDisplay(data?.createdBy)} />
                    <InfoRow label="Updated At" value={formatToDDMMYYWithTime(data?.updatedAt)} />
                    <InfoRow label="Updated By" value={getUserDisplay(data?.updatedBy)} />
                    {isDraftPublishWorkflowEnabled && (
                        <>
                            <InfoRow label="Published At" value={formatToDDMMYYWithTime(data?.publishedAt ?? published ?? '')} />
                            <InfoRow label="Published By" value={getUserDisplay(publishedBy)} />
                        </>
                    )}
                </div>
            </div>
            {isInternationalisationEnabled &&
                <div className="solid-locale-info-card solid-locale-i18n-panel">
                    <div className="solid-locale-info-card-header">
                        <div>
                            <h3 className="solid-locale-section-title p-0 m-0">Internationalisation</h3>
                            <p className="solid-locale-i18n-subtitle m-0">{localeOptions.length || 0} locales</p>
                        </div>
                        <span className="solid-locale-i18n-code">{activeLocaleCode}</span>
                    </div>
                    <div className="solid-locale-i18n-body">
                        <div className="solid-locale-i18n-control">
                            <label className="solid-locale-i18n-label">Locale</label>
                            <SolidSelect
                                value={selectedLocale}
                                onChange={(e) => handleLocaleChange(e.value)}
                                options={localeOptions}
                                placeholder="Select locale"
                                className="w-full solid-locale-select"
                                disabled={createMode}
                            />
                        </div>
                        {createMode && (
                            <p className="solid-locale-helper-copy m-0">New records start in <b>{defaultLocaleLabel}</b>.</p>
                        )}
                    </div>
                </div>
            }
            {/* <p className="text-sm font-bold text-gray-500 px-2">Fill in form another locale</p> */}
        </div>
    );
};

export default SolidLocale;
