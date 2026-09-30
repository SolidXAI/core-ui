import { getSession } from "../../../../adapters/auth/getSession";
import { toHttpBase } from "./agentSocket";

export const HISTORY_PAGE_SIZE = 50;

export type AgentSessionSummary = {
    session_id: string;
    status: string;
    total_steps: number;
    created_at: string | null;
    preview: string;
};

export type AgentHistoryPage = { messages: any[]; has_more: boolean };

async function authHeaders(): Promise<Record<string, string> | null> {
    const session = await getSession();
    const token = session?.user?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : null;
}

async function agentFetch<T>(agentUrl: string, path: string, init: RequestInit = {}): Promise<T | null> {
    const headers = await authHeaders();
    if (!headers) return null;
    const res = await fetch(`${toHttpBase(agentUrl)}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
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
