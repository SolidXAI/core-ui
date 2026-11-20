import type { AgentToolFile } from "./types";

/** A stored copy of a tool file, as SolidX returns it for the owning agentEvent. */
export type AgentToolFileMedia = { id?: number; name?: string; url: string };

const fetchable = (url: unknown): url is string =>
    typeof url === "string" && (/^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("blob:"));

/** The files of a ToolResult event in the shape the thread keeps. Runtime-internal URLs (solidx-media:) are dropped. */
export function normalizeToolFiles(raw: unknown): AgentToolFile[] {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry): AgentToolFile[] => {
        if (!entry || typeof entry !== "object") return [];
        const file = entry as Record<string, unknown>;
        const mediaId = Number(file.mediaId ?? file.media_id);
        const name = typeof file.name === "string" && file.name ? file.name : "file";
        const mimeType = typeof file.mimeType === "string" ? file.mimeType : typeof file.mime_type === "string" ? file.mime_type : "";
        const size = Number(file.size);
        return [{
            ...(Number.isInteger(mediaId) && mediaId > 0 ? { mediaId } : {}),
            name,
            mimeType,
            ...(Number.isFinite(size) && size >= 0 ? { size } : {}),
            ...(fetchable(file.url) ? { url: file.url } : {}),
        }];
    });
}

/** Puts the resolved media URLs on the files: by media id, then by file name, then by position. */
export function mergeToolFileMedia(files: AgentToolFile[], media: AgentToolFileMedia[]): AgentToolFile[] {
    const unused = [...media];
    const take = (match: (item: AgentToolFileMedia) => boolean) => {
        const index = unused.findIndex(match);
        return index >= 0 ? unused.splice(index, 1)[0] : undefined;
    };
    const found = files.map((file) => file.mediaId !== undefined ? take((item) => item.id === file.mediaId) : undefined);
    files.forEach((file, index) => { found[index] ??= take((item) => item.name === file.name); });
    if (files.length === media.length) files.forEach((_, index) => { found[index] ??= unused.shift(); });
    return files.map((file, index) => found[index]?.url ? { ...file, url: found[index]!.url } : file);
}

export const isImageFile = (file: AgentToolFile) => file.mimeType.startsWith("image/");
