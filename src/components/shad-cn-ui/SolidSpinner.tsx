import React from "react";
import { Loader2 } from "lucide-react";

type SolidSpinnerProps = {
  size?: number;
  className?: string;
  label?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSpinner({ size = 28, className, label }: SolidSpinnerProps) {
  return (
    <div className={cx("solid-spinner", className)} role="status" aria-live="polite">
      <Loader2 size={size} className="solid-spinner-icon" aria-hidden="true" />
      {label ? <span className="solid-spinner-label">{label}</span> : null}
    </div>
  );
}
