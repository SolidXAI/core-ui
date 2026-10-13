import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../../../shad-cn-ui";
import type { SolidListFieldWidgetProps } from "../../../../../../types/solid-core";

type FailureDetails = {
  message: string;
  errorClass?: string;
  guidance?: string;
};

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function nonEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined && value !== false && value !== "";
}

function errorDetails(value: unknown, visited = new Set<object>()): FailureDetails | undefined {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object") return undefined;
  if (visited.has(parsed)) return undefined;
  visited.add(parsed);

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const failure = errorDetails(item, visited);
      if (failure) return failure;
    }
    return undefined;
  }

  const record = parsed as Record<string, unknown>;
  const failedFlag = record.isError === true || record.ok === false || record.success === false;
  const failedStatus = [record.status, record.state, record.outcome]
    .some((status) => typeof status === "string" && /^(error|failed|failure|rejected)$/i.test(status.trim()));

  for (const key of ["tool_failed", "error", "errors", "exception", "failure"]) {
    const candidate = record[key];
    if (!nonEmpty(candidate)) continue;
    const candidateRecord = parseJson(candidate);
    if (typeof candidateRecord === "string") {
      return { message: candidateRecord.trim() || "The operation failed." };
    }
    if (candidateRecord && typeof candidateRecord === "object") {
      const details = candidateRecord as Record<string, unknown>;
      const message = [details.message, details.detail, details.description, details.reason]
        .find((part) => typeof part === "string" && part.trim());
      return {
        message: typeof message === "string" ? message.trim() : "The operation failed.",
        errorClass: typeof details.error_class === "string" ? details.error_class : typeof details.errorClass === "string" ? details.errorClass : undefined,
        guidance: typeof details.guidance === "string" ? details.guidance : undefined,
      };
    }
    return { message: String(candidate) };
  }

  if (failedFlag || failedStatus) {
    const message = [record.message, record.detail, record.description]
      .find((part) => typeof part === "string" && part.trim());
    return { message: typeof message === "string" ? message.trim() : "The operation failed." };
  }

  for (const nested of Object.values(record)) {
    const failure = errorDetails(nested, visited);
    if (failure) return failure;
  }
  return undefined;
}

export function getAgentEventFailure(rowData: Record<string, unknown>): FailureDetails | undefined {
  const eventType = String(rowData.eventType ?? "");
  if (/error|failed|failure/i.test(eventType)) {
    return errorDetails(rowData.toolOutput) ?? errorDetails(rowData.eventData) ?? {
      message: `The ${eventType || "event"} reported a failure.`,
    };
  }
  const returnCode = rowData.toolReturncode;
  if (returnCode !== null && returnCode !== undefined && Number(returnCode) !== 0) {
    return errorDetails(rowData.toolOutput) ?? errorDetails(rowData.eventData) ?? {
      message: `The tool exited with return code ${String(returnCode)}.`,
    };
  }
  return errorDetails(rowData.toolOutput) ?? errorDetails(rowData.eventData);
}

/** Shows a compact event outcome, with structured failure details when available. */
export function AgentEventOutcomeListWidget({ rowData, fieldMetadata }: SolidListFieldWidgetProps) {
  const eventType = String(rowData?.[fieldMetadata?.name] ?? "");
  const failure = getAgentEventFailure(rowData ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
      <span>{eventType}</span>
      {failure ? (
        <SolidTooltip>
          <SolidTooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Error: ${failure.message}`}
              style={{ border: "1px solid #fecaca", borderRadius: "999px", padding: "0.08rem 0.38rem", background: "#fef2f2", color: "#b91c1c", cursor: "help", fontSize: "0.62rem", fontWeight: 700, lineHeight: 1.3 }}
            >
              ERROR
            </button>
          </SolidTooltipTrigger>
          <SolidTooltipContent align="start" className="max-w-sm whitespace-normal">
            <div style={{ display: "grid", gap: "0.35rem", maxWidth: "22rem", whiteSpace: "normal", overflowWrap: "anywhere" }}>
              <strong>{failure.errorClass || "Event failed"}</strong>
              <span>{failure.message}</span>
              {failure.guidance && <span style={{ opacity: 0.8 }}>{failure.guidance}</span>}
            </div>
          </SolidTooltipContent>
        </SolidTooltip>
      ) : (
        <span style={{ border: "1px solid #bbf7d0", borderRadius: "999px", padding: "0.08rem 0.38rem", background: "#f0fdf4", color: "#15803d", fontSize: "0.62rem", fontWeight: 700, lineHeight: 1.3 }}>
          SUCCESS
        </span>
      )}
    </div>
  );
}
