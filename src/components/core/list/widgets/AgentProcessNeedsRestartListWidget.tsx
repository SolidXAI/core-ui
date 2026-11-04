import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { listAgentHubProcesses } from "../../solid-agent/processes/agentHubProcessApi";

type RuntimeProcess = { id: string; restartNeeded?: boolean };

export function AgentProcessNeedsRestartListWidget({ rowData }: SolidListFieldWidgetProps) {
  const [restartNeeded, setRestartNeeded] = useState<boolean | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const processId = String(rowData?.processId ?? "");
  const isReady = String(rowData?.status ?? "").toLowerCase() === "ready";

  useEffect(() => {
    if (!isReady) {
      setRestartNeeded(false);
      setManagerError(null);
      return;
    }
    let alive = true;
    const load = () => {
      void listAgentHubProcesses(true).then((processes) => {
        if (!alive) return;
        const process = processes.find((item: RuntimeProcess) => String(item.id) === processId);
        setRestartNeeded(process?.restartNeeded === true);
        setManagerError(null);
      }).catch((error: any) => {
        if (!alive) return;
        setRestartNeeded(null);
        setManagerError(error?.response?.status === 403 ? "Manager access denied" : "Manager unavailable");
      });
    };
    load();
    const refreshTimer = window.setInterval(load, 15000);
    window.addEventListener("agent-process-manager-updated", load);
    return () => {
      alive = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("agent-process-manager-updated", load);
    };
  }, [isReady, processId]);

  return (
    <div className="flex min-w-0 flex-col items-start gap-1" style={{ maxWidth: "28ch" }}>
      <span title={processId} style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{processId || "—"}</span>
      {isReady && restartNeeded && (
        <span title="This process is running an older agent configuration." style={{
          display: "inline-flex", alignItems: "center", gap: ".25rem", borderRadius: 999,
          padding: ".12rem .45rem", color: "#92400e", background: "#fef3c7",
          fontSize: ".7rem", fontWeight: 600, lineHeight: 1.3,
        }}>
          <CircleAlert size={12} /> Needs Restart
        </span>
      )}
      {managerError && <span title="Check the AgentHub manager URL and its configured administrator roles." style={{
        color: "var(--muted-foreground)", fontSize: ".7rem", lineHeight: 1.3,
      }}>{managerError}</span>}
    </div>
  );
}
