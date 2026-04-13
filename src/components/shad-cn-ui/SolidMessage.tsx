import React from "react";

type SolidMessageProps = {
  severity?: "info" | "success" | "warn" | "error";
  text?: string;
  children?: React.ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidMessage({ severity = "info", text, children, className }: SolidMessageProps) {
  return (
    <div className={cx("solid-message", `solid-message-${severity}`, className)} role="status">
      {text ?? children}
    </div>
  );
}
