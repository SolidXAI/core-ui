/**
 * Formatting helpers shared by the live event reducer and history replay.
 * Ported from the agent-ui chat (SolidX Agent repo) so tool rows read the same.
 */

const TOOL_DISPLAY_NAMES: Record<string, string> = {
    manage_data_model: "Manage Data Model",
    discover_ui_selectors: "Discover UI Selectors",
    manage_metadata: "Manage Metadata",
    get_metadata: "Get Metadata",
    run_solidctl: "Run SolidCTL",
    introspect_database: "Introspect Database",
    run_read_only_sql: "Run Read-Only SQL",
    content_crud: "Content CRUD",
    filesystem_tool: "File System",
    bash: "Run Command",
};

const FILESYSTEM_ACTIONS: Record<string, string> = { read: "Read", write: "Write", edit: "Edit", search: "Search" };

const TOOL_CATEGORIES: Record<string, string[]> = {
    Context: ["introspect_database", "get_metadata", "run_read_only_sql"],
    Build: ["manage_data_model", "manage_metadata", "content_crud"],
    Files: ["filesystem_tool"],
    Testing: ["discover_ui_selectors"],
    Deploy: ["run_solidctl"],
    Terminal: ["bash"],
};

/** Category shown as the tool card badge ("Context", "Build", ...). */
export function toolCategory(name: string): string {
    for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
        if (tools.includes(name)) return category;
    }
    return "Tool";
}

export function toolDisplayName(name: string, args?: Record<string, unknown>): string {
    if (name === "filesystem_tool" && typeof args?.action === "string") {
        return FILESYSTEM_ACTIONS[args.action] ?? TOOL_DISPLAY_NAMES[name] ?? name;
    }
    return TOOL_DISPLAY_NAMES[name] ?? name;
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
