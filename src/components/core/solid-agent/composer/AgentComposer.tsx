import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, FileText, Paperclip, Square, X } from "lucide-react";
import styles from "../SolidAgent.module.css";
import type { AgentAttachment, AgentCommand } from "../types";
import { AGENT_ATTACHMENT_ACCEPT, MAX_AGENT_ATTACHMENTS, formatFileSize, readAgentAttachments } from "../agentAttachments";

type Props = {
    working: boolean;
    disabled: boolean;
    placeholder?: string;
    commands: AgentCommand[];
    /** Text to place in the box (e.g. a prefilled prompt); changing `seedKey` re-applies it. */
    seed?: string;
    seedKey?: number;
    onSend: (text: string, attachments: AgentAttachment[]) => void | Promise<void>;
    onStop: () => void;
    modelIndicator?: React.ReactNode;
};

/**
 * Message box: Enter sends, Shift+Enter adds a line, "/" at the start lists the agent's commands.
 * Files can be attached with the paperclip, dropped onto the box, or pasted.
 */
export function AgentComposer({ working, disabled, placeholder, commands, seed, seedKey, onSend, onStop, modelIndicator }: Props) {
    const [text, setText] = useState("");
    const [active, setActive] = useState(0);
    const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
    const [attachErrors, setAttachErrors] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (seed == null) return;
        setText(seed);
        requestAnimationFrame(() => {
            ref.current?.focus();
            autosize();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seedKey]);

    useEffect(() => {
        if (!disabled) ref.current?.focus();
    }, [disabled]);

    const slashQuery = text.startsWith("/") && !text.includes(" ") ? text.slice(1).toLowerCase() : null;
    const matches = useMemo(
        () => (slashQuery == null ? [] : commands.filter((cmd) => cmd.name.replace(/^\//, "").toLowerCase().startsWith(slashQuery))),
        [commands, slashQuery],
    );

    function autosize() {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }

    const addFiles = async (files: File[]) => {
        if (!files.length || disabled || sending) return;
        const { added, errors } = await readAgentAttachments(files, attachments);
        if (added.length) setAttachments((prev) => [...prev, ...added]);
        setAttachErrors(errors);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
        setAttachErrors([]);
    };

    const canSend = (!!text.trim() || attachments.length > 0) && !working && !disabled && !sending;

    const submit = async () => {
        if (!canSend) return;
        setSending(true);
        setAttachErrors([]);
        try {
            await onSend(text.trim(), attachments);
            setText("");
            setAttachments([]);
            requestAnimationFrame(autosize);
        } catch (error) {
            setAttachErrors([error instanceof Error ? error.message : "The message could not be sent."]);
        } finally {
            setSending(false);
        }
    };

    const pickCommand = (cmd: AgentCommand) => {
        setText(`/${cmd.name.replace(/^\//, "")} `);
        ref.current?.focus();
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (matches.length) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => (i + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
                return;
            }
            if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
                event.preventDefault();
                pickCommand(matches[Math.min(active, matches.length - 1)]);
                return;
            }
        }
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length) {
            event.preventDefault();
            void addFiles(files);
        }
    };

    const dropHandlers = {
        onDragOver: (event: React.DragEvent) => {
            if (disabled || sending || !event.dataTransfer?.types?.includes("Files")) return;
            event.preventDefault();
            setDragging(true);
        },
        onDragLeave: (event: React.DragEvent) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        },
        onDrop: (event: React.DragEvent) => {
            if (disabled || sending) return;
            event.preventDefault();
            setDragging(false);
            void addFiles(Array.from(event.dataTransfer?.files ?? []));
        },
    };

    return (
        <div className={`${styles.composer} ${dragging ? styles.composerDragging : ""}`} {...dropHandlers}>
            {matches.length > 0 && (
                <div className={styles.popover} role="listbox" aria-label="Commands">
                    {matches.map((cmd, i) => (
                        <button
                            key={cmd.name}
                            type="button"
                            role="option"
                            aria-selected={i === active}
                            className={`${styles.popoverItem} ${i === active ? styles.popoverItemActive : ""}`}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                pickCommand(cmd);
                            }}
                        >
                            <span className={styles.popoverCmd}>/{cmd.name.replace(/^\//, "")}</span>
                            {cmd.description && <span className={styles.popoverDesc}>{cmd.description}</span>}
                        </button>
                    ))}
                </div>
            )}

            {attachments.length > 0 && (
                <ul className={styles.attachmentTray} aria-label="Attached files">
                    {attachments.map((item, index) => (
                        <li key={`${item.meta.name}-${index}`} className={styles.attachmentChip}>
                            {item.meta.previewUrl ? (
                                <img className={styles.attachmentThumb} src={item.meta.previewUrl} alt="" />
                            ) : (
                                <span className={styles.attachmentIcon}><FileText size={14} /></span>
                            )}
                            <span className={styles.attachmentText}>
                                <span className={styles.attachmentName} title={item.meta.name}>{item.meta.name}</span>
                                <span className={styles.attachmentSize}>{formatFileSize(item.meta.size)}</span>
                            </span>
                            <button type="button" className={styles.attachmentRemove} aria-label={`Remove ${item.meta.name}`} onClick={() => removeAttachment(index)}>
                                <X size={12} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {attachErrors.length > 0 && (
                <div className={styles.attachmentErrors} role="alert">
                    {attachErrors.map((error) => <div key={error}>{error}</div>)}
                </div>
            )}

            <textarea
                ref={ref}
                className={styles.textarea}
                rows={1}
                value={text}
                disabled={disabled || sending}
                aria-label="Message the SolidX Agent"
                placeholder={dragging ? "Drop files to attach" : placeholder ?? "Ask the agent…"}
                onChange={(event) => {
                    setText(event.target.value);
                    setActive(0);
                    autosize();
                }}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
            />
            <div className={styles.composerRow}>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={AGENT_ATTACHMENT_ACCEPT}
                    hidden
                    onChange={(event) => {
                        void addFiles(Array.from(event.target.files ?? []));
                        event.target.value = "";
                    }}
                />
                <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Attach files"
                    title={`Attach files (up to ${MAX_AGENT_ATTACHMENTS}: images or text files)`}
                    disabled={disabled || sending || attachments.length >= MAX_AGENT_ATTACHMENTS}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip size={16} />
                </button>
                {modelIndicator}
                {working ? (
                    <button type="button" className={styles.stopBtn} onClick={onStop} aria-label="Stop the agent">
                        <Square size={10} fill="currentColor" /> Stop
                    </button>
                ) : (
                    <button type="button" className={styles.sendBtn} onClick={submit} disabled={!canSend} aria-label="Send">
                        <ArrowUp size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
