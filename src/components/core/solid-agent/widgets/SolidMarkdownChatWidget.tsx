import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidAgentMarkdown } from "../SolidAgentMarkdown";
import { getChatWidgetData } from "./chatWidgetUtils";

/** `event_data: { widget: "markdown", text }` — formatted text (tables, lists, code with copy). */
export const SolidMarkdownChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ text?: string; content?: string }>(eventData);
    return <SolidAgentMarkdown text={String(data.text ?? data.content ?? "")} />;
};
