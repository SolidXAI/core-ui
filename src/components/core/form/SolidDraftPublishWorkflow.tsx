import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { SolidConfirmDialog } from "../../shad-cn-ui";

export type SolidWorkflowAction = "publish" | "unpublish";

const VERSION_HISTORY_PAGE = {
    type: 'page',
    attrs: {
        name: 'versionHistory',
        label: 'Version History',
        key: 'versionHistory',
    },
    children: [
        {
            type: 'versionHistory',
            attrs: {
                key: 'versionHistoryList',
            },
        },
    ],
};

// Injects the "Version History" tab into a form's notebook layout so draft/publish enabled
// models always get a version history page without every layout having to declare it.
export const appendVersionHistoryPage = (layout: any): any => {
    if (!layout) return layout;
    let appended = false;

    const visit = (node: any): any => {
        if (!node || typeof node !== 'object') return node;
        const children = Array.isArray(node.children) ? node.children : [];

        if (node.type === 'notebook') {
            const hasVersionHistory = children.some((child: any) => child?.attrs?.name === 'versionHistory' || child?.attrs?.key === 'versionHistory');
            appended = true;
            return {
                ...node,
                children: hasVersionHistory ? children.map(visit) : [...children.map(visit), VERSION_HISTORY_PAGE],
            };
        }

        return children.length > 0
            ? { ...node, children: children.map(visit) }
            : { ...node };
    };

    const nextLayout = visit(layout);

    if (appended || nextLayout?.type !== 'form') {
        return nextLayout;
    }

    return {
        ...nextLayout,
        children: [
            {
                type: 'notebook',
                attrs: {
                    name: 'workflowNotebook',
                    key: 'workflowNotebook',
                },
                children: [
                    {
                        type: 'page',
                        attrs: {
                            name: 'details',
                            label: 'Details',
                            key: 'details',
                        },
                        children: nextLayout.children || [],
                    },
                    VERSION_HISTORY_PAGE,
                ],
            },
        ],
    };
};

export const SolidWorkflowStatusPill = ({ label }: { label?: string | null }) => {
    if (!label) return null;

    return (
        <span className={`solid-notebook-status-pill solid-notebook-status-pill--${String(label).toLowerCase()}`}>
            {label}
        </span>
    );
};

type SolidWorkflowConfirmDialogProps = {
    open: boolean;
    workflowConfirmAction: SolidWorkflowAction;
    onConfirm: () => void;
    onCancel: () => void;
};

export const SolidWorkflowConfirmDialog = ({ open, workflowConfirmAction, onConfirm, onCancel }: SolidWorkflowConfirmDialogProps) => {
    const isPublishConfirm = workflowConfirmAction === 'publish';

    return (
        <SolidConfirmDialog
            open={open}
            title={isPublishConfirm ? 'Publish this draft?' : 'Unpublish this version?'}
            confirmLabel={isPublishConfirm ? 'Publish' : 'Unpublish'}
            cancelLabel="Cancel"
            onConfirm={onConfirm}
            onCancel={onCancel}
            className={`solid-shadcn-confirm-dialog solid-workflow-confirm-dialog solid-workflow-confirm-dialog--${workflowConfirmAction}`}
            headerClassName="solid-shadcn-dialog-head solid-workflow-confirm-head"
            bodyClassName="solid-shadcn-dialog-body solid-workflow-confirm-body"
            footerClassName="solid-shadcn-dialog-actions solid-workflow-confirm-actions"
            message={
                <div className="solid-workflow-confirm-content">
                    <span className="solid-workflow-confirm-mark" aria-hidden="true">
                        {isPublishConfirm ? 'P' : 'U'}
                    </span>
                    <p className="solid-workflow-confirm-title">
                        {isPublishConfirm ? 'Make this version live' : 'Remove this version from public view'}
                    </p>
                    <p className="solid-workflow-confirm-copy">
                        {isPublishConfirm
                            ? 'This version will become visible through published APIs.'
                            : 'This version will no longer be returned as published content.'}
                    </p>
                    {isPublishConfirm && (
                        <p className="solid-workflow-confirm-note">
                            Previously published versions will stay in version history.
                        </p>
                    )}
                </div>
            }
        />
    );
};

type UseDraftPublishWorkflowParams = {
    entityApi: any;
    id: string;
    onWorkflowChange?: () => void;
    onEmbeddedFormSave?: () => void;
};

// Owns every stateful piece of the draft/publish workflow for a single form record:
// the publish/unpublish mutations, the confirm dialog's open/promise state and the
// current published value. SolidFormView only wires up the returned handlers/props.
export const useDraftPublishWorkflow = ({ entityApi, id, onWorkflowChange, onEmbeddedFormSave }: UseDraftPublishWorkflowParams) => {
    const dispatch = useDispatch();

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmWorkflowAction, setConfirmWorkflowAction] = useState<SolidWorkflowAction | null>(null);
    const confirmResolveRef = useRef<(value: boolean) => void>();
    const [published, setPublished] = useState<string | null>(null);

    const { usePublishSolidEntityMutation, useUnpublishSolidEntityMutation } = entityApi;

    const [
        publishSolidEntity,
        { isSuccess: isEntityPublishedSuccess, isError: isEntityPublishedError, error: entityPublishedError },
    ] = usePublishSolidEntityMutation();

    const [
        unpublishSolidEntity,
        { isSuccess: isEntityUnpublishedSuccess, isError: isEntityUnpublishedError, error: entityUnpublishedError },
    ] = useUnpublishSolidEntityMutation();

    useEffect(() => {
        const handleError = (errorToast: any) => {
            const errorMessage = errorToast?.data?.message ?? [ERROR_MESSAGES.SOMETHING_WRONG];
            const detail = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            dispatch(showToast({ severity: 'error', summary: 'Error', detail }));
        };

        if (isEntityPublishedError) {
            handleError(entityPublishedError);
        } else if (isEntityUnpublishedError) {
            handleError(entityUnpublishedError);
        }
    }, [isEntityPublishedError, isEntityUnpublishedError]);

    const confirmDialogWithPromise = (type: SolidWorkflowAction) => {
        return new Promise<boolean>((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmWorkflowAction(type);
            setConfirmVisible(true);
        });
    };

    const handleConfirmAccept = () => {
        confirmResolveRef.current?.(true);
        setConfirmVisible(false);
        setConfirmWorkflowAction(null);
    };

    const handleConfirmReject = () => {
        confirmResolveRef.current?.(false);
        setConfirmVisible(false);
        setConfirmWorkflowAction(null);
    };

    const handleDraftPublishWorkFlow = async (type: SolidWorkflowAction) => {
        const userChoice = await confirmDialogWithPromise(type);
        if (!userChoice) return;

        const result = type === "publish"
            ? await publishSolidEntity(id).unwrap()
            : await unpublishSolidEntity(id).unwrap();

        dispatch(showToast({
            severity: "success",
            summary: ERROR_MESSAGES.SAVED,
            detail: type === "publish" ? ERROR_MESSAGES.MARK_PUBLISH : ERROR_MESSAGES.MARK_UNPUBLISH,
        }));

        setPublished(result?.data?.isPublished ? result?.data?.publishedAt : null);
        onWorkflowChange?.();
        onEmbeddedFormSave?.();
    };

    const workflowConfirmAction: SolidWorkflowAction = confirmWorkflowAction ?? (published !== null ? 'unpublish' : 'publish');

    return {
        published,
        setPublished,
        confirmVisible,
        workflowConfirmAction,
        handleDraftPublishWorkFlow,
        handleConfirmAccept,
        handleConfirmReject,
        isEntityPublishedSuccess,
        isEntityUnpublishedSuccess,
    };
};
