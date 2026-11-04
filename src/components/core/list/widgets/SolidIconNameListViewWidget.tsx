import type { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import { SolidMaterialSymbol } from "../../../common/SolidMaterialSymbol";

/** Read-only list-cell renderer for fields storing a Material Symbol name. */
export function SolidIconNameListViewWidget({ rowData, fieldMetadata, column }: SolidListFieldWidgetProps) {
  const fieldName = fieldMetadata?.name ?? column?.attrs?.name;
  const iconName = fieldName ? rowData?.[fieldName] : undefined;

  if (typeof iconName !== "string" || !iconName.trim()) return <span />;

  const normalizedName = iconName.trim();
  return (
    <span
      role="img"
      aria-label={normalizedName.replace(/_/g, " ")}
      title={normalizedName.replace(/_/g, " ")}
      style={{
        display: "inline-flex",
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--surface-border, var(--border, #3f3f46))",
        borderRadius: 10,
        color: "var(--text-color-secondary, var(--muted-foreground, currentColor))",
        verticalAlign: "middle",
      }}
    >
      <SolidMaterialSymbol name={normalizedName} size={20} aria-hidden="true" />
    </span>
  );
}
