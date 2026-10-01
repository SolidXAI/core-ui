import { getSession } from "../../../../adapters/auth/getSession";
import { toHttpBase } from "./agentUrls";

/**
 * Agent login (same flow as the SolidX agent-ui).
 *
 * The user pastes a Solid API key once; POST <agent>/api/agent/api-keys/me checks it with Solid and
 * returns a random `agentToken` plus a few public user fields. The API key stays on the agent
 * server. The UI keeps `{ agentToken, user }` in sessionStorage, so it is gone when the tab closes,
 * and sends the agentToken on every WebSocket frame and REST call. One entry per agent backend.
 * An entry is also tied to the Solid user who created it, so another user in the same tab never
 * reuses it.
 */

export type AgentUser = { id?: number | string; username?: string; email?: string; mobile?: string; [key: string]: unknown };

export type AgentAuth = { agentToken: string; user: AgentUser; solidUserId: string | null };

export type AgentSignInResult = { ok: true } | { ok: false; error: string; status: number };

const STORAGE_PREFIX = "solidx.agent-session:";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function storageKey(agentUrl: string) {
    return `${STORAGE_PREFIX}${toHttpBase(agentUrl)}`;
}

function notify(agentUrl: string) {
    listeners.get(toHttpBase(agentUrl))?.forEach((listener) => listener());
}

async function currentSolidUserId(): Promise<string | null> {
    const session = await getSession();
    const id = (session as any)?.user?.id;
    return id === undefined || id === null ? null : String(id);
}

function readStored(agentUrl: string): AgentAuth | null {
    try {
        const raw = sessionStorage.getItem(storageKey(agentUrl));
        const parsed = raw ? (JSON.parse(raw) as AgentAuth) : null;
        return parsed?.agentToken ? parsed : null;
    } catch {
        return null;
    }
}

/** The stored login for this agent backend, if it belongs to the signed-in Solid user. */
export async function loadAgentAuth(agentUrl: string): Promise<AgentAuth | null> {
    const stored = readStored(agentUrl);
    if (!stored) return null;
    if (stored.solidUserId !== (await currentSolidUserId())) {
        clearAgentAuth(agentUrl);
        return null;
    }
    return stored;
}

export function clearAgentAuth(agentUrl: string) {
    try {
        sessionStorage.removeItem(storageKey(agentUrl));
    } catch {
        // Storage blocked: nothing was stored.
    }
    notify(agentUrl);
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

/** Exchanges a Solid API key for an agentToken and stores it for this tab. */
export async function signInWithApiKey(agentUrl: string, apiKey: string): Promise<AgentSignInResult> {
    const key = apiKey.trim();
    if (!key) return { ok: false, error: "Enter your API key.", status: 0 };
    try {
        const res = await fetch(`${toHttpBase(agentUrl)}/api/agent/api-keys/me`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: key }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
            const detail = typeof body?.detail === "string" ? body.detail : null;
            return { ok: false, error: detail ?? `Sign-in failed (HTTP ${res.status}).`, status: res.status };
        }
        if (typeof body?.agentToken !== "string" || !body.agentToken) {
            return { ok: false, error: "The agent did not return a token.", status: res.status };
        }
        const auth: AgentAuth = { agentToken: body.agentToken, user: body.user ?? {}, solidUserId: await currentSolidUserId() };
        sessionStorage.setItem(storageKey(agentUrl), JSON.stringify(auth));
        notify(agentUrl);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Could not reach the agent.", status: 0 };
    }
}

/** Calls `listener` whenever this agent backend's login is stored or cleared. Returns an unsubscribe. */
export function onAgentAuthChange(agentUrl: string, listener: Listener) {
    const base = toHttpBase(agentUrl);
    if (!listeners.has(base)) listeners.set(base, new Set());
    listeners.get(base)!.add(listener);
    return () => {
        listeners.get(base)?.delete(listener);
    };
}
