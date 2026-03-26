import React from "react";

type SolidInputProps = React.InputHTMLAttributes<HTMLInputElement>;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidInput({ className, ...props }: SolidInputProps) {
  return <input className={cx("solid-input", className)} {...props} />;
}

