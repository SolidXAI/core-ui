
import { getTextColor, stringToColor } from '../../../helpers/getRandomColors'
import Image from "../../common/Image"
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './chatter.module.css'
import { SolidChatterCustomMessage } from './SolidChatterCustomMessage'
import { SolidChatterAuditMessage } from './SolidChatterAuditMessage'
import { Check, GitBranch, MessageSquare, Paperclip, Pencil, Trash2, X } from 'lucide-react'
import { SolidButton, SolidLightbox, SolidTag, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger, SolidIcon, SolidTextarea, type SolidIconName } from '../../shad-cn-ui'
import type { SolidLightboxSlide } from '../../shad-cn-ui/SolidLightbox'
import { usePatchChatterMessageMutation, useUpdateChatterNoteMessageMutation } from '../../../redux/api/solidChatterMessageApi'
import { useSession } from '../../../hooks/useSession'

interface Props {
    messageId?: number | string,
    user: string,
    userId?: number,
    messageType?: string,
    message?: any,
    time?: string,
    auditRecord?: any,
    messageSubType?: string,
    status?: string,
    modelDisplayName?: string,
    modelUserKey?: string,
    onRefresh?: () => void,
    media?: {
        messageAttachments?: Array<{
            id: number;
            relativeUri: string;
            mimeType: string;
            originalFileName: string;
            _full_url: string;
        }>;
    };
}

const getFileIcon = (mimeType: string): SolidIconName => {
    if (mimeType.startsWith('image/')) {
        return 'si-image';
    }
    switch (mimeType) {
        case 'application/pdf':
            return 'si-file-pdf';
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'si-file-excel';
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'si-file-word';
        case 'text/plain':
            return 'si-file';
        default:
            return 'si-file';
    }
};

export const SolidChatterMessageBox = (props: Props) => {
    const { messageId, user, userId, messageType, message, time, auditRecord, media, messageSubType, status, modelDisplayName, modelUserKey, onRefresh } = props;
    const [lightboxSlides, setLightboxSlides] = useState<SolidLightboxSlide[]>([]);
    const [openLightbox, setOpenLightbox] = useState(false);
    const [taskStatus, setTaskStatus] = useState<string | undefined>(status);
    const [isEditing, setIsEditing] = useState(false);
    const [localMessage, setLocalMessage] = useState(message ?? '');
    const [editedMessage, setEditedMessage] = useState(message ?? '');
    const [hasPendingOptimisticUpdate, setHasPendingOptimisticUpdate] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
    const [optimisticRemovedAttachmentIds, setOptimisticRemovedAttachmentIds] = useState<number[]>([]);
    const [hasPendingOptimisticAttachmentUpdate, setHasPendingOptimisticAttachmentUpdate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [patchChatterMessage, { isLoading: isUpdatingTaskStatus }] = usePatchChatterMessageMutation();
    const [updateChatterNoteMessage, { isLoading: isUpdatingNote }] = useUpdateChatterNoteMessageMutation();
    const { data: session } = useSession();

    const avatarStyle = useMemo(() => {
        const bg = stringToColor(user)
        const color = getTextColor(bg)
        return { backgroundColor: bg, color }
    }, [user])

    const initials = useMemo(() => {
        if (!user) return "";
        return user
            .split(" ")
            .map(part => part.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }, [user]);

    const handleImageClick = (url: string) => {
        const imageAttachments = media?.messageAttachments?.filter(att => att.mimeType?.startsWith('image/')) || [];
        if (imageAttachments.length === 0) return;

        const startIndex = imageAttachments.findIndex(att => att._full_url === url);
        const ordered = startIndex >= 0
            ? [...imageAttachments.slice(startIndex), ...imageAttachments.slice(0, startIndex)]
            : imageAttachments;

        const slides: SolidLightboxSlide[] = ordered.map(att => ({
            src: att._full_url
        }));

        setLightboxSlides(slides);
        setOpenLightbox(true);
    };

    const renderMessageContent = () => {
        switch (messageType) {
            case 'audit':
                return <SolidChatterAuditMessage auditRecord={auditRecord} />;
            case 'custom':
            default:
                return <SolidChatterCustomMessage message={message} />;
        }
    };

    const messageLabel = messageType === 'audit'
        ? (messageSubType === "audit_update"
            ? "Updated"
            : messageSubType === "audit_insert"
                ? "Inserted"
                : "Audit record")
        : "Internal note";

    const TypeIcon = messageType === 'audit' ? GitBranch : MessageSquare;

    const isTaskMessage = messageSubType === 'task';
    const isTaskCompleted = (taskStatus ?? '').toLowerCase() === 'completed';
    const isCustomMessage = messageType === 'custom';
    const isEditableSubtype = messageSubType === 'note';
    const isCurrentUserAuthor = !!(session?.user?.id && userId && Number(session.user.id) === Number(userId));
    const canEditNote = Boolean(messageId && isCustomMessage && isEditableSubtype && isCurrentUserAuthor);

    useEffect(() => {
        const incomingMessage = message ?? '';

        // Keep optimistic message visible until server data catches up.
        if (hasPendingOptimisticUpdate && incomingMessage !== localMessage) {
            return;
        }

        if (hasPendingOptimisticUpdate && incomingMessage === localMessage) {
            setHasPendingOptimisticUpdate(false);
        }

        setLocalMessage(incomingMessage);
        if (!isEditing) {
            setEditedMessage(incomingMessage);
        }
    }, [message, isEditing, hasPendingOptimisticUpdate, localMessage]);

    useEffect(() => {
        if (!isEditing) {
            setSelectedFiles([]);
            if (!hasPendingOptimisticAttachmentUpdate) {
                setRemovedAttachmentIds([]);
            }
        }
    }, [isEditing, hasPendingOptimisticAttachmentUpdate]);

    useEffect(() => {
        if (!hasPendingOptimisticAttachmentUpdate) return;
        const latestAttachmentIds = (media?.messageAttachments || []).map((attachment) => attachment.id);
        const stillPresent = optimisticRemovedAttachmentIds.some((id) => latestAttachmentIds.includes(id));
        if (!stillPresent) {
            setHasPendingOptimisticAttachmentUpdate(false);
            setOptimisticRemovedAttachmentIds([]);
            setRemovedAttachmentIds([]);
        }
    }, [media?.messageAttachments, hasPendingOptimisticAttachmentUpdate, optimisticRemovedAttachmentIds]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
            event.target.value = '';
        }
    };

    const handleMarkTaskDone = async () => {
        if (!messageId || isUpdatingTaskStatus) return;
        try {
            await patchChatterMessage({ id: messageId, data: { status: 'completed' } }).unwrap();
            setTaskStatus('completed');
            onRefresh?.();
        } catch (e) {
            // no-op (parent/global error handling if any)
        }
    };

    const handleEditSave = async () => {
        if (!messageId || isUpdatingNote) return;
        const trimmedMessage = editedMessage?.trim();
        const hasBodyChange = trimmedMessage && trimmedMessage !== (message ?? '').trim();
        const hasAttachmentOps = removedAttachmentIds.length > 0 || selectedFiles.length > 0;
        if (!hasBodyChange && !hasAttachmentOps) return;
        if (!trimmedMessage) return;
        const nextMessage = trimmedMessage;
        // Optimistic local update to remove UI lag before refetch resolves.
        setLocalMessage(nextMessage);
        setHasPendingOptimisticUpdate(true);
        if (removedAttachmentIds.length > 0) {
            setOptimisticRemovedAttachmentIds((prev) => Array.from(new Set([...prev, ...removedAttachmentIds])));
            setHasPendingOptimisticAttachmentUpdate(true);
        }
        setIsEditing(false);
        try {
            const formData = new FormData();
            formData.append('messageBody', nextMessage);
            if (removedAttachmentIds.length > 0) {
                formData.append('removeAttachmentIds', removedAttachmentIds.join(','));
            }
            selectedFiles.forEach((file) => formData.append('messageAttachments', file));

            await updateChatterNoteMessage({ id: messageId, data: formData }).unwrap();
            onRefresh?.();
        } catch (e) {
            // Revert optimistic update on failure.
            setLocalMessage(message ?? '');
            setHasPendingOptimisticUpdate(false);
            setHasPendingOptimisticAttachmentUpdate(false);
            setOptimisticRemovedAttachmentIds([]);
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setEditedMessage(localMessage ?? '');
        setSelectedFiles([]);
        setRemovedAttachmentIds([]);
        setIsEditing(false);
    };

    const formatFileSize = (size: number) => {
        if (!size) return '';
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

    const hiddenAttachmentIds = new Set([
        ...removedAttachmentIds,
        ...optimisticRemovedAttachmentIds,
    ]);
    const visibleAttachments = (media?.messageAttachments || []).filter(
        (attachment) => !hiddenAttachmentIds.has(attachment.id)
    );

    const toggleRemoveAttachment = (attachmentId: number) => {
        setRemovedAttachmentIds(prev =>
            prev.includes(attachmentId)
                ? prev.filter(id => id !== attachmentId)
                : [...prev, attachmentId]
        );
    };

    return (
        <div className={styles.solidChatterMessageBox}>
            <div className={styles.solidChatterMessageCard}>
                <div className={styles.solidChatterMessageLayout}>
                    <div className={styles.solidChatterAvatar} style={avatarStyle}>
                        {initials || user.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.solidChatterMessageContent}>
                        <div className={styles.solidChatterMessageHeader}>
                            <div className='flex align-items-center gap-2 flex-wrap'>
                                <p className={styles.solidChatterUser}>{user}</p>
                                <SolidTooltip>
                                    <SolidTooltipTrigger asChild>
                                        <span
                                            className={`${styles.solidChatterBadge} ${messageType === 'audit' ? styles.audit : styles.custom}`}
                                            aria-label={messageLabel}
                                        >
                                            <TypeIcon size={12} />
                                        </span>
                                    </SolidTooltipTrigger>
                                    <SolidTooltipContent side="right">
                                        {messageLabel}
                                    </SolidTooltipContent>
                                </SolidTooltip>
                            </div>
                            <div className='flex align-items-center gap-2'>
                                {canEditNote && !isEditing && (
                                    <SolidButton
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="solid-icon-button"
                                        leftIcon={<Pencil size={12} />}
                                        onClick={() => setIsEditing(true)}
                                        aria-label="Edit note"
                                        title="Edit note"
                                    />
                                )}
                                <span className={styles.solidChatterTime}>{time}</span>
                            </div>
                        </div>
                        {modelDisplayName && (
                            <p className={`${styles.solidChatterMeta} m-0`}>
                                {modelDisplayName}
                                {modelUserKey && <> · <span className='font-medium'>{modelUserKey}</span></>}
                            </p>
                        )}
                        {localMessage && !isEditing && (
                            <div className={styles.solidMessageWrapper}>
                                {messageType === 'audit'
                                    ? <SolidChatterAuditMessage auditRecord={auditRecord} />
                                    : <SolidChatterCustomMessage message={localMessage} />}
                            </div>
                        )}
                        {isEditing && (
                            <div className='flex flex-column gap-2'>
                                <SolidTextarea
                                    value={editedMessage}
                                    onChange={(e) => setEditedMessage(e.target.value)}
                                    rows={4}
                                    className="w-full py-2"
                                />
                                <div className='flex flex-column gap-2'>
                                    <input
                                        ref={fileInputRef}
                                        id={`note-edit-file-${messageId}`}
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    {selectedFiles.length > 0 && (
                                        <div className='flex flex-column gap-1'>
                                            {selectedFiles.map((file, index) => (
                                                <div key={`${file.name}-${index}`} className='flex align-items-center justify-content-between text-xs'>
                                                    <span>{file.name} ({formatFileSize(file.size)})</span>
                                                    <SolidButton
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className='solid-icon-button'
                                                        leftIcon={<X size={12} />}
                                                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                                        aria-label={`Remove ${file.name}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className='flex align-items-center justify-content-between gap-2 flex-wrap'>
                                    <div className='flex align-items-center gap-2'>
                                        <SolidButton
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="solid-icon-button"
                                            leftIcon={<Paperclip size={14} />}
                                            onClick={() => fileInputRef.current?.click()}
                                            aria-label="Attach files"
                                            title="Attach files"
                                        />
                                        <span className='text-xs text-color-secondary'>Attach file</span>
                                    </div>
                                    <div className='flex align-items-center justify-content-end gap-2'>
                                    <SolidButton
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<X size={12} />}
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </SolidButton>
                                    <SolidButton
                                        type="button"
                                        size="sm"
                                        variant="primary"
                                        loading={isUpdatingNote}
                                        leftIcon={<Check size={12} />}
                                        onClick={handleEditSave}
                                        disabled={!editedMessage?.trim() || (removedAttachmentIds.length === 0 && selectedFiles.length === 0 && editedMessage.trim() === (message ?? '').trim())}
                                    >
                                        Save
                                    </SolidButton>
                                    </div>
                                </div>
                            </div>
                        )}
                        {visibleAttachments.length > 0 && (
                            <div className={styles.solidChatterAttachments}>
                                {visibleAttachments.map((attachment) => {
                                    const isImage = attachment.mimeType.startsWith('image/');
                                    return (
                                        <div key={attachment.id} className={styles.solidChatterAttachment} style={{ position: 'relative' }}>
                                            {isEditing && canEditNote && (
                                                <SolidButton
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="solid-icon-button"
                                                    leftIcon={<Trash2 size={12} color="#dc2626" />}
                                                    onClick={() => toggleRemoveAttachment(attachment.id)}
                                                    aria-label={`Remove ${attachment.originalFileName}`}
                                                    title={`Remove ${attachment.originalFileName}`}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -8,
                                                        right: -8,
                                                        zIndex: 2,
                                                        background: '#fff',
                                                        border: '1px solid #fecaca',
                                                        borderRadius: '999px',
                                                    }}
                                                />
                                            )}
                                            {isImage ? (
                                                <div
                                                    className='cursor-pointer'
                                                    onClick={() => handleImageClick(attachment._full_url)}
                                                >
                                                    <Image
                                                        src={encodeURI(attachment._full_url)}
                                                        alt={attachment.originalFileName}
                                                        width={54}
                                                        height={54}
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ) : (
                                                <a
                                                    href={encodeURI(attachment._full_url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                className='flex align-items-center gap-2 text-decoration-none text-sm'
                                            >
                                                <SolidIcon name={getFileIcon(attachment.mimeType)} aria-hidden />
                                                <span>{attachment.originalFileName}</span>
                                            </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {isTaskMessage && (
                            <div className='flex align-items-center justify-content-end'>
                                {isTaskCompleted ? (
                                    <SolidTag tone="success" className="inline-flex align-items-center gap-1 text-xs px-2 py-1">
                                        <Check size={12} aria-hidden />
                                        <span className="font-medium">Done</span>
                                    </SolidTag>
                                ) : (
                                    <SolidButton
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                        leftIcon={<Check size={12} />}
                                        loading={isUpdatingTaskStatus}
                                        onClick={handleMarkTaskDone}
                                    >
                                        <span className="font-semibold">Mark as done</span>
                                    </SolidButton>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {openLightbox && (
                <SolidLightbox
                    open={openLightbox}
                    slides={lightboxSlides}
                    onClose={() => setOpenLightbox(false)}
                />
            )}
        </div>
    )
}
