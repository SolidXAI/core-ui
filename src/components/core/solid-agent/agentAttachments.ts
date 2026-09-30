import type { AgentAttachment } from "./types";

/**
 * Reading chat attachments in the browser. Limits match the agent (server/attachments.py)
 * so problems are reported before sending.
 */

export const MAX_AGENT_ATTACHMENTS = 5;
export const MAX_AGENT_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_AGENT_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

/** Text files by extension; browsers often report "" (or odd types, e.g. .ts → video/mp2t). */
const TEXT_EXTENSIONS: Record<string, string> = {
    txt: "text/plain",
    log: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    html: "text/html",
    css: "text/css",
    json: "application/json",
    xml: "application/xml",
    yaml: "application/yaml",
    yml: "application/yaml",
    js: "application/javascript",
    jsx: "application/javascript",
    mjs: "application/javascript",
    ts: "application/typescript",
    tsx: "application/typescript",
    sql: "application/sql",
    sh: "application/x-sh",
    py: "text/x-python",
    java: "text/x-java",
    env: "text/plain",
    ini: "text/plain",
    toml: "text/plain",
};

/** Value for the file input's `accept` attribute. */
export const AGENT_ATTACHMENT_ACCEPT = [...Array.from(IMAGE_TYPES), ...Object.keys(TEXT_EXTENSIONS).map((ext) => `.${ext}`)].join(",");

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveKind(file: File): { kind: "image" | "text"; mimeType: string } | null {
    if (IMAGE_TYPES.has(file.type)) return { kind: "image", mimeType: file.type };
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
    if (TEXT_EXTENSIONS[ext]) return { kind: "text", mimeType: TEXT_EXTENSIONS[ext] };
    if (file.type.startsWith("text/")) return { kind: "text", mimeType: file.type };
    return null;
}

function readAs(file: File, mode: "text" | "dataUrl"): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("read failed"));
        if (mode === "text") reader.readAsText(file);
        else reader.readAsDataURL(file);
    });
}

/**
 * Validates `files` against what is already attached and reads the accepted ones.
 * Returns the new attachments plus one message per rejected file.
 */
export async function readAgentAttachments(files: File[], existing: AgentAttachment[]): Promise<{ added: AgentAttachment[]; errors: string[] }> {
    const added: AgentAttachment[] = [];
    const errors: string[] = [];
    let count = existing.length;
    let total = existing.reduce((sum, item) => sum + item.meta.size, 0);

    for (const file of files) {
        const kind = resolveKind(file);
        if (!kind) {
            errors.push(`“${file.name}”: this file type is not supported (images and text files only).`);
            continue;
        }
        if (count >= MAX_AGENT_ATTACHMENTS) {
            errors.push(`You can attach up to ${MAX_AGENT_ATTACHMENTS} files per message.`);
            break;
        }
        if (file.size > MAX_AGENT_ATTACHMENT_BYTES) {
            errors.push(`“${file.name}” is larger than ${formatFileSize(MAX_AGENT_ATTACHMENT_BYTES)}.`);
            continue;
        }
        if (total + file.size > MAX_AGENT_ATTACHMENTS_TOTAL_BYTES) {
            errors.push(`Attachments can't exceed ${formatFileSize(MAX_AGENT_ATTACHMENTS_TOTAL_BYTES)} in total.`);
            continue;
        }
        try {
            if (kind.kind === "image") {
                const dataUrl = await readAs(file, "dataUrl");
                added.push({
                    payload: { name: file.name, mimeType: kind.mimeType, size: file.size, encoding: "base64", content: dataUrl.slice(dataUrl.indexOf(",") + 1) },
                    meta: { name: file.name, mimeType: kind.mimeType, size: file.size, previewUrl: dataUrl },
                });
            } else {
                const text = await readAs(file, "text");
                added.push({
                    payload: { name: file.name, mimeType: kind.mimeType, size: file.size, encoding: "text", content: text },
                    meta: { name: file.name, mimeType: kind.mimeType, size: file.size },
                });
            }
            count += 1;
            total += file.size;
        } catch {
            errors.push(`“${file.name}” could not be read.`);
        }
    }
    return { added, errors };
}
