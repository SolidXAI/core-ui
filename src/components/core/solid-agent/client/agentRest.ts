import { clearAgentAuth, loadAgentAuth } from "./agentAuth";
import type { AgentUploadedAttachment } from "../types";

export const HISTORY_PAGE_SIZE = 50;

export type AgentSessionSummary = {
    session_id: string;
    status: string;
    totalSteps: number;
    created_at: string | null;
    preview: string;
};

export type AgentHistoryPage = { messages: any[]; has_more: boolean };
export type AgentConfigVersionStatus = {
    processConfigVersion: number;
    latestConfigVersion: number;
    stale: boolean;
};

/** Calls the agent at the `httpUrl` named at sign-in, with `Authorization: Bearer <agentToken>`; null when signed out or on error. */
async function agentFetch<T>(agentUrl: string, path: string, init: RequestInit = {}): Promise<T | null> {
    const auth = await loadAgentAuth(agentUrl);
    if (!auth) return null;
    const res = await fetch(`${auth.httpUrl.replace(/\/$/, "")}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${auth.agentToken}`, ...(init.headers ?? {}) },
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

export function fetchAgentConfigVersionStatus(agentUrl: string) {
    return agentFetch<AgentConfigVersionStatus>(agentUrl, "/api/agent/config-version", { cache: "no-store" });
}

export function deleteSession(agentUrl: string, sessionId: string) {
    return agentFetch<unknown>(agentUrl, `/api/agent/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

/** Upload files through Agent Hub, which forwards them to SolidX media storage with the caller's API key. */
export async function uploadAgentHubAttachments(agentUrl: string, files: File[]): Promise<AgentUploadedAttachment[]> {
    const auth = await loadAgentAuth(agentUrl);
    if (!auth) throw new Error("Sign in to the agent before uploading files.");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`${auth.httpUrl.replace(/\/$/, "")}/api/agent/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.agentToken}` },
        body: formData,
    });
    if (response.status === 401) clearAgentAuth(agentUrl);
    if (!response.ok) {
        let message = "File upload failed.";
        try {
            const body = await response.json();
            message = body?.detail ?? body?.message ?? message;
            if (Array.isArray(message)) message = message.join(", ");
        } catch {
            // Keep a useful generic error if the runtime did not return JSON.
        }
        throw new Error(String(message));
    }
    const body = await response.json();
    if (!Array.isArray(body?.attachments)) throw new Error("The agent returned an invalid file upload response.");
    return body.attachments as AgentUploadedAttachment[];
}
