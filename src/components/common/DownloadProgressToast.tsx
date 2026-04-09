import { useEffect } from "react";
import { CheckCircle2, Download, X } from "lucide-react";
import "./solid-export.css";
import { SolidButton, SolidProgressBar } from "../shad-cn-ui";
export const DownloadProgressToast = ({
  progress,
  visible,
  onClose,
  message,
  submessage,
  status
}: {
  progress: number;
  visible: boolean;
  onClose: () => void;
  message?: string;
  submessage?: string;
  status?: string;
}) => {
  useEffect(() => {
    if (progress >= 100) {
      setTimeout(onClose, 2000);
    }
  }, [progress]);

  if (!visible) return null;

  return (
    <div className="SolidExportProgressToaster">
      <div className="solid-export-progress-head">
        <div className={`solid-export-progress-icon ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>
          {status === "success" ? <CheckCircle2 size={18} /> : <Download size={18} />}
        </div>
        <div className="solid-export-progress-copy">
          <h2 className={`solid-export-progress-title ${status === "error" ? "is-error" : ""}`}>
            {message}
          </h2>
          <p className={`solid-export-progress-subtitle ${status === "error" ? "is-error" : ""}`}>
            {submessage}
          </p>
        </div>
        <button type="button" className="solid-export-progress-close" onClick={onClose} aria-label="Close export progress">
          <X size={14} />
        </button>
      </div>
      {status !== "error" && (
        <SolidProgressBar value={progress} showValue={false} className="ExportCustomProgressbar mt-2" />
      )}
      {status === "success" && (
        <div className="solid-export-progress-actions">
          <SolidButton size="small" variant="outline" onClick={onClose}>
            Dismiss
          </SolidButton>
        </div>
      )}
    </div>
  );
};
