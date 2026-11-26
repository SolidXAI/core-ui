import React, { useEffect, useRef, useState } from "react";
import { Check, Clock, MoreHorizontal, Pencil, Search, Trash2, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import type { AgentSessionSummary } from "./client/agentRest";
import { SolidSpinner } from "../../shad-cn-ui/SolidSpinner";

/** Space the row menu needs below its trigger before it flips upward. */
const MENU_FLIP_THRESHOLD_PX = 115;

function formatSessionTime(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return `Today, ${timeStr}`;
    if (days === 1) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

const sessionLabel = (session: AgentSessionSummary) => session.title || session.preview || "New conversation";

export function AgentSessionSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className={styles.historySearchBox}>
            <Search size={13} className={styles.historySearchIcon} />
            <input
                type="text"
                className={styles.historySearchInput}
                placeholder="Search by title, message, or session ID…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Search past conversations"
            />
            {value && (
                <button
                    type="button"
                    className={styles.historySearchClear}
                    onClick={() => onChange("")}
                    title="Clear search"
                    aria-label="Clear search"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}

type Props = {
    /** Class of the scrolling container (docked history panel or full-screen sidebar). */
    className: string;
    sectionTitle?: string;
    sessions: AgentSessionSummary[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    /** The search the current results were loaded for. */
    searchQuery: string;
    activeSessionId: string | null;
    resumingSessionId: string | null;
    providerLabel: (providerId?: string) => string;
    onResume: (session: AgentSessionSummary) => void;
    onRename: (sessionId: string, title: string) => void;
    onDelete: (session: AgentSessionSummary) => void;
    onRetry: () => void;
    onLoadMore: () => void;
};

/** Past conversations with rename/delete menus; loads further pages as the end scrolls into view. */
export function AgentSessionList({
    className,
    sectionTitle,
    sessions,
    loading,
    loadingMore,
    error,
    hasMore,
    searchQuery,
    activeSessionId,
    resumingSessionId,
    providerLabel,
    onResume,
    onRename,
    onDelete,
    onRetry,
    onLoadMore,
}: Props) {
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
    const [menuPlacement, setMenuPlacement] = useState<"up" | "down">("down");
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!scrollEl || !sentinel || !hasMore || loading || loadingMore || error) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
        }, { root: scrollEl, rootMargin: "0px 0px 200px 0px" });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [scrollEl, hasMore, loading, loadingMore, error, sessions.length]);

    useEffect(() => {
        if (!menuSessionId) return;
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuSessionId(null);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuSessionId(null);
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [menuSessionId]);

    const toggleMenu = (session: AgentSessionSummary, trigger: HTMLButtonElement) => {
        if (menuSessionId === session.session_id) {
            setMenuSessionId(null);
            trigger.blur();
            return;
        }
        const spaceBelow = scrollEl
            ? scrollEl.getBoundingClientRect().bottom - trigger.getBoundingClientRect().bottom
            : Number.POSITIVE_INFINITY;
        setMenuPlacement(spaceBelow < MENU_FLIP_THRESHOLD_PX ? "up" : "down");
        setMenuSessionId(session.session_id);
    };

    const saveRename = (sessionId: string) => {
        setEditingSessionId(null);
        onRename(sessionId, editingTitle);
    };

    const renderRow = (session: AgentSessionSummary) => {
        const isResumingThis = resumingSessionId === session.session_id;
        const isCurrentSession = session.session_id === activeSessionId;
        const isMenuOpen = menuSessionId === session.session_id;
        const providerName = session.provider ? providerLabel(session.provider) : "";

        return (
            <div
                key={session.session_id}
                className={`${styles.historyRow} ${isCurrentSession ? styles.historyRowActive : ""} ${isMenuOpen ? styles.historyRowMenuOpen : ""}`}
            >
                {editingSessionId === session.session_id ? (
                    <form
                        className={styles.historyRenameForm}
                        onSubmit={(e) => {
                            e.preventDefault();
                            saveRename(session.session_id);
                        }}
                    >
                        <input
                            type="text"
                            className={styles.historyRenameInput}
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.stopPropagation();
                                    setEditingSessionId(null);
                                }
                            }}
                            aria-label="Rename conversation"
                        />
                        <button type="submit" className={styles.iconBtn} aria-label="Save title" title="Save">
                            <Check size={14} />
                        </button>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Cancel rename"
                            title="Cancel"
                            onClick={() => setEditingSessionId(null)}
                        >
                            <X size={14} />
                        </button>
                    </form>
                ) : (
                    <>
                        <button
                            type="button"
                            className={`${styles.historyItem} ${isCurrentSession ? styles.historyItemActive : ""}`}
                            onClick={() => {
                                setMenuSessionId(null);
                                setEditingSessionId(null);
                                onResume(session);
                            }}
                            disabled={!!resumingSessionId}
                            title={session.session_id ? `${sessionLabel(session)} (ID: ${session.session_id})` : undefined}
                        >
                            {isResumingThis && <SolidSpinner size={13} className={styles.inlineSolidSpinner} aria-hidden="true" />}
                            <span className={styles.historyPreview}>{sessionLabel(session)}</span>
                            {providerName && (
                                <span
                                    className={styles.historyProviderName}
                                    title={session.model ? `${providerName} (${session.model})` : providerName}
                                >
                                    {providerName}
                                </span>
                            )}
                        </button>
                        <div className={styles.historyMenuWrap} ref={isMenuOpen ? menuRef : undefined}>
                            <button
                                type="button"
                                className={`${styles.historyMenuTrigger} ${isMenuOpen ? styles.historyMenuTriggerActive : ""}`}
                                aria-label="Conversation options"
                                title="Options"
                                aria-expanded={isMenuOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(session, e.currentTarget);
                                }}
                            >
                                <MoreHorizontal size={14} />
                            </button>
                            {isMenuOpen && (
                                <div
                                    className={`${styles.historyMenuDropdown} ${menuPlacement === "up" ? styles.historyMenuDropdownUp : ""}`}
                                    role="menu"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {session.created_at && (
                                        <div className={styles.historyMenuTime}>
                                            <Clock size={12} className={styles.historyMenuTimeIcon} />
                                            <span>{formatSessionTime(session.created_at)}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.historyMenuItem}
                                        role="menuitem"
                                        onClick={() => {
                                            setMenuSessionId(null);
                                            setEditingSessionId(session.session_id);
                                            setEditingTitle(sessionLabel(session));
                                        }}
                                    >
                                        <Pencil size={13} />
                                        <span>Rename</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.historyMenuItem} ${styles.historyMenuItemDanger}`}
                                        role="menuitem"
                                        onClick={() => {
                                            setMenuSessionId(null);
                                            onDelete(session);
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={`${className} ${menuSessionId ? styles.sessionsMenuOpen : ""}`} ref={setScrollEl}>
            {sectionTitle && (loading || sessions.length > 0) && <div className={styles.sidebarSectionTitle}>{sectionTitle}</div>}
            {loading ? (
                Array.from({ length: 5 }, (_, index) => <div key={index} className={styles.historySkeletonRow} />)
            ) : (
                <>
                    {sessions.length === 0 && !error && (
                        <div className={styles.notice}>
                            {searchQuery ? <>No conversations match &ldquo;{searchQuery}&rdquo;</> : "No past conversations."}
                        </div>
                    )}
                    {sessions.map(renderRow)}
                    {loadingMore && (
                        <>
                            <div className={styles.historySkeletonRow} />
                            <div className={styles.historySkeletonRow} />
                        </>
                    )}
                    {error && (
                        <div className={styles.historyErrorRow}>
                            <span>{error}</span>
                            <button type="button" className={styles.historyRetryBtn} onClick={onRetry}>
                                Retry
                            </button>
                        </div>
                    )}
                    {hasMore && <div ref={sentinelRef} className={styles.historySentinel} />}
                </>
            )}
        </div>
    );
}
