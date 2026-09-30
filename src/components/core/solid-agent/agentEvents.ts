import { describeToolArgs, isLlmMetadata, parseToolResult } from "./agentFormat";
import { AgentEventTypes, type AgentChatEvent, type AgentChatItem, type AgentCommand, type AgentWireFrame } from "./types";

/**
 * Turns agent events into thread items. Used by agentSlice for live socket frames and by the
 * history loader for stored events, so both render identically.
 *
 * Rule: if `event_data.widget` is present the event becomes (or updates) a widget item rendered
 * by that registered widget; otherwise the `event_type` switch below decides what, if anything,
 * to add, and the thread renders it with the default widget for its type.
 */

/** The slice of chat state this reducer reads and writes (agentSlice state satisfies it). */
export type AgentThreadState = {
    items: AgentChatItem[];
    sessionId: string | null;
    historySessionId: string | null;
    commands: AgentCommand[];
    working: boolean;
    thinking: boolean;
    authError: string | null;
    liveToolId: string | null;
    streamingId: string | null;
    turnStreamed: boolean;
};

export function createThreadState(): AgentThreadState {
    return {
        items: [],
        sessionId: null,
        historySessionId: null,
        commands: [],
        working: false,
        thinking: false,
        authError: null,
        liveToolId: null,
        streamingId: null,
        turnStreamed: false,
    };
}

/** Accepts `{ event_type, event_data }` (current) and `{ type, data }` (legacy) frames. */
export function normalizeAgentFrame(frame: AgentWireFrame): AgentChatEvent {
    const eventType = frame.event_type ?? frame.type ?? "";
    const raw = frame.event_data ?? frame.data ?? {};
    const eventData = typeof raw === "object" && raw !== null ? raw : { value: raw };
    return { eventType, eventData, frame };
}

let seq = 0;
export const nextItemId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

function findItem(state: AgentThreadState, id: string | null) {
    return id ? state.items.find((item) => item.id === id) ?? null : null;
}

function freezeLiveTool(state: AgentThreadState) {
    const tool = findItem(state, state.liveToolId);
    if (tool) tool.live = false;
    state.liveToolId = null;
}

function stopStreaming(state: AgentThreadState) {
    const streaming = findItem(state, state.streamingId);
    if (streaming) streaming.live = false;
    state.streamingId = null;
}

function endTurn(state: AgentThreadState) {
    freezeLiveTool(state);
    stopStreaming(state);
    state.working = false;
    state.thinking = false;
}

function lastAssistantText(state: AgentThreadState): string | undefined {
    for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        if (item.eventType === AgentEventTypes.llmComplete && !item.widget) return item.eventData.content;
        if (item.eventType === AgentEventTypes.userMessage) return undefined;
    }
    return undefined;
}

function pushAssistantText(state: AgentThreadState, content: string, at: number) {
    freezeLiveTool(state);
    state.items.push({ id: nextItemId("llm"), at, eventType: AgentEventTypes.llmComplete, eventData: { content } });
}

/** Adds or updates the widget item named by `event_data.widget`. */
function applyWidgetEvent(state: AgentThreadState, event: AgentChatEvent, at: number) {
    const { eventType, eventData } = event;
    const widgetId: string = eventData.widgetId ?? eventData.widget_id ?? nextItemId(eventType || "widget");
    const existing = state.items.find((item) => item.widgetId === widgetId);
    if (existing) {
        if (existing.final) return;
        existing.eventType = eventType;
        existing.eventData = eventData;
        existing.widget = eventData.widget;
        existing.final = !!eventData.final;
        return;
    }
    freezeLiveTool(state);
    stopStreaming(state);
    state.items.push({ id: nextItemId("w"), at, eventType, eventData, widget: eventData.widget, widgetId, final: !!eventData.final });
    state.thinking = false;
}

/**
 * Applies one event. `replay` is true when rebuilding from stored history: user messages then
 * come from the event stream (live ones are added locally when the user sends them).
 */
export function applyAgentEvent(state: AgentThreadState, event: AgentChatEvent, replay = false, at = Date.now()) {
    const { eventType, eventData, frame } = event;
    const hasWidget = typeof eventData.widget === "string" && eventData.widget.length > 0;

    if (hasWidget) {
        applyWidgetEvent(state, event, at);
        // Widget events still close the turn when they are end-of-turn events.
        switch (eventType) {
            case AgentEventTypes.turnComplete:
            case AgentEventTypes.turnCompleteLegacy:
            case AgentEventTypes.executionCancelled:
            case AgentEventTypes.executionCancelledLegacy:
            case AgentEventTypes.agentError:
            case AgentEventTypes.error:
                endTurn(state);
                break;
        }
        return;
    }

    switch (eventType) {
        case AgentEventTypes.sessionStarted: {
            const sessionId = frame.session_id ?? eventData.session_id ?? null;
            state.sessionId = sessionId;
            state.historySessionId = frame.history_session_id ?? eventData.history_session_id ?? sessionId;
            const commands = frame.commands ?? eventData.commands;
            if (Array.isArray(commands)) state.commands = commands;
            state.authError = null;
            break;
        }

        case AgentEventTypes.sessionEnded:
            state.sessionId = null;
            break;

        case AgentEventTypes.userMessage:
            if (replay) {
                const content = eventData.content ?? frame.content ?? "";
                const attachments = Array.isArray(eventData.attachments) ? eventData.attachments : [];
                if (content || attachments.length) {
                    // agentEventId lets the UI fetch the stored attachment files (agentEvent media) later.
                    const eventData = attachments.length ? { content, attachments, agentEventId: frame.id } : { content };
                    state.items.push({ id: nextItemId("u"), at, eventType, eventData });
                }
                state.liveToolId = null;
            }
            break;

        case AgentEventTypes.agentStarted:
        case AgentEventTypes.stepStarted:
            if (!replay) {
                state.working = true;
                if (!state.liveToolId) state.thinking = true;
            }
            break;

        case AgentEventTypes.stepComplete:
        case AgentEventTypes.agentComplete:
            freezeLiveTool(state);
            break;

        case AgentEventTypes.toolCalling: {
            freezeLiveTool(state);
            stopStreaming(state);
            const toolName = eventData.tool_name ?? frame.tool_name ?? "tool";
            const args = eventData.arguments ?? {};
            const id = nextItemId("tool");
            state.items.push({
                id,
                at,
                eventType,
                eventData: { tool_name: toolName, arguments: args, summary: describeToolArgs(args, toolName) },
                live: !replay,
            });
            state.liveToolId = id;
            state.thinking = false;
            break;
        }

        case AgentEventTypes.toolProgress: {
            const tool = findItem(state, state.liveToolId);
            if (!tool) break;
            const label = eventData.label ?? "";
            const status = eventData.status === "success" || eventData.status === "done" ? "done" : "running";
            const progress: any[] = tool.eventData.progress ?? [];
            const index = progress.findIndex((step) => step.label === label);
            const step = { label, status, duration_ms: eventData.duration_ms ?? progress[index]?.duration_ms };
            tool.eventData = { ...tool.eventData, progress: index >= 0 ? progress.map((entry, i) => (i === index ? step : entry)) : [...progress, step] };
            break;
        }

        case AgentEventTypes.toolResult: {
            const tool = findItem(state, state.liveToolId);
            if (tool) {
                const output = eventData.output ?? frame.content ?? "";
                const parsed = output ? parseToolResult(String(output)) : null;
                tool.eventData = {
                    ...tool.eventData,
                    duration_ms: eventData.duration_ms ?? frame.duration_ms,
                    ...(parsed ? { status: parsed.status, output: parsed.text, output_raw: String(output) } : {}),
                };
            }
            freezeLiveTool(state);
            if (!replay) state.thinking = true;
            break;
        }

        case AgentEventTypes.llmToken: {
            const delta: string = eventData.delta ?? "";
            if (!delta) break;
            freezeLiveTool(state);
            state.thinking = false;
            state.turnStreamed = true;
            const streaming = findItem(state, state.streamingId);
            if (streaming) {
                streaming.eventData = { ...streaming.eventData, content: `${streaming.eventData.content ?? ""}${delta}` };
            } else {
                const id = nextItemId("stream");
                state.items.push({ id, at, eventType: AgentEventTypes.llmComplete, eventData: { content: delta }, live: true });
                state.streamingId = id;
            }
            break;
        }

        case AgentEventTypes.llmComplete: {
            const content: string = eventData.content ?? frame.content ?? "";
            const streamed = findItem(state, state.streamingId);
            stopStreaming(state);
            if (!content || isLlmMetadata(content)) break;
            if (streamed) streamed.eventData = { ...streamed.eventData, content }; // authoritative final text
            else if (lastAssistantText(state) !== content) pushAssistantText(state, content, at);
            break;
        }

        case AgentEventTypes.turnComplete:
        case AgentEventTypes.turnCompleteLegacy: {
            const content: string = eventData.content ?? frame.content ?? "";
            if (content && !state.turnStreamed && !isLlmMetadata(content) && lastAssistantText(state) !== content) {
                pushAssistantText(state, content, at);
            }
            endTurn(state);
            state.turnStreamed = false;
            break;
        }

        case AgentEventTypes.executionCancelled:
        case AgentEventTypes.executionCancelledLegacy:
            endTurn(state);
            state.items.push({ id: nextItemId("cancel"), at, eventType: AgentEventTypes.executionCancelled, eventData: { message: eventData.message ?? "Stopped." } });
            break;

        case AgentEventTypes.agentError:
        case AgentEventTypes.error: {
            const message: string = eventData.error ?? frame.content ?? "Unknown error";
            endTurn(state);
            if (!replay && /unauthori[sz]ed|access token|lacks required permission/i.test(message)) state.authError = message;
            state.items.push({ id: nextItemId("err"), at, eventType: AgentEventTypes.agentError, eventData: { error: message } });
            break;
        }

        default:
            // Bookkeeping events (LlmRequest, SkillActivation, ...) are not rendered without a widget.
            break;
    }
}

/** Rebuilds thread items from stored session events (`/api/agent/sessions/{id}/messages`). */
export function historyToItems(rows: any[]): AgentChatItem[] {
    const state = createThreadState();
    for (const row of rows) {
        const frame: AgentWireFrame = { ...row, event_type: row.event_type ?? (row.role === "user" ? AgentEventTypes.userMessage : row.role === "assistant" ? AgentEventTypes.llmComplete : "") };
        const at = row.timestamp ? new Date(row.timestamp).getTime() : Date.now();
        applyAgentEvent(state, normalizeAgentFrame(frame), true, at);
    }
    freezeLiveTool(state);
    stopStreaming(state);
    return state.items;
}
