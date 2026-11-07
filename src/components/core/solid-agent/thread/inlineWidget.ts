/** A widget the agent sent as its text reply: `{"widgetName": "...", "data": {...} | "<json>"}`. */
export type InlineChatWidget = { widget: string; data: Record<string, any> };
export type InlineChatWidgetState =
    | { state: "widget"; value: InlineChatWidget }
    | { state: "pending" }
    | { state: "text" };

const WIDGET_NAME_KEY = "widgetName";

/**
 * True while a streamed reply can still become a widget envelope. The agent
 * protocol puts widgetName first, so this checks that key incrementally instead
 * of treating every partial JSON object as a widget.
 */
function isPendingWidgetEnvelope(content: string): boolean {
    let candidate = content.trimStart();
    if (!candidate) return false;

    if (candidate.startsWith("```")) {
        const newline = candidate.indexOf("\n");
        if (newline === -1) return "```json".startsWith(candidate.toLowerCase());
        const fence = candidate.slice(0, newline).trim().toLowerCase();
        if (fence !== "```" && fence !== "```json") return false;
        candidate = candidate.slice(newline + 1).trimStart();
    }

    if (!candidate.startsWith("{")) return false;
    const afterBrace = candidate.slice(1).trimStart();
    if (!afterBrace) return true;
    if (!afterBrace.startsWith('"')) return false;

    const closingQuote = afterBrace.indexOf('"', 1);
    if (closingQuote === -1) {
        return WIDGET_NAME_KEY.startsWith(afterBrace.slice(1));
    }

    const firstKey = afterBrace.slice(1, closingQuote);
    if (firstKey !== WIDGET_NAME_KEY) return false;

    const afterKey = afterBrace.slice(closingQuote + 1).trimStart();
    return afterKey === "" || afterKey.startsWith(":");
}

const EMBEDDED_ENVELOPE = '{"widgetName"';
const FENCED_BLOCK = /^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:^[ \t]*\1[ \t]*$|(?![\s\S]))/gm;
const INLINE_CODE = /(`+)(?!`)[^\n]*?[^`\n]\1(?!`)/g;

/**
 * Ranges of `text` where an envelope is example code, not a widget: inline code spans, and fenced
 * blocks that hold more than a lone envelope. A fence holding only an envelope is still a widget.
 */
function exampleCodeRanges(text: string): Array<[number, number]> {
    const fences: Array<[number, number]> = [];
    const ranges: Array<[number, number]> = [];
    let match: RegExpExecArray | null;
    FENCED_BLOCK.lastIndex = 0;
    while ((match = FENCED_BLOCK.exec(text))) {
        const range: [number, number] = [match.index, match.index + match[0].length];
        fences.push(range);
        const body = match[2].trim();
        if (!(body.indexOf(EMBEDDED_ENVELOPE) === 0 && body.charAt(body.length - 1) === "}")) ranges.push(range);
    }
    INLINE_CODE.lastIndex = 0;
    while ((match = INLINE_CODE.exec(text))) {
        const start = match.index;
        if (!fences.some(([fs, fe]) => start >= fs && start < fe)) ranges.push([start, start + match[0].length]);
    }
    return ranges;
}

/** Parses the balanced JSON object starting at `start`, or null when it is not a widget envelope. */
function parseEnvelopeAt(text: string, start: number): any {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
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
        if (inString) continue;
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) {
                try {
                    const parsed = JSON.parse(text.slice(start, i + 1));
                    return parsed && typeof parsed === "object" && typeof parsed.widgetName === "string" ? parsed : null;
                } catch {
                    return null;
                }
            }
        }
    }
    return null;
}

/** Returns the widget in a reply, or null when the reply is not that JSON (it then renders as text). */export function parseWidgetContent(content: unknown): InlineChatWidget | null {
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
        const codeRanges = exampleCodeRanges(candidate);
        let idx = candidate.indexOf(EMBEDDED_ENVELOPE);
        while (idx !== -1 && !parsed) {
            if (!codeRanges.some(([start, end]) => idx >= start && idx < end)) parsed = parseEnvelopeAt(candidate, idx);
            idx = candidate.indexOf(EMBEDDED_ENVELOPE, idx + 1);
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

/** Classifies live assistant content without exposing an incomplete JSON envelope as text. */
export function classifyWidgetContent(content: unknown): InlineChatWidgetState {
    const widget = parseWidgetContent(content);
    if (widget) return { state: "widget", value: widget };
    if (typeof content === "string" && isPendingWidgetEnvelope(content)) return { state: "pending" };
    return { state: "text" };
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
