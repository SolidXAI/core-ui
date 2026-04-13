import React, { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastSeverity } from "../../redux/features/toastSlice";

type SolidToastProps = {
  id: number;
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  onClose: (id: number) => void;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getToastIcon(severity: ToastSeverity) {
  switch (severity) {
    case "success":
      return <CheckCircle2 size={16} />;
    case "warn":
      return <AlertTriangle size={16} />;
    case "error":
      return <AlertCircle size={16} />;
    case "info":
    default:
      return <Info size={16} />;
  }
}

export function SolidToast({ id, severity, summary, detail, life, sticky, onClose }: SolidToastProps) {
  useEffect(() => {
    if (sticky) return undefined;

    const timeout = window.setTimeout(() => onClose(id), life ?? 3000);
    return () => window.clearTimeout(timeout);
  }, [id, life, onClose, sticky]);

  return (
    <div className={cx("solid-toast", `is-${severity}`)} role="status" aria-live="polite">
      <div className="solid-toast-icon" aria-hidden="true">
        {getToastIcon(severity)}
      </div>
      <div className="solid-toast-copy">
        <div className="solid-toast-title">{summary}</div>
        {detail ? <div className="solid-toast-description">{detail}</div> : null}
      </div>
      <button type="button" className="solid-toast-close" aria-label="Close notification" onClick={() => onClose(id)}>
        <X size={14} />
      </button>
    </div>
  );
}
