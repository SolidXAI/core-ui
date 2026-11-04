import { useEffect, useState } from "react";
import { solidGet } from "../../../http/solidHttp";
import { getSettingsMap } from "../../../helpers/settingsPayload";
import type { AgentRuntimeType } from "./types";

export type AgentAvailability = {
    ready: boolean;
    enabled: boolean;
    loadFailed: boolean;
    /** Backend URL of the "solidx" runtime (the floating launcher). */
    agentUrl: string | null;
    /** Backend URL per agent type; null when that backend is not configured. */
    agentUrls: Record<AgentRuntimeType, string | null>;
    canUse: boolean;
};

const NO_URLS: Record<AgentRuntimeType, string | null> = { solidx: null, agentHub: null };
const UNAVAILABLE: AgentAvailability = { ready: true, enabled: false, loadFailed: true, agentUrl: null, agentUrls: NO_URLS, canUse: false };

/** Settings key holding each agent type's backend URL (see solid-core default settings). */
const URL_SETTING: Record<AgentRuntimeType, string> = {
    solidx: "solidxAgentBackendUrl",
    agentHub: "solidxAgentHubBackendUrl",
};

/** Solid's response interceptor wraps bodies as { data: <payload> }; descend until `user` shows up. */
function unwrapUser(body: any): any {
    let node = body;
    for (let i = 0; i < 4 && node; i++) {
        if (node.user) return node.user;
        node = node.data;
    }
    return null;
}

function urlSetting(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

let cached: Promise<AgentAvailability> | null = null;

async function loadAvailability(): Promise<AgentAvailability> {
    const config = { params: { agentAvailabilityRefresh: Date.now() } };
    const [settingsRes, meRes] = await Promise.all([solidGet("/setting/wrapped", config), solidGet("/iam/me", config)]);
    const settings = getSettingsMap(settingsRes?.data);
    const enabled = settings.solidAgentEnabled === true || settings.solidAgentEnabled === "true";
    const agentUrls: Record<AgentRuntimeType, string | null> = {
        solidx: urlSetting(settings[URL_SETTING.solidx]),
        agentHub: urlSetting(settings[URL_SETTING.agentHub]),
    };
    const canUse = unwrapUser(meRes?.data)?.canUseAgent === true;
    return { ready: true, enabled, loadFailed: false, agentUrl: agentUrls.solidx, agentUrls, canUse };
}

/**
 * Whether the SolidX Agent can be shown for the current user: the `solidAgentEnabled` setting,
 * the backend URL settings (`solidxAgentBackendUrl`, `solidxAgentHubBackendUrl`), and
 * `canUseAgent` (agent:invoke) from /iam/me. Concurrent mounts share one request;
 * later mounts get current settings and permission values.
 */
export function useAgentAvailability(enabled = true): AgentAvailability {
    const [state, setState] = useState<AgentAvailability>({ ready: false, enabled: false, loadFailed: false, agentUrl: null, agentUrls: NO_URLS, canUse: false });

    useEffect(() => {
        if (!enabled) return;
        let alive = true;
        cached ??= loadAvailability().catch(() => {
            cached = null; // retry on the next mount
            return UNAVAILABLE;
        });
        const request = cached;
        request.then((result) => {
            if (cached === request) cached = null;
            if (alive) setState(result);
        });
        return () => {
            alive = false;
        };
    }, [enabled]);

    return state;
}

/** Forget the cached availability (e.g. after logout or a settings change). */
export function resetAgentAvailability() {
    cached = null;
}
