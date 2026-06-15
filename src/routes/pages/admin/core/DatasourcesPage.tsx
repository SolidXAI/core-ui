import { Database, HardDriveDownload, Plus, RefreshCw, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../../redux/features/toastSlice";
import {
  type CreateDatasourceManagementPayload,
  type DatasourceManagementRecord,
  useCreateDatasourceMutation,
  useGetDatasourcesQuery,
} from "../../../../redux/api/datasourceManagementApi";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogDescription,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidInput,
  SolidPanel,
  SolidSelect,
  SolidSpinner,
  SolidSwitch,
} from "../../../../components/shad-cn-ui";
import "./DatasourcesPage.css";

const providerOptions = [
  { label: "PostgreSQL", value: "postgres" },
  { label: "MySQL", value: "mysql" },
  { label: "MS SQL Server", value: "mssql" },
] as const;

const defaultFormState: CreateDatasourceManagementPayload = {
  name: "",
  displayName: "",
  type: "postgres",
  host: "",
  port: 5432,
  database: "",
  username: "",
  password: "",
  synchronize: false,
  logging: false,
  ssl: false,
  sslRejectUnauthorized: true,
  poolMax: 20,
  connectionTimeoutMs: 60000,
  idleTimeoutMs: 30000,
  statementTimeoutMs: 60000,
  idleInTxTimeoutMs: 60000,
  retryAttempts: 0,
  retryDelayMs: 0,
  encrypt: false,
  trustServerCertificate: true,
};

function slugifyDatasourceName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getDefaultPort(type: CreateDatasourceManagementPayload["type"]) {
  if (type === "mysql") return 3306;
  if (type === "mssql") return 1433;
  return 5432;
}

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

function countByType(datasources: DatasourceManagementRecord[], type: string) {
  return datasources.filter((datasource) => datasource.type === type).length;
}

function readMutationError(error: any) {
  return (
    error?.data?.message
    || error?.error
    || error?.message
    || "Unable to save the datasource."
  );
}

function sanitizePayload(formState: CreateDatasourceManagementPayload): CreateDatasourceManagementPayload {
  const payload: CreateDatasourceManagementPayload = {
    ...formState,
    name: slugifyDatasourceName(formState.name),
  };

  if (payload.type === "mssql") {
    delete payload.ssl;
    delete payload.sslRejectUnauthorized;
    delete payload.statementTimeoutMs;
    delete payload.idleInTxTimeoutMs;
  } else {
    delete payload.encrypt;
    delete payload.trustServerCertificate;
  }

  if (payload.type !== "postgres") {
    delete payload.statementTimeoutMs;
    delete payload.idleInTxTimeoutMs;
  }

  return payload;
}

function DatasourceProviderMark({ type }: { type: string }) {
  return (
    <div className={`sdm-provider-mark ${providerTone(type)}`}>
      <span>{providerGlyph(type)}</span>
    </div>
  );
}

export function DatasourcesPage() {
  const dispatch = useDispatch();
  const {
    data: datasources = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDatasourcesQuery();
  const [createDatasource, { isLoading: isCreating }] = useCreateDatasourceMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [formState, setFormState] = useState<CreateDatasourceManagementPayload>(defaultFormState);

  useEffect(() => {
    if (!dialogOpen) {
      setFormState(defaultFormState);
      setNameTouched(false);
    }
  }, [dialogOpen]);

  const stats = [
    { label: "Configured", value: datasources.length, icon: <Database size={18} /> },
    { label: "Default", value: datasources.filter((item) => item.isDefault).length, icon: <Server size={18} /> },
    { label: "PostgreSQL", value: countByType(datasources, "postgres"), icon: <HardDriveDownload size={18} /> },
    { label: "MySQL", value: countByType(datasources, "mysql"), icon: <HardDriveDownload size={18} /> },
    { label: "MS SQL", value: countByType(datasources, "mssql"), icon: <HardDriveDownload size={18} /> },
  ];

  const handleFieldChange = <K extends keyof CreateDatasourceManagementPayload>(
    key: K,
    value: CreateDatasourceManagementPayload[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleDisplayNameChange = (value: string) => {
    setFormState((current) => ({
      ...current,
      displayName: value,
      name: nameTouched ? current.name : slugifyDatasourceName(value),
    }));
  };

  const handleTypeChange = (value: CreateDatasourceManagementPayload["type"]) => {
    handleFieldChange("type", value);
    handleFieldChange("port", getDefaultPort(value));
  };

  const handleSubmit = async () => {
    if (!formState.name || !formState.host || !formState.database || !formState.username || !formState.password) {
      dispatch(showToast({
        severity: "warn",
        summary: "Missing details",
        detail: "Fill in the datasource name, host, database, username, and password.",
      }));
      return;
    }

    try {
      const payload = sanitizePayload(formState);
      await createDatasource(payload).unwrap();
      setDialogOpen(false);
      dispatch(showToast({
        severity: "success",
        summary: "Datasource created",
        detail: `${payload.displayName || payload.name} is now registered in SolidX.`,
      }));
    } catch (mutationError: any) {
      dispatch(showToast({
        severity: "error",
        summary: "Datasource creation failed",
        detail: readMutationError(mutationError),
      }));
    }
  };

  return (
    <div className="sdm-page">
      <section className="sdm-hero">
        <div className="sdm-hero__copy">
          <span className="sdm-eyebrow">App Builder</span>
          <h1>Datasource Management</h1>
          <p>
            Review every configured datasource in one place and add new TypeORM connections without leaving the SolidX admin surface.
          </p>
          <div className="sdm-hero__actions">
            <SolidButton size="small" onClick={() => setDialogOpen(true)} leftIcon={<Plus size={14} />}>
              Add datasource
            </SolidButton>
            <SolidButton size="small" variant="outline" onClick={() => void refetch()} leftIcon={<RefreshCw size={14} />}>
              Refresh
            </SolidButton>
          </div>
        </div>
        <div className="sdm-hero__panel">
          <div className="sdm-hero__panel-title">How this works</div>
          <ul>
            <li>`default` stays reserved for the bootstrap datasource.</li>
            <li>New datasources are written directly into `app-*-database.module.ts` and `.env`.</li>
            <li>Advanced options stay close to the generated datasource module instead of drifting into a sidecar JSON file.</li>
          </ul>
        </div>
      </section>

      <section className="sdm-stats">
        {stats.map((stat) => (
          <article key={stat.label} className="sdm-stat">
            <div className="sdm-stat__icon">{stat.icon}</div>
            <div className="sdm-stat__value">{stat.value}</div>
            <div className="sdm-stat__label">{stat.label}</div>
          </article>
        ))}
      </section>

      <section className="sdm-section-head">
        <div>
          <h2>Configured datasources</h2>
          <p>Large cards surface the provider, host, logical name, and environment prefix at a glance.</p>
        </div>
        {isFetching && !isLoading ? (
          <div className="sdm-inline-status">
            <SolidSpinner size={16} />
            <span>Refreshing</span>
          </div>
        ) : null}
      </section>

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
            <p>Create one here and SolidX will wire the module and environment variables for you.</p>
          </div>
          <SolidButton size="small" onClick={() => setDialogOpen(true)} leftIcon={<Plus size={14} />}>
            Add datasource
          </SolidButton>
        </div>
      )}

      <SolidDialog open={dialogOpen} onOpenChange={setDialogOpen} style={{ width: "min(860px, calc(100vw - 32px))" }}>
        <SolidDialogHeader>
          <div>
            <SolidDialogTitle>Add datasource</SolidDialogTitle>
            <SolidDialogDescription>
              Create a new datasource module, register it in `app.module.ts`, and persist its env variables to disk.
            </SolidDialogDescription>
          </div>
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody>
          <div className="sdm-form-grid">
            <label className="sdm-form-field">
              <span>Display name</span>
              <SolidInput
                value={formState.displayName || ""}
                placeholder="Applications"
                onChange={(event) => handleDisplayNameChange(event.target.value)}
              />
            </label>

            <label className="sdm-form-field">
              <span>Datasource key</span>
              <SolidInput
                value={formState.name}
                placeholder="applications"
                onChange={(event) => {
                  setNameTouched(true);
                  handleFieldChange("name", slugifyDatasourceName(event.target.value));
                }}
              />
            </label>

            <label className="sdm-form-field">
              <span>Provider</span>
              <SolidSelect
                value={formState.type}
                options={providerOptions as any}
                onChange={(event) => handleTypeChange(event.value)}
              />
            </label>

            <label className="sdm-form-field">
              <span>Port</span>
              <SolidInput
                type="number"
                value={formState.port}
                onChange={(event) => handleFieldChange("port", Number(event.target.value) || getDefaultPort(formState.type))}
              />
            </label>

            <label className="sdm-form-field">
              <span>Host</span>
              <SolidInput
                value={formState.host}
                placeholder="localhost"
                onChange={(event) => handleFieldChange("host", event.target.value)}
              />
            </label>

            <label className="sdm-form-field">
              <span>Database</span>
              <SolidInput
                value={formState.database}
                placeholder="solidx_app"
                onChange={(event) => handleFieldChange("database", event.target.value)}
              />
            </label>

            <label className="sdm-form-field">
              <span>Username</span>
              <SolidInput
                value={formState.username}
                placeholder="postgres"
                onChange={(event) => handleFieldChange("username", event.target.value)}
              />
            </label>

            <label className="sdm-form-field">
              <span>Password</span>
              <SolidInput
                type="password"
                value={formState.password}
                onChange={(event) => handleFieldChange("password", event.target.value)}
              />
            </label>
          </div>

          <div className="sdm-switch-row">
            <label className="sdm-switch-field">
              <div>
                <strong>Synchronize</strong>
                <span>Write `*_DATABASE_SYNCHRONIZE` for this datasource.</span>
              </div>
              <SolidSwitch checked={!!formState.synchronize} onChange={(checked) => handleFieldChange("synchronize", checked)} />
            </label>

            <label className="sdm-switch-field">
              <div>
                <strong>Logging</strong>
                <span>Enable TypeORM logging through the generated datasource module.</span>
              </div>
              <SolidSwitch checked={!!formState.logging} onChange={(checked) => handleFieldChange("logging", checked)} />
            </label>
          </div>

          <SolidPanel header="Advanced options" toggleable className="solid-column-panel sdm-advanced-panel">
            <div className="sdm-advanced-grid">
              {formState.type === "mssql" ? (
                <>
                  <label className="sdm-switch-field sdm-switch-field--inline">
                    <div>
                      <strong>Encrypt</strong>
                      <span>MSSQL connection option.</span>
                    </div>
                    <SolidSwitch checked={!!formState.encrypt} onChange={(checked) => handleFieldChange("encrypt", checked)} />
                  </label>

                  <label className="sdm-switch-field sdm-switch-field--inline">
                    <div>
                      <strong>Trust certificate</strong>
                      <span>Allow self-signed development certificates.</span>
                    </div>
                    <SolidSwitch checked={!!formState.trustServerCertificate} onChange={(checked) => handleFieldChange("trustServerCertificate", checked)} />
                  </label>
                </>
              ) : (
                <>
                  <label className="sdm-switch-field sdm-switch-field--inline">
                    <div>
                      <strong>SSL</strong>
                      <span>Enable SSL for PostgreSQL or MySQL.</span>
                    </div>
                    <SolidSwitch checked={!!formState.ssl} onChange={(checked) => handleFieldChange("ssl", checked)} />
                  </label>

                  <label className="sdm-switch-field sdm-switch-field--inline">
                    <div>
                      <strong>Reject unauthorized</strong>
                      <span>Keep certificate validation strict when SSL is enabled.</span>
                    </div>
                    <SolidSwitch checked={!!formState.sslRejectUnauthorized} onChange={(checked) => handleFieldChange("sslRejectUnauthorized", checked)} />
                  </label>
                </>
              )}

              <label className="sdm-form-field">
                <span>Pool max</span>
                <SolidInput
                  type="number"
                  value={formState.poolMax ?? ""}
                  onChange={(event) => handleFieldChange("poolMax", Number(event.target.value) || 0)}
                />
              </label>

              <label className="sdm-form-field">
                <span>Connection timeout (ms)</span>
                <SolidInput
                  type="number"
                  value={formState.connectionTimeoutMs ?? ""}
                  onChange={(event) => handleFieldChange("connectionTimeoutMs", Number(event.target.value) || 0)}
                />
              </label>

              <label className="sdm-form-field">
                <span>Idle timeout (ms)</span>
                <SolidInput
                  type="number"
                  value={formState.idleTimeoutMs ?? ""}
                  onChange={(event) => handleFieldChange("idleTimeoutMs", Number(event.target.value) || 0)}
                />
              </label>

              {formState.type === "postgres" ? (
                <>
                  <label className="sdm-form-field">
                    <span>Statement timeout (ms)</span>
                    <SolidInput
                      type="number"
                      value={formState.statementTimeoutMs ?? ""}
                      onChange={(event) => handleFieldChange("statementTimeoutMs", Number(event.target.value) || 0)}
                    />
                  </label>

                  <label className="sdm-form-field">
                    <span>Idle in transaction timeout (ms)</span>
                    <SolidInput
                      type="number"
                      value={formState.idleInTxTimeoutMs ?? ""}
                      onChange={(event) => handleFieldChange("idleInTxTimeoutMs", Number(event.target.value) || 0)}
                    />
                  </label>
                </>
              ) : null}

              <label className="sdm-form-field">
                <span>Retry attempts</span>
                <SolidInput
                  type="number"
                  value={formState.retryAttempts ?? ""}
                  onChange={(event) => handleFieldChange("retryAttempts", Number(event.target.value) || 0)}
                />
              </label>

              <label className="sdm-form-field">
                <span>Retry delay (ms)</span>
                <SolidInput
                  type="number"
                  value={formState.retryDelayMs ?? ""}
                  onChange={(event) => handleFieldChange("retryDelayMs", Number(event.target.value) || 0)}
                />
              </label>
            </div>
          </SolidPanel>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </SolidButton>
          <SolidButton onClick={() => void handleSubmit()} loading={isCreating}>
            Create datasource
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
    </div>
  );
}
