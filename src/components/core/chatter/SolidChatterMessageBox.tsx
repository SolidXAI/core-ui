
import { getTextColor, stringToColor } from '../../../helpers/getRandomColors'
import Image from "../../common/Image"
import { Dialog } from 'primereact/dialog'
import { useMemo, useState } from 'react'
import styles from './chatter.module.css'
import { SolidChatterCustomMessage } from './SolidChatterCustomMessage'
import { SolidChatterAuditMessage } from './SolidChatterAuditMessage'
import { GitBranch, MessageSquare } from 'lucide-react'
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from '../../shad-cn-ui'

interface Props {
    user: string,
    messageType?: string,
    message?: any,
    time?: string,
    auditRecord?: any,
    messageSubType?: string,
    modelDisplayName?: string,
    modelUserKey?: string,
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

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
        return 'pi pi-image';
    }
    switch (mimeType) {
        case 'application/pdf':
            return 'pi pi-file-pdf';
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'pi pi-file-excel';
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'pi pi-file-word';
        case 'text/plain':
            return 'pi pi-file';
        default:
            return 'pi pi-file';
    }
};

export const SolidChatterMessageBox = (props: Props) => {
    const { user, messageType, message, time, auditRecord, media, messageSubType, modelDisplayName, modelUserKey } = props;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageDialogVisible, setIsImageDialogVisible] = useState(false);

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
        setSelectedImage(url);
        setIsImageDialogVisible(true);
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
                                                    <i className={getFileIcon(attachment.mimeType)} />
                                                    <span>{attachment.originalFileName}</span>
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Dialog
                visible={isImageDialogVisible}
                onHide={() => setIsImageDialogVisible(false)}
                className='w-9 '
                modal
            >
                {selectedImage && (
                    <Image
                        src={selectedImage}
                        alt="Preview"
                        width={800}
                        height={600}
                        style={{ width: '100%', height: 'auto' }}
                    />
                )}
            </Dialog>
        </div>
    )
}
