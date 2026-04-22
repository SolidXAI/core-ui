import React from "react";

type SolidSwitchProps = {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  onChange?: (checked: boolean) => void;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSwitch({ checked, disabled, name, onChange, className }: SolidSwitchProps) {
  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      name={name}
      aria-checked={!!checked}
      disabled={disabled}
      className={cx("solid-switch", checked && "is-on", disabled && "is-disabled", className)}
      onClick={handleToggle}
    >
      <span className="solid-switch-thumb" />
    </button>
  );
}
