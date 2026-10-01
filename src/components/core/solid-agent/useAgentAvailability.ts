import { useEffect, useState } from "react";
import { solidGet } from "../../../http/solidHttp";
import { getSettingsMap } from "../../../helpers/settingsPayload";
import type { AgentType } from "./types";

export type AgentAvailability = {
    ready: boolean;
    enabled: boolean;
    /** Backend URL of the "agent" type (the floating launcher). */
    agentUrl: string | null;
    /** Backend URL per agent type; null when that backend is not configured. */
    agentUrls: Record<AgentType, string | null>;
    canUse: boolean;
};

const NO_URLS: Record<AgentType, string | null> = { agent: null, agentHub: null };
const UNAVAILABLE: AgentAvailability = { ready: true, enabled: false, agentUrl: null, agentUrls: NO_URLS, canUse: false };

/** Settings key holding each agent type's backend URL (see solid-core default settings). */
const URL_SETTING: Record<AgentType, string> = {
    agent: "solidxAgentBackendUrl",
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
    const [settingsRes, meRes] = await Promise.all([solidGet("/setting/wrapped"), solidGet("/iam/me")]);
    const settings = getSettingsMap(settingsRes?.data);
    const enabled = settings.solidAgentEnabled === true || settings.solidAgentEnabled === "true";
    const agentUrls: Record<AgentType, string | null> = {
        agent: urlSetting(settings[URL_SETTING.agent]),
        agentHub: urlSetting(settings[URL_SETTING.agentHub]),
    };
    const canUse = unwrapUser(meRes?.data)?.canUseAgent === true;
    return { ready: true, enabled, agentUrl: agentUrls.agent, agentUrls, canUse };
}

/**
 * Whether the SolidX Agent can be shown for the current user: the `solidAgentEnabled` setting,
 * the backend URL settings (`solidxAgentBackendUrl`, `solidxAgentHubBackendUrl`), and
 * `canUseAgent` (agent:invoke) from /iam/me. Fetched once per page load and shared by every caller.
 */
export function useAgentAvailability(enabled = true): AgentAvailability {
    const [state, setState] = useState<AgentAvailability>({ ready: false, enabled: false, agentUrl: null, agentUrls: NO_URLS, canUse: false });

    useEffect(() => {
        if (!enabled) return;
        let alive = true;
        cached ??= loadAvailability().catch(() => {
            cached = null; // retry on the next mount
            return UNAVAILABLE;
        });
        cached.then((result) => alive && setState(result));
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
