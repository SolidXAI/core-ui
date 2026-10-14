import type { AgentBootstrap } from "../client/agentAuth";

export const EMBED_CHANNEL = "solidx-agent-embed";
export const EMBED_PUBLIC_PROTOCOL_VERSION = 2;
export const EMBED_MESSAGE_CONTEXT_MAX_BYTES = 32 * 1024;
export type EmbedJson = null | boolean | number | string | EmbedJson[] | { [key: string]: EmbedJson };
export type EmbedContextContribution = { context: EmbedJson; revision: string; displaySummary?: string };
export type EmbedMessageContext = { schemaVersion: 1; namespaces: Record<string, EmbedContextContribution> };
export type BeforeUserMessageSendRequest = {
    text: string;
    source: "composer" | "sdk" | "prefill" | "widget";
    attachments: Array<{ name: string; mimeType: string; size: number }>;
    contextRevision?: string;
};
export type BeforeUserMessageSendListener = (
    request: BeforeUserMessageSendRequest,
    signal: AbortSignal,
) => Promise<EmbedContextContribution | { cancelled: true; reason?: string }>;
export type AgentInputDefinition = { name: string; description: string; dataType: string; defaultValue?: unknown; optional?: boolean };
export type AgentEmbedBootstrap = AgentBootstrap & {
    embed: true;
    agentId: number;
    title?: string;
    requiredInputs: AgentInputDefinition[];
};

export class MissingAgentInputsError extends Error {
    constructor(readonly inputNames: string[]) {
        super(`Required inputs are missing: ${inputNames.join(", ")}`);
        this.name = "MissingAgentInputsError";
    }
}

export function validateMessageContext(value: unknown): EmbedMessageContext {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("message_context must be an object.");
    const context = value as Partial<EmbedMessageContext>;
    if (context.schemaVersion !== 1 || !context.namespaces || typeof context.namespaces !== "object"
        || Array.isArray(context.namespaces) || Object.keys(context.namespaces).length > 32)
        throw new Error("message_context must use schemaVersion 1 and contain a namespaces object.");
    for (const [namespace, contribution] of Object.entries(context.namespaces)) {
        if (!namespace || namespace.length > 80 || !contribution || typeof contribution !== "object"
            || typeof contribution.revision !== "string" || contribution.revision.length > 256 || !("context" in contribution)
            || (contribution.displaySummary !== undefined && (typeof contribution.displaySummary !== "string" || contribution.displaySummary.length > 1024)))
            throw new Error("message_context contains an invalid namespace contribution.");
    }
    const isJson = (item: unknown, depth = 0): boolean => {
        if (depth > 12) return false;
        if (item === null || typeof item === "string" || typeof item === "boolean") return true;
        if (typeof item === "number") return Number.isFinite(item);
        if (Array.isArray(item)) return item.length <= 1024 && item.every((child) => isJson(child, depth + 1));
        if (typeof item !== "object" || Object.getPrototypeOf(item) !== Object.prototype) return false;
        return Object.values(item as Record<string, unknown>).every((child) => isJson(child, depth + 1));
    };
    let serialized: string;
    try {
        if (!isJson(value)) throw new Error("message_context contains unsupported JSON values.");
        serialized = JSON.stringify(value);
    } catch {
        throw new Error("message_context contains unsupported JSON values.");
    }
    if (new TextEncoder().encode(serialized).length > EMBED_MESSAGE_CONTEXT_MAX_BYTES)
        throw new Error("message_context exceeds 32 KiB.");
    return value as EmbedMessageContext;
}

export function validateBootstrap(value: unknown, agentId: number): AgentEmbedBootstrap {
    const body = value as AgentEmbedBootstrap;
    if (!body || body.embed !== true || body.agentId !== agentId || typeof body.agentToken !== "string" || !body.agentToken
        || !Array.isArray(body.requiredInputs)) throw new Error("The token endpoint returned an invalid embed response.");
    const ws = new URL(body.wsUrl), http = new URL(body.httpUrl);
    if (!["ws:", "wss:"].includes(ws.protocol) || !["http:", "https:"].includes(http.protocol)
        || ws.username || ws.password || http.username || http.password || ws.search || http.search || ws.hash || http.hash)
        throw new Error("The token endpoint returned invalid connection URLs.");
    if (window.location.protocol === "https:" && (ws.protocol !== "wss:" || http.protocol !== "https:"))
        throw new Error("HTTPS embeds require HTTPS and WSS AgentHub endpoints.");
    return body;
}

export function validateEmbedInputs(fields: AgentInputDefinition[], suppliedValues?: Record<string, unknown>): void {
    const values = suppliedValues ?? {};
    if (typeof values !== "object" || Array.isArray(values)) throw new Error("inputs must be an object.");
    const names = new Set(fields.map((field) => field.name));
    for (const name of Object.keys(values)) if (!names.has(name)) throw new Error(`Unknown input: ${name}`);
    const missing = fields
    .filter(({ name, optional }) => {
        const value = values[name];
            return !optional && (value === undefined || value === null || (typeof value === "string" && !value.trim()));
        })
        .map(({ name }) => name);
    if (missing.length) throw new MissingAgentInputsError(missing);
    for (const field of fields) {
        const value = values[field.name];
        let valid = false;
        switch (field.dataType) {
            case "string": valid = typeof value === "string"; break;
            case "number": valid = typeof value === "number" && Number.isFinite(value); break;
            case "integer": valid = typeof value === "number" && Number.isSafeInteger(value); break;
            case "boolean": valid = typeof value === "boolean"; break;
            case "array": valid = Array.isArray(value); break;
            case "object": valid = typeof value === "object" && value !== null && !Array.isArray(value); break;
            case "date": valid = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
                && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; break;
            case "datetime": valid = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)); break;
        }
        if (!valid) throw new Error(`Input ${field.name} must have data type ${field.dataType}.`);
    }
}
