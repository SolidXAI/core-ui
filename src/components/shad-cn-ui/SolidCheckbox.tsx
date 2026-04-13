import React from "react";

type SolidCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidCheckbox({ label, className, ...props }: SolidCheckboxProps) {
  return (
    <label className={cx("solid-checkbox", className)}>
      <input type="checkbox" className="solid-checkbox-input" {...props} />
      <span className="solid-checkbox-box" />
      {label && <span className="solid-checkbox-label">{label}</span>}
    </label>
  );
}
