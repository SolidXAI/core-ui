/** A widget the agent sent as its text reply: `{"widgetName": "...", "data": {...} | "<json>"}`. */
export type InlineChatWidget = { widget: string; data: Record<string, any> };

/** Returns the widget in a reply, or null when the reply is not that JSON (it then renders as text). */
export function parseWidgetContent(content: unknown): InlineChatWidget | null {
    if (typeof content !== "string") return null;
    try {
        const parsed = JSON.parse(content);
        if (typeof parsed?.widgetName !== "string") return null;

        let data = parsed.data;
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch {
                // Assistant markdown envelopes carry the markdown itself as a string.
                if (parsed.widgetName === "markdown") data = { text: data };
                else return null;
            }
        }

        if (!data || typeof data !== "object" || Array.isArray(data)) return null;
        return { widget: parsed.widgetName, data };
    } catch {
        return null;
    }
}
