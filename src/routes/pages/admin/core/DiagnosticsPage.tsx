import { useMemo, useState } from "react";
import { env } from "../../../../adapters/env";
import { loadSession } from "../../../../adapters/auth/storage";
import { hasAnyRole } from "../../../../helpers/rolesHelper";
import { useSession } from "../../../../hooks/useSession";
import { getSolidEntityApiPoolSnapshot, SOLID_ENTITY_API_POOL_LIMIT } from "../../../../redux/store/solidEntityApiPool";
import { SolidButton } from "../../../../components/shad-cn-ui/SolidButton";

const ALLOWED_ENVIRONMENTS = new Set([
  "dev",
  "development",
  "staging",
  "stage",
  "uat",
  "test",
  "local",
]);

function toDisplayTime(counter: number) {
  return `#${counter}`;
}

export function DiagnosticsPage() {
  const { data: session, status } = useSession();
  const [refreshTick, setRefreshTick] = useState(0);

  const envName = (env("VITE_SOLIDX_ENV") || "unknown").toLowerCase();
  const diagnosticsEnabled = ALLOWED_ENVIRONMENTS.has(envName);
  const isAdmin = hasAnyRole(session?.user?.roles, ["Admin"]);

  const poolSnapshot = useMemo(() => {
    refreshTick;
    return getSolidEntityApiPoolSnapshot();
  }, [refreshTick]);

  const activeCount = poolSnapshot.filter((entry) => entry.active).length;
  const cachedCount = poolSnapshot.length;
  const loginRedirect = env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin";
  const backendApi = env("NEXT_PUBLIC_BACKEND_API_URL") || env("API_URL", "");
  const localSession = loadSession();

  if (status === "loading") {
    return (
      <div className="solid-studio-home">
        <div className="solid-studio-home-inner solid-studio-home-inner--wider">
          <div className="solid-studio-card">
            <div className="solid-studio-card-content">Loading diagnostics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="solid-studio-home">
        <div className="solid-studio-home-inner solid-studio-home-inner--wider">
          <div className="solid-studio-card">
            <div className="solid-studio-card-header">
              <h3 className="solid-studio-card-title">Diagnostics Access Restricted</h3>
              <p className="solid-studio-card-description">
                You do not have permission to view this diagnostics page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!diagnosticsEnabled) {
    return (
      <div className="solid-studio-home">
        <div className="solid-studio-home-inner solid-studio-home-inner--wider">
          <div className="solid-studio-card">
            <div className="solid-studio-card-header">
              <h3 className="solid-studio-card-title">Diagnostics Disabled</h3>
              <p className="solid-studio-card-description">
                Diagnostics are enabled only in dev/staging-style environments. Current environment: <code>{envName}</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-studio-home solid-studio-home--top">
      <div className="solid-studio-home-inner solid-studio-home-inner--wider">
        <div className="solid-studio-home-toolbar" style={{ marginBottom: "14px" }}>
          <div className="solid-studio-home-toolbar-left">
            <div className="solid-studio-home-heading">
              <div className="solid-studio-home-badge">Diagnostics</div>
              <h1>SolidX Runtime Diagnostics</h1>
              <p>Read-only runtime snapshot for support and debugging.</p>
            </div>
          </div>
          <div className="solid-studio-home-toolbar-right">
            <SolidButton size="sm" variant="outline" onClick={() => setRefreshTick((v) => v + 1)}>
              Refresh
            </SolidButton>
          </div>
        </div>

        <div className="solid-studio-card" style={{ marginBottom: "14px" }}>
          <div className="solid-studio-card-header">
            <h3 className="solid-studio-card-title">Runtime</h3>
          </div>
          <div className="solid-studio-card-content">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              <div><strong>Environment:</strong> {envName}</div>
              <div><strong>Pool Limit:</strong> {SOLID_ENTITY_API_POOL_LIMIT}</div>
              <div><strong>Active Entity APIs:</strong> {activeCount}</div>
              <div><strong>Cached Entity APIs:</strong> {cachedCount}</div>
              <div><strong>Login Redirect:</strong> {loginRedirect}</div>
              <div><strong>Backend API:</strong> {backendApi || "(not set)"}</div>
              <div><strong>User:</strong> {localSession?.user?.email || localSession?.user?.name || "(unknown)"}</div>
              <div><strong>Roles:</strong> {(localSession?.user?.roles || []).map((r: any) => r.name || r).join(", ") || "(none)"}</div>
            </div>
          </div>
        </div>

        <div className="solid-studio-card">
          <div className="solid-studio-card-header">
            <h3 className="solid-studio-card-title">Entity API Pool</h3>
            <p className="solid-studio-card-description">
              Each entry represents a lazily created entity API. Active entries have reducer+middleware currently registered.
            </p>
          </div>
          <div className="solid-studio-card-content" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.35)" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>Entity</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Reducer Path</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Registered</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Last Accessed</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {poolSnapshot.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "12px", opacity: 0.7 }}>
                      No entity APIs have been created in this session yet.
                    </td>
                  </tr>
                ) : (
                  poolSnapshot.map((entry) => (
                    <tr key={entry.reducerPath} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>
                      <td style={{ padding: "8px" }}>{entry.entityName}</td>
                      <td style={{ padding: "8px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{entry.reducerPath}</td>
                      <td style={{ padding: "8px" }}>{toDisplayTime(entry.registeredAt)}</td>
                      <td style={{ padding: "8px" }}>{toDisplayTime(entry.lastAccessedAt)}</td>
                      <td style={{ padding: "8px" }}>{entry.active ? "yes" : "no"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
