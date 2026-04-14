import { SolidListFieldWidgetProps } from "../../../../types/solid-core";

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
    pending: { backgroundColor: "#6b7280", color: "#fff" },     // gray
    scheduled: { backgroundColor: "#3b82f6", color: "#fff" },   // blue
    started: { backgroundColor: "#eab308", color: "#000" },     // yellow
    retry: { backgroundColor: "#f97316", color: "#fff" },       // orange
    retrying: { backgroundColor: "#ea580c", color: "#fff" },    // darker orange
    failed: { backgroundColor: "#ef4444", color: "#fff" },      // red
    succeeded: { backgroundColor: "#22c55e", color: "#fff" },   // green
};

export const SolidMqMessageStageListViewWidget = ({
    rowData,
    fieldMetadata,
}: SolidListFieldWidgetProps) => {

    const value =
        fieldMetadata?.name && rowData[fieldMetadata.name]
            ? String(rowData[fieldMetadata.name]).toLowerCase()
            : "";

    const style = STATUS_STYLES[value] || {
        backgroundColor: "#9ca3af",
        color: "#fff",
    };

    return (
        <div className="mt-2">
            {value ? (
                <span
                    style={{
                        ...style,
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                    }}
                >
                    {value}
                </span>
            ) : (
                <span className="text-muted">—</span>
            )}
        </div>
    );
};