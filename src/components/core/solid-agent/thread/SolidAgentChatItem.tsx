import React from "react";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import styles from "../SolidAgent.module.css";
import { AgentEventTypes, type AgentChatItem, type AgentContext } from "../types";

/** Registry name of the widget that renders an event when `event_data.widget` is absent. */
export const getDefaultChatWidgetName = (eventType: string): string => {
    switch (eventType) {
        case AgentEventTypes.userMessage:
            return "DefaultUserMessageChatWidget";
        case AgentEventTypes.llmToken:
        case AgentEventTypes.llmComplete:
        case AgentEventTypes.turnComplete:
        case AgentEventTypes.turnCompleteLegacy:
            return "DefaultAssistantMessageChatWidget";
        case AgentEventTypes.toolCalling:
            return "DefaultToolCallChatWidget";
        case AgentEventTypes.agentError:
        case AgentEventTypes.error:
            return "DefaultErrorChatWidget";
        case AgentEventTypes.executionCancelled:
        case AgentEventTypes.executionCancelledLegacy:
            return "DefaultNoticeChatWidget";
        case AgentEventTypes.agentStarted:
        case AgentEventTypes.stepStarted:
            return "DefaultThinkingChatWidget";
        default:
            return "DefaultUnknownChatWidget";
    }
};

type ErrorBoundaryProps = { widget: string; eventData: Record<string, any>; children: React.ReactNode };
type ErrorBoundaryState = { error: Error | null };

/** Keeps a throwing widget inside its own bubble; the rest of the thread keeps working. */
export class SolidChatWidgetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error(`[solidAgent] chat widget "${this.props.widget}" failed to render`, error);
    }

    componentDidUpdate(prev: ErrorBoundaryProps) {
        // A later update of the same widget gets a fresh attempt.
        if (this.state.error && prev.eventData !== this.props.eventData) this.setState({ error: null });
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className={styles.widgetFallback} role="alert">
                <span>The “{this.props.widget}” widget failed to render.</span>
                <pre className={styles.pre} style={{ maxHeight: 180 }}>{JSON.stringify(this.props.eventData, null, 2)}</pre>
            </div>
        );
    }
}

type SolidAgentChatItemProps = {
    item: AgentChatItem;
    agentContext?: AgentContext;
    onReply: (widgetId: string, widget: string, value: unknown) => void;
    onPrompt: (text: string) => void;
};

/**
 * Renders one thread item. The widget named in `event_data.widget` wins; otherwise the default
 * widget for the event type. Both resolve through the extension registry, so a UI module can
 * register new chat widgets or override a default by registering the same name.
 */
export const SolidAgentChatItem = ({ item, agentContext, onReply, onPrompt }: SolidAgentChatItemProps) => {
    const widgetName = item.widget ?? getDefaultChatWidgetName(item.eventType);
    const DynamicWidget = getExtensionComponent(widgetName) ?? getExtensionComponent("DefaultUnknownChatWidget");
    const widgetId = item.widgetId ?? item.id;

    const widgetProps: SolidChatWidgetProps = {
        eventType: item.eventType,
        eventData: item.eventData,
        widgetId,
        live: !!item.live,
        final: !!item.final,
        timestamp: item.at,
        reply: (value: unknown) => onReply(widgetId, widgetName, value),
        sendPrompt: onPrompt,
        agentContext,
    };

    return (
        <SolidChatWidgetErrorBoundary widget={widgetName} eventData={item.eventData}>
            {DynamicWidget && <DynamicWidget {...widgetProps} />}
        </SolidChatWidgetErrorBoundary>
    );
};
