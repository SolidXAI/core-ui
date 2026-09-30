import { useEffect, useState } from "react";
import { solidGet } from "../../../http/solidHttp";
import { getSettingsMap } from "../../../helpers/settingsPayload";

export type AgentAvailability = { ready: boolean; enabled: boolean; agentUrl: string | null; canUse: boolean };

const UNAVAILABLE: AgentAvailability = { ready: true, enabled: false, agentUrl: null, canUse: false };

/** Solid's response interceptor wraps bodies as { data: <payload> }; descend until `user` shows up. */
function unwrapUser(body: any): any {
    let node = body;
    for (let i = 0; i < 4 && node; i++) {
        if (node.user) return node.user;
        node = node.data;
    }
    return null;
}

let cached: Promise<AgentAvailability> | null = null;

async function loadAvailability(): Promise<AgentAvailability> {
    const [settingsRes, meRes] = await Promise.all([solidGet("/setting/wrapped"), solidGet("/iam/me")]);
    const settings = getSettingsMap(settingsRes?.data);
    const enabled = settings.solidAgentEnabled === true || settings.solidAgentEnabled === "true";
    const agentUrl = typeof settings.solidAgentUrl === "string" && settings.solidAgentUrl.trim() ? settings.solidAgentUrl.trim() : null;
    const canUse = unwrapUser(meRes?.data)?.canUseAgent === true;
    return { ready: true, enabled, agentUrl, canUse };
}

/**
 * Whether the SolidX Agent can be shown for the current user: the `solidAgentEnabled` setting,
 * a configured `solidAgentUrl`, and `canUseAgent` (agent:invoke) from /iam/me.
 * Fetched once per page load and shared by every caller.
 */
export function useAgentAvailability(enabled = true): AgentAvailability {
    const [state, setState] = useState<AgentAvailability>({ ready: false, enabled: false, agentUrl: null, canUse: false });

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
