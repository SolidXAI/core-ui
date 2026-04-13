import React from "react";

type SolidTagProps = {
  children?: React.ReactNode;
  tone?: "info" | "success" | "warn" | "danger";
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidTag({ children, tone = "info", className }: SolidTagProps) {
  return <span className={cx("solid-tag", `solid-tag-${tone}`, className)}>{children}</span>;
}
