/**
 * Shared types for the SolidX Agent chat (launcher, window, thread).
 *
 * Wire format: every agent payload carries `event_type` and `event_data`. When
 * `event_data.widget` names a registered chat widget, that widget renders the event;
 * otherwise the event is rendered by the default widget for its `event_type`.
 * (Legacy frames `{ type, data }` are normalised to the same shape.)
 * The widget contract itself (SolidChatWidgetProps) lives in types/solid-core.d.ts.
 */

/** Page context passed with a prompt so the agent knows where the user is. */
export type AgentContext = {
    module?: string;
    model?: string;
    recordId?: string | number;
    route?: string;
    [key: string]: unknown;
};

export type AgentMode = "bubble" | "compact" | "docked" | "maximized";

/**
 * Which agent backend a chat talks to: "solidx" (setting solidxAgentBackendUrl; the floating
 * launcher) or "agentHub" (setting solidxAgentHubBackendUrl).
 */
export type AgentRuntimeType = "solidx" | "agentHub";
export type AgentModelAssignment = { provider: string; model: string } | null;
export type AgentModelAssignments = { reasoning: AgentModelAssignment; fast: AgentModelAssignment };
/** @deprecated Use AgentRuntimeType. */
export type AgentType = AgentRuntimeType;

export type AgentConnection = "idle" | "connecting" | "open" | "reconnecting" | "offline";

/** A slash command advertised by the agent in `session_started`. */
export type AgentCommand = { name: string; description?: string };

// ── Inbound ───────────────────────────────────────────────────────────────────

/** A frame as it arrives on the socket or from session history (before normalisation). */
export type AgentWireFrame = {
    event_type?: string;
    event_data?: Record<string, any>;
    type?: string;
    data?: Record<string, any>;
    session_id?: string;
    history_session_id?: string;
    [key: string]: any;
};

/** The normalised event every reducer and widget works with. */
export type AgentChatEvent = {
    eventType: string;
    eventData: Record<string, any>;
    /** Top-level fields of the frame (session_id, history_session_id, commands, ...). */
    frame: AgentWireFrame;
};

/** Event types the chat knows by name. Anything else is still rendered (via its widget or the fallback). */
export const AgentEventTypes = {
    sessionStarted: "session_started",
    sessionEnded: "session_ended",
    userMessage: "UserMessage",
    agentStarted: "AgentStarted",
    stepStarted: "StepStarted",
    stepComplete: "StepComplete",
    llmToken: "LlmToken",
    llmComplete: "LlmComplete",
    toolCalling: "ToolCalling",
    toolProgress: "ToolProgress",
    toolResult: "ToolResult",
    turnComplete: "TurnCompleteEvent",
    turnCompleteLegacy: "turn_complete",
    agentComplete: "AgentComplete",
    executionCancelled: "ExecutionCancelled",
    executionCancelledLegacy: "execution_cancelled",
    agentError: "AgentError",
    error: "error",
} as const;

// ── Outbound ──────────────────────────────────────────────────────────────────

export type WidgetReply = { widgetId: string; value: unknown };

/** A file sent inline with a message: text files as text, images base64-encoded (no data: prefix). */
export type AgentAttachmentPayload = {
    name: string;
    mimeType: string;
    size: number;
    encoding: "text" | "base64";
    content: string;
};

/** What the thread shows for an attachment (history only has name/type/size). */
export type AgentAttachmentMeta = {
    mediaId?: number;
    name: string;
    mimeType: string;
    size: number;
    /** data: URL for image thumbnails of files attached in this browser session. */
    previewUrl?: string;
    /** Stored copy in Solid media storage (resolved when a conversation is reopened). */
    url?: string;
};

export type AgentAttachment = { payload: AgentAttachmentPayload; meta: AgentAttachmentMeta; file: File };
export type AgentUploadedAttachment = { id: number; name: string; mimeType: string; size: number };

export type AgentAction =
    | { action: "start_session" }
    | { action: "resume_session"; session_id: string }
    | {
          action: "message";
          session_id: string;
          content: string;
          context?: AgentContext;
          widget_reply?: WidgetReply | null;
          attachments?: AgentAttachmentPayload[] | AgentUploadedAttachment[];
      }
    | { action: "cancel"; session_id: string }
    | { action: "end_session"; session_id: string };

// ── Thread items ──────────────────────────────────────────────────────────────

/**
 * One rendered entry in the thread. `eventData` is the (accumulated) event payload handed to
 * the widget; `widget` is set when the agent named one, otherwise the default for `eventType`.
 */
export type AgentChatItem = {
    id: string;
    at: number;
    eventType: string;
    eventData: Record<string, any>;
    widget?: string;
    widgetId?: string;
    /** Live items (a running tool, a streaming reply) are still updating. */
    live?: boolean;
    /** A final widget accepts no more updates or replies. */
    final?: boolean;
};

/** Options for `solidAgent.open`. */
export type SolidAgentOpenOptions = {
    prompt?: string;
    autoSend?: boolean;
    context?: AgentContext;
    mode?: Exclude<AgentMode, "bubble">;
};
