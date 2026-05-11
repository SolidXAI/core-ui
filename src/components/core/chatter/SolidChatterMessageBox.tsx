
import { getTextColor, stringToColor } from '../../../helpers/getRandomColors'
import Image from "../../common/Image"
import { useMemo, useState } from 'react'
import styles from './chatter.module.css'
import { SolidChatterCustomMessage } from './SolidChatterCustomMessage'
import { SolidChatterAuditMessage } from './SolidChatterAuditMessage'
import { Check, GitBranch, MessageSquare } from 'lucide-react'
import { SolidButton, SolidLightbox, SolidTag, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger, SolidIcon, type SolidIconName } from '../../shad-cn-ui'
import type { SolidLightboxSlide } from '../../shad-cn-ui/SolidLightbox'
import { usePatchChatterMessageMutation } from '../../../redux/api/solidChatterMessageApi'

interface Props {
    messageId?: number | string,
    user: string,
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
    const { messageId, user, messageType, message, time, auditRecord, media, messageSubType, status, modelDisplayName, modelUserKey, onRefresh } = props;
    const [lightboxSlides, setLightboxSlides] = useState<SolidLightboxSlide[]>([]);
    const [openLightbox, setOpenLightbox] = useState(false);
    const [taskStatus, setTaskStatus] = useState<string | undefined>(status);
    const [patchChatterMessage, { isLoading: isUpdatingTaskStatus }] = usePatchChatterMessageMutation();

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
                            <span className={styles.solidChatterTime}>{time}</span>
                        </div>
                        {modelDisplayName && (
                            <p className={`${styles.solidChatterMeta} m-0`}>
                                {modelDisplayName}
                                {modelUserKey && <> · <span className='font-medium'>{modelUserKey}</span></>}
                            </p>
                        )}
                        {message && (
                            <div className={styles.solidMessageWrapper}>
                                {renderMessageContent()}
                            </div>
                        )}
                        {media?.messageAttachments && media.messageAttachments.length > 0 && (
                            <div className={styles.solidChatterAttachments}>
                                {media.messageAttachments.map((attachment) => {
                                    const isImage = attachment.mimeType.startsWith('image/');
                                    return (
                                        <div key={attachment.id} className={styles.solidChatterAttachment}>
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
