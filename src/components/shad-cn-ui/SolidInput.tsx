import React from "react";

type SolidInputProps = React.InputHTMLAttributes<HTMLInputElement>;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const SolidInput = React.forwardRef<HTMLInputElement, SolidInputProps>(function SolidInput(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cx("solid-input", className)} {...props} />;
});
