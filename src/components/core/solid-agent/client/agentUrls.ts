/**
 * A chat's agent URL is the configured backend URL (used only to sign in), plus the agent it talks to
 * when one is given (`<backend>?agentId=5`): required for the Agent Hub, optional for SolidX.
 * Each agent URL has its own login.
 */
export function withAgentId(url: string, agentId?: number): string {
    return agentId === undefined ? url : `${toHttpBase(url)}?agentId=${agentId}`;
}

/** The agent id named by an agent URL, if any. */
export function agentIdOf(url: string): number | undefined {
    const match = url.match(/[?&]agentId=(\d+)/);
    return match ? Number(match[1]) : undefined;
}

/** `http(s)://host[:port]` of the sign-in backend, from a configured agent URL (http or ws, trailing slash ok). */
export function toHttpBase(url: string): string {
    return url.trim().split("?")[0].replace(/\/$/, "").replace(/^ws(s?):\/\//i, "http$1://");
}
