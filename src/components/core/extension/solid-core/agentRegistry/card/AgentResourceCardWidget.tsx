import type { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";
import { SolidMaterialSymbol } from "../../../../../common/SolidMaterialSymbol";
import styles from "./AgentRegistryCardWidget.module.css";

function toTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
  } catch {
    return value === "{}" ? [] : value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}

/** Compact shared card renderer for agent skill and tool records. */
export function AgentResourceCardWidget({ rowData }: SolidKanbanCardWidgetProps) {
  const iconName = typeof rowData?.iconName === "string" && rowData.iconName.trim()
    ? rowData.iconName.trim()
    : rowData?.type ? "build" : "psychology";
  const name = typeof rowData?.name === "string" && rowData.name.trim() ? rowData.name.trim() : "Untitled";
  const description = typeof rowData?.description === "string" ? rowData.description.trim() : "";
  const tags = toTags(rowData?.tags);
  const status = typeof rowData?.status === "string" && rowData.status.trim() ? rowData.status.trim() : "";
  const loadError = status === "load_failed" && typeof rowData?.lastLoadError === "string"
    ? rowData.lastLoadError.trim()
    : "";
  const kind = typeof rowData?.type === "string" && rowData.type.trim() ? rowData.type.trim() : "";

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBadge} aria-label={`${name} icon`}>
          <SolidMaterialSymbol name={iconName} size={22} aria-hidden="true" />
        </div>
        {status && <span className={`${styles.status} ${styles[`status_${status.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`] || ""}`}>{status.replace(/[_-]+/g, " ")}</span>}
      </div>
      <div className={styles.heading}><h3 className={styles.title} title={name}>{name}</h3></div>
      <p className={styles.description} title={description || undefined}>{description || "No description provided."}</p>
      {loadError && <p className={styles.loadError} title={loadError}>{loadError}</p>}
      {(kind || tags.length > 0) && <div className={styles.footer}>
        <div className={styles.meta}>{kind && <span className={styles.badge}>{kind.replace(/[_-]+/g, " ")}</span>}</div>
        {tags.length > 0 && <div className={styles.tags}>{tags.slice(0, 3).map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</div>}
      </div>}
    </article>
  );
}
