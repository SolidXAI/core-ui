import React from 'react';
import { getExtensionComponent } from '../../../helpers/registry';
import { ExtensionComponentTypes } from '../../../types/extension-registry';
import type { SolidChatterMessageWidgetProps } from '../../../types/solid-core';

const ChatterWidgetPlaceholder = ({ messageBody }: { messageBody: string | null }) => {
    let displayBody = messageBody ?? '';
    try {
        displayBody = JSON.stringify(JSON.parse(displayBody), null, 2);
    } catch {
        // Non-JSON bodies remain readable as plain text.
    }

    return (
        <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded p-2 text-xs">
            {displayBody}
        </pre>
    );
};

class ChatterWidgetErrorBoundary extends React.Component<
    { widgetName: string; messageBody: string | null; children: React.ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        console.error(`Chatter widget "${this.props.widgetName}" failed to render`, error);
    }

    render() {
        return this.state.failed
            ? <ChatterWidgetPlaceholder messageBody={this.props.messageBody} />
            : this.props.children;
    }
}

/** Widget selection applies only to custom messages outside the built-in subtypes. */
export const isChatterMessageWidget = (messageType?: string, messageSubType?: string) =>
    messageType === 'custom' &&
    !!messageSubType &&
    !['custom', 'note', 'task'].includes(messageSubType);

export const SolidChatterMessageWidget = ({ chatterMessage }: SolidChatterMessageWidgetProps) => {
    const widgetName = chatterMessage.messageSubType;
    const Widget = getExtensionComponent(widgetName, ExtensionComponentTypes.chatterMessageWidget);

    if (!Widget) return <ChatterWidgetPlaceholder messageBody={chatterMessage.messageBody} />;

    return (
        <ChatterWidgetErrorBoundary key={widgetName} widgetName={widgetName} messageBody={chatterMessage.messageBody}>
            <Widget chatterMessage={chatterMessage} />
        </ChatterWidgetErrorBoundary>
    );
};
