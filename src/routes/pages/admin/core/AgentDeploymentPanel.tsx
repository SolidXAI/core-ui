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
    <aside className="agent-editor__deployment-help" aria-label="Deployment guidance">
      <strong>About deployment</strong>
      <p>These settings control where new workers run and how many can be available for this agent.</p>
      <ul>
        <li><strong>Installation default:</strong> Uses the runner configured for the AgentHub installation. Choose this when the agent should follow the environment-wide default.</li>
        <li><strong>Local process:</strong> Runs workers on the AgentHub host. No separate runner setup is needed; CPU and memory overrides are not applied to local workers.</li>
        <li><strong>Docker:</strong> Requires Docker access and an <code>AGENT_HUB_DOCKER_IMAGE</code> image. Remote workers also need PostgreSQL, a reachable HTTPS manager URL, and a public gateway URL. Configure networking and shared workspace storage when needed.</li>
        <li><strong>Amazon ECS:</strong> Requires AWS access plus an ECS cluster, Fargate task definition, private subnet IDs, and security group IDs. The task definition must include the configured container (default: <code>agent</code>); remote workers also need PostgreSQL, an HTTPS manager URL, and a public gateway URL.</li>
        <li><strong>Process limits:</strong> Minimum processes keep workers warm; maximum processes caps this agent’s worker pool. Blank maximum uses the installation default. CPU units and memory (MiB) are resource overrides for Docker and ECS; blank values use runner defaults.</li>
      </ul>
      <p>Runner and resource changes affect new workers. Restart workers to replace existing ones. Save with <strong>Save Agent</strong>; saving an active agent moves it to Draft, which must be activated to create the next config version.</p>
    </aside>
  </section>;
}
