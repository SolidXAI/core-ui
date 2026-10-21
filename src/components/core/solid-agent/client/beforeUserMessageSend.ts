import type { AgentContext, AgentMessageContext } from "../types";
import type { BeforeUserMessageSendRequest } from "../embed/agentEmbedProtocol";

export type BeforeUserMessageSendContribution = AgentContext | AgentMessageContext | undefined;
export type BeforeUserMessageSendListener = (
    request: BeforeUserMessageSendRequest,
    signal: AbortSignal,
) => BeforeUserMessageSendContribution | Promise<BeforeUserMessageSendContribution>;

const listeners = new Set<BeforeUserMessageSendListener>();

/** Register an awaited in-app contributor that runs before each user message is sent. */
export function onBeforeUserMessageSend(listener: BeforeUserMessageSendListener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Run a snapshot of current listeners so subscription changes cannot alter an in-flight send. */
export async function emitBeforeUserMessageSend(
    request: BeforeUserMessageSendRequest,
    signal: AbortSignal,
): Promise<BeforeUserMessageSendContribution[]> {
    return Promise.all(Array.from(listeners, (listener) => listener(request, signal)));
}
