/**
 * Formatting helpers shared by the live event reducer and history replay.
 * Ported from the agent-ui chat (SolidX Agent repo) so tool rows read the same.
 */

const TOOL_PREFIXES = [
    "tools.solidx.",
    "mcp.solidx.",
    "solidx.",
    "tools.",
    "mcp__solidx__",
    "mcp_solidx_",
    "solidx___",
    "solidx__",
    "solidx_",
    "solidx-",
    "solidx:",
    "solidx/",
    "solid_",
];

export function parseExecuteCode(rawCode: unknown): {
    innerTool?: string;
    innerArgs?: Record<string, unknown>;
    rawSummary?: string;
} {
    if (!rawCode || typeof rawCode !== "string") return {};
    const code = rawCode.trim();

    // 1. Detect tool invocation: tools.solidx.<tool>(<args>), tools.<server>.<tool>(<args>), or solidx.<tool>(<args>)
    const toolCallMatch = code.match(/(?:await\s+)?(?:tools\.(?:solidx|[\w-]+)\.|solidx\.)([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/);
    if (toolCallMatch) {
        const innerTool = toolCallMatch[1];
        const rawArgStr = toolCallMatch[2].trim();
        let innerArgs: Record<string, unknown> = {};
        if (rawArgStr.startsWith("{") && rawArgStr.endsWith("}")) {
            try {
                innerArgs = JSON.parse(rawArgStr);
            } catch {
                // Non-strict object literal parser (e.g. { action: "get_modules", module_name: "test" })
                const propRegex = /([a-zA-Z0-9_]+)\s*:\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\d+(?:\.\d+)?)|(true|false)|null)/g;
                let m: RegExpExecArray | null;
                while ((m = propRegex.exec(rawArgStr)) !== null) {
                    const key = m[1];
                    const val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? Number(m[4]) : m[5] !== undefined ? m[5] === "true" : null;
                    innerArgs[key] = val;
                }
            }
        }
        return { innerTool, innerArgs };
    }

    // 2. Detect tool search: search({ query: "..." }) or search("...")
    const searchMatch = code.match(/(?:await\s+)?search\s*\(([\s\S]*?)\)/);
    if (searchMatch) {
        const rawArg = searchMatch[1].trim();
        let query = "";
        const qm = rawArg.match(/query\s*:\s*["']([^"']+)["']/) || rawArg.match(/^["']([^"']+)["']/);
        if (qm) query = qm[1];
        return { innerTool: "search", innerArgs: { query } };
    }

    // 3. Clean assignment / boilerplate noise for generic code: "const r = await ...", "return r;", trailing semicolons
    const cleaned = code
        .replace(/^(?:const|let|var)\s+\w+\s*=\s*(?:await\s+)?/m, "")
        .replace(/;\s*return\s+\w+;?$/m, "")
        .replace(/;\s*$/, "")
        .trim();

    return { rawSummary: cleaned };
}

function cleanRawToolName(raw: string): string {
    if (!raw || typeof raw !== "string") return "Tool";
    let name = raw.trim();
    const lower = name.toLowerCase();
    for (const prefix of TOOL_PREFIXES) {
        if (lower.startsWith(prefix)) {
            name = name.slice(prefix.length);
            break;
        }
    }
    return name;
}

function humanizeIdentifier(id: string): string {
    return id
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase())
        .trim();
}

const DATA_MODEL_ACTIONS: Record<string, string> = {
    create_module: "Create Module",
    create_model: "Create Model",
    add_fields: "Add Fields",
    update_fields: "Update Fields",
    remove_fields: "Remove Fields",
    remove_model: "Remove Model",
    remove_module: "Remove Module",
    update_model: "Update Model",
};

const TOOL_DISPLAY_NAMES: Record<string, string> = {
    manage_data_model: "Manage Data Model",
    discover_ui_selectors: "Discover UI Selectors",
    manage_metadata: "Manage Metadata",
    get_metadata: "Get Metadata",
    get_skill_content: "Get Skill Content",
    get_current_solidx_user: "Get Current User",
    metadata_json_patch: "Patch Metadata",
    run_solidctl: "Run SolidCTL",
    introspect_database: "Introspect Database",
    run_read_only_sql: "Run Read-Only SQL",
    content_crud: "Content CRUD",
    filesystem_tool: "File System",
    bash: "Run Command",
    view_file: "View File",
    edit_file: "Edit File",
    write_file: "Write File",
    read_file: "Read File",
    list_widgets: "List Widgets",
    list_dir: "List Directory",
    run_command: "Run Command",
    search: "Search Tools",
    search_tools: "Search Tools",
    execute: "Execute",
};

const FILESYSTEM_ACTIONS: Record<string, string> = { read: "Read", write: "Write", edit: "Edit", search: "Search" };

const TOOL_CATEGORIES: Record<string, string[]> = {
    Context: ["introspect_database", "get_metadata", "run_read_only_sql", "get_skill_content", "get_current_solidx_user"],
    Build: ["manage_data_model", "manage_metadata", "content_crud", "metadata_json_patch"],
    Files: ["filesystem_tool", "view_file", "edit_file", "write_file", "read_file", "list_dir"],
    Testing: ["discover_ui_selectors"],
    Deploy: ["run_solidctl"],
    Terminal: ["bash", "run_command"],
};

/** Category shown as the tool card badge ("Context", "Build", ...). */
export function toolCategory(name: string): string {
    const clean = cleanRawToolName(name);
    for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
        if (tools.includes(clean)) return category;
    }
    return "Tool";
}

export function toolDisplayName(name: string, args?: Record<string, unknown>): string {
    if (!name) return "Tool";
    const clean = cleanRawToolName(name);

    if (clean === "execute" || clean === "eval") {
        const rawCode = args?.code ?? args?.script;
        if (typeof rawCode === "string" && rawCode.trim()) {
            const parsed = parseExecuteCode(rawCode);
            if (parsed.innerTool) {
                return toolDisplayName(parsed.innerTool, parsed.innerArgs);
            }
        }
        return "Execute";
    }

    if (clean === "filesystem_tool" && typeof args?.action === "string") {
        return FILESYSTEM_ACTIONS[args.action] ?? "File System";
    }

    if (clean === "manage_data_model" && typeof args?.action === "string") {
        const actionStr = String(args.action).toLowerCase();
        if (DATA_MODEL_ACTIONS[actionStr]) {
            return DATA_MODEL_ACTIONS[actionStr];
        }
    }

    if (clean === "get_skill_content") {
        const concern = args?.concern || args?.skill_name || args?.skill;
        if (typeof concern === "string" && concern.trim()) {
            return `Skill: ${humanizeIdentifier(concern)}`;
        }
        return "Get Skill Content";
    }

    if (TOOL_DISPLAY_NAMES[clean]) {
        return TOOL_DISPLAY_NAMES[clean];
    }

    return humanizeIdentifier(clean);
}

const truncate = (text: string, max = 80) => (text.length > max ? `${text.slice(0, max)}…` : text);
function oneLine(value: unknown): string {
    let text: string;
    if (typeof value === "string") {
        text = value;
    } else {
        try {
            text = JSON.stringify(value) ?? String(value);
        } catch {
            text = "[unserializable value]";
        }
    }
    return text.trim().replace(/\s+/g, " ");
}

function humanizeCommand(cmd: string): string {
    const trimmed = cmd.trim();
    const verbs: Array<[string, string]> = [
        ["cat ", "Read "], ["find ", "Search files: "], ["grep ", "Search content: "], ["ls ", "List "],
        ["cd ", "Navigate to "], ["mkdir ", "Create folder "], ["rm ", "Remove "], ["cp ", "Copy "], ["mv ", "Move "],
    ];
    for (const [prefix, label] of verbs) {
        if (trimmed.startsWith(prefix)) return label + trimmed.slice(prefix.length).trim();
    }
    return trimmed;
}

/** One-line summary of a tool call's arguments for the collapsed tool row. */
export function describeToolArgs(args: Record<string, unknown> = {}, toolName?: string): string {
    const rawCode = args.code ?? args.script;
    if (typeof rawCode === "string" && rawCode.trim() && (!toolName || toolName === "execute" || toolName === "eval" || toolName === "tool")) {
        const parsed = parseExecuteCode(rawCode);
        if (parsed.innerTool) {
            return describeToolArgs(parsed.innerArgs ?? {}, parsed.innerTool);
        }
        if (parsed.rawSummary) {
            return truncate(oneLine(parsed.rawSummary), 72);
        }
    }

    if (toolName === "filesystem_tool") {
        const path = args.path != null ? oneLine(args.path) : "";
        if (args.action === "read" && path) {
            if (args.start_line != null && args.end_line != null) return truncate(`${path}:${args.start_line}-${args.end_line}`);
            return truncate(path);
        }
        if (args.action === "search") {
            const query = args.query != null ? oneLine(args.query) : "";
            const glob = args.glob != null ? oneLine(args.glob) : "";
            if (query && glob) return truncate(`"${query}" in ${glob}`);
            if (query) return truncate(`"${query}"`);
            if (glob) return truncate(glob);
        }
        if (args.action === "edit" && path) {
            const edits = Array.isArray(args.edits) ? args.edits.length : null;
            return truncate(edits != null ? `${path} (${edits} edit${edits === 1 ? "" : "s"})` : path);
        }
        for (const key of ["path", "query", "file"]) {
            if (args[key] != null) return truncate(oneLine(args[key]));
        }
        return "";
    }
    if (args.action && args.prompt) return truncate(`${oneLine(args.action)}: ${oneLine(args.prompt)}`);
    if (args.action && (args.module_name || args.model_name || args.name || args.path)) {
        const target = oneLine(args.module_name || args.model_name || args.name || args.path);
        return truncate(`${oneLine(args.action)}: ${target}`, 72);
    }
    for (const key of ["action", "prompt", "cmd", "command", "query", "path", "file", "module_name", "model_name", "name", "id", "content"]) {
        if (args[key] != null) {
            const value = oneLine(args[key]);
            return truncate(key === "cmd" || key === "command" ? humanizeCommand(value) : value, 72);
        }
    }
    const first = Object.values(args)[0];
    return first != null ? truncate(oneLine(first), 72) : "";
}

export function formatDuration(ms?: number): string {
    if (ms == null) return "";
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/** Extracts a status and short display text from a tool's (often nested-JSON) output. */
export function parseToolResult(output: string): { status: "success" | "warning" | "error"; text: string } {
    if (!output) return { status: "success", text: "" };
    try {
        const outer = JSON.parse(output);
        let status: "success" | "warning" | "error" = "success";
        let text = "";
        let inner: any = outer.data;
        if (typeof inner === "string") {
            try {
                inner = JSON.parse(inner);
            } catch {
                text = inner;
            }
        }
        if (inner && typeof inner === "object") {
            if (inner.operation_status === "failed") {
                status = "error";
                const failure = inner.failure;
                text = failure && typeof failure === "object"
                    ? failure.error_message || failure.message || JSON.stringify(failure)
                    : "Tool operation failed.";
            } else if (inner.operation_status === "pending") {
                status = "warning";
                text = inner.result?.message || inner.instructions || "Operation is pending.";
            } else {
                text = inner.result?.message || inner.result?.content || inner.message || inner.content || JSON.stringify(inner.result ?? inner);
            }
        } else {
            text = outer.content || outer.message || output;
        }
        if (outer.status === "tool_failed" || outer.status === "error") {
            status = "error";
            text = outer.message || (Array.isArray(outer.errors) ? outer.errors.join(", ") : text) || text;
        }
        return { status, text: truncate(String(text), 500) };
    } catch {
        return { status: "success", text: truncate(output, 120) };
    }
}

/** Token counts, model names and similar bookkeeping the agent emits as text; never shown as chat. */
export function isLlmMetadata(content: string): boolean {
    if (!content) return true;
    return /\d+\s*(input|output)\s*tokens/i.test(content)
        || /finish_reason:/i.test(content)
        || /^\d+\s+messages\s*\(/i.test(content)
        || /\|\s*model:\s*\S+/i.test(content);
}
