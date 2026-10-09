import type { AgentBootstrap } from "../client/agentAuth";

export const EMBED_CHANNEL = "solidx-agent-embed";
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
    .filter(({ name, optional, defaultValue }) => {
        const value = values[name];
            return !optional && defaultValue == null && (value === undefined || value === null || (typeof value === "string" && !value.trim()));
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
