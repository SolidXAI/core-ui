import { SolidSpinner } from "../shad-cn-ui";

type SolidHeaderRequestStatusProps = {
  label?: string | null;
};

export function SolidHeaderRequestStatus({ label }: SolidHeaderRequestStatusProps) {
  if (!label) return null;

  return (
    <div className="solid-header-request-status" role="status" aria-live="polite">
      <span className="solid-header-request-status-label">{label}</span>
      <SolidSpinner size={14} className="solid-header-request-status-spinner" />
    </div>
  );
}
