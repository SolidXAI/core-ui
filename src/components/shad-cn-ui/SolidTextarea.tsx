import React from "react";

type SolidTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidTextarea({ className, ...props }: SolidTextareaProps) {
  return <textarea className={cx("solid-input solid-textarea", className)} {...props} />;
}
