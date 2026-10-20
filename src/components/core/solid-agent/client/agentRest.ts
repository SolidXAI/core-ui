import { clearAgentAuth, loadAgentAuth, isExternalAgentAuth, renewExternalAgentAuth } from "./agentAuth";
import type { AgentUploadedAttachment, AgentModelAssignments, AgentProviderInfo, ProviderModelInfo, AgentRuntimeType } from "../types";

export const HISTORY_PAGE_SIZE = 50;

export type AgentSessionSummary = {
    session_id: string;
    status: string;
    totalSteps: number;
    created_at: string | null;
    preview: string;
    title?: string;
    provider?: string;
    model?: string;
    runtime?: AgentRuntimeType;
};

export type AgentHistoryPage = { messages: any[]; has_more: boolean };
export type AgentConfigVersionStatus = {
    processConfigVersion: number;
    latestConfigVersion: number;
    stale: boolean;
};

export type ProviderModelsResponse = {
    provider: string;
    default_model?: string;
    models: ProviderModelInfo[];
};

/** Calls the agent at the `httpUrl` named at sign-in, with `Authorization: Bearer <agentToken>`; null when signed out or on error. */
async function agentFetch<T>(agentUrl: string, path: string, init: RequestInit = {}, retried = false): Promise<T | null> {
    const auth = await loadAgentAuth(agentUrl);
    if (!auth) return null;
    const res = await fetch(`${auth.httpUrl.replace(/\/$/, "")}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${auth.agentToken}`, ...(init.headers ?? {}) },
    });
    // The agent forgot the token (idle 30 min or restarted): sign in again.
    if (res.status === 401) {
        if ((await loadAgentAuth(agentUrl))?.agentToken === auth.agentToken) clearAgentAuth(agentUrl);
        if (!retried && isExternalAgentAuth(agentUrl)) {
            if (!(await loadAgentAuth(agentUrl))) await renewExternalAgentAuth(agentUrl);
            return agentFetch<T>(agentUrl, path, init, true);
        }
    }
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

/** Model labels reported by the connected agent backend (never provider credentials). */
export async function fetchAgentModelAssignments(agentUrl: string): Promise<AgentModelAssignments | null> {
    try {
        const auth = await loadAgentAuth(agentUrl);
        const baseUrl = (auth?.httpUrl || agentUrl).replace(/\/$/, "");
        const headers: Record<string, string> = {};
        if (auth?.agentToken) headers.Authorization = `Bearer ${auth.agentToken}`;
        const res = await fetch(`${baseUrl}/api/agent/models`, { headers, cache: "no-store" });
        if (!res.ok) return null;
        return ((await res.json()) as AgentModelAssignments) ?? null;
    } catch {
        return null;
    }
}

const providersMemoryCache = new Map<string, AgentProviderInfo[]>();
const modelsMemoryCache = new Map<string, ProviderModelsResponse>();

/** Synchronously returns cached providers from memory or session storage to avoid layout buffering on remount. */
export function getCachedAgentProviders(agentUrl: string): AgentProviderInfo[] {
    const mem = providersMemoryCache.get(agentUrl);
    if (mem && mem.length > 0) return mem;
    try {
        const stored = sessionStorage.getItem(`solid-agent.cached-providers.${agentUrl}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                providersMemoryCache.set(agentUrl, parsed);
                return parsed;
            }
        }
    } catch {
        // ignore storage errors
    }
    return [];
}

/** Synchronously returns cached provider models from memory or session storage. */
export function getCachedProviderModels(agentUrl: string, providerId: string): ProviderModelsResponse | null {
    const key = `${agentUrl}::${providerId}`;
    const mem = modelsMemoryCache.get(key);
    if (mem) return mem;
    try {
        const stored = sessionStorage.getItem(`solid-agent.cached-models.${key}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
                modelsMemoryCache.set(key, parsed);
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

/** List installed execution providers (both native SolidX and CLI agents). */
export async function fetchAgentProviders(agentUrl: string): Promise<AgentProviderInfo[]> {
    try {
        const auth = await loadAgentAuth(agentUrl);
        const baseUrl = (auth?.httpUrl || agentUrl).replace(/\/$/, "");
        const headers: Record<string, string> = {};
        if (auth?.agentToken) headers.Authorization = `Bearer ${auth.agentToken}`;
        const res = await fetch(`${baseUrl}/api/agent/providers`, { headers });
        if (!res.ok) return getCachedAgentProviders(agentUrl);
        const data = await res.json();
        const list = Array.isArray(data?.providers) ? data.providers : [];
        if (list.length > 0) {
            providersMemoryCache.set(agentUrl, list);
            try {
                sessionStorage.setItem(`solid-agent.cached-providers.${agentUrl}`, JSON.stringify(list));
            } catch {
                // ignore
            }
        }
        return list;
    } catch {
        return getCachedAgentProviders(agentUrl);
    }
}

/** Return model catalog for a specific provider. */
export async function fetchProviderModels(agentUrl: string, providerId: string): Promise<ProviderModelsResponse | null> {
    const key = `${agentUrl}::${providerId}`;
    try {
        const auth = await loadAgentAuth(agentUrl);
        const baseUrl = (auth?.httpUrl || agentUrl).replace(/\/$/, "");
        const headers: Record<string, string> = {};
        if (auth?.agentToken) headers.Authorization = `Bearer ${auth.agentToken}`;
        const res = await fetch(`${baseUrl}/api/agent/providers/${encodeURIComponent(providerId)}/models`, { headers });
        if (!res.ok) return getCachedProviderModels(agentUrl, providerId);
        const data = (await res.json()) as ProviderModelsResponse;
        if (data && typeof data === "object") {
            modelsMemoryCache.set(key, data);
            try {
                sessionStorage.setItem(`solid-agent.cached-models.${key}`, JSON.stringify(data));
            } catch {
                // ignore
            }
        }
        return data;
    } catch {
        return getCachedProviderModels(agentUrl, providerId);
    }
}

const SESSION_TITLES_STORAGE_KEY = "solid-agent.session-titles";

export function getStoredSessionTitles(agentUrl: string): Record<string, string> {
    try {
        const raw = localStorage.getItem(`${SESSION_TITLES_STORAGE_KEY}.${agentUrl}`);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

export function setStoredSessionTitle(agentUrl: string, sessionId: string, title: string): void {
    try {
        const titles = getStoredSessionTitles(agentUrl);
        const trimmed = title.trim();
        if (trimmed) {
            titles[sessionId] = trimmed;
        } else {
            delete titles[sessionId];
        }
        localStorage.setItem(`${SESSION_TITLES_STORAGE_KEY}.${agentUrl}`, JSON.stringify(titles));
    } catch {
        // ignore storage errors
    }
}

export async function renameSession(agentUrl: string, sessionId: string, title: string): Promise<boolean> {
    const trimmed = title.trim();
    setStoredSessionTitle(agentUrl, sessionId, trimmed);
    try {
        const res = await agentFetch<{ status: string; title: string }>(
            agentUrl,
            `/api/agent/sessions/${encodeURIComponent(sessionId)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: trimmed }),
            }
        );
        return !!res;
    } catch {
        return false;
    }
}

export function deleteSession(agentUrl: string, sessionId: string) {
    try {
        const titles = getStoredSessionTitles(agentUrl);
        if (sessionId in titles) {
            delete titles[sessionId];
            localStorage.setItem(`${SESSION_TITLES_STORAGE_KEY}.${agentUrl}`, JSON.stringify(titles));
        }
    } catch {
        // ignore
    }
    return agentFetch<unknown>(agentUrl, `/api/agent/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

/** Upload files through the agent runtime into SolidX media storage. */
export async function uploadAgentAttachments(agentUrl: string, files: File[], retried = false): Promise<AgentUploadedAttachment[]> {
    const auth = await loadAgentAuth(agentUrl);
    if (!auth) throw new Error("Sign in to the agent before uploading files.");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`${auth.httpUrl.replace(/\/$/, "")}/api/agent/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.agentToken}` },
        body: formData,
    });
    if (response.status === 401) {
        if ((await loadAgentAuth(agentUrl))?.agentToken === auth.agentToken) clearAgentAuth(agentUrl);
        if (!retried && isExternalAgentAuth(agentUrl)) {
            if (!(await loadAgentAuth(agentUrl))) await renewExternalAgentAuth(agentUrl);
            return uploadAgentAttachments(agentUrl, files, true);
        }
    }
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
