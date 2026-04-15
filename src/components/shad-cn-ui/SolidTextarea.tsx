import React from "react";

type SolidTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidTextarea({ className, disabled, readOnly, style, ...props }: SolidTextareaProps) {
  const isInteractionLocked = Boolean(disabled || readOnly);

  return (
    <textarea
      className={cx("solid-input solid-textarea", isInteractionLocked && "is-interaction-locked", className)}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      style={{
        ...(style || {}),
        ...(isInteractionLocked ? { opacity: 0.75, cursor: "not-allowed" } : {}),
      }}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
    />
  );
}
