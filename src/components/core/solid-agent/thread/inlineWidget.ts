/** A widget the agent sent as its text reply: `{"widgetName": "...", "data": {...} | "<json>"}`. */
export type InlineChatWidget = { widget: string; data: Record<string, any> };

/** Returns the widget in a reply, or null when the reply is not that JSON (it then renders as text). */
export function parseWidgetContent(content: unknown): InlineChatWidget | null {
    if (typeof content !== "string") return null;
    try {
        const parsed = JSON.parse(content);
        const data = typeof parsed?.data === "string" ? JSON.parse(parsed.data) : parsed?.data;
        if (typeof parsed?.widgetName !== "string" || !data || typeof data !== "object") return null;
        return { widget: parsed.widgetName, data };
    } catch {
        return null;
    }
}
