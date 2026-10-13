import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidJsonChatWidget } from "./SolidJsonChatWidget";

/**
 * Fallback when `event_data.widget` names a widget that is not registered, or an event type has
 * no default widget: the payload is shown as collapsible JSON so nothing silently disappears.
 */
export const DefaultUnknownChatWidget = (props: SolidChatWidgetProps) => {
    const label = props.eventData?.widget ? `Unknown widget: ${props.eventData.widget}` : `Unhandled event: ${props.eventType}`;
    return (
        <div className={styles.widgetFallback}>
            <span>{label}</span>
            <SolidJsonChatWidget {...props} eventData={{ title: "Event data", data: props.eventData }} />
        </div>
    );
};

Object.assign(DefaultUnknownChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
