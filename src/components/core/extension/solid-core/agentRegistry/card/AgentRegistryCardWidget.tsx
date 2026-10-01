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

/** Shared card renderer for agent skill and tool registry records. */
export function AgentRegistryCardWidget({ rowData }: SolidKanbanCardWidgetProps) {
  const iconName = typeof rowData?.iconName === "string" && rowData.iconName.trim()
    ? rowData.iconName.trim()
    : rowData?.type ? "build" : "psychology";
  const name = typeof rowData?.name === "string" && rowData.name.trim() ? rowData.name.trim() : "Untitled";
  const description = typeof rowData?.description === "string" ? rowData.description.trim() : "";
  const tags = toTags(rowData?.tags);
  const badges = [rowData?.type, rowData?.status].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return (
    <article className={styles.content}>
      <h3 className={styles.title} title={name}>{name}</h3>
      <div className={styles.iconStage} aria-label={`${name} icon`}>
        <SolidMaterialSymbol name={iconName} size={42} aria-hidden="true" />
      </div>
      <p className={styles.description} title={description || undefined}>
        {description || "No description provided."}
      </p>
      {(badges.length > 0 || tags.length > 0) && (
        <div className={styles.footer}>
          <div className={styles.badges}>
            {badges.map((badge) => <span className={styles.badge} key={badge}>{badge.replace(/[_-]+/g, " ")}</span>)}
          </div>
          {tags.length > 0 && <div className={styles.tags}>{tags.map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</div>}
        </div>
      )}
    </article>
  );
}
