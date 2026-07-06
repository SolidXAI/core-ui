import { Database, RefreshCw } from "lucide-react";
import { useGetDatasourcesQuery } from "../../../../redux/api/datasourceManagementApi";
import {
  SolidButton,
  SolidSpinner,
} from "../../../../components/shad-cn-ui";
import "./DatasourcesPage.css";

const providerOptions = [
  { label: "PostgreSQL", value: "postgres" },
  { label: "MySQL", value: "mysql" },
  { label: "MS SQL Server", value: "mssql" },
] as const;

function providerLabel(type: string) {
  return providerOptions.find((option) => option.value === type)?.label || type;
}

function providerTone(type: string) {
  if (type === "postgres") return "sdm-provider-mark--postgres";
  if (type === "mysql") return "sdm-provider-mark--mysql";
  return "sdm-provider-mark--mssql";
}

function providerGlyph(type: string) {
  if (type === "postgres") return "PG";
  if (type === "mysql") return "MY";
  return "MS";
}

function DatasourceProviderMark({ type }: { type: string }) {
  return (
    <div className={`sdm-provider-mark ${providerTone(type)}`}>
      <span>{providerGlyph(type)}</span>
    </div>
  );
}

export function DatasourcesPage() {
  const {
    data: datasources = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDatasourcesQuery();

  return (
    <div className="sdm-page">
      <div className="sdm-header">
        <div className="sdm-title-block">
          <h1 className="sdm-title">Datasource Management</h1>
          <p className="sdm-subtitle">Review and manage the datasources configured for this SolidX application.</p>
        </div>

        <div className="sdm-header-actions">
          {isFetching && !isLoading ? (
            <div className="sdm-inline-status">
              <SolidSpinner size={16} />
              <span>Refreshing</span>
            </div>
          ) : null}

          <SolidButton
            className="sdm-icon-button"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => void refetch()}
            tooltip="Refresh"
            aria-label="Refresh"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="sdm-loading">
          <SolidSpinner size={28} />
          <p>Loading datasource configuration...</p>
        </div>
      ) : error ? (
        <div className="sdm-error">
          <span>Unable to load datasource configuration.</span>
          <SolidButton size="small" variant="outline" onClick={() => void refetch()}>
            Retry
          </SolidButton>
        </div>
      ) : datasources.length ? (
        <div className="sdm-grid">
          {datasources.map((datasource) => (
            <article key={datasource.name} className="sdm-card">
              <div className="sdm-card__top">
                <div className="sdm-card__identity">
                  <DatasourceProviderMark type={datasource.type} />
                  <div>
                    <h3>{datasource.displayName}</h3>
                    <p>{datasource.name}</p>
                  </div>
                </div>
                <div className="sdm-card__badges">
                  <span className="sdm-badge sdm-badge--provider">{providerLabel(datasource.type)}</span>
                  {datasource.isDefault ? <span className="sdm-badge sdm-badge--default">Default</span> : null}
                </div>
              </div>

              <div className="sdm-card__facts">
                <div className="sdm-card__row">
                  <span>Host</span>
                  <strong>{datasource.host || "Not configured"}</strong>
                </div>
                <div className="sdm-card__row">
                  <span>Port</span>
                  <strong>{datasource.port ?? "Not configured"}</strong>
                </div>
                <div className="sdm-card__row">
                  <span>Database</span>
                  <strong>{datasource.database || "Not configured"}</strong>
                </div>
                <div className="sdm-card__row">
                  <span>User</span>
                  <strong>{datasource.username || "Not configured"}</strong>
                </div>
                <div className="sdm-card__row">
                  <span>Env prefix</span>
                  <strong>{datasource.envPrefix}</strong>
                </div>
                <div className="sdm-card__row">
                  <span>Password</span>
                  <strong>{datasource.passwordConfigured ? "Configured" : "Missing"}</strong>
                </div>
              </div>

              <div className="sdm-card__footer">
                <div className="sdm-meta-pill">sync: {datasource.synchronize === null ? "n/a" : String(datasource.synchronize)}</div>
                <div className="sdm-meta-pill">logging: {datasource.logging === null ? "n/a" : String(datasource.logging)}</div>
                {datasource.advanced?.poolMax ? <div className="sdm-meta-pill">pool: {datasource.advanced.poolMax}</div> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="sdm-empty">
          <Database size={22} />
          <div>
            <h3>No datasources configured</h3>
            <p>Datasource creation is temporarily unavailable from this screen.</p>
          </div>
        </div>
      )}
    </div>
  );
}
