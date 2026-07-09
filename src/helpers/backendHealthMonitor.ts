import { env } from "../adapters/env";
import { pingBackendAvailability } from "./waitForBackendAvailability";

export type BackendHealthStatus = "online" | "checking" | "offline";

export type BackendHealthState = {
  status: BackendHealthStatus;
  firstFailureAt: number | null;
  lastFailureAt: number | null;
  unavailableToastDelayMs: number;
  retryDelayMs: number;
  message: string;
  statusCode?: number | string;
  error?: unknown;
};

type BackendHealthListener = (state: BackendHealthState) => void;

type BackendHealthConfig = {
  unavailableToastDelayMs?: number;
  retryDelayMs?: number;
};

const DEFAULT_UNAVAILABLE_TOAST_DELAY_MS = 60_000;
const DEFAULT_RETRY_DELAY_MS = 1_500;

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

class BackendHealthMonitor {
  private listeners = new Set<BackendHealthListener>();
  private pollingPromise: Promise<void> | null = null;
  private offlineTimer: number | null = null;
  private config: Required<BackendHealthConfig> = {
    unavailableToastDelayMs: parsePositiveInteger(
      env("BACKEND_UNAVAILABLE_TOAST_DELAY_MS", `${DEFAULT_UNAVAILABLE_TOAST_DELAY_MS}`),
      DEFAULT_UNAVAILABLE_TOAST_DELAY_MS,
    ),
    retryDelayMs: parsePositiveInteger(
      env("BACKEND_RETRY_DELAY_MS", `${DEFAULT_RETRY_DELAY_MS}`),
      DEFAULT_RETRY_DELAY_MS,
    ),
  };

  private state: BackendHealthState = {
    status: "online",
    firstFailureAt: null,
    lastFailureAt: null,
    unavailableToastDelayMs: this.config.unavailableToastDelayMs,
    retryDelayMs: this.config.retryDelayMs,
    message: "",
  };

  subscribe(listener: BackendHealthListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  configure(nextConfig: BackendHealthConfig = {}) {
    this.config = {
      unavailableToastDelayMs: nextConfig.unavailableToastDelayMs ?? this.config.unavailableToastDelayMs,
      retryDelayMs: nextConfig.retryDelayMs ?? this.config.retryDelayMs,
    };

    this.state = {
      ...this.state,
      unavailableToastDelayMs: this.config.unavailableToastDelayMs,
      retryDelayMs: this.config.retryDelayMs,
    };
    this.emit();
  }

  reportFailure(payload?: { status?: number | string; message?: string; error?: unknown }) {
    const now = Date.now();

    this.state = {
      ...this.state,
      status: this.state.status === "offline" ? "offline" : "checking",
      firstFailureAt: this.state.firstFailureAt ?? now,
      lastFailureAt: now,
      unavailableToastDelayMs: this.config.unavailableToastDelayMs,
      retryDelayMs: this.config.retryDelayMs,
      message: payload?.message || "Unable to reach the server. Reconnecting...",
      statusCode: payload?.status,
      error: payload?.error,
    };
    this.emit();

    this.scheduleOfflineTimer();
    void this.ensurePolling();
  }

  reportSuccess() {
    if (this.state.status === "online") {
      return;
    }

    this.clearOfflineTimer();
    this.state = {
      ...this.state,
      status: "online",
      firstFailureAt: null,
      lastFailureAt: null,
      message: "",
      statusCode: undefined,
      error: undefined,
    };
    this.emit();
  }

  private emit() {
    for (const listener of Array.from(this.listeners)) {
      listener(this.state);
    }
  }

  private scheduleOfflineTimer() {
    if (this.offlineTimer != null) {
      return;
    }

    this.offlineTimer = window.setTimeout(() => {
      this.offlineTimer = null;
      if (this.state.status !== "online" && this.state.firstFailureAt != null) {
        this.state = {
          ...this.state,
          status: "offline",
          message: this.state.message || "Server unavailable.",
        };
        this.emit();
      }
    }, this.config.unavailableToastDelayMs);
  }

  private clearOfflineTimer() {
    if (this.offlineTimer != null) {
      window.clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }
  }

  private async ensurePolling() {
    if (this.pollingPromise) {
      return this.pollingPromise;
    }

    this.pollingPromise = (async () => {
      while (this.state.status !== "online") {
        const reachable = await pingBackendAvailability();
        if (reachable) {
          this.reportSuccess();
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, this.config.retryDelayMs));
      }
    })();

    try {
      await this.pollingPromise;
    } finally {
      this.pollingPromise = null;
    }
  }
}

export const backendHealthMonitor = new BackendHealthMonitor();

