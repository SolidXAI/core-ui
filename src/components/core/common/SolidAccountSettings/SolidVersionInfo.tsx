import { useEffect, useState } from "react";
import { env } from "../../../../adapters/env";
import { hasAnyRole } from "../../../../helpers/rolesHelper";
import { useSession } from "../../../../hooks/useSession";
import { useLazyGetSolidVersionInfoQuery } from "../../../../redux/api/solidSettingsApi";
import { getSolidEntityApiPoolSnapshot, SOLID_ENTITY_API_POOL_LIMIT } from "../../../../redux/store/solidEntityApiPool";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import "./solid-account-settings.css";

interface PackageVersionInfo {
  repo: "local" | "npm";
  version: string;
}

const PACKAGE_LABELS: Record<string, string> = {
  "solid-core": "Solid Core",
  "solid-core-ui": "Solid Core UI",
  "solid-code-builder": "Solid Code Builder",
};

const PACKAGE_HINTS: Record<string, string> = {
  "solid-core": "@solidxai/core",
  "solid-core-ui": "@solidxai/core-ui",
  "solid-code-builder": "@solidxai/code-builder",
};

export const SolidVersionInfo = () => {
  const { data: session } = useSession();
  const [trigger, { data, isLoading, isError }] = useLazyGetSolidVersionInfoQuery();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeTab, setActiveTab] = useState<"pool" | "runtime">("pool");
  const [poolSnapshot, setPoolSnapshot] = useState(() => getSolidEntityApiPoolSnapshot());
  const [isRefreshingDiagnostics, setIsRefreshingDiagnostics] = useState(false);
  const [lastDiagnosticsRefreshLabel, setLastDiagnosticsRefreshLabel] = useState<string | null>(null);

  useEffect(() => {
    trigger("");
  }, [trigger]);

  const refreshDiagnosticsSnapshot = async () => {
    setIsRefreshingDiagnostics(true);

    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const snapshot = getSolidEntityApiPoolSnapshot();
      setPoolSnapshot(snapshot);
      setLastDiagnosticsRefreshLabel(
        `Refreshed at ${new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())}`
      );
    } finally {
      setIsRefreshingDiagnostics(false);
    }
  };

  useEffect(() => {
    if (!showDiagnostics) return;
    void refreshDiagnosticsSnapshot();
  }, [showDiagnostics]);

  if (isLoading) {
    return (
      <div className={"solid-account-settings-version-loader-wrap"}>
        <span className="solid-btn-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className={"solid-account-settings-version-error"}>Unable to load version information.</p>;
  }

  const packages = ((data as any)?.data?.data ?? (data as any)?.data ?? data) as Record<string, PackageVersionInfo>;
  const envName = (env("VITE_SOLIDX_ENV") || "").toLowerCase();
  const isDevLikeEnvironment = ["dev", "development", "staging", "stage", "uat", "test", "local"].includes(envName);
  const canOpenDiagnostics = hasAnyRole(session?.user?.roles, ["Admin"]) && isDevLikeEnvironment;
  const loginRedirect = env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin";
  const backendApi = env("NEXT_PUBLIC_BACKEND_API_URL") || env("API_URL") || "(not set)";
  const roles = (session?.user?.roles || []).map((role: any) => role?.name || role).join(", ") || "(none)";
  const activeCount = poolSnapshot.filter((entry) => entry.active).length;

  if (!packages || Object.keys(packages).length === 0) {
    return <p className={"solid-account-settings-version-error"}>Version information is currently unavailable.</p>;
  }

  return (
    <div className={"solid-account-settings-version-panel"}>
      <h3 className={"solid-account-settings-section-title"}>Version Information</h3>
      <p className={"solid-account-settings-version-caption"}>Packages powering this application</p>

      <div className={"solid-account-settings-version-list"}>
        {Object.entries(packages).map(([key, info]) => (
          <div key={key} className={"solid-account-settings-version-row"}>
            <div>
              <div className={"solid-account-settings-version-name"}>{PACKAGE_LABELS[key] || key}</div>
              <div className={"solid-account-settings-version-hint"}>{PACKAGE_HINTS[key] || key}</div>
            </div>
            <div className={"solid-account-settings-version-tags"}>
              <span className={"solid-account-settings-version-tag"}>{info.version}</span>
              <span className={`${"solid-account-settings-version-tag"} ${info.repo === "local" ? "solid-account-settings-repo-local" : "solid-account-settings-repo-npm"}`}>
                {info.repo}
              </span>
            </div>
          </div>
        ))}
      </div>

      {canOpenDiagnostics && (
        <div className={"solid-account-settings-version-actions"}>
          <SolidButton
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowDiagnostics(true)}
          >
            Diagnostics
          </SolidButton>
        </div>
      )}

      {canOpenDiagnostics && showDiagnostics && (
        <div className={"solid-account-settings-diagnostics-backdrop"} role="presentation" onClick={() => setShowDiagnostics(false)}>
          <section
            className={"solid-account-settings-diagnostics-modal"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solid-diagnostics-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={"solid-account-settings-diagnostics-header"}>
              <div>
                <h3 id="solid-diagnostics-title" className={"solid-account-settings-section-title"}>Diagnostics</h3>
                <p className={"solid-account-settings-version-caption"}>Current tab runtime entity API pool snapshot.</p>
              </div>
              <div className={"solid-account-settings-diagnostics-header-actions"}>
                <span className={"solid-account-settings-diagnostics-refresh-status"} aria-live="polite">{lastDiagnosticsRefreshLabel}</span>
                <SolidButton
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={isRefreshingDiagnostics}
                  onClick={() => void refreshDiagnosticsSnapshot()}
                >
                  Refresh
                </SolidButton>
                <button
                  type="button"
                  className={"solid-account-settings-close-button"}
                  onClick={() => setShowDiagnostics(false)}
                  aria-label="Close diagnostics"
                >
                  ×
                </button>
              </div>
            </header>

            <div className={"solid-account-settings-diagnostics-summary"}>
              <span><strong>Environment:</strong> {envName || "unknown"}</span>
              <span><strong>Pool Limit:</strong> {SOLID_ENTITY_API_POOL_LIMIT}</span>
              <span><strong>Active:</strong> {activeCount}</span>
              <span><strong>Cached:</strong> {poolSnapshot.length}</span>
            </div>

            <div className={"solid-account-settings-diagnostics-tabs"}>
              <button
                type="button"
                className={`${"solid-account-settings-diagnostics-tab"} ${activeTab === "pool" ? "solid-account-settings-diagnostics-tab-active" : ""}`}
                onClick={() => setActiveTab("pool")}
              >
                Pool
              </button>
              <button
                type="button"
                className={`${"solid-account-settings-diagnostics-tab"} ${activeTab === "runtime" ? "solid-account-settings-diagnostics-tab-active" : ""}`}
                onClick={() => setActiveTab("runtime")}
              >
                Runtime
              </button>
            </div>

            {activeTab === "pool" ? (
              <div className={"solid-account-settings-diagnostics-table-wrap"}>
                <table className={"solid-account-settings-diagnostics-table"}>
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Reducer Path</th>
                      <th>Registered</th>
                      <th>Last Accessed</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolSnapshot.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={"solid-account-settings-diagnostics-empty"}>No entity APIs created in this session yet.</td>
                      </tr>
                    ) : (
                      poolSnapshot.map((entry) => (
                        <tr key={entry.reducerPath}>
                          <td>{entry.entityName}</td>
                          <td className={"solid-account-settings-diagnostics-mono"}>{entry.reducerPath}</td>
                          <td>#{entry.registeredAt}</td>
                          <td>#{entry.lastAccessedAt}</td>
                          <td>{entry.active ? "yes" : "no"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={"solid-account-settings-diagnostics-runtime-grid"}>
                <div><strong>Environment:</strong> {envName || "unknown"}</div>
                <div><strong>Backend API:</strong> {backendApi}</div>
                <div><strong>Login Redirect:</strong> {loginRedirect}</div>
                <div><strong>User:</strong> {session?.user?.email || session?.user?.name || "(unknown)"}</div>
                <div className={"solid-account-settings-diagnostics-span2"}><strong>Roles:</strong> {roles}</div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
