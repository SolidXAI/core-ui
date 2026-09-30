import { useState } from "react";
import { FileText, ImageIcon, User } from "lucide-react";
import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidAgentMessageCopyButton } from "../SolidAgentMarkdown";
import { formatFileSize } from "../agentAttachments";
import type { AgentAttachmentMeta } from "../types";
import { asArray, formatChatTime } from "./chatWidgetUtils";

/**
 * Default widget for `UserMessage`: dark right-aligned bubble with avatar, time and copy on hover.
 * Attachments show above the bubble: image thumbnails (click to enlarge) or file chips.
 * History only carries attachment metadata, so reloaded images show as chips.
 */
export const DefaultUserMessageChatWidget = ({ eventData, timestamp }: SolidChatWidgetProps) => {
    const content = String(eventData.content ?? "");
    const attachments = asArray<AgentAttachmentMeta>(eventData.attachments);
    const [zoom, setZoom] = useState<string | null>(null);

    return (
        <div className={`${styles.Row} ${styles.RowUser}`}>
            {/* Avatar first in DOM → rightmost with row-reverse */}
            <div className={`${styles.Avatar} ${styles.AvatarUser}`}>
                <User size={12} />
            </div>
            <div className={styles.BubbleGroup}>
                {attachments.length > 0 && (
                    <ul className={styles.MessageAttachments} aria-label="Attachments">
                        {attachments.map((file, index) => {
                            // previewUrl: attached in this browser session; url: stored copy (history).
                            const imageSrc = file.mimeType?.startsWith("image/") ? file.previewUrl ?? file.url : undefined;
                            if (imageSrc) {
                                return (
                                    <li key={index}>
                                        <button type="button" className={styles.MessageAttachmentImageBtn} onClick={() => setZoom(imageSrc)} title={file.name}>
                                            <img className={styles.MessageAttachmentImage} src={imageSrc} alt={file.name} />
                                        </button>
                                    </li>
                                );
                            }
                            const chip = (
                                <>
                                    {file.mimeType?.startsWith("image/") ? <ImageIcon size={13} /> : <FileText size={13} />}
                                    <span className={styles.MessageAttachmentName}>{file.name}</span>
                                    <span className={styles.MessageAttachmentSize}>{formatFileSize(file.size ?? 0)}</span>
                                </>
                            );
                            return (
                                <li key={index} title={file.name}>
                                    {file.url ? (
                                        <a className={styles.MessageAttachmentFile} href={file.url} target="_blank" rel="noopener noreferrer">{chip}</a>
                                    ) : (
                                        <span className={styles.MessageAttachmentFile}>{chip}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {content && (
                    <div className={`${styles.Bubble} ${styles.BubbleUser}`}>
                        <p className={styles.UserText}>{content}</p>
                    </div>
                )}
                <div className={`${styles.BubbleMeta} ${styles.BubbleMetaUser}`}>
                    <span className={styles.Timestamp}>{formatChatTime(timestamp)}</span>
                    {content && <SolidAgentMessageCopyButton text={content} />}
                </div>
            </div>
            {zoom && (
                <div className={styles.AttachmentLightbox} role="dialog" aria-label="Image preview" onClick={() => setZoom(null)}>
                    <img src={zoom} alt="" />
                </div>
            )}
        </div>
    );
};
