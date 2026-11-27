import { solidAxios } from "../../../../../http/solidHttp";
import { isAxiosError } from "axios";

export type Period = "7" | "30" | "all";
export type Group = { groupValue: string | number | null; count: number | string } & Record<string, string | number | null>;
export type Result = { rows: Group[]; issue?: string };
export type Agent = { id: number; title?: string; name: string };

type Query = { entity: string; group: string; measures?: string[]; event?: string };
const session = "agent-session";
const event = "agent-event";
const usage = ["totalCost:sum", "totalInputTokens:sum", "totalOutputTokens:sum", "turnCount:sum", "totalSteps:sum"];
const queries = {
  agents: { entity: session, group: "agent.id", measures: usage },
  configured: { entity: session, group: "reasoningModelKey" },
  sessionStatus: { entity: session, group: "status" },
  triggers: { entity: session, group: "trigger" },
  events: { entity: event, group: "eventType", measures: ["cost:sum", "session.id:count_distinct"] },
  reasoning: { entity: event, group: "reasoningModelKey", event: "LlmRawResponse", measures: ["inputTokens:sum", "outputTokens:sum"] },
  fast: { entity: event, group: "fastModelKey", event: "FastLlmResponse" },
  sessionDaily: { entity: session, group: "startedAt:day", measures: ["totalCost:sum"] },
  daily: { entity: event, group: "createdAt:day", measures: ["cost:sum"] },
  tools: { entity: event, group: "toolName", event: "ToolResult", measures: ["durationMs:avg"] },
  toolCodes: { entity: event, group: "toolReturncode", event: "ToolResult" },
  jobs: { entity: "agent-job", group: "status", measures: ["attempts:sum"] },
  requests: { entity: "agent-human-request", group: "status" },
  browsers: { entity: "agent-browser-session", group: "status" },
  archives: { entity: "agent-context-archive", group: "kind", measures: ["tokenEstimate:sum"] },
} satisfies Record<string, Query>;
export type Report = Record<keyof typeof queries, Result>;

function issue(error: unknown) {
  return isAxiosError(error) && error.response?.status === 403
    ? "Restricted by your role."
    : "Could not load this data. Try Refresh.";
}

async function pages<T>(entity: string, params: URLSearchParams, key: "records" | "groupMeta", signal: AbortSignal) {
  const rows: T[] = [];
  params.set("limit", "100");
  for (;;) {
    params.set("offset", String(rows.length));
    const response = await solidAxios.get('/' + entity + '?' + params.toString(), { signal });
    const body = response.data?.data ?? response.data;
    const page: T[] = body?.[key];
    if (!Array.isArray(page) || !Number.isFinite(Number(body.meta?.totalRecords))) throw new Error("Invalid page");
    rows.push(...page);
    if (rows.length >= Number(body.meta.totalRecords) || !page.length) return rows;
  }
}

export function loadAgents(signal: AbortSignal) {
  return pages<Agent>("agent-registry", new URLSearchParams({
    "fields[0]": "id", "fields[1]": "name", "fields[2]": "title", "sort[0]": "id:asc",
  }), "records", signal);
}

export async function loadReport(period: Period, agent: string, signal: AbortSignal): Promise<Report> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  if (period !== "all") since.setUTCDate(since.getUTCDate() - Number(period) + 1);
  const entries = Object.entries(queries) as [keyof Report, Query][];
  const report = {} as Report;
  async function worker() {
    while (entries.length && !signal.aborted) {
      const [key, q] = entries.shift()!;
      const params = new URLSearchParams({ "groupBy[0]": q.group, "sort[0]": q.group + ":asc" });
      ["count", ...(q.measures ?? [])].forEach((v, i) => params.set("aggregates[" + i + "]", v));
      if (q.event) params.set("filters[eventType][$eq]", q.event);
      const direct = q.entity === session || q.entity === "agent-job";
      if (agent) params.set(direct ? "filters[agent][id][$eq]" : "filters[session][agent][id][$eq]", agent);
      const date = q.entity === session ? "startedAt" : q.entity === "agent-job" ? "queuedAt" : "createdAt";
      if (period !== "all") params.set("filters[" + date + "][$gte]", since.toISOString());
      try {
        report[key] = { rows: await pages<Group>(q.entity, params, "groupMeta", signal) };
      } catch (error) {
        report[key] = { rows: [], issue: issue(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return report;
}
