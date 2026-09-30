/**
 * Helpers shared by the chat widgets in this folder.
 */

/**
 * A named widget's data. Agents may put the widget's fields directly in `event_data`
 * (`{ widget: "checklist", title, items }`) or nest them (`{ widget: "checklist", props: {...} }`).
 */
export function getChatWidgetData<T = Record<string, any>>(eventData: Record<string, any>): T {
    const nested = eventData?.props;
    return (nested && typeof nested === "object" ? nested : eventData ?? {}) as T;
}

/** Message time as shown under chat bubbles, e.g. "02:45 PM". */
export function formatChatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const asArray =<T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
