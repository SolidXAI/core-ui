import React from "react";

type SolidProgressBarProps = {
  value?: number;
  showValue?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidProgressBar({ value = 0, showValue = true, className, style }: SolidProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cx("solid-progress", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      style={style}
    >
      <div className="solid-progress-bar" style={{ width: `${clamped}%` }} />
      {showValue && <span className="solid-progress-label">{clamped}%</span>}
    </div>
  );
}
