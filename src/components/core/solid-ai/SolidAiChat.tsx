import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SolidSelect } from "../../shad-cn-ui/SolidSelect";
import { loadSession } from "../../../adapters/auth/storage";
import styles from "./SolidAiChat.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToolProgressStep {
    label: string;
    status: "running" | "done";
    durationMs?: number;
}

interface Message {
    id: string;
    role: "user" | "assistant" | "event";
    content: string;
    timestamp: Date;
    // event messages only
    eventState?: "active" | "done";
    // tool call events only
    toolName?: string;
    toolDesc?: string;
    toolProgress?: ToolProgressStep[];
    durationMs?: number;
    toolStatus?: "success" | "warning" | "error";
    toolOutput?: string;
    // step tracking for dividers
    step?: number;
    // error flag for styled error bubble
    isError?: boolean;
}

interface SessionSummary {
    session_id: string;
    status: string;
    total_steps: number;
    created_at: string | null;
    preview: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WS_URL = "ws://localhost:8765/ws/agent";
const API_BASE = "http://localhost:8765";
const RECONNECT_DELAY = 3000;
const PAGE_SIZE = 50;

// ── Session persistence ───────────────────────────────────────────────────────
// Module-level vars survive sidebar collapse; localStorage survives hard reload.
const LS_SESSION_ID = "solidx.ai.session_id";
const LS_HISTORY_ID = "solidx.ai.history_session_id";

function readLS(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function writeLS(key: string, val: string | null) {
    try { val ? localStorage.setItem(key, val) : localStorage.removeItem(key); } catch { /* ignore */ }
}

let _persistedSessionId: string | null = readLS(LS_SESSION_ID);
let _historySessionId: string | null = readLS(LS_HISTORY_ID);

// ── Models ────────────────────────────────────────────────────────────────────

const MODELS = [
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
    { label: "Gemini 1.5 Pro", value: "gemini-1-5-pro" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSessionDate(iso: string | null): string {
    if (!iso) return "Unknown date";
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button className={styles.CopyBtn} onClick={handleCopy} title="Copy" aria-label="Copy message">
            <i className={`pi ${copied ? "pi-check" : "pi-copy"}`} style={{ fontSize: "11px" }} />
        </button>
    );
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
    const [copied, setCopied] = useState(false);
    const code = String(children ?? "").replace(/\n$/, "");
    const lang = className?.replace("language-", "") ?? "";
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className={styles.CodeBlockWrapper}>
            <div className={styles.CodeBlockHeader}>
                <span className={styles.CodeLang}>{lang || "code"}</span>
                <button className={styles.CodeCopyBtn} onClick={handleCopy}>
                    <i className={`pi ${copied ? "pi-check" : "pi-copy"}`} style={{ fontSize: "11px" }} />
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className={styles.CodePre}><code>{code}</code></pre>
        </div>
    );
}

const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
        // Detect by className — only named fenced blocks (```lang) become CodeBlock.
        // Inline backticks and unnamed fenced blocks render as inline code.
        const isBlock = /language-/.test(className || "");
        if (!isBlock) return <code className={styles.InlineCode} {...props}>{children}</code>;
        return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    pre({ children }: any) { return <>{children}</>; },
    table({ children }: any) {
        return <div className={styles.MarkdownTableWrapper}><table>{children}</table></div>;
    },
};

// ── Tool helpers ──────────────────────────────────────────────────────────────

const TOOL_CATEGORIES: Record<string, string[]> = {
    "Read": ["solid_get_module_metadata", "solid_get_model_metadata", "solid_get_field_metadata", "solid_get_layout_context", "select_relevant_code_context"],
    "Create": ["solid_create_module", "solid_create_model_with_fields", "solid_add_fields_to_model", "solid_modify_fields_in_model", "solid_update_layout", "solid_patch_layout", "solid_add_or_update_menu", "edit_solid_code"],
    "Chat": ["solid_chat_with_ozzy"],
    "Shell": ["bash"],
};

function getToolCategory(name: string): string {
    for (const [cat, tools] of Object.entries(TOOL_CATEGORIES)) {
        if (tools.includes(name)) return cat;
    }
    return "Tool";
}

function getToolIconClass(name: string): string {
    if (name === "bash") return "pi-terminal";
    const cat = getToolCategory(name);
    if (cat === "Read") return "pi-search";
    if (cat === "Create") return "pi-file-edit";
    if (cat === "Chat") return "pi-comments";
    return "pi-cog";
}

function describeToolArgs(args: Record<string, unknown>): string {
    const priority = ["cmd", "command", "query", "path", "file", "module_name", "model_name", "name", "id", "content"];
    for (const key of priority) {
        if (args[key] != null) {
            const val = String(args[key]).trim().replace(/\n/g, " ");
            return val.length > 72 ? val.slice(0, 72) + "…" : val;
        }
    }
    const first = Object.values(args)[0];
    if (first != null) {
        const val = String(first).trim().replace(/\n/g, " ");
        return val.length > 72 ? val.slice(0, 72) + "…" : val;
    }
    return "";
}

function formatDuration(ms?: number): string {
    if (ms == null) return "";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Parses tool output to extract semantic status and clean display text.
 * Handles nested JSON structures like the Solid agent uses.
 */
function parseToolResult(output: string): { status: Message["toolStatus"]; text: string } {
    if (!output) return { status: "success", text: "" };
    try {
        const outer = JSON.parse(output);
        let status: Message["toolStatus"] = "success";
        let text = "";

        // The Solid agent often wraps the real result in a 'data' string or object
        const innerData = outer.data;
        if (typeof innerData === "string") {
            try {
                const inner = JSON.parse(innerData);
                if (inner.generation_status === "error" || inner.status === "error") {
                    status = "warning";
                    text = inner.instructions || (inner.errors && inner.errors.join(", ")) || innerData;
                } else {
                    text = inner.message || inner.content || innerData;
                }
            } catch {
                text = innerData;
            }
        } else if (innerData && typeof innerData === "object") {
            if (innerData.generation_status === "error" || innerData.status === "error") {
                status = "warning";
                text = innerData.instructions || (innerData.errors && innerData.errors.join(", ")) || JSON.stringify(innerData);
            } else {
                text = innerData.message || innerData.content || JSON.stringify(innerData);
            }
        } else {
            text = outer.content || outer.message || output;
        }

        // Check if the outer status is error
        if (outer.status === "error" || outer.errors?.length > 0) {
            status = "error";
            text = outer.message || (outer.errors && outer.errors.join(", ")) || text;
        }

        return { status, text: text.length > 500 ? text.slice(0, 500) + "…" : text };
    } catch {
        return { status: "success", text: output.length > 120 ? output.slice(0, 120) + "…" : output };
    }
}

// ── Message grouping ──────────────────────────────────────────────────────────
// Groups consecutive event + assistant messages into a single AI turn so we can
// render the avatar once per turn rather than per message.

type MsgGroup =
    | { kind: "user"; msg: Message }
    | { kind: "ai"; msgs: Message[]; groupKey: string };

function groupMessages(messages: Message[]): MsgGroup[] {
    const result: MsgGroup[] = [];
    let aiBuffer: Message[] = [];
    for (const msg of messages) {
        if (msg.role === "user") {
            if (aiBuffer.length > 0) {
                result.push({ kind: "ai", msgs: aiBuffer, groupKey: aiBuffer[0].id });
                aiBuffer = [];
            }
            result.push({ kind: "user", msg });
        } else {
            aiBuffer.push(msg);
        }
    }
    if (aiBuffer.length > 0) {
        result.push({ kind: "ai", msgs: aiBuffer, groupKey: aiBuffer[0].id });
    }
    return result;
}

/**
 * Maps the new backend "event-based" JSON history into a flattened Message list for UI.
 * Handles merging ToolResult into ToolCalling, and processing StepStarted etc.
 */
function processHistoryEvents(backendMsgs: any[]): Message[] {
    const result: Message[] = [];
    // Tracks the "active" message so we can update its duration/progress inline.
    let currentEventIdx: number | null = null;

    for (const m of backendMsgs) {
        const type = m.event_type;
        const data = m.event_data || {};
        const id = `hist-${m.id}`;
        // The backend ISO timestamp or the current time as fallback.
        const ts = m.timestamp ? new Date(m.timestamp) : new Date();

        switch (type) {
            case "UserMessage":
                result.push({
                    id,
                    role: "user",
                    content: m.content || data.content || "",
                    timestamp: ts,
                });
                currentEventIdx = null;
                break;

            case "AgentStarted":
            case "StepStarted":
                // Create a "Thinking…" event row.
                currentEventIdx = result.length;
                result.push({
                    id,
                    role: "event",
                    content: "Thinking…",
                    timestamp: ts,
                    eventState: "done",
                });
                break;

            case "ToolCalling": {
                const toolName = data.tool_name || m.tool_name || "tool";
                const toolArgs = data.arguments || {};
                currentEventIdx = result.length;
                result.push({
                    id,
                    role: "event",
                    content: toolName,
                    timestamp: ts,
                    eventState: "done",
                    toolName,
                    toolDesc: describeToolArgs(toolArgs),
                });
                break;
            }

            case "ToolProgress": {
                if (currentEventIdx != null) {
                    const label = data.label || "";
                    const progressStatus = data.status || "running";
                    const stepStatus: ToolProgressStep["status"] =
                        progressStatus === "success" || progressStatus === "done" ? "done" : "running";
                    const durationMs: number | undefined = data.duration_ms;

                    const prev = result[currentEventIdx];
                    if (prev && prev.role === "event") {
                        const existing = prev.toolProgress || [];
                        const existingIdx = existing.findIndex((p) => p.label === label);
                        if (existingIdx >= 0) {
                            const updated = [...existing];
                            updated[existingIdx] = {
                                label,
                                status: stepStatus,
                                durationMs: durationMs ?? updated[existingIdx].durationMs,
                            };
                            prev.toolProgress = updated;
                        } else {
                            prev.toolProgress = [...existing, { label, status: stepStatus, durationMs }];
                        }
                    }
                }
                break;
            }

            case "ToolResult": {
                if (currentEventIdx != null) {
                    const prev = result[currentEventIdx];
                    if (prev && prev.role === "event") {
                        prev.durationMs = data.duration_ms || m.duration_ms;
                        const outputStr = data.output || m.content || "";
                        if (outputStr) {
                            const { status, text } = parseToolResult(outputStr);
                            prev.toolStatus = status;
                            prev.toolOutput = text;
                        }
                    }
                }
                break;
            }

            case "LlmComplete":
            case "TurnCompleteEvent":
                result.push({
                    id,
                    role: "assistant",
                    content: m.content || data.content || "",
                    timestamp: ts,
                });
                currentEventIdx = null;
                break;

            case "StepComplete":
            case "AgentComplete":
                currentEventIdx = null;
                break;

            case "AgentError":
            case "error":
                result.push({
                    id,
                    role: "assistant",
                    content: `Error: ${data.error || m.content || "Unknown error"}`,
                    timestamp: ts,
                });
                currentEventIdx = null;
                break;

            default:
                // If it's a simple user/assistant message without a recognized event_type,
                // fall back to the top-level role/content.
                if (m.role === "user" || m.role === "assistant") {
                    result.push({
                        id,
                        role: m.role as "user" | "assistant",
                        content: m.content || "",
                        timestamp: ts,
                    });
                    currentEventIdx = null;
                }
                break;
        }
    }
    return result;
}

// ── Main component ────────────────────────────────────────────────────────────

export const SolidAiChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState("gpt-4o");
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);

    const [showSessionMenu, setShowSessionMenu] = useState(false);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [isDeletingSessionId, setIsDeletingSessionId] = useState<string | null>(null);
    const [expandedToolIds, setExpandedToolIds] = useState<Set<string>>(new Set());

    const sessionMenuRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasStreamedRef = useRef(false);
    const intentionalCloseRef = useRef(false);
    const isPrependingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    // Tracks the id of the current "live" event message so we can update it in-place.
    const liveEventIdRef = useRef<string | null>(null);
    const currentStepRef = useRef<number | null>(null);
    const activeSessionIdRef = useRef<string | null>(_persistedSessionId);

    // ── Close session menu on outside click ──────────────────────────────────
    useEffect(() => {
        if (!showSessionMenu) return;
        const handler = (e: MouseEvent) => {
            if (sessionMenuRef.current && !sessionMenuRef.current.contains(e.target as Node)) {
                setShowSessionMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showSessionMenu]);

    // ── Scroll management ─────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    useEffect(() => {
        if (isPrependingRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
            isPrependingRef.current = false;
        } else {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    // ── History fetch ─────────────────────────────────────────────────────────
    const fetchHistory = useCallback(async (sid: string, page: number, prepend: boolean) => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`${API_BASE}/api/agent/sessions/${sid}/messages?page=${page}&page_size=${PAGE_SIZE}`);
            if (!res.ok) return;
            const data = await res.json();
            const fetched = processHistoryEvents(data.messages ?? []);
            if (prepend) {
                prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
                isPrependingRef.current = true;
                setMessages((prev) => [...fetched, ...prev]);
            } else {
                setMessages(fetched);
            }
            setHasMoreHistory(data.has_more ?? false);
            setHistoryPage(page);
        } catch {
            // silently skip
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // ── Sessions list fetch ───────────────────────────────────────────────────
    const fetchSessions = useCallback(async () => {
        setIsLoadingSessions(true);
        try {
            const userId = loadSession()?.user?.id ?? null;
            const url = userId
                ? `${API_BASE}/api/agent/sessions/history?user_id=${userId}`
                : `${API_BASE}/api/agent/sessions/history`;
            const res = await fetch(url);
            if (!res.ok) return;
            setSessions(await res.json());
        } catch {
            // silently ignore
        } finally {
            setIsLoadingSessions(false);
        }
    }, []);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    const connectWebSocket = useCallback(() => {
        const state = wsRef.current?.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
        intentionalCloseRef.current = false;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setIsConnected(true);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            const userId = loadSession()?.user?.id ?? null;
            if (_persistedSessionId) {
                ws.send(JSON.stringify({ action: "resume_session", session_id: _persistedSessionId, user_id: userId }));
            } else {
                ws.send(JSON.stringify({ action: "start_session", user_id: userId }));
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Filtering: Only process messages for the active session.
                // data.session_id is the primary field; sometimes it's nested in data.data
                const msgSessionId = data.session_id || data.data?.session_id;

                // If we have an active session and the message is for a different one, ignore it.
                // Exception: session_started events are always allowed as they establish the new active ID.
                if (data.type !== "session_started" && msgSessionId && activeSessionIdRef.current && msgSessionId !== activeSessionIdRef.current) {
                    return;
                }

                // Add a new persistent event row, auto-freezing any previous live one.
                // Pass extra fields (toolName, toolDesc, …) for tool card events.
                const addEvent = (content: string, extra?: Partial<Message>) => {
                    const prevId = liveEventIdRef.current;
                    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                    liveEventIdRef.current = id;
                    setMessages((prev) => {
                        const base = prevId
                            ? prev.map((m) => m.id === prevId ? { ...m, eventState: "done" as const } : m)
                            : prev;
                        return [...base, { id, role: "event" as const, content, timestamp: new Date(), eventState: "active" as const, ...extra }];
                    });
                };

                // Freeze the current live event as done.
                const freezeEvent = () => {
                    const id = liveEventIdRef.current;
                    if (!id) return;
                    liveEventIdRef.current = null;
                    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, eventState: "done" as const } : m));
                };

                switch (data.type) {
                    // ── Session lifecycle ──────────────────────────────────
                    case "session_started": {
                        const sid: string = data.session_id;
                        // Prefer the backend's history_session_id if provided.
                        // This fixes the "ID chaining" issue where resuming a restored session
                        // would create a new ID. We want to stick to the "original" ID for history.
                        const historySid: string = data.history_session_id || sid;

                        _persistedSessionId = sid;
                        _historySessionId = historySid;
                        writeLS(LS_SESSION_ID, sid);
                        writeLS(LS_HISTORY_ID, historySid);
                        setSessionId(sid);
                        activeSessionIdRef.current = sid;
                        setActiveHistoryId(historySid);

                        // Only fetch history if we don't have any messages yet (initial load or session switch)
                        setMessages((prev) => {
                            if (prev.length === 0) fetchHistory(historySid, 1, false);
                            return prev;
                        });
                        break;
                    }

                    case "session_ended":
                        setSessionId(null);
                        break;

                    // ── Agent lifecycle ────────────────────────────────────
                    case "AgentStarted":
                        setIsProcessing(true);
                        currentStepRef.current = null;
                        addEvent("Thinking…");
                        break;

                    case "StepStarted": {
                        const step: number = data.data?.step ?? 1;
                        currentStepRef.current = step;
                        // Only create a "Thinking…" row when there's no active live event
                        // (e.g. step 2+ after tool results already froze the previous card).
                        if (!liveEventIdRef.current) addEvent("Thinking…", { step });
                        break;
                    }

                    case "StepComplete":
                        freezeEvent();
                        break;

                    case "ToolResult": {
                        const durationMs: number | undefined = data.data?.duration_ms;
                        const outputStr: string = data.data?.output || "";
                        const id = liveEventIdRef.current;
                        if (id) {
                            setMessages((prev) => prev.map((m) => {
                                if (m.id === id) {
                                    const update: Partial<Message> = { durationMs };
                                    if (outputStr) {
                                        const { status, text } = parseToolResult(outputStr);
                                        update.toolStatus = status;
                                        update.toolOutput = text;
                                    }
                                    return { ...m, ...update };
                                }
                                return m;
                            }));
                        }
                        freezeEvent();
                        break;
                    }

                    case "AgentComplete":
                        freezeEvent();
                        break;

                    // ── LLM streaming ──────────────────────────────────────
                    case "LlmToken": {
                        const delta: string = data.data?.delta ?? "";
                        if (!delta) break;
                        hasStreamedRef.current = true;
                        // Freeze the live event row on the first token, then stream.
                        const evtId = liveEventIdRef.current;
                        liveEventIdRef.current = null;
                        setMessages((prev) => {
                            let msgs = evtId
                                ? prev.map((m) => m.id === evtId ? { ...m, eventState: "done" as const } : m)
                                : prev;
                            const last = msgs[msgs.length - 1];
                            if (last?.role === "assistant" && last.id.startsWith("stream-")) {
                                return [...msgs.slice(0, -1), { ...last, content: last.content + delta }];
                            }
                            return [...msgs, { id: `stream-${Date.now()}`, role: "assistant", content: delta, timestamp: new Date() }];
                        });
                        break;
                    }

                    // ── Tool activity ──────────────────────────────────────
                    case "ToolCalling": {
                        // Each tool call becomes its own card (freezes any "Thinking…" row).
                        const toolName: string = data.data?.tool_name ?? "tool";
                        const toolArgs: Record<string, unknown> = data.data?.arguments ?? {};
                        addEvent(toolName, { toolName, toolDesc: describeToolArgs(toolArgs) });
                        break;
                    }

                    case "ToolProgress": {
                        const label: string = data.data?.label ?? "";
                        const progressStatus: string = data.data?.status ?? "running";
                        const durationMs: number | undefined = data.data?.duration_ms;
                        const stepStatus: ToolProgressStep["status"] =
                            progressStatus === "success" || progressStatus === "done" ? "done" : "running";
                        const id = liveEventIdRef.current;
                        if (!id) break;
                        setMessages((prev) => prev.map((m) => {
                            if (m.id !== id) return m;
                            const existing = m.toolProgress ?? [];
                            const idx = existing.findIndex((p) => p.label === label);
                            if (idx >= 0) {
                                const updated = [...existing];
                                updated[idx] = { label, status: stepStatus, durationMs: durationMs ?? updated[idx].durationMs };
                                return { ...m, toolProgress: updated };
                            }
                            return { ...m, toolProgress: [...existing, { label, status: stepStatus, durationMs }] };
                        }));
                        break;
                    }

                    // ── Turn complete ──────────────────────────────────────
                    case "TurnCompleteEvent":
                    case "turn_complete": {
                        setIsProcessing(false);
                        const content: string = data.data?.content ?? "";
                        // Freeze any remaining live event
                        const evtId = liveEventIdRef.current;
                        liveEventIdRef.current = null;
                        setMessages((prev) => {
                            let msgs = evtId
                                ? prev.map((m) => m.id === evtId ? { ...m, eventState: "done" as const } : m)
                                : prev;
                            if (!hasStreamedRef.current && content) {
                                msgs = [...msgs, { id: `tc-${Date.now()}`, role: "assistant", content, timestamp: new Date() }];
                            }
                            return msgs;
                        });
                        break;
                    }

                    // ── Errors ─────────────────────────────────────────────
                    case "AgentError":
                    case "error": {
                        setIsProcessing(false);
                        const errMsg: string = data.data?.error ?? "Unknown error";
                        const evtId = liveEventIdRef.current;
                        liveEventIdRef.current = null;
                        setMessages((prev) => {
                            const msgs = evtId
                                ? prev.map((m) => m.id === evtId ? { ...m, eventState: "done" as const } : m)
                                : prev;
                            return [...msgs, { id: `err-${Date.now()}`, role: "assistant" as const, content: errMsg, timestamp: new Date(), isError: true }];
                        });
                        break;
                    }

                    default:
                        break;
                }
            } catch {
                // ignore JSON parse errors
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setSessionId(null);
            setIsProcessing(false);
            liveEventIdRef.current = null;
            if (!intentionalCloseRef.current) {
                // Unexpected disconnect — banner is shown via !isConnected state; schedule reconnect.
                reconnectTimerRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY);
            }
        };

        ws.onerror = () => {
            setIsConnected(false);
        };

        wsRef.current = ws;
    }, [fetchHistory]);

    useEffect(() => {
        connectWebSocket();
        return () => {
            reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
            intentionalCloseRef.current = true;
            wsRef.current?.close();
        };
    }, [connectWebSocket]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed || !isConnected || !sessionId || isProcessing) return;

        setIsProcessing(true);
        hasStreamedRef.current = false;
        currentStepRef.current = null;
        liveEventIdRef.current = null;
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() }]);
        wsRef.current?.send(JSON.stringify({ action: "message", session_id: sessionId, content: trimmed }));
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.focus();
        }
    }, [input, isConnected, sessionId, isProcessing]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 480)}px`;
    };

    // ── Session actions ───────────────────────────────────────────────────────
    const handleNewChat = useCallback(() => {
        _persistedSessionId = null;
        _historySessionId = null;
        writeLS(LS_SESSION_ID, null);
        writeLS(LS_HISTORY_ID, null);
        liveEventIdRef.current = null;
        activeSessionIdRef.current = "__switching__";
        setMessages([]);
        setIsProcessing(false);
        setExpandedToolIds(new Set());
        setSessionId(null);
        setActiveHistoryId(null);
        setHasMoreHistory(false);
        setHistoryPage(1);
        setShowSessionMenu(false);
        const userId = loadSession()?.user?.id ?? null;
        wsRef.current?.send(JSON.stringify({ action: "start_session", user_id: userId }));
    }, []);

    const handleSelectSession = useCallback((targetSessionId: string) => {
        if (targetSessionId === activeHistoryId) {
            setShowSessionMenu(false);
            return;
        }
        _persistedSessionId = targetSessionId;
        _historySessionId = targetSessionId;
        writeLS(LS_SESSION_ID, targetSessionId);
        writeLS(LS_HISTORY_ID, targetSessionId);
        liveEventIdRef.current = null;
        activeSessionIdRef.current = targetSessionId;
        setMessages([]);
        setSessionId(null);
        setActiveHistoryId(targetSessionId);
        setExpandedToolIds(new Set());
        setHasMoreHistory(false);
        setHistoryPage(1);
        setShowSessionMenu(false);
        const userId = loadSession()?.user?.id ?? null;
        wsRef.current?.send(JSON.stringify({ action: "resume_session", session_id: targetSessionId, user_id: userId }));
    }, [activeHistoryId]);

    const handleDeleteSession = useCallback(async (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this conversation?")) return;

        setIsDeletingSessionId(targetId);
        try {
            const res = await fetch(`${API_BASE}/api/agent/sessions/${targetId}`, { method: "DELETE" });
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.session_id !== targetId));
                if (targetId === activeHistoryId) {
                    handleNewChat();
                }
            }
        } catch {
            // ignore
        } finally {
            setIsDeletingSessionId(null);
        }
    }, [activeHistoryId, handleNewChat]);

    const handleToggleSessionMenu = useCallback(() => {
        setShowSessionMenu((prev) => { if (!prev) fetchSessions(); return !prev; });
    }, [fetchSessions]);

    const handleLoadOlder = useCallback(() => {
        const sid = _historySessionId ?? sessionId;
        if (!sid || isLoadingHistory) return;
        fetchHistory(sid, historyPage + 1, true);
    }, [sessionId, isLoadingHistory, historyPage, fetchHistory]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const canSend = isConnected && !!sessionId && !!input.trim() && !isProcessing;
    const inputPlaceholder = !isConnected ? "Connecting to server…" : !sessionId ? "Establishing session…" : isProcessing ? "SolidX AI is thinking…" : "Message SolidX AI…";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={styles.Container}>

            {/* ── Header ── */}
            <header className={styles.Header}>
                <div className={styles.LogoBadge}>
                    <i className="pi pi-sparkles" style={{ fontSize: "13px" }} />
                </div>
                <span className={styles.HeaderTitle}>SolidX AI</span>
                <span className={`${styles.StatusDot} ${isProcessing ? styles.StatusRunning : isConnected ? styles.StatusOnline : styles.StatusOffline}`} />
                <span className={styles.StatusLabel}>
                    <i className={`pi ${isConnected ? "pi-wifi" : "pi-times-circle"}`} style={{ fontSize: "11px" }} />
                    {isConnected ? (isProcessing ? "Running…" : sessionId ? "Connected" : "Starting…") : "Offline"}
                </span>

                <div className={styles.HeaderSpacer} />

                <button className={styles.NewChatHeaderBtn} onClick={handleNewChat} title="New conversation">
                    <i className="pi pi-plus" style={{ fontSize: "10px" }} />
                    New Chat
                </button>

                {/* Hamburger + sessions dropdown — rightmost */}
                <div className={styles.SessionMenuAnchor} ref={sessionMenuRef}>
                    <button className={styles.HamburgerBtn} onClick={handleToggleSessionMenu} title="Session history" aria-label="Open session history">
                        <i className="pi pi-bars" style={{ fontSize: "13px" }} />
                    </button>

                    {showSessionMenu && (
                        <div className={styles.SessionMenu}>
                            <button className={styles.SessionMenuNewChat} onClick={handleNewChat}>
                                <i className="pi pi-plus" style={{ fontSize: "12px" }} />
                                New Chat
                            </button>
                            <div className={styles.SessionMenuSectionLabel}>Recent Sessions</div>
                            <div className={styles.SessionList}>
                                {isLoadingSessions ? (
                                    <div className={styles.SessionMenuLoading}>
                                        <i className="pi pi-spin pi-spinner" style={{ fontSize: "11px" }} />
                                        Loading…
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className={styles.SessionMenuEmpty}>No past sessions found</div>
                                ) : (
                                    sessions.map((s) => (
                                        <div
                                            key={s.session_id}
                                            className={`${styles.SessionItem} ${s.session_id === activeHistoryId ? styles.SessionItemActive : ""}`}
                                            onClick={() => handleSelectSession(s.session_id)}
                                        >
                                            <div className={styles.SessionItemMain}>
                                                <span className={styles.SessionItemPreview}>{s.preview || "New conversation"}</span>
                                                <span className={styles.SessionItemMeta}>
                                                    {formatSessionDate(s.created_at)}
                                                    {s.total_steps > 0 && ` · ${s.total_steps} turn${s.total_steps !== 1 ? "s" : ""}`}
                                                </span>
                                            </div>
                                            <button
                                                className={styles.SessionDeleteBtn}
                                                onClick={(e) => handleDeleteSession(e, s.session_id)}
                                                disabled={isDeletingSessionId === s.session_id}
                                                title="Delete conversation"
                                            >
                                                <i className={`pi ${isDeletingSessionId === s.session_id ? "pi-spin pi-spinner" : "pi-trash"}`} style={{ fontSize: "11px" }} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ── Reconnecting banner ── */}
            {!isConnected && (
                <div className={styles.ReconnectBanner}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: "11px" }} />
                    Reconnecting…
                </div>
            )}

            {/* ── Message list ── */}
            <div className={styles.MessageList} ref={scrollRef}>
                {hasMoreHistory && (
                    <div className={styles.LoadOlderWrap}>
                        <button className={styles.LoadOlderBtn} onClick={handleLoadOlder} disabled={isLoadingHistory}>
                            {isLoadingHistory
                                ? <><i className="pi pi-spin pi-spinner" style={{ fontSize: "11px" }} /> Loading…</>
                                : <><i className="pi pi-history" style={{ fontSize: "11px" }} /> Load older messages</>
                            }
                        </button>
                    </div>
                )}

                {isLoadingHistory && messages.length === 0 && (
                    <div className={styles.HistoryLoading}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: "16px" }} />
                        <span>Loading conversation…</span>
                    </div>
                )}

                {messages.length === 0 && !isLoadingHistory && (
                    <div className={styles.EmptyState}>
                        <div className={styles.EmptyIcon}>
                            <i className="pi pi-comments" style={{ fontSize: "28px" }} />
                        </div>
                        <p className={styles.EmptyTitle}>How can I help you today?</p>
                        <p className={styles.EmptySubtitle}>Ask me anything — powered by {MODELS.find((m) => m.value === model)?.label ?? model}.</p>
                    </div>
                )}

                {groupMessages(messages).map((group) => {
                    // ── User message ────────────────────────────────────────
                    if (group.kind === "user") {
                        const msg = group.msg;
                        return (
                            <div key={msg.id} className={`${styles.Row} ${styles.RowUser}`}>
                                {/* Avatar first in DOM → rightmost with row-reverse */}
                                <div className={`${styles.Avatar} ${styles.AvatarUser}`}>
                                    <i className="pi pi-user" style={{ fontSize: "12px" }} />
                                </div>
                                <div className={styles.BubbleGroup}>
                                    <div className={`${styles.Bubble} ${styles.BubbleUser}`}>
                                        <p className={styles.UserText}>{msg.content}</p>
                                    </div>
                                    <div className={`${styles.BubbleMeta} ${styles.BubbleMetaUser}`}>
                                        <span className={styles.Timestamp}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <CopyButton text={msg.content} />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // ── AI turn: avatar once, events + response stacked ─────
                    return (
                        <div key={group.groupKey} className={styles.AiTurnGroup}>
                            <div className={styles.Avatar}>
                                <i className="pi pi-android" style={{ fontSize: "12px" }} />
                            </div>
                            <div className={styles.AiTurnContent}>
                                {group.msgs.flatMap((msg) => {
                                    const items: React.ReactNode[] = [];

                                    // ── Step divider before step > 1 thinking events ──
                                    if (msg.role === "event" && !msg.toolName && msg.step && msg.step > 1) {
                                        items.push(
                                            <div key={`divider-${msg.id}`} className={styles.StepDividerRow}>
                                                <div className={styles.StepDividerLine} />
                                                <span className={styles.StepDividerLabel}>Step {msg.step}</span>
                                                <div className={styles.StepDividerLine} />
                                            </div>
                                        );
                                    }

                                    if (msg.role === "event") {
                                        const active = msg.eventState === "active";

                                        // ── Tool call card ──────────────────────────────
                                        if (msg.toolName) {
                                            const status = msg.toolStatus || (active ? "running" : "success");
                                            const cardClass = status === "running" ? styles.ToolCardRunning :
                                                status === "warning" ? styles.ToolCardWarning :
                                                    status === "error" ? styles.ToolCardError :
                                                        styles.ToolCardDone;

                                            const statusIcon = status === "running" ? "pi-spin pi-spinner" :
                                                status === "warning" ? "pi-exclamation-triangle" :
                                                    status === "error" ? "pi-times-circle" :
                                                        "pi-check-circle";

                                            const statusIconClass = status === "warning" ? styles.ToolCardStatusWarning :
                                                status === "error" ? styles.ToolCardStatusError :
                                                    status === "success" ? styles.ToolCardStatusDone :
                                                        styles.ToolCardStatusIcon;

                                            const hasExpandable = (msg.toolProgress && msg.toolProgress.length > 0) || !!msg.toolOutput;
                                            const isExpanded = expandedToolIds.has(msg.id);
                                            const toggleExpand = hasExpandable && status !== "running"
                                                ? () => setExpandedToolIds((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                                                    return next;
                                                })
                                                : undefined;

                                            items.push(
                                                <div key={msg.id} className={`${styles.ToolCard} ${cardClass}`}>
                                                    <button
                                                        className={styles.ToolCardHeaderBtn}
                                                        onClick={toggleExpand}
                                                        data-expandable={hasExpandable && status !== "running" ? "true" : undefined}
                                                    >
                                                        <i className={`pi ${statusIcon} ${statusIconClass}`} />
                                                        <i className={`pi ${getToolIconClass(msg.toolName)} ${styles.ToolCardToolIcon}`} />
                                                        <span className={styles.ToolCardName}>{msg.toolName}</span>
                                                        {msg.toolDesc && <span className={styles.ToolCardDesc} title={msg.toolDesc}>{msg.toolDesc}</span>}
                                                        <span className={styles.ToolCardBadge}>{getToolCategory(msg.toolName)}</span>
                                                        {msg.durationMs != null && (
                                                            <span className={styles.ToolCardDuration}>{formatDuration(msg.durationMs)}</span>
                                                        )}
                                                        {hasExpandable && status !== "running" && (
                                                            <i className={`pi pi-chevron-right ${styles.ToolCardChevron} ${isExpanded ? styles.ToolCardChevronOpen : ""}`} />
                                                        )}
                                                    </button>
                                                    {/* Progress: always visible while running, collapsible when done */}
                                                    {msg.toolProgress && msg.toolProgress.length > 0 && (status === "running" || isExpanded) && (
                                                        <div className={`${styles.ToolCardProgress} ${styles.ToolCardExpandable}`}>
                                                            {msg.toolProgress.map((p, i) => (
                                                                <div key={i} className={`${styles.ToolProgressItem} ${p.status === "running" ? styles.ToolProgressRunning : styles.ToolProgressDone}`}>
                                                                    <i className={`pi ${p.status === "running" ? "pi-spin pi-spinner" : "pi-check-circle"}`} style={{ fontSize: "10px" }} />
                                                                    <span className={styles.ToolProgressLabel}>{p.label}</span>
                                                                    {p.durationMs != null && p.status === "done" && (
                                                                        <span className={styles.ToolProgressDuration}>{formatDuration(p.durationMs)}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {msg.toolOutput && isExpanded && (
                                                        <div className={`${styles.ToolCardOutput} ${styles.ToolCardExpandable}`}>
                                                            <div className={styles.ToolOutputHeader}>
                                                                <span>Result</span>
                                                            </div>
                                                            <div className={`${styles.ToolOutputText} ${status === "warning" ? styles.ToolOutputWarning : status === "error" ? styles.ToolOutputError : ""}`}>
                                                                {msg.toolOutput}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                            return items;
                                        }

                                        // ── Thinking bubble (active) / done row ─────────
                                        if (active) {
                                            items.push(
                                                <div key={msg.id} className={styles.ThinkingBubble}>
                                                    <div className={styles.ThinkingDots}>
                                                        <span className={styles.ThinkingDot} />
                                                        <span className={styles.ThinkingDot} />
                                                        <span className={styles.ThinkingDot} />
                                                    </div>
                                                    <span className={styles.ThinkingLabel}>
                                                        {msg.step && msg.step > 1 ? `Thinking...` : "Thinking…"}
                                                    </span>
                                                </div>
                                            );
                                        } else {
                                            items.push(
                                                <div key={msg.id} className={`${styles.EventRow} ${styles.EventRowDone}`}>
                                                    <i className="pi pi-check-circle" />
                                                    <span>{msg.content}</span>
                                                </div>
                                            );
                                        }
                                        return items;
                                    }

                                    // ── Error bubble ────────────────────────────────────
                                    if (msg.isError) {
                                        items.push(
                                            <div key={msg.id} className={styles.ErrorBubble}>
                                                <div className={styles.ErrorIcon}>
                                                    <i className="pi pi-exclamation-circle" style={{ fontSize: "13px" }} />
                                                </div>
                                                <div className={styles.ErrorContent}>
                                                    <p className={styles.ErrorTitle}>Error</p>
                                                    <p className={styles.ErrorText}>{msg.content}</p>
                                                </div>
                                            </div>
                                        );
                                        return items;
                                    }

                                    // ── Assistant message ───────────────────────────────
                                    const isStreaming = msg.id.startsWith("stream-") && isProcessing;
                                    items.push(
                                        <div key={msg.id} className={styles.BubbleGroup}>
                                            <div className={`${styles.Bubble} ${styles.BubbleAssistant}`}>
                                                <div className={styles.MarkdownRoot}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {isStreaming && <span className={styles.StreamingCursor} />}
                                            </div>
                                            <div className={`${styles.BubbleMeta} ${styles.BubbleMetaAssistant}`}>
                                                <span className={styles.Timestamp}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                <CopyButton text={msg.content} />
                                            </div>
                                        </div>
                                    );
                                    return items;
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Input area ── */}
            <div className={styles.InputArea}>
                <div className={`${styles.InputBox} ${!isConnected || !sessionId ? styles.InputBoxDisabled : ""}`}>
                    <textarea
                        ref={textareaRef}
                        className={styles.Textarea}
                        placeholder={inputPlaceholder}
                        value={input}
                        onChange={autoResize}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected || !sessionId || isProcessing}
                        rows={1}
                    />
                </div>

                {/* ── Taskbar ── */}
                <div className={styles.InputFooter}>
                    <div className={styles.InputModelWrap}>
                        <SolidSelect
                            value={model}
                            options={MODELS}
                            onChange={(e) => setModel(e.value)}
                            className={styles.ModelSelect}
                        />
                    </div>
                    <div className={styles.TaskBarSpacer} />
                    <button
                        className={`${styles.SendBtn} ${canSend ? styles.SendBtnActive : ""}`}
                        disabled={!canSend}
                        onClick={handleSend}
                        aria-label="Send message"
                    >
                        <i className="pi pi-send" style={{ fontSize: "13px" }} />
                    </button>
                </div>
            </div>

        </div>
    );
};
