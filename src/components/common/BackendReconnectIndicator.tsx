import { useEffect, useState } from "react";
import { backendHealthMonitor, type BackendHealthState } from "../../helpers/backendHealthMonitor";
import { SolidSpinner } from "../shad-cn-ui";

type BackendReconnectIndicatorProps = {
  variant?: "header" | "floating";
};

function buildStatusLabel(state: BackendHealthState) {
  if (state.status === "offline") {
    return "Server unavailable";
  }

  return "Reconnecting...";
}

export function BackendReconnectIndicator({ variant = "header" }: BackendReconnectIndicatorProps) {
  const [state, setState] = useState<BackendHealthState>(backendHealthMonitor.getState());

  useEffect(() => backendHealthMonitor.subscribe(setState), []);

  if (state.status === "online") {
    return null;
  }

  const className = variant === "floating"
    ? "solid-backend-indicator solid-backend-indicator--floating"
    : "solid-backend-indicator";

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      data-status={state.status}
      title={state.status === "offline"
        ? "The app is still trying to reconnect to the backend."
        : "The app is checking whether the backend is back online."}
    >
      <SolidSpinner size={14} className="solid-backend-indicator-spinner" />
      <span className="solid-backend-indicator-text">{buildStatusLabel(state)}</span>
    </div>
  );
}

