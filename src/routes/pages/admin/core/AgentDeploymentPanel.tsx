export type AgentDeployment = {
  runner?: string | null;
  minProcesses?: number;
  maxProcesses?: number | null;
  processCpu?: number | null;
  processMemory?: number | null;
};

export function AgentDeploymentPanel({ value, onChange }: {
  value: AgentDeployment;
  onChange: (value: AgentDeployment) => void;
}) {
  return <section className="agent-editor__section">
    <h2>Deployment</h2>
    <p>Runner and resource changes apply to new workers. Restart a worker to replace it using these settings.</p>
    <p>Save these settings with <strong>Save Agent</strong>. Saving changes to an active agent moves it to Draft; activate the draft to create the next config version.</p>
    <div className="agent-editor__grid">
      <label className="agent-editor__field">Runner
        <select value={value.runner ?? ""} onChange={(event) => onChange({ ...value, runner: event.target.value || null })}>
          <option value="">Installation default</option>
          <option value="local">Local process</option>
          <option value="docker">Docker</option>
          <option value="ecs">Amazon ECS</option>
        </select>
      </label>
      <label className="agent-editor__field">Minimum processes
        <input type="number" min={0} required value={value.minProcesses ?? 0} onChange={(event) => onChange({ ...value, minProcesses: Number(event.target.value) })} />
      </label>
      <label className="agent-editor__field">Maximum processes
        <input type="number" min={1} placeholder="Installation default" value={value.maxProcesses ?? ""} onChange={(event) => onChange({ ...value, maxProcesses: event.target.value ? Number(event.target.value) : null })} />
      </label>
      <label className="agent-editor__field">CPU units
        <input type="number" min={1} placeholder="Runner default" value={value.processCpu ?? ""} onChange={(event) => onChange({ ...value, processCpu: event.target.value ? Number(event.target.value) : null })} />
      </label>
      <label className="agent-editor__field">Memory (MiB)
        <input type="number" min={1} placeholder="Runner default" value={value.processMemory ?? ""} onChange={(event) => onChange({ ...value, processMemory: event.target.value ? Number(event.target.value) : null })} />
      </label>
    </div>
  </section>;
}
