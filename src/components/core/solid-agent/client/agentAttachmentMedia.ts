import qs from "qs";
import { solidGet } from "../../../../http/solidHttp";
import { normalizeAssetUrl } from "../../../../helpers/assetUrl";
import { mergeToolFileMedia, type AgentToolFileMedia } from "../toolFiles";
import { AgentEventTypes, type AgentAttachmentMeta, type AgentChatItem } from "../types";

/** Media field on the agentEvent model that stores chat attachments (solid-core metadata). */
const ATTACHMENTS_FIELD = "attachments";

type StoredMedia = { id?: number | string; _full_url?: string; originalFileName?: string; mimeType?: string; fileSize?: number };

/** Solid's response interceptor wraps bodies as { data: <payload> }; find the records array. */
function unwrapRecords(body: any): any[] {
    let node = body;
    for (let i = 0; i < 4 && node; i++) {
        if (Array.isArray(node.records)) return node.records;
        node = node.data;
    }
    return [];
}

/** The stored media of each agentEvent, by event id. Throws when SolidX cannot be asked. */
async function fetchEventMedia(eventIds: Array<string | number>): Promise<Map<string, StoredMedia[]>> {
    const query = qs.stringify(
        {
            filters: { id: { $in: eventIds.map(Number) } },
            populateMedia: [ATTACHMENTS_FIELD],
            fields: ["id"],
            limit: eventIds.length,
            offset: 0,
        },
        { encodeValuesOnly: true },
    );
    const response = await solidGet(`/agent-event?${query}`);
    const mediaByEvent = new Map<string, StoredMedia[]>();
    unwrapRecords(response?.data).forEach((record) => {
        const media: StoredMedia[] = record?._media?.[ATTACHMENTS_FIELD] ?? [];
        if (media.length) mediaByEvent.set(String(record.id), media);
    });
    return mediaByEvent;
}

function toolFileMedia(media: StoredMedia[]): AgentToolFileMedia[] {
    return media.flatMap((file) => {
        const url = normalizeAssetUrl(file._full_url);
        if (!url) return [];
        const id = Number(file.id);
        return [{ ...(Number.isInteger(id) ? { id } : {}), ...(file.originalFileName ? { name: file.originalFileName } : {}), url }];
    });
}

/** URLs of the files a tool returned, stored on its ToolResult agentEvent. Empty while SolidX has not linked them yet. */
export async function fetchToolFileMedia(agentEventId: string | number): Promise<AgentToolFileMedia[]> {
    try {
        return toolFileMedia((await fetchEventMedia([agentEventId])).get(String(agentEventId)) ?? []);
    } catch {
        return [];
    }
}

/**
 * Replayed user messages only know their attachments' names, and tool calls only the names of the
 * files the tool returned. The files themselves are stored on the agentEvent (media field
 * `attachments`) by the agent, so fetch fresh URLs for every such event in one request and put them
 * on the thread items. Items are returned unchanged when nothing is stored or the request fails.
 */
export async function resolveAttachmentMedia(items: AgentChatItem[]): Promise<AgentChatItem[]> {
    const eventIds = items
        .map((item) => item.eventData?.agentEventId)
        .filter((id): id is string | number => id !== undefined && id !== null && id !== "");
    if (!eventIds.length) return items;

    let mediaByEvent: Map<string, StoredMedia[]>;
    try {
        mediaByEvent = await fetchEventMedia(eventIds);
    } catch {
        return items;
    }
    if (!mediaByEvent.size) return items;

    return items.map((item) => {
        const media = mediaByEvent.get(String(item.eventData?.agentEventId));
        if (!media) return item;
        if (item.eventType === AgentEventTypes.toolCalling) {
            const files = Array.isArray(item.eventData.files) ? item.eventData.files : [];
            return { ...item, eventData: { ...item.eventData, files: mergeToolFileMedia(files, toolFileMedia(media)) } };
        }
        const attachments: AgentAttachmentMeta[] = media.map((file) => ({
            name: file.originalFileName ?? "attachment",
            mimeType: file.mimeType ?? "",
            size: Number(file.fileSize ?? 0),
            url: normalizeAssetUrl(file._full_url),
        }));
        return { ...item, eventData: { ...item.eventData, attachments } };
    });
}
