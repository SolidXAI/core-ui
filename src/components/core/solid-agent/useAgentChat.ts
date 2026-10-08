import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import agentReducer, { type AgentState } from "../../../redux/features/agentSlice";
import { AgentRuntime, ensureAgentRuntime } from "./client/agentRuntime";
import type { AgentRuntimeType } from "./types";

type Dispatch = (action: any) => any;

export type AgentChatBinding = {
    agent: AgentState;
    dispatch: Dispatch;
    /** Null only for an "agentHub" chat during its first render, before its connection opens. */
    runtime: AgentRuntime | null;
};

/**
 * The state and connection a chat renders from.
 *
 * - "solidx": the store's `solidAgent` slice and the shared runtime, so the floating launcher
 *   and any embedded "solidx" chat show the same conversation.
 * - "agentHub": a private thread, reduced by the same agentSlice reducer,
 *   and its own runtime, opened on mount and closed on unmount. It never touches the
 *   launcher's conversation.
 */
export function useAgentChat(agentRuntime: AgentRuntimeType, agentUrl: string, externalEmbed = false): AgentChatBinding {
    const shared = agentRuntime === "solidx";

    const storeDispatch = useDispatch();
    const store = useStore();
    const sharedState = useSelector((state: any) => state.solidAgent as AgentState);

    // Private thread: kept in a ref so the runtime reads the latest state synchronously.
    const localState = useRef<AgentState>(agentReducer(undefined, { type: "solidAgent/@@init" }));
    const [, rerender] = useReducer((count: number) => count + 1, 0);
    const localDispatch = useCallback((action: any) => {
        localState.current = agentReducer(localState.current, action);
        rerender();
        return action;
    }, []);

    const [localRuntime, setLocalRuntime] = useState<AgentRuntime | null>(null);
    useEffect(() => {
        if (shared) return;
        const runtime = new AgentRuntime(agentUrl, localDispatch, () => localState.current, agentRuntime, !externalEmbed);
        setLocalRuntime(runtime);
        return () => {
            runtime.dispose();
            setLocalRuntime(null);
        };
    }, [shared, agentUrl, agentRuntime, localDispatch, externalEmbed]);

    if (shared) {
        const runtime = ensureAgentRuntime(agentUrl, storeDispatch, () => (store.getState() as any).solidAgent);
        return { agent: sharedState, dispatch: storeDispatch, runtime };
    }
    return { agent: localState.current, dispatch: localDispatch, runtime: localRuntime };
}
