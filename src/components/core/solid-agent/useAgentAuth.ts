import { useEffect, useState } from "react";
import { loadAgentAuth, onAgentAuthChange, type AgentAuth } from "./client/agentAuth";

export type AgentAuthState =
    | { status: "checking"; auth: null }
    | { status: "signedOut"; auth: null }
    | { status: "signedIn"; auth: AgentAuth };

/** The agent login for `agentUrl` in this tab, kept current as the user signs in or the token expires. */
export function useAgentAuth(agentUrl: string): AgentAuthState {
    const [state, setState] = useState<AgentAuthState>({ status: "checking", auth: null });

    useEffect(() => {
        let alive = true;
        const refresh = () => {
            void loadAgentAuth(agentUrl).then((auth) => {
                if (alive) setState(auth ? { status: "signedIn", auth } : { status: "signedOut", auth: null });
            });
        };
        refresh();
        const off = onAgentAuthChange(agentUrl, refresh);
        return () => {
            alive = false;
            off();
        };
    }, [agentUrl]);

    return state;
}
