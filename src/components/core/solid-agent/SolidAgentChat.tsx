import React, { useCallback, useEffect, useState } from "react";
import { History, LogOut, Maximize2, Minimize2, Minus, PanelRight, Plus, Sparkles, Trash2, WifiOff, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentPrefillConsumed } from "../../../redux/features/agentSlice";
import { deleteSession, fetchSessionList, type AgentSessionSummary } from "./client/agentRest";
import { AgentThread } from "./thread/AgentThread";
import { AgentComposer } from "./composer/AgentComposer";
import type { AgentAttachment, AgentMode, AgentRuntimeType } from "./types";
import type { AgentInputContext } from "./useAdminInputContext";
import { useAgentChat } from "./useAgentChat";
import { useAgentAuth } from "./useAgentAuth";
import { AgentSignIn } from "./AgentSignIn";
import { clearAgentAuth } from "./client/agentAuth";

type Props = {
    agentUrl: string;
    /** Which agent backend `agentUrl` belongs to (default "solidx", shared with the launcher). */
    agentRuntime?: AgentRuntimeType;
    inputContext?: AgentInputContext;
    /** Rendered inside a page (tab/form widget) instead of the floating window: no window controls. */
    embedded?: boolean;
    /** Only one mounted chat should act on SDK prefill requests; the floating window does by default. */
    handlesPrefill?: boolean;
    suggestions?: string[];
};

const DEFAULT_SUGGESTIONS = [
    "What can you help me with in this app?",
    "Show me the models in this module",
    "Explain what this screen does",
];

function formatDate(iso: string | null) {
    if (!iso) return "";
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SolidAgentChat({
    agentUrl,
    agentRuntime = "solidx",
    inputContext = {},
    embedded = false,
    // SDK prefill goes through the shared "solidx" conversation only.
    handlesPrefill = !embedded && agentRuntime === "solidx",
    suggestions = DEFAULT_SUGGESTIONS,
}: Props) {
    const { agent, dispatch, runtime } = useAgentChat(agentRuntime, agentUrl);
    // Agent login (API key → agentToken in sessionStorage); the chat is usable once signed in.
    const agentAuth = useAgentAuth(agentUrl);
    const signedIn = agentAuth.status === "signedIn";
    const signedInAs = agentAuth.auth?.user?.email ?? agentAuth.auth?.user?.username;

    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<AgentSessionSummary[]>([]);
    const [seed, setSeed] = useState<{ text: string; key: number } | null>(null);

    // SDK requests: solidAgent.open({ prompt, autoSend, context }).
    useEffect(() => {
        if (!handlesPrefill || !agent.prefill || !runtime) return;
        const { prompt, autoSend, context, nonce } = agent.prefill;
        dispatch(agentPrefillConsumed());
        setShowHistory(false);
        if (autoSend) runtime.sendMessage(prompt, { ...inputContext, ...(context ?? {}) });
        else setSeed({ text: prompt, key: nonce });
    }, [agent.prefill, handlesPrefill, dispatch, runtime, inputContext]);

    useEffect(() => {
        if (!showHistory || !signedIn) return;
        let alive = true;
        fetchSessionList(agentUrl).then((list) => alive && setSessions(list ?? []));
        return () => {
            alive = false;
        };
    }, [showHistory, agentUrl, signedIn]);

    const setMode = (mode: AgentMode) => dispatch(agentModeChanged(mode));
    const send = useCallback((text: string) => runtime?.sendMessage(text, inputContext), [runtime, inputContext]);
    const sendWithAttachments = useCallback(
        (text: string, attachments: AgentAttachment[]) => runtime?.sendMessage(text, inputContext, attachments),
        [runtime, inputContext],
    );
    const offline = agent.connection === "reconnecting" || agent.connection === "offline";
    const statusColor = agent.connection === "open" ? (agent.working ? "#eab308" : "#22c55e") : offline ? "#dc2626" : "#94a3b8";
    const statusText =
        agentAuth.status === "signedOut" ? "Sign in required"
        : agent.connection === "open" ? (agent.working ? "Working…" : "Ready")
        : agent.connection === "connecting" ? "Connecting…"
        : offline ? "Reconnecting…" : "Idle";

    const empty = (
        <div className={styles.empty}>
            <div className={styles.emptyMark}><Sparkles size={24} /></div>
            <div>
                <h2 className={styles.emptyTitle}>How can I help?</h2>
                <p className={styles.emptyText}>Ask in plain English. I can read this app's metadata and data, and run the agent's tools for you.</p>
            </div>
            <div className={styles.suggestions}>
                {suggestions.map((text) => (
                    <button key={text} type="button" className={styles.suggestion} onClick={() => send(text)}>
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerMark}>
                    <Sparkles size={15} />
                    <span className={styles.statusDot} style={{ background: statusColor }} />
                </div>
                <div className={styles.headerTitle}>
                    <strong>SolidX Agent</strong>
                    <span className={styles.headerSub}>{statusText}</span>
                </div>
                {signedIn && (
                    <>
                        <button type="button" className={styles.iconBtn} title="New chat" aria-label="New chat" onClick={() => { runtime?.newChat(); setShowHistory(false); }}>
                            <Plus size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            title="History"
                            aria-label="Chat history"
                            aria-pressed={showHistory}
                            onClick={() => setShowHistory((v) => !v)}
                        >
                            <History size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            title={signedInAs ? `Sign out of the agent (${String(signedInAs)})` : "Sign out of the agent"}
                            aria-label="Sign out of the agent"
                            onClick={() => { setShowHistory(false); clearAgentAuth(agentUrl); }}
                        >
                            <LogOut size={15} />
                        </button>
                    </>
                )}
                {!embedded && (
                    <>
                        {agent.mode !== "docked" && (
                            <button type="button" className={styles.iconBtn} title="Dock to the side" aria-label="Dock to the side" onClick={() => setMode("docked")}>
                                <PanelRight size={16} />
                            </button>
                        )}
                        {agent.mode === "maximized" ? (
                            <button type="button" className={styles.iconBtn} title="Restore" aria-label="Restore size" onClick={() => setMode("compact")}>
                                <Minimize2 size={15} />
                            </button>
                        ) : (
                            <button type="button" className={styles.iconBtn} title="Maximize" aria-label="Maximize" onClick={() => setMode("maximized")}>
                                <Maximize2 size={15} />
                            </button>
                        )}
                        <button type="button" className={styles.iconBtn} title="Minimize (Esc)" aria-label="Minimize" onClick={() => setMode("bubble")}>
                            {agent.mode === "compact" ? <Minus size={16} /> : <X size={16} />}
                        </button>
                    </>
                )}
            </div>

            {agentAuth.status === "checking" ? (
                <div style={{ flex: "1 1 auto" }} />
            ) : agentAuth.status === "signedOut" ? (
                // The agent forgot the token (expired/restarted) if it already reported an auth error.
                <AgentSignIn agentUrl={agentUrl} expired={!!agent.authError} />
            ) : (
                <>
                {offline && (
                    <div className={styles.banner} role="status">
                        <WifiOff size={14} /> Reconnecting to the agent… Your messages will be sent once it is back.
                    </div>
                )}
                {agent.authError && (
                    <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
                        {agent.authError}
                    </div>
                )}

                {showHistory ? (
                    <div className={styles.historyPanel} aria-label="Past conversations">
                        {sessions.length === 0 && <div className={styles.notice}>No past conversations.</div>}
                        {sessions.map((session) => (
                            <div key={session.session_id} style={{ display: "flex", alignItems: "center" }}>
                                <button
                                    type="button"
                                    className={`${styles.historyItem} ${session.session_id === agent.historySessionId ? styles.historyItemActive : ""}`}
                                    onClick={() => {
                                        runtime?.resume(session.session_id);
                                        setShowHistory(false);
                                    }}
                                >
                                    <span className={styles.historyPreview}>{session.preview || "New conversation"}</span>
                                    <span className={styles.historyDate}>{formatDate(session.created_at)}</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    aria-label="Delete conversation"
                                    title="Delete"
                                    onClick={async () => {
                                        if (!window.confirm("Delete this conversation?")) return;
                                        await deleteSession(agentUrl, session.session_id);
                                        setSessions((prev) => prev.filter((s) => s.session_id !== session.session_id));
                                        if (session.session_id === agent.historySessionId) runtime?.newChat();
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <AgentThread
                        items={agent.items}
                        thinking={agent.working && agent.thinking}
                        hasMore={agent.hasMoreHistory}
                        context={agent.context ?? undefined}
                        emptyState={empty}
                        onLoadOlder={() => void runtime?.loadOlder()}
                        onReply={(widgetId, widget, value) => runtime?.replyToWidget(widgetId, widget, value)}
                        onPrompt={send}
                    />
                )}

                <AgentComposer
                    working={agent.working}
                    disabled={!!agent.authError}
                    commands={agent.commands}
                    seed={seed?.text}
                    seedKey={seed?.key}
                    onSend={sendWithAttachments}
                    onStop={() => runtime?.cancel()}
                />
                </>
            )}
        </>
    );
}
