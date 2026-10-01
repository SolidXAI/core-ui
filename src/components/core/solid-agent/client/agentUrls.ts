/** `http(s)://host[:port]` for REST calls, from a configured agent URL (http or ws, trailing slash ok). */
export function toHttpBase(url: string): string {
    return url.trim().replace(/\/$/, "").replace(/^ws(s?):\/\//i, "http$1://");
}

/** The agent's WebSocket endpoint for a configured agent URL. */
export function toWsUrl(url: string): string {
    return `${url.trim().replace(/\/$/, "").replace(/^http(s?):\/\//i, "ws$1://")}/ws/agent`;
}
