type MqMessageStageBadgeProps = {
    stage?: any;
    className?: string;
    showDot?: boolean;
    compact?: boolean;
    fallbackLabel?: string;
};

const STAGE_TONES: Record<string, { backgroundColor: string; color: string; borderColor: string; dotColor: string }> = {
    pending: { backgroundColor: "#6b7280", color: "#fff", borderColor: "rgba(107, 114, 128, 0.18)", dotColor: "#d1d5db" },
    scheduled: { backgroundColor: "#722ED1", color: "#fff", borderColor: "rgba(114, 46, 209, 0.18)", dotColor: "#efdbff" },
    started: { backgroundColor: "#eab308", color: "#111827", borderColor: "rgba(234, 179, 8, 0.22)", dotColor: "#fef08a" },
    retry: { backgroundColor: "#f97316", color: "#fff", borderColor: "rgba(249, 115, 22, 0.18)", dotColor: "#fed7aa" },
    retrying: { backgroundColor: "#ea580c", color: "#fff", borderColor: "rgba(234, 88, 12, 0.18)", dotColor: "#fdba74" },
    failed: { backgroundColor: "#ef4444", color: "#fff", borderColor: "rgba(239, 68, 68, 0.18)", dotColor: "#fecaca" },
    succeeded: { backgroundColor: "#22c55e", color: "#fff", borderColor: "rgba(34, 197, 94, 0.18)", dotColor: "#bbf7d0" },
    default: { backgroundColor: "#9ca3af", color: "#fff", borderColor: "rgba(156, 163, 175, 0.18)", dotColor: "#e5e7eb" },
};

export const getMqMessageStageTone = (stage: any) => {
    const key = String(stage || "").toLowerCase();
    return STAGE_TONES[key] || STAGE_TONES.default;
};

export const getMqMessageStageLabel = (stage: any, fallbackLabel = "—") => {
    if (stage === null || stage === undefined || stage === "") {
        return fallbackLabel;
    }

    return String(stage).toLowerCase();
};

export const MqMessageStageBadge = ({
    stage,
    className = "",
    showDot = false,
    compact = false,
    fallbackLabel = "—",
}: MqMessageStageBadgeProps) => {
    const label = getMqMessageStageLabel(stage, fallbackLabel);
    if (label === fallbackLabel) {
        return <span className={`text-muted ${className}`.trim()}>{fallbackLabel}</span>;
    }

    const tone = getMqMessageStageTone(stage);

    return (
        <span
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: showDot ? "6px" : "0",
                borderRadius: "999px",
                padding: compact ? "3px 8px" : "4px 10px",
                fontSize: compact ? "11px" : "12px",
                fontWeight: 600,
                textTransform: "capitalize",
                backgroundColor: tone.backgroundColor,
                color: tone.color,
                border: `1px solid ${tone.borderColor}`,
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
            title={label}
        >
            {showDot && (
                <span
                    aria-hidden="true"
                    style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "999px",
                        backgroundColor: tone.dotColor,
                        flex: "0 0 auto",
                    }}
                />
            )}
            <span>{label}</span>
        </span>
    );
};

