import { useEffect, useState } from "react";
import { clearAgentAuth, isAgentProcessAvailable, loadAgentAuth, onAgentAuthChange, type AgentAuth } from "./client/agentAuth";

export type AgentAuthState =
    | { status: "checking"; auth: null }
    | { status: "signedOut"; auth: null }
    | { status: "signedIn"; auth: AgentAuth };

/** The agent login for `agentUrl` in this tab, kept current as the user signs in or the token expires. */
export function useAgentAuth(agentUrl: string, checkProcessAvailability = false): AgentAuthState {
    const [state, setState] = useState<AgentAuthState>({ status: "checking", auth: null });

    useEffect(() => {
        let alive = true;
        const refresh = () => {
            void loadAgentAuth(agentUrl).then(async (auth) => {
                if (!auth) {
                    if (alive) setState({ status: "signedOut", auth: null });
                    return;
                }
                if (checkProcessAvailability && !(await isAgentProcessAvailable(auth))) {
                    // The stored wsUrl points at a dead process. Signing in again asks the manager
                    // for a live process and its current WebSocket URL.
                    clearAgentAuth(agentUrl);
                    if (alive) setState({ status: "signedOut", auth: null });
                    return;
                }
                if (alive) setState({ status: "signedIn", auth });
            });
        };
        refresh();
        const off = onAgentAuthChange(agentUrl, refresh);
        return () => {
            alive = false;
            off();
        };
    }, [agentUrl, checkProcessAvailability]);

    return state;
}
