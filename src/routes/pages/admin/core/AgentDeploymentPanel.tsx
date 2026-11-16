import React from "react";
import { SolidButton } from "../../../../components/shad-cn-ui";
import { solidPatch } from "../../../../http/solidHttp";

export type AgentDeployment = {
  runner?: string | null;
  minProcesses?: number;
  maxProcesses?: number | null;
  processCpu?: number | null;
  processMemory?: number | null;
};

export function AgentDeploymentPanel({ agentId, current, onSaved }: {
  agentId: number;
  current: AgentDeployment;
  onSaved: () => void;
}) {
  const [runner, setRunner] = React.useState(current.runner ?? "");
  const [minimum, setMinimum] = React.useState(String(current.minProcesses ?? 0));
  const [maximum, setMaximum] = React.useState(current.maxProcesses?.toString() ?? "");
  const [cpu, setCpu] = React.useState(current.processCpu?.toString() ?? "");
  const [memory, setMemory] = React.useState(current.processMemory?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ error: boolean; text: string }>();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(undefined);
    try {
      await solidPatch(`/agent-registry/${agentId}/deployment`, {
        runner: runner || null, minProcesses: Number(minimum), maxProcesses: maximum ? Number(maximum) : null,
        processCpu: cpu ? Number(cpu) : null, processMemory: memory ? Number(memory) : null,
      });
      setStatus({ error: false, text: "Deployment settings saved." });
      onSaved();
    } catch (error) {
      const detail = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setStatus({ error: true, text: typeof detail === "string" ? detail : "Could not save deployment settings." });
    } finally {
      setSaving(false);
    }
  }
  return <form className="agent-editor__section" onSubmit={(event) => void save(event)}>
    <h2>Deployment</h2>
    <p>Runner and resource changes apply to new workers. Restart a worker to replace it using these settings.</p>
    <div className="agent-editor__grid">
      <label className="agent-editor__field">Runner
        <select value={runner} onChange={(event) => setRunner(event.target.value)}>
          <option value="">Installation default</option>
          <option value="local">Local process</option>
          <option value="docker">Docker</option>
          <option value="ecs">Amazon ECS</option>
        </select>
      </label>
      <label className="agent-editor__field">Minimum processes
        <input type="number" min={0} required value={minimum} onChange={(event) => setMinimum(event.target.value)} />
      </label>
      <label className="agent-editor__field">Maximum processes
        <input type="number" min={1} placeholder="Installation default" value={maximum} onChange={(event) => setMaximum(event.target.value)} />
      </label>
      <label className="agent-editor__field">CPU units
        <input type="number" min={1} placeholder="Runner default" value={cpu} onChange={(event) => setCpu(event.target.value)} />
      </label>
      <label className="agent-editor__field">Memory (MiB)
        <input type="number" min={1} placeholder="Runner default" value={memory} onChange={(event) => setMemory(event.target.value)} />
      </label>
    </div>
    <SolidButton type="submit" variant="secondary" loading={saving} disabled={saving}>Save deployment settings</SolidButton>
    {status && <p role={status.error ? "alert" : "status"}>{status.text}</p>}
  </form>;
}
