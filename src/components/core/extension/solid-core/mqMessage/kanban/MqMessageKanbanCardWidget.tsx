import { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";

const STAGE_TONES: Record<string, Record<string, string>> = {
  started: {
    accent: "#4f46e5",
    accentSoft: "rgba(79, 70, 229, 0.10)",
    border: "rgba(79, 70, 229, 0.18)",
    chipBg: "rgba(79, 70, 229, 0.08)",
    chipText: "#4f46e5",
    avatarBg: "rgba(79, 70, 229, 0.18)",
  },
  pending: {
    accent: "#d97706",
    accentSoft: "rgba(217, 119, 6, 0.10)",
    border: "rgba(217, 119, 6, 0.18)",
    chipBg: "rgba(217, 119, 6, 0.10)",
    chipText: "#b45309",
    avatarBg: "rgba(217, 119, 6, 0.18)",
  },
  succeeded: {
    accent: "#059669",
    accentSoft: "rgba(5, 150, 105, 0.10)",
    border: "rgba(5, 150, 105, 0.18)",
    chipBg: "rgba(5, 150, 105, 0.10)",
    chipText: "#047857",
    avatarBg: "rgba(5, 150, 105, 0.16)",
  },
  failed: {
    accent: "#dc2626",
    accentSoft: "rgba(220, 38, 38, 0.10)",
    border: "rgba(220, 38, 38, 0.18)",
    chipBg: "rgba(220, 38, 38, 0.10)",
    chipText: "#b91c1c",
    avatarBg: "rgba(220, 38, 38, 0.16)",
  },
  default: {
    accent: "#64748b",
    accentSoft: "rgba(100, 116, 139, 0.08)",
    border: "rgba(100, 116, 139, 0.16)",
    chipBg: "rgba(100, 116, 139, 0.08)",
    chipText: "#475569",
    avatarBg: "rgba(100, 116, 139, 0.14)",
  },
};

const renderText = (value: any, fallback = "--") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const formatDate = (value: any) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
};

const formatDuration = (value: any) => {
  if (value === null || value === undefined || value === "") return "--";

  const milliseconds = Number(value);
  if (Number.isNaN(milliseconds)) return renderText(value);
  if (milliseconds < 1000) return `${milliseconds} ms`;
  if (milliseconds < 60_000) {
    const seconds = milliseconds / 1000;
    return `${seconds >= 10 ? Math.round(seconds) : seconds.toFixed(1)} s`;
  }
  if (milliseconds < 3_600_000) {
    return `${Math.round(milliseconds / 60_000)} min`;
  }

  return `${(milliseconds / 3_600_000).toFixed(1)} h`;
};

const getInitials = (...values: Array<any>) => {
  const source = values.find((value) => value && String(value).trim().length > 0);
  if (!source) return "MQ";

  return String(source)
    .trim()
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "MQ";
};

const getTone = (stage: any) => {
  const key = String(stage || "").toLowerCase();
  return STAGE_TONES[key] || STAGE_TONES.default;
};

const truncate = (value: any, maxLength: number) => {
  const text = renderText(value, "");
  if (!text || text.length <= maxLength) return text || "--";
  return `${text.slice(0, maxLength - 1)}...`;
};

export default function MqMessageKanbanCardWidget({
  rowData,
}: SolidKanbanCardWidgetProps) {
  const tone = getTone(rowData?.stage);
  const chipLabel = renderText(rowData?.messageType, "Message");
  const brokerLabel = renderText(rowData?.messageBroker, "Unknown broker");
  const retryCount = rowData?.retryCount ?? 0;
  const retryInterval = rowData?.retryInterval ?? 0;
  const retryLabel = retryCount > 0 ? `${retryCount} x / ${retryInterval} ms` : "No retries";
  const parentEntity = renderText(rowData?.parentEntity, "Root");
  const errorPreview = truncate(rowData?.error, 96);
  const hasError = Boolean(rowData?.error && String(rowData.error).trim());
  const cardStyle = {
    ["--mq-card-accent" as any]: tone.accent,
    ["--mq-card-accent-soft" as any]: tone.accentSoft,
    ["--mq-card-border" as any]: tone.border,
    ["--mq-card-chip-bg" as any]: tone.chipBg,
    ["--mq-card-chip-text" as any]: tone.chipText,
    ["--mq-card-avatar-bg" as any]: tone.avatarBg,
  };

  return (
    <div className="mq-message-kanban-card" style={cardStyle}>
      <div className="mq-message-kanban-card__accent" />

      <div className="mq-message-kanban-card__eyebrow">
        <span className="mq-message-kanban-card__chip">{chipLabel}</span>
        <span className="mq-message-kanban-card__record-id">#{renderText(rowData?.id)}</span>
      </div>

      <div className="mq-message-kanban-card__title" title={renderText(rowData?.messageId)}>
        {renderText(rowData?.messageId, "Message without identifier")}
      </div>

      <div className="mq-message-kanban-card__subtitle" title={brokerLabel}>
        {brokerLabel}
      </div>

      <div className="mq-message-kanban-card__metrics">
        <div className="mq-message-kanban-card__metric">
          <div className="mq-message-kanban-card__metric-label">Retry</div>
          <div className="mq-message-kanban-card__metric-value">{retryLabel}</div>
        </div>
        <div className="mq-message-kanban-card__metric">
          <div className="mq-message-kanban-card__metric-label">Elapsed</div>
          <div className="mq-message-kanban-card__metric-value">{formatDuration(rowData?.elapsedMillis)}</div>
        </div>
        <div className="mq-message-kanban-card__metric">
          <div className="mq-message-kanban-card__metric-label">Parent</div>
          <div className="mq-message-kanban-card__metric-value" title={parentEntity}>
            {parentEntity}
          </div>
        </div>
        <div className="mq-message-kanban-card__metric">
          <div className="mq-message-kanban-card__metric-label">Broker</div>
          <div className="mq-message-kanban-card__metric-value" title={brokerLabel}>
            {brokerLabel}
          </div>
        </div>
      </div>

      <div className="mq-message-kanban-card__footer">
        <div className="mq-message-kanban-card__timeline">
          <div className="mq-message-kanban-card__timeline-item">
            <span className="mq-message-kanban-card__timeline-label">Started</span>
            <span className="mq-message-kanban-card__timeline-value">{formatDate(rowData?.startedAt)}</span>
          </div>
          <div className="mq-message-kanban-card__timeline-item">
            <span className="mq-message-kanban-card__timeline-label">Finished</span>
            <span className="mq-message-kanban-card__timeline-value">{formatDate(rowData?.finishedAt)}</span>
          </div>
        </div>

        <div className="mq-message-kanban-card__avatar" title={parentEntity}>
          {getInitials(rowData?.parentEntity, rowData?.messageBroker, rowData?.messageType)}
        </div>
      </div>

      {hasError && (
        <div className="mq-message-kanban-card__error" title={renderText(rowData?.error)}>
          <span className="mq-message-kanban-card__error-label">Error</span>
          <span className="mq-message-kanban-card__error-value">{errorPreview}</span>
        </div>
      )}
    </div>
  );
}
