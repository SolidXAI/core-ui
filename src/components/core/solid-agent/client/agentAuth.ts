import { getSession } from "../../../../adapters/auth/getSession";
import { agentIdOf, toHttpBase } from "./agentUrls";

/**
 * Agent login (same flow as the SolidX agent-ui).
 *
 * The user pastes a Solid API key once; POST <backend>/api/agent/api-keys/me (with the agentId, if
 * any) checks it with Solid and returns a random `agentToken`, a few public user fields, and where
 * to chat: `wsUrl` for the WebSocket and `httpUrl` for the REST calls. The configured backend URL is
 * only used to sign in and out. The API key stays on the agent server. The UI keeps the reply in
 * sessionStorage, so it is gone when the tab closes, and sends the agentToken on every WebSocket
 * frame and REST call. One entry per agent URL (backend + agent id).
 * An entry is also tied to the Solid user who created it, so another user in the same tab never
 * reuses it.
 */

export type AgentUser = { id?: number | string; username?: string; email?: string; mobile?: string; [key: string]: unknown };

export type AgentAuth = {
    agentToken: string;
    user: AgentUser;
    solidUserId: string | null;
    /** WebSocket URL to chat on. */
    wsUrl: string;
    /** Base URL for the REST calls (sessions, history). */
    httpUrl: string;
};

export type AgentSignInResult = { ok: true } | { ok: false; error: string; status: number };

const STORAGE_PREFIX = "solidx.agent-session:";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

// Embed credentials never enter browser storage or depend on a Solid admin login.
const external = new Map<string, { auth: AgentAuth | null; renew: () => Promise<AgentAuth>; pending?: Promise<void> }>();

export type AgentBootstrap = Pick<AgentAuth, "agentToken" | "wsUrl" | "httpUrl" | "user">;

export function isExternalAgentAuth(agentUrl: string): boolean { return external.has(loginScope(agentUrl)); }

export function registerExternalAgentAuth(agentUrl: string, renew: () => Promise<AgentAuth>) {
    const scope = loginScope(agentUrl);
    const entry = { auth: null as AgentAuth | null, renew };
    external.set(scope, entry);
    return {
        setAuth(auth: AgentAuth) { entry.auth = auth; notify(agentUrl); },
        dispose() { if (external.get(scope) === entry) { external.delete(scope); notify(agentUrl); } },
    };
}

export async function renewExternalAgentAuth(agentUrl: string): Promise<void> {
    const entry = external.get(loginScope(agentUrl));
    if (!entry) return;
    if (!entry.pending) {
        entry.pending = entry.renew().then((auth) => {
            if (external.get(loginScope(agentUrl)) === entry) { entry.auth = auth; notify(agentUrl); }
        }).finally(() => { entry.pending = undefined; });
    }
    return entry.pending;
}

/** One login per backend and agent. */
function loginScope(agentUrl: string) {
    if (/[?&]embedInstance=/.test(agentUrl)) return agentUrl;
    const agentId = agentIdOf(agentUrl);
    return agentId === undefined ? toHttpBase(agentUrl) : `${toHttpBase(agentUrl)}?agentId=${agentId}`;
}

function storageKey(agentUrl: string) {
    return `${STORAGE_PREFIX}${loginScope(agentUrl)}`;
}

function notify(agentUrl: string) {
    listeners.get(loginScope(agentUrl))?.forEach((listener) => listener());
}

async function currentSolidUserId(): Promise<string | null> {
    const session = await getSession();
    const id = (session as any)?.user?.id;
    return id === undefined || id === null ? null : String(id);
}

function readStored(agentUrl: string): AgentAuth | null {
    const embed = external.get(loginScope(agentUrl));
    if (embed) return embed.auth;
    try {
        const raw = sessionStorage.getItem(storageKey(agentUrl));
        const parsed = raw ? (JSON.parse(raw) as AgentAuth) : null;
        // Entries from before sign-in returned wsUrl/httpUrl are dropped, so the user signs in again.
        return parsed?.agentToken && parsed.wsUrl && parsed.httpUrl ? parsed : null;
    } catch {
        return null;
    }
}

/** The stored login for this agent backend, if it belongs to the signed-in Solid user. */
export async function loadAgentAuth(agentUrl: string): Promise<AgentAuth | null> {
    const embed = external.get(loginScope(agentUrl));
    if (embed) return embed.auth;
    const stored = readStored(agentUrl);
    if (!stored) return null;
    if (stored.solidUserId !== (await currentSolidUserId())) {
        clearAgentAuth(agentUrl);
        return null;
    }
    return stored;
}

export function clearAgentAuth(agentUrl: string) {
    const embed = external.get(loginScope(agentUrl));
    if (embed) {
        embed.auth = null;
        notify(agentUrl);
        void renewExternalAgentAuth(agentUrl).catch(() => { /* The embed route displays the failure and retry action. */ });
        return;
    }
    try {
        sessionStorage.removeItem(storageKey(agentUrl));
    } catch {
        // Storage blocked: nothing was stored.
    }
    notify(agentUrl);
}

/**
 * Signs out of the agent: forgets the login in this tab and asks the sign-in backend to forget the
 * token too (`DELETE /api/agent/api-keys/me`). A backend without that call just lets the token expire.
 */
export async function signOutOfAgent(agentUrl: string) {
    const stored = readStored(agentUrl);
    clearAgentAuth(agentUrl);
    if (!stored) return;
    try {
        await fetch(`${toHttpBase(agentUrl)}/api/agent/api-keys/me`, { method: "DELETE", headers: { Authorization: `Bearer ${stored.agentToken}` } });
    } catch {
        // Offline or unknown call: the token still expires when idle.
    }
}

/** Forget every agent login in this tab (e.g. on logout). */
export function clearAllAgentAuth() {
    try {
        Object.keys(sessionStorage)
            .filter((key) => key.startsWith(STORAGE_PREFIX))
            .forEach((key) => sessionStorage.removeItem(key));
    } catch {
        // Storage blocked: nothing was stored.
    }
    listeners.forEach((set) => set.forEach((listener) => listener()));
}

/** The chat's full WebSocket endpoint, as named at sign-in; null until signed in. */
export function agentWsUrl(agentUrl: string): string | null {
    return readStored(agentUrl)?.wsUrl ?? null;
}

/** Checks the process named by the most recent AgentHub login before reusing its WebSocket URL. */
export async function isAgentProcessAvailable(auth: AgentAuth): Promise<boolean> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(`${auth.httpUrl.replace(/\/$/, "")}/health`, {
            cache: "no-store",
            signal: controller.signal,
        });
        if (!response.ok) return false;
        const body = await response.json().catch(() => null);
        return body?.status === "ready";
    } catch {
        return false;
    } finally {
        window.clearTimeout(timeout);
    }
}

/** Exchanges a Solid API key for an agentToken and stores it for this tab. */
export async function signInWithApiKey(agentUrl: string, apiKey: string): Promise<AgentSignInResult> {
    const key = apiKey.trim();
    if (!key) return { ok: false, error: "Enter your API key.", status: 0 };
    try {
        const res = await fetch(`${toHttpBase(agentUrl)}/api/agent/api-keys/me`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: key, agentId: agentIdOf(agentUrl) }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
            const detail = typeof body?.detail === "string" ? body.detail : null;
            return { ok: false, error: detail ?? `Sign-in failed (HTTP ${res.status}).`, status: res.status };
        }
        if (typeof body?.agentToken !== "string" || !body.agentToken) {
            return { ok: false, error: "The agent did not return a token.", status: res.status };
        }
        if (typeof body.wsUrl !== "string" || !body.wsUrl || typeof body.httpUrl !== "string" || !body.httpUrl) {
            return { ok: false, error: "The agent did not say where to connect.", status: res.status };
        }
        const auth: AgentAuth = {
            agentToken: body.agentToken,
            user: body.user ?? {},
            solidUserId: await currentSolidUserId(),
            wsUrl: body.wsUrl,
            httpUrl: body.httpUrl,
        };
        sessionStorage.setItem(storageKey(agentUrl), JSON.stringify(auth));
        notify(agentUrl);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Could not reach the agent.", status: 0 };
    }
}

/** Calls `listener` whenever this agent backend's login is stored or cleared. Returns an unsubscribe. */
export function onAgentAuthChange(agentUrl: string, listener: Listener) {
    const base = loginScope(agentUrl);
    if (!listeners.has(base)) listeners.set(base, new Set());
    listeners.get(base)!.add(listener);
    return () => {
        listeners.get(base)?.delete(listener);
    };
}
