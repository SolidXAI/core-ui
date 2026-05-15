import { useEffect, useMemo, useState } from "react";
import { env } from "../../../../adapters/env";
import { hasAnyRole } from "../../../../helpers/rolesHelper";
import { useSession } from "../../../../hooks/useSession";
import { useLazyGetSolidVersionInfoQuery } from "../../../../redux/api/solidSettingsApi";
import { getSolidEntityApiPoolSnapshot, SOLID_ENTITY_API_POOL_LIMIT } from "../../../../redux/store/solidEntityApiPool";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import styles from "./SolidAccountSettings.module.css";

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
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeTab, setActiveTab] = useState<"pool" | "runtime">("pool");
  const poolSnapshot = useMemo(() => getSolidEntityApiPoolSnapshot(), [refreshTick, showDiagnostics]);

  useEffect(() => {
    trigger("");
  }, [trigger]);

  if (isLoading) {
    return (
      <div className={styles.versionLoaderWrap}>
        <span className="solid-btn-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className={styles.versionError}>Unable to load version information.</p>;
  }

  const packages = ((data as any)?.data ?? data) as Record<string, PackageVersionInfo>;
  const envName = (env("VITE_SOLIDX_ENV") || "").toLowerCase();
  const isDevLikeEnvironment = ["dev", "development", "staging", "stage", "uat", "test", "local"].includes(envName);
  const canOpenDiagnostics = hasAnyRole(session?.user?.roles, ["Admin"]) && isDevLikeEnvironment;
  const loginRedirect = env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin";
  const backendApi = env("NEXT_PUBLIC_BACKEND_API_URL") || env("API_URL") || "(not set)";
  const roles = (session?.user?.roles || []).map((role: any) => role?.name || role).join(", ") || "(none)";
  const activeCount = poolSnapshot.filter((entry) => entry.active).length;

  return (
    <div className={styles.versionPanel}>
      <h3 className={styles.sectionTitle}>Version Information</h3>
      <p className={styles.versionCaption}>Packages powering this application</p>

      <div className={styles.versionList}>
        {Object.entries(packages).map(([key, info]) => (
          <div key={key} className={styles.versionRow}>
            <div>
              <div className={styles.versionName}>{PACKAGE_LABELS[key] || key}</div>
              <div className={styles.versionHint}>{PACKAGE_HINTS[key] || key}</div>
            </div>
            <div className={styles.versionTags}>
              <span className={styles.versionTag}>{info.version}</span>
              <span className={`${styles.versionTag} ${info.repo === "local" ? styles.repoLocal : styles.repoNpm}`}>
                {info.repo}
              </span>
            </div>
          </div>
        ))}
      </div>

      {canOpenDiagnostics && (
        <div className={styles.versionActions}>
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
        <div className={styles.diagnosticsBackdrop} role="presentation" onClick={() => setShowDiagnostics(false)}>
          <section
            className={styles.diagnosticsModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solid-diagnostics-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.diagnosticsHeader}>
              <div>
                <h3 id="solid-diagnostics-title" className={styles.sectionTitle}>Diagnostics</h3>
                <p className={styles.versionCaption}>Current tab runtime entity API pool snapshot.</p>
              </div>
              <div className={styles.diagnosticsHeaderActions}>
                <SolidButton type="button" size="sm" variant="outline" onClick={() => setRefreshTick((value) => value + 1)}>
                  Refresh
                </SolidButton>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setShowDiagnostics(false)}
                  aria-label="Close diagnostics"
                >
                  ×
                </button>
              </div>
            </header>

            <div className={styles.diagnosticsSummary}>
              <span><strong>Environment:</strong> {envName || "unknown"}</span>
              <span><strong>Pool Limit:</strong> {SOLID_ENTITY_API_POOL_LIMIT}</span>
              <span><strong>Active:</strong> {activeCount}</span>
              <span><strong>Cached:</strong> {poolSnapshot.length}</span>
            </div>

            <div className={styles.diagnosticsTabs}>
              <button
                type="button"
                className={`${styles.diagnosticsTab} ${activeTab === "pool" ? styles.diagnosticsTabActive : ""}`}
                onClick={() => setActiveTab("pool")}
              >
                Pool
              </button>
              <button
                type="button"
                className={`${styles.diagnosticsTab} ${activeTab === "runtime" ? styles.diagnosticsTabActive : ""}`}
                onClick={() => setActiveTab("runtime")}
              >
                Runtime
              </button>
            </div>

            {activeTab === "pool" ? (
              <div className={styles.diagnosticsTableWrap}>
                <table className={styles.diagnosticsTable}>
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
                        <td colSpan={5} className={styles.diagnosticsEmpty}>No entity APIs created in this session yet.</td>
                      </tr>
                    ) : (
                      poolSnapshot.map((entry) => (
                        <tr key={entry.reducerPath}>
                          <td>{entry.entityName}</td>
                          <td className={styles.diagnosticsMono}>{entry.reducerPath}</td>
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
              <div className={styles.diagnosticsRuntimeGrid}>
                <div><strong>Environment:</strong> {envName || "unknown"}</div>
                <div><strong>Backend API:</strong> {backendApi}</div>
                <div><strong>Login Redirect:</strong> {loginRedirect}</div>
                <div><strong>User:</strong> {session?.user?.email || session?.user?.name || "(unknown)"}</div>
                <div className={styles.diagnosticsSpan2}><strong>Roles:</strong> {roles}</div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
