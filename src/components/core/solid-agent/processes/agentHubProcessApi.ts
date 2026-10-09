import { solidGet, solidPost } from "../../../../http/solidHttp";

export type AgentHubRuntimeProcess = {
  id: string;
  agentId: number;
  status: string;
  openSessions: number;
  runningTurns: number;
  restartNeeded: boolean;
};

let inFlight: Promise<AgentHubRuntimeProcess[]> | null = null;
let cachedAt = 0;
let cached: AgentHubRuntimeProcess[] = [];

function unwrap(value: any): any {
  let current = value;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (Array.isArray(current)) return current;
    if (Array.isArray(current.data)) return current.data;
    current = current.data;
  }
  return [];
}

export function listAgentHubProcesses(force = false): Promise<AgentHubRuntimeProcess[]> {
  if (!force && Date.now() - cachedAt < 5000) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = solidGet("/agent-process/manager/processes")
    .then((response: any) => {
      cached = unwrap(response?.data);
      cachedAt = Date.now();
      return cached;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

export async function stopAgentHubProcess(processId: string) {
  await solidPost(`/agent-process/manager/processes/${encodeURIComponent(processId)}/stop`, {});
  invalidateAgentHubProcessList();
}

export async function restartAgentHubProcess(processId: string) {
  await solidPost(`/agent-process/manager/processes/${encodeURIComponent(processId)}/restart`, {});
  invalidateAgentHubProcessList();
}

export function invalidateAgentHubProcessList() {
  cachedAt = 0;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("agent-process-manager-updated"));
}

export async function stopAgentHubProcessRowAction(event: any) {
  const processId = event?.rowData?.processId;
  if (!processId) throw new Error("This process has no runtime process ID.");
  return stopAgentHubProcess(String(processId));
}

export async function restartAgentHubProcessRowAction(event: any) {
  const processId = event?.rowData?.processId;
  if (!processId) throw new Error("This process has no runtime process ID.");
  return restartAgentHubProcess(String(processId));
}
