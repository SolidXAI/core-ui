import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { DefaultAssistantMessageChatWidget } from "./DefaultAssistantMessageChatWidget";

/** Default widget for `ExecutionCancelled`: shown as an agent bubble ("Execution stopped by user."). */
export const DefaultNoticeChatWidget = (props: SolidChatWidgetProps) => {
    const message = String(props.eventData.message ?? props.eventData.content ?? "Execution stopped by user.");
    return <DefaultAssistantMessageChatWidget {...props} live={false} eventData={{ content: message }} />;
};

Object.assign(DefaultNoticeChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
