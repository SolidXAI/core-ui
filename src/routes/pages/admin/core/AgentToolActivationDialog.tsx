import React from "react";
import { CheckCircle2, Circle, Loader2, ShieldCheck, XCircle } from "lucide-react";
import axios from "axios";
import { getSession } from "../../../../adapters/auth";
import { getSettingsMap } from "../../../../helpers/settingsPayload";
import { solidGet, solidPost } from "../../../../http/solidHttp";
import { SolidButton, SolidDialog, SolidDialogBody } from "../../../../components/shad-cn-ui";

type Step = {
  status: "waiting" | "running" | "passed" | "failed" | "skipped";
  message: string;
  requiredSecrets?: string[];
  missingSecrets?: string[];
};
type Report = { toolId?: number; checksum?: string; config: Step; init: Step };
type Props = {
  open: boolean;
  toolId: number;
  checksum: string;
  toolName: string;
  onOpenChange: (open: boolean) => void;
  onActivated: () => Promise<void>;
};

function unwrapReport(response: any): Report {
  let value = response?.data;
  for (let depth = 0; depth < 5 && value; depth += 1) {
    if (value.config && value.init) return value as Report;
    value = value.data;
  }
  throw new Error("The server returned an invalid tool check result.");
}

function errorMessage(error: any): string {
  const body = error?.response?.data;
  const message = body?.data?.message ?? body?.message ?? body?.detail ?? error?.message;
  return Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : "Checks failed. Please retry.";
}

function CheckStep({ title, step, number }: { title: string; step: Step; number: number }) {
  const Icon = step.status === "running" ? Loader2 : step.status === "passed" ? CheckCircle2
    : step.status === "failed" ? XCircle : Circle;
  const label = step.status === "running" ? "Checking" : step.status === "waiting" ? "Waiting" : step.status;
  return <section className={`agent-tool-check is-${step.status}`} aria-label={`${title}: ${label}`}>
    <div className="agent-tool-check__icon"><Icon size={23} className={step.status === "running" ? "is-spinning" : undefined} /></div>
    <div className="agent-tool-check__content">
      <div className="agent-tool-check__heading"><h3>{number}. {title}</h3><span>{label}</span></div>
      <p>{step.message}</p>
      {!!step.requiredSecrets?.length && <ul className="agent-tool-check__secrets" aria-label="Required secrets">
        {step.requiredSecrets.map((name) => {
          const missing = step.missingSecrets?.includes(name);
          const verified = step.status === "passed" || Boolean(step.missingSecrets?.length);
          return <li key={name} className={missing ? "is-missing" : verified ? "is-available" : ""}>
            <code>{name}</code><span>{missing ? "Missing, empty, or inactive" : verified ? "Available" : "Not verified"}</span>
          </li>;
        })}
      </ul>}
    </div>
  </section>;
}

export function AgentToolActivationDialog({ open, toolId, checksum, toolName, onOpenChange, onActivated }: Props) {
  const [config, setConfig] = React.useState<Step>({ status: "running", message: "Checking configuration and required secrets…" });
  const [init, setInit] = React.useState<Step>({ status: "waiting", message: "Waiting for configuration to pass." });
  const [busy, setBusy] = React.useState(true);
  const [activated, setActivated] = React.useState(false);
  const [activationError, setActivationError] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  const callbacks = React.useRef({ onActivated });
  callbacks.current = { onActivated };

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let cancelled = false;
    const run = async () => {
      let phase: "config" | "init" | "activate" = "config";
      setBusy(true);
      setActivated(false);
      setActivationError("");
      setConfig({ status: "running", message: "Checking configuration and required secrets…" });
      setInit({ status: "waiting", message: "Waiting for configuration to pass." });
      try {
        const settingsResponse = await solidGet("/setting/wrapped", { signal: controller.signal });
        const configuredUrl = getSettingsMap(settingsResponse.data).solidxAgentHubBackendUrl;
        if (typeof configuredUrl !== "string" || !configuredUrl.trim()) throw new Error("Configure the Agent Hub runtime URL in settings first.");
        const runtimeUrl = new URL(configuredUrl.trim());
        if (!["http:", "https:"].includes(runtimeUrl.protocol) || runtimeUrl.username || runtimeUrl.password) {
          throw new Error("The Agent Hub runtime URL must be an HTTP or HTTPS URL.");
        }
        const session = await getSession();
        if (!session?.user?.accessToken) throw new Error("Sign in again to check this tool.");
        const requestOptions = { signal: controller.signal, timeout: 60000,
          headers: { Authorization: `Bearer ${session.user.accessToken}` } };
        const checkUrl = `${runtimeUrl.toString().replace(/\/$/, "")}/api/tools/${toolId}/check`;
        const configuration = unwrapReport(await axios.post(checkUrl, { checksum, phase: "config" }, requestOptions));
        if (configuration.toolId !== toolId || configuration.checksum !== checksum) throw new Error("The runtime checked a different tool version.");
        if (cancelled) return;
        setConfig(configuration.config);
        if (configuration.config.status !== "passed") {
          setInit({ status: "skipped", message: "Configuration must pass before initialization can run." });
          return;
        }
        phase = "init";
        setInit({ status: "running", message: "Running the tool’s initialization check…" });
        const initialization = unwrapReport(await axios.post(checkUrl, { checksum, phase: "init" }, requestOptions));
        if (initialization.toolId !== toolId || initialization.checksum !== checksum) throw new Error("The runtime checked a different tool version.");
        if (cancelled) return;
        setConfig(initialization.config);
        setInit(initialization.init);
        if (initialization.config.status !== "passed" || initialization.init.status !== "passed") return;
        phase = "activate";
        await callbacks.current.onActivated();
        if (cancelled) return;
        setActivated(true);
      } catch (error) {
        if (cancelled) return;
        const failed: Step = { status: "failed", message: errorMessage(error) };
        if (phase === "config") {
          setConfig(failed);
          setInit({ status: "skipped", message: "Configuration must pass before initialization can run." });
        } else if (phase === "init") setInit(failed);
        else setActivationError(errorMessage(error));
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    // Avoid duplicate requests during React StrictMode effect replay.
    const timer = setTimeout(() => void run(), 0);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [open, toolId, checksum, attempt]);

  return <SolidDialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}
    className={busy ? "agent-tool-activation-dialog is-checking" : "agent-tool-activation-dialog"}
    header="Activate tool" dismissible={!busy} style={{ width: "min(36rem, 94vw)" }}
    footer={<>
      <SolidButton variant="secondary" disabled={busy} onClick={() => onOpenChange(false)}>{activated ? "Done" : "Close"}</SolidButton>
      {!activated && <SolidButton loading={busy} onClick={() => { setBusy(true); setAttempt((value) => value + 1); }}>
        {busy ? "Checking…" : "Retry checks"}
      </SolidButton>}
    </>}>
    <SolidDialogBody>
      <div className="agent-tool-activation" aria-live="polite" aria-busy={busy}>
        <p className="agent-tool-activation__intro"><strong>{toolName}</strong> will activate after configuration and initialization both pass.</p>
        <CheckStep title="Configuration" step={config} number={1} />
        <CheckStep title="Initialization" step={init} number={2} />
        {activated ? <div className="agent-tool-activation__success" role="status"><ShieldCheck size={20} />
          <div><strong>Tool activated</strong><p>Both checks passed. Restart linked agent processes to apply the change.</p></div>
        </div> : !busy && <p className="agent-tool-activation__failure" role="alert">{activationError ? `Checks passed, but activation failed: ${activationError}` : "The tool remains inactive. Resolve the reported issue and retry the checks."}</p>}
      </div>
    </SolidDialogBody>
  </SolidDialog>;
}
