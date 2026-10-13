/** A widget the agent sent as its text reply: `{"widgetName": "...", "data": {...} | "<json>"}`. */
export type InlineChatWidget = { widget: string; data: Record<string, any> };

/** Returns the widget in a reply, or null when the reply is not that JSON (it then renders as text). */
export function parseWidgetContent(content: unknown): InlineChatWidget | null {
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) return null;

    let candidate = trimmed;
    // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
    if (candidate.startsWith("```")) {
        const lines = candidate.split("\n");
        if (lines.length >= 2 && lines[lines.length - 1].trim().startsWith("```")) {
            candidate = lines.slice(1, -1).join("\n").trim();
        }
    }

    let parsed: any = null;
    if (candidate.startsWith("{") && candidate.endsWith("}")) {
        try {
            parsed = JSON.parse(candidate);
        } catch {
            // ignore
        }
    }

    // If candidate wasn't a standalone JSON object, look for embedded {"widgetName" envelope
    if (!parsed || typeof parsed !== "object" || typeof parsed.widgetName !== "string") {
        const idx = candidate.indexOf('{"widgetName"');
        if (idx !== -1) {
            let depth = 0;
            let inString = false;
            let escape = false;
            for (let i = idx; i < candidate.length; i++) {
                const ch = candidate[i];
                if (escape) {
                    escape = false;
                    continue;
                }
                if (ch === "\\" && inString) {
                    escape = true;
                    continue;
                }
                if (ch === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (ch === "{") depth++;
                    else if (ch === "}") {
                        depth--;
                        if (depth === 0) {
                            try {
                                const candidateParsed = JSON.parse(candidate.slice(idx, i + 1));
                                if (candidateParsed && typeof candidateParsed === "object" && typeof candidateParsed.widgetName === "string") {
                                    parsed = candidateParsed;
                                }
                            } catch {
                                // ignore
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    if (!parsed || typeof parsed !== "object" || typeof parsed.widgetName !== "string") {
        return null;
    }

    const widgetName = parsed.widgetName.trim().toLowerCase();
    let data = parsed.data;

    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch {
            // Assistant envelopes carry text or raw strings for specific widgets
            if (widgetName === "markdown") data = { text: data };
            else if (widgetName === "code") data = { code: data };
            else if (widgetName === "json") data = { json: data };
            else data = { text: data, raw: data };
        }
    }

    // Support data being an array directly
    if (Array.isArray(data)) {
        if (widgetName === "table") data = { rows: data };
        else if (widgetName === "checklist" || widgetName === "progress") data = { items: data };
        else data = { items: data, data };
    }

    if (!data || typeof data !== "object") return null;
    return { widget: widgetName, data };
}

/**
 * Compares two assistant text strings, accounting for JSON serialization / formatting differences
 * and widget markdown envelopes so duplicate turn completions do not append repeated cards.
 */
export function isSameAssistantContent(a: string | undefined, b: string | undefined): boolean {
    const trimA = a?.trim() ?? "";
    const trimB = b?.trim() ?? "";
    if (!trimA && !trimB) return true;
    if (!trimA || !trimB) return false;
    if (trimA === trimB) return true;

    const wa = parseWidgetContent(trimA);
    const wb = parseWidgetContent(trimB);
    if (wa && wb) {
        if (wa.widget !== wb.widget) return false;
        try {
            return JSON.stringify(wa.data) === JSON.stringify(wb.data);
        } catch {
            return false;
        }
    }
    if (wa?.widget === "markdown" && typeof wa.data?.text === "string" && wa.data.text.trim() === trimB) {
        return true;
    }
    if (wb?.widget === "markdown" && typeof wb.data?.text === "string" && wb.data.text.trim() === trimA) {
        return true;
    }
    return false;
}
