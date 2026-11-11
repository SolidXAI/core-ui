import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { DefaultAgentTurnCompletionWidget } from "./DefaultAgentTurnCompletionWidget";

/** Default widget for `ExecutionCancelled`: shown as an agent bubble ("Execution stopped by user."). */
export const DefaultNoticeChatWidget = (props: SolidChatWidgetProps) => {
    const message = String(props.eventData.message ?? props.eventData.content ?? "Execution stopped by user.");
    return <DefaultAgentTurnCompletionWidget {...props} live={false} eventData={{ content: message }} />;
};

Object.assign(DefaultNoticeChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
