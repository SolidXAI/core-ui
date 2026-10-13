import qs from "qs";
import { solidGet } from "../../../../http/solidHttp";
import { normalizeAssetUrl } from "../../../../helpers/assetUrl";
import type { AgentAttachmentMeta, AgentChatItem } from "../types";

/** Media field on the agentEvent model that stores chat attachments (solid-core metadata). */
const ATTACHMENTS_FIELD = "attachments";

type StoredMedia = { _full_url?: string; originalFileName?: string; mimeType?: string; fileSize?: number };

/** Solid's response interceptor wraps bodies as { data: <payload> }; find the records array. */
function unwrapRecords(body: any): any[] {
    let node = body;
    for (let i = 0; i < 4 && node; i++) {
        if (Array.isArray(node.records)) return node.records;
        node = node.data;
    }
    return [];
}

/**
 * Replayed user messages only know their attachments' names. The files themselves are stored
 * on the agentEvent (media field `attachments`) by the agent, so fetch fresh URLs for every
 * such event in one request and put them on the thread items. Items are returned unchanged
 * when nothing is stored or the request fails.
 */
export async function resolveAttachmentMedia(items: AgentChatItem[]): Promise<AgentChatItem[]> {
    const eventIds = items
        .map((item) => item.eventData?.agentEventId)
        .filter((id): id is string | number => id !== undefined && id !== null && id !== "");
    if (!eventIds.length) return items;

    let records: any[] = [];
    try {
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
        records = unwrapRecords(response?.data);
    } catch {
        return items;
    }

    const mediaByEvent = new Map<string, StoredMedia[]>();
    records.forEach((record) => {
        const media: StoredMedia[] = record?._media?.[ATTACHMENTS_FIELD] ?? [];
        if (media.length) mediaByEvent.set(String(record.id), media);
    });
    if (!mediaByEvent.size) return items;

    return items.map((item) => {
        const media = mediaByEvent.get(String(item.eventData?.agentEventId));
        if (!media) return item;
        const attachments: AgentAttachmentMeta[] = media.map((file) => ({
            name: file.originalFileName ?? "attachment",
            mimeType: file.mimeType ?? "",
            size: Number(file.fileSize ?? 0),
            url: normalizeAssetUrl(file._full_url),
        }));
        return { ...item, eventData: { ...item.eventData, attachments } };
    });
}
