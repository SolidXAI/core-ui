import React, { useCallback, useEffect, useState } from "react";
import { History, LogOut, Maximize2, Minimize2, Minus, PanelRight, Plus, Sparkles, Trash2, WifiOff, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentPrefillConsumed } from "../../../redux/features/agentSlice";
import { deleteSession, fetchAgentConfigVersionStatus, fetchAgentModelAssignments, fetchSessionList, type AgentSessionSummary } from "./client/agentRest";
import { AgentThread } from "./thread/AgentThread";
import { AgentComposer } from "./composer/AgentComposer";
import type { AgentAttachment, AgentMode, AgentRuntimeType } from "./types";
import type { AgentInputContext } from "./useAdminInputContext";
import { useAgentChat } from "./useAgentChat";
import { useAgentAuth } from "./useAgentAuth";
import { AgentSignIn } from "./AgentSignIn";
import { signOutOfAgent } from "./client/agentAuth";
import { AgentModelIndicator } from "./AgentModelIndicator";
import type { AgentModelAssignments } from "./types";
import type { AgentInputDefinition } from "./embed/agentEmbedProtocol";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidDialog, SolidDialogBody } from "../../shad-cn-ui/SolidDialog";
import { SolidInput } from "../../shad-cn-ui/SolidInput";

type Props = {
    agentUrl: string;
    title?: string;
    /** Which agent backend `agentUrl` belongs to (default "solidx", shared with the launcher). */
    agentRuntime?: AgentRuntimeType;
    inputContext?: AgentInputContext;
    inputs?: Record<string, unknown>;
    requiredInputs?: AgentInputDefinition[];
    externalEmbed?: boolean;
    onInputsLocked?: (locked: boolean) => void;
    /** Rendered inside a page (tab/form widget) instead of the floating window: no window controls. */
    embedded?: boolean;
    /** Only one mounted chat should act on SDK prefill requests; the floating window does by default. */
    handlesPrefill?: boolean;
    suggestions?: string[];
    /** Controlled window actions for an embedded chat rendered in a modal. */
    windowControls?: {
        mode: "docked" | "maximized";
        onDock: () => void;
        onMaximize: () => void;
        onRestore: () => void;
        onClose: () => void;
    };
};

const DEFAULT_SUGGESTIONS = [
    "What can you help me with in this app?",
    "Show me the models in this module",
    "Explain what this screen does",
];

const AGENT_HUB_DEFAULT_SUGGESTIONS = [
    "What can you help me with?",
    "What tools can you use?",
    "Summarize your capabilities",
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

function parseInputValues(fields: AgentInputDefinition[], rawValues: Record<string, string>): { values?: Record<string, unknown>; error?: string } {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
        const raw = rawValues[field.name] ?? "";
        if (field.dataType === "boolean") {
            if (raw !== "true" && raw !== "false") return { error: `Choose true or false for “${field.name}”.` };
            values[field.name] = raw === "true";
            continue;
        }
        if (!raw.trim()) return { error: `Enter a value for “${field.name}”.` };
        if (field.dataType === "number" || field.dataType === "integer") {
            const value = Number(raw);
            if (!Number.isFinite(value) || (field.dataType === "integer" && !Number.isSafeInteger(value))) {
                return { error: `Enter a valid ${field.dataType} for “${field.name}”.` };
            }
            values[field.name] = value;
            continue;
        }
        if (field.dataType === "object" || field.dataType === "array") {
            try {
                const value: unknown = JSON.parse(raw);
                if (field.dataType === "object" && (!value || typeof value !== "object" || Array.isArray(value))) throw new Error();
                if (field.dataType === "array" && !Array.isArray(value)) throw new Error();
                values[field.name] = value;
            } catch {
                return { error: `Enter valid JSON ${field.dataType === "array" ? "array" : "object"} for “${field.name}”.` };
            }
            continue;
        }
        if (field.dataType === "date" && (Number.isNaN(Date.parse(raw)) || new Date(raw).toISOString().slice(0, 10) !== raw)) {
            return { error: `Enter a valid date for “${field.name}”.` };
        }
        if (field.dataType === "datetime" && Number.isNaN(Date.parse(raw))) {
            return { error: `Enter a valid date and time for “${field.name}”.` };
        }
        values[field.name] = raw;
    }
    return { values };
}

export function SolidAgentChat({
    agentUrl,
    title = "SolidX Agent",
    agentRuntime = "solidx",
    inputContext = {},
    inputs,
    requiredInputs = [],
    externalEmbed = false,
    onInputsLocked,
    embedded = false,
    // SDK prefill goes through the shared "solidx" conversation only.
    handlesPrefill = !embedded && agentRuntime === "solidx",
    suggestions,
    windowControls,
}: Props) {
    const { agent, dispatch, runtime } = useAgentChat(agentRuntime, agentUrl, externalEmbed);
    // Agent login (API key → agentToken in sessionStorage); the chat is usable once signed in.
    const agentAuth = useAgentAuth(agentUrl, agentRuntime === "agentHub");
    const signedIn = agentAuth.status === "signedIn";
    const signedInAs = agentAuth.auth?.user?.email ?? agentAuth.auth?.user?.username;
    const emptyStateSuggestions = suggestions ?? (agentRuntime === "agentHub" ? AGENT_HUB_DEFAULT_SUGGESTIONS : DEFAULT_SUGGESTIONS);

    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<AgentSessionSummary[]>([]);
    const [seed, setSeed] = useState<{ text: string; key: number } | null>(null);
    const [staleAgentConfig, setStaleAgentConfig] = useState(false);
    const [modelAssignments, setModelAssignments] = useState<AgentModelAssignments | null>(null);
    const [collectedInputs, setCollectedInputs] = useState<Record<string, unknown> | null>(null);
    const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
    const [inputError, setInputError] = useState("");
    const shouldPromptForInputs = !externalEmbed && agentRuntime === "agentHub" && signedIn
        && requiredInputs.length > 0 && inputs === undefined && collectedInputs === null;
    const messageInputs = inputs ?? collectedInputs ?? undefined;

    const submitRequiredInputs = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const result = parseInputValues(requiredInputs, rawInputValues);
        if (!result.values) {
            setInputError(result.error ?? "Check the input values and try again.");
            return;
        }
        setCollectedInputs(result.values);
    };

    useEffect(() => {
        if (!signedIn) {
            setModelAssignments(null);
            return;
        }
        let alive = true;
        fetchAgentModelAssignments(agentUrl).then((models) => {
            if (alive) setModelAssignments(models);
        });
        return () => { alive = false; };
    }, [agentUrl, signedIn]);

    useEffect(() => {
        if (agentRuntime !== "agentHub" || !signedIn) {
            setStaleAgentConfig(false);
            return;
        }

        let alive = true;
        const refreshConfigStatus = async () => {
            try {
                const status = await fetchAgentConfigVersionStatus(agentUrl);
                if (alive && status) setStaleAgentConfig(status.stale);
            } catch {
                // Keep the last known status when the agent is temporarily unreachable.
            }
        };
        void refreshConfigStatus();
        const timer = window.setInterval(() => void refreshConfigStatus(), 30_000);
        return () => {
            alive = false;
            window.clearInterval(timer);
        };
    }, [agentRuntime, agentUrl, signedIn]);

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
    const windowMode = windowControls?.mode ?? agent.mode;
    const send = useCallback((text: string) => {
        if (!text.trim() || !runtime) return;
        onInputsLocked?.(true);
        return runtime.sendMessage(text, inputContext, [], messageInputs);
    }, [runtime, inputContext, messageInputs, onInputsLocked]);
    const sendWithAttachments = useCallback(
        (text: string, attachments: AgentAttachment[]) => {
            if ((!text.trim() && !attachments.length) || !runtime) return;
            onInputsLocked?.(true);
            return runtime.sendMessage(text, inputContext, attachments, messageInputs);
        },
        [runtime, inputContext, messageInputs, onInputsLocked],
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
                <h2 className={styles.emptyTitle}>{agentRuntime === "agentHub" ? `Start a conversation with ${title}` : "How can I help?"}</h2>
                <p className={styles.emptyText}>{agentRuntime === "agentHub"
                    ? "Ask this agent for help with its configured capabilities. It can use the tools and knowledge available to it."
                    : "Ask in plain English. I can read this app's metadata and data, and run the agent's tools for you."}</p>
            </div>
            <div className={styles.suggestions}>
                {emptyStateSuggestions.map((text) => (
                    <button key={text} type="button" className={styles.suggestion} onClick={() => send(text)}>
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {shouldPromptForInputs && <SolidDialog
                open
                dismissible={!!windowControls}
                onOpenChange={(open) => { if (!open) windowControls?.onClose(); }}
                className={styles.inputDialog}
                overlayClassName={styles.inputDialogOverlay}
                header="Set up this test run"
                ariaLabel={`Enter required inputs for ${title}`}
                style={{ width: "min(34rem, 94vw)" }}
            >
                <SolidDialogBody className={styles.inputDialogBody}>
                    <form className={styles.inputForm} autoComplete="off" onSubmit={submitRequiredInputs}>
                        <p>Sign-in is complete. Enter the values this agent needs before starting the conversation.</p>
                        <div className={styles.inputFields}>
                            {requiredInputs.map((field, index) => {
                                const id = `solid-agent-test-input-${index}`;
                                const value = rawInputValues[field.name] ?? "";
                                const update = (next: string) => {
                                    setRawInputValues((current) => ({ ...current, [field.name]: next }));
                                    setInputError("");
                                };
                                const inputType = field.dataType === "integer" || field.dataType === "number" ? "number"
                                    : field.dataType === "datetime" ? "datetime-local"
                                        : field.dataType === "date" ? "date" : "text";
                                return <label className={styles.inputField} htmlFor={id} key={`${field.name}-${index}`}>
                                    <span>{field.name}<small>{field.description || field.dataType}</small></span>
                                    {field.dataType === "boolean" ? (
                                        <select id={id} autoComplete="off" value={value} onChange={(event) => update(event.target.value)}>
                                            <option value="">Choose a value</option><option value="true">True</option><option value="false">False</option>
                                        </select>
                                    ) : field.dataType === "object" || field.dataType === "array" ? (
                                        <textarea id={id} autoComplete="off" value={value} onChange={(event) => update(event.target.value)} placeholder={field.dataType === "array" ? "[ ]" : "{ }"} rows={3} />
                                    ) : (
                                        <SolidInput id={id} type={inputType} step={field.dataType === "number" ? "any" : field.dataType === "integer" ? "1" : undefined}
                                            autoComplete="off" value={value} onChange={(event) => update(event.target.value)} />
                                    )}
                                </label>;
                            })}
                        </div>
                        {inputError && <p className={styles.inputError} role="alert">{inputError}</p>}
                        <div className={styles.inputActions}>
                            {windowControls && <SolidButton type="button" variant="secondary" onClick={() => windowControls.onClose()}>Cancel</SolidButton>}
                            <SolidButton type="submit">Start test</SolidButton>
                        </div>
                    </form>
                </SolidDialogBody>
            </SolidDialog>}
            <div className={`${styles.header} ${externalEmbed ? styles.externalEmbedHeader : ""}`}>
                <div className={styles.headerMark}>
                    <Sparkles size={15} />
                    <span className={styles.statusDot} style={{ background: statusColor }} />
                </div>
                <div className={styles.headerTitle}>
                    <strong>{title}</strong>
                    <span className={styles.headerSub}>{statusText}</span>
                </div>
                {signedIn && (
                    <>
                        <button type="button" className={styles.iconBtn} title="New chat" aria-label="New chat" disabled={agent.working} onClick={() => { runtime?.newChat(); setShowHistory(false); onInputsLocked?.(false); if (!externalEmbed && agentRuntime === "agentHub" && requiredInputs.length && inputs === undefined) { setCollectedInputs(null); setInputError(""); } }}>
                            <Plus size={16} />
                        </button>
                        {!externalEmbed && <button
                            type="button"
                            className={styles.iconBtn}
                            title="History"
                            aria-label="Chat history"
                            aria-pressed={showHistory}
                            onClick={() => setShowHistory((v) => !v)}
                        >
                            <History size={16} />
                        </button>}
                        {!externalEmbed && <button
                            type="button"
                            className={styles.iconBtn}
                            title={signedInAs ? `Sign out of the agent (${String(signedInAs)})` : "Sign out of the agent"}
                            aria-label="Sign out of the agent"
                            onClick={() => { setShowHistory(false); void signOutOfAgent(agentUrl); }}
                        >
                            <LogOut size={15} />
                        </button>}
                    </>
                )}
                {(!embedded || windowControls) && (
                    <>
                        {windowMode !== "docked" && (
                            <button type="button" className={styles.iconBtn} title="Dock to the side" aria-label="Dock to the side" onClick={() => windowControls ? windowControls.onDock() : setMode("docked")}>
                                <PanelRight size={16} />
                            </button>
                        )}
                        {windowMode === "maximized" ? (
                            <button type="button" className={styles.iconBtn} title="Restore" aria-label="Restore size" onClick={() => windowControls ? windowControls.onRestore() : setMode("compact")}>
                                <Minimize2 size={15} />
                            </button>
                        ) : (
                            <button type="button" className={styles.iconBtn} title="Maximize" aria-label="Maximize" onClick={() => windowControls ? windowControls.onMaximize() : setMode("maximized")}>
                                <Maximize2 size={15} />
                            </button>
                        )}
                        <button type="button" className={styles.iconBtn} title={windowControls ? "Close test agent" : "Minimize (Esc)"} aria-label={windowControls ? "Close test agent" : "Minimize"} onClick={() => windowControls ? windowControls.onClose() : setMode("bubble")}>
                            {windowControls || windowMode !== "compact" ? <X size={16} /> : <Minus size={16} />}
                        </button>
                    </>
                )}
            </div>

            {agentAuth.status === "checking" ? (
                <div style={{ flex: "1 1 auto" }} />
            ) : agentAuth.status === "signedOut" ? (
                // The agent forgot the token (expired/restarted) if it already reported an auth error.
                externalEmbed ? <div className={styles.notice} role="status">Connecting to your agent…</div>
                    : <AgentSignIn agentUrl={agentUrl} expired={!!agent.authError} />
            ) : (
                <>
                {offline && (
                    <div className={styles.banner} role="status">
                        <WifiOff size={14} /> Reconnecting to the agent… Your messages will be sent once it is back.
                    </div>
                )}
                {agentRuntime === "agentHub" && staleAgentConfig && (
                    <div className={styles.banner} role="status">
                        This session is using an older agent configuration. Ask an administrator to restart the agent, then sign in again to load the latest version.
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
                        working={agent.working}
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
                    modelIndicator={<AgentModelIndicator assignments={modelAssignments} />}
                />
                </>
            )}
        </>
    );
}
