import type { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";
import { SolidMaterialSymbol } from "../../../../../common/SolidMaterialSymbol";
import styles from "./AgentRegistryCardWidget.module.css";

function modelLabel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const [provider, ...model] = value.trim().split(":");
  return model.length ? `${provider} · ${model.join(":")}` : value.trim();
}

/** Card renderer for Agent Registry records. */
export function AgentRegistryCardWidget({ rowData }: SolidKanbanCardWidgetProps) {
  const iconName = typeof rowData?.iconName === "string" && rowData.iconName.trim()
    ? rowData.iconName.trim()
    : "psychology";
  const name = typeof rowData?.name === "string" && rowData.name.trim() ? rowData.name.trim() : "Untitled";
  const title = typeof rowData?.title === "string" && rowData.title.trim() ? rowData.title.trim() : name;
  const description = typeof rowData?.description === "string" ? rowData.description.trim() : "";
  const status = typeof rowData?.status === "string" && rowData.status.trim() ? rowData.status.trim() : "";
  const configVersion = Number(rowData?.configVersion);
  const normalizedDescription = description.toLocaleLowerCase();
  const summary = normalizedDescription === title.toLocaleLowerCase() || normalizedDescription === name.toLocaleLowerCase() ? "" : description;
  const models = [
    { label: "Reasoning", value: modelLabel(rowData?.reasoningModelKey) },
    { label: "Fast", value: modelLabel(rowData?.fastModelKey) },
  ].filter((model) => model.value);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBadge} aria-label={`${title} icon`}>
          <SolidMaterialSymbol name={iconName} size={22} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.heading}>
        <h3 className={styles.title} title={title}>{title}</h3>
        {name !== title && <span className={styles.name} title={name}>{name}</span>}
      </div>

      {summary && <p className={styles.description} title={summary}>{summary}</p>}

      {models.length > 0 && <div className={styles.models} aria-label="Configured models">
        {models.map((model) => <div className={styles.modelRow} key={model.label} title={`${model.label}: ${model.value}`}>
          <span>{model.label}</span><strong>{model.value}</strong>
        </div>)}
      </div>}

      <div className={styles.footer}>
        <div className={styles.meta}>
          {status && <span className={`${styles.status} ${styles[`status_${status.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`] || ""}`}>{status.replace(/[_-]+/g, " ")}</span>}
          {Number.isFinite(configVersion) && configVersion > 0 && <span className={styles.badge} aria-label={`Configuration version ${configVersion}`}>Config v{configVersion}</span>}
        </div>
      </div>
    </article>
  );
}
