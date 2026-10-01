import { clearAgentAuth, loadAgentAuth } from "./agentAuth";
import { toHttpBase } from "./agentUrls";

export const HISTORY_PAGE_SIZE = 50;

export type AgentSessionSummary = {
    session_id: string;
    status: string;
    total_steps: number;
    created_at: string | null;
    preview: string;
};

export type AgentHistoryPage = { messages: any[]; has_more: boolean };

/** Calls the agent with `Authorization: Bearer <agentToken>`; null when signed out or on error. */
async function agentFetch<T>(agentUrl: string, path: string, init: RequestInit = {}): Promise<T | null> {
    const agentToken = (await loadAgentAuth(agentUrl))?.agentToken;
    if (!agentToken) return null;
    const res = await fetch(`${toHttpBase(agentUrl)}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${agentToken}`, ...(init.headers ?? {}) },
    });
    // The agent forgot the token (idle 30 min or restarted): sign in again.
    if (res.status === 401) clearAgentAuth(agentUrl);
    if (!res.ok) return null;
    return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

/** One page of a session's stored events, oldest first (page 1 = most recent page). */
export function fetchSessionHistory(agentUrl: string, sessionId: string, page = 1) {
    return agentFetch<AgentHistoryPage>(
        agentUrl,
        `/api/agent/sessions/${encodeURIComponent(sessionId)}/messages?page=${page}&page_size=${HISTORY_PAGE_SIZE}`,
    );
}

/** The current user's past conversations (the agent derives the user from the token). */
export function fetchSessionList(agentUrl: string) {
    return agentFetch<AgentSessionSummary[]>(agentUrl, "/api/agent/sessions/history");
}

export function deleteSession(agentUrl: string, sessionId: string) {
    return agentFetch<unknown>(agentUrl, `/api/agent/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}
