import { closePopup } from "../../../../../../redux/features/popupSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { useApplyDeleteModelMutation, usePreviewDeleteModelMutation } from "../../../../../../redux/api/modelApi";
import { ERROR_MESSAGES } from "../../../../../../constants/error-messages";
import { SolidButton, SolidCheckbox, SolidSpinner } from "../../../../../shad-cn-ui";
import { pingBackendAvailability } from "../../../../../../helpers/waitForBackendAvailability";
import { backendHealthMonitor } from "../../../../../../helpers/backendHealthMonitor";
import { Check, Copy } from "lucide-react";

type DeleteChange = { category: string; description: string; count: number; items: string[] };
type DeletePreview = { model: { id: number; singularName: string; displayName: string }; planHash: string; changes: DeleteChange[] };

const displayInventoryItem = (item: string) => {
    if (!item.startsWith("/")) return item;
    const sourceIndex = item.lastIndexOf("/src/");
    if (sourceIndex >= 0) return item.slice(sourceIndex + 1);
    return item.split("/").slice(-2).join("/");
};

const DeleteModelRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
    const dispatch = useDispatch();
    const [preview, setPreview] = useState<DeletePreview | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [copiedDdl, setCopiedDdl] = useState(false);
    const [loadPreview, { isLoading: isLoadingPreview }] = usePreviewDeleteModelMutation();
    const [applyDelete, { isLoading: isApplying }] = useApplyDeleteModelMutation();

    const refreshPreview = async () => {
        setPreview(null);
        setPreviewError(null);
        setIsConfirmed(false);
        try {
            const result = await loadPreview(event.rowData.id).unwrap();
            setPreview(result as DeletePreview);
        } catch (error: any) {
            setPreviewError(error?.data?.message || error?.error || ERROR_MESSAGES.ERROR_OCCURED);
        }
    };

    useEffect(() => { void refreshPreview(); }, [event.rowData.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const automaticChanges = preview?.changes.filter(change => change.category !== 'Manual follow-up' && change.count > 0) ?? [];
    const automaticItemCount = automaticChanges.reduce((total, change) => total + change.count, 0);
    const manualFollowUp = preview?.changes.find(change => change.category === 'Manual follow-up');
    const tableName = manualFollowUp?.items[0]?.replace(/ database table$/, '') ?? '';
    const quotedTableName = tableName.split('.').map(part => `"${part.replace(/"/g, '""')}"`).join('.');
    const dropTableStatement = tableName ? `DROP TABLE IF EXISTS ${quotedTableName};` : '';

    const copyDropStatement = async () => {
        if (!dropTableStatement) return;
        try {
            await navigator.clipboard.writeText(dropTableStatement);
            setCopiedDdl(true);
            window.setTimeout(() => setCopiedDdl(false), 1800);
        } catch {
            setPreviewError('Unable to copy the DROP TABLE statement. Select and copy it manually.');
        }
    };

    const deleteModelHandler = async () => {
        if (!preview || !isConfirmed || isApplying) return;
        try {
            await applyDelete({ id: event.rowData.id, planHash: preview.planHash }).unwrap();
            dispatch(showToast({ severity: 'success', summary: ERROR_MESSAGES.MODEL_DELETE, detail: ERROR_MESSAGES.MODEL_DELETE_SUCCESSFULLY(event.rowData.singularName) }));
            dispatch(closePopup());
            const isBackendAvailable = await pingBackendAvailability();
            if (isBackendAvailable) backendHealthMonitor.reportSuccess();
            else backendHealthMonitor.reportFailure({ status: "FETCH_ERROR", message: "Unable to reach the server. Reconnecting..." });
        } catch (error: any) {
            const updatedPreview = error?.data?.preview as DeletePreview | undefined;
            if (updatedPreview) {
                setPreview(updatedPreview);
                setIsConfirmed(false);
                setPreviewError('The inventory changed since it was reviewed. Please review the updated changes and confirm again.');
            } else {
                setPreviewError(error?.data?.message || error?.error || ERROR_MESSAGES.NETWORK_OR_SERVER_ERROR);
            }
        }
    };

    return (
        <div className="solid-delete-model-popup">
            <div className="solid-filter-dialog-head solid-delete-model-popup__head">
                <div>
                    <h3 className="solid-filter-dialog-title">Delete {event.rowData.displayName || event.rowData.singularName}</h3>
                    <p className="solid-filter-dialog-subtitle m-0">Review the automatic cleanup before deleting this model.</p>
                </div>
            </div>
            <div className="solid-filter-dialog-sep" />
            <div className="solid-filter-dialog-body solid-delete-model-popup__body">
                {isLoadingPreview && <div className="flex justify-center p-4"><SolidSpinner /></div>}
                {previewError && <div role="alert" className="text-sm text-destructive mb-3">{previewError}</div>}
                {preview && (
                    <>
                    <div className="solid-delete-model-popup__summary" aria-label="Deletion impact summary">
                        <div><strong>{automaticItemCount}</strong><span>automatic changes</span></div>
                        <div><strong>{automaticChanges.length}</strong><span>areas affected</span></div>
                    </div>
                    <div className="solid-delete-model-popup__inventory" aria-label="Automatic deletion changes">
                        {automaticChanges.map((change, index) => (
                            <details className="solid-delete-model-popup__change" key={`${change.category}-${index}`}>
                                <summary>
                                    <span className="solid-delete-model-popup__change-name">{change.category}</span>
                                    <span className="solid-delete-model-popup__change-description">{change.description}</span>
                                    <span className="solid-delete-model-popup__count">{change.count}</span>
                                </summary>
                                {change.items.length > 0 && (
                                    <ul className="solid-delete-model-popup__items">
                                        {change.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} title={item}>{displayInventoryItem(item)}</li>)}
                                    </ul>
                                )}
                            </details>
                        ))}
                        {automaticChanges.length === 0 && <p className="solid-delete-model-popup__empty">No related automatic cleanup was found.</p>}
                    </div>
                    {manualFollowUp && manualFollowUp.count > 0 && (
                        <aside className="solid-delete-model-popup__manual">
                            <strong>Manual follow-up</strong>
                            <span>{manualFollowUp.description}</span>
                            {dropTableStatement && <div className="solid-delete-model-popup__ddl">
                                <code>{dropTableStatement}</code>
                                <button type="button" className="solid-delete-model-popup__copy-ddl" onClick={copyDropStatement} aria-label={copiedDdl ? 'DDL copied' : 'Copy DROP TABLE statement'} title={copiedDdl ? 'Copied' : 'Copy SQL'}>
                                    {copiedDdl ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                            </div>}
                        </aside>
                    )}
                    </>
                )}
            </div>
            <div className="solid-filter-dialog-sep" />
            <div className="solid-delete-model-popup__footer">
                {preview && <div className="solid-delete-model-popup__confirm">
                    <SolidCheckbox id="delete-model-confirmation" name="confirm" checked={isConfirmed} onChange={() => setIsConfirmed(!isConfirmed)} label="I reviewed the automatic changes above and understand the database table drop is a separate manual step." />
                </div>}
                <div className="solid-delete-model-popup__actions">
                    <SolidButton size="small" variant="destructive" disabled={!preview || !isConfirmed || isApplying || isLoadingPreview} loading={isApplying} autoFocus onClick={deleteModelHandler}>Delete model</SolidButton>
                    <SolidButton size="small" variant="outline" disabled={isApplying} onClick={() => dispatch(closePopup())}>Cancel</SolidButton>
                </div>
            </div>
        </div>
    );
};

export default DeleteModelRowAction;
