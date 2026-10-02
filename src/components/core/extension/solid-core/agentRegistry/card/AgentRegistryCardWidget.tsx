import type { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";
import { SolidMaterialSymbol } from "../../../../../common/SolidMaterialSymbol";
import styles from "./AgentRegistryCardWidget.module.css";

function inputCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value !== "string" || !value.trim()) return 0;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).length;
  } catch {
    return 0;
  }
  return 0;
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
  const requiredCount = inputCount(rowData?.requiredInputs);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBadge} aria-label={`${title} icon`}>
          <SolidMaterialSymbol name={iconName} size={22} aria-hidden="true" />
        </div>
        {status && <span className={`${styles.status} ${styles[`status_${status.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`] || ""}`}>{status.replace(/[_-]+/g, " ")}</span>}
      </div>

      <div className={styles.heading}>
        <h3 className={styles.title} title={title}>{title}</h3>
        {name !== title && <span className={styles.name} title={name}>{name}</span>}
      </div>

      <p className={styles.description} title={description || undefined}>
        {description || "An AI agent in your registry."}
      </p>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.badge}>Agent</span>
          <span className={styles.metaText}>{requiredCount} {requiredCount === 1 ? "input" : "inputs"}</span>
        </div>
      </div>
    </article>
  );
}
