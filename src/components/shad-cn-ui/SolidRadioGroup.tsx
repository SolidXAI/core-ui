import React from "react";

type SolidRadioOption = {
  label: React.ReactNode;
  value: any;
};

type SolidRadioGroupProps = {
  name?: string;
  options: SolidRadioOption[];
  value?: any;
  disabled?: boolean;
  onChange?: (value: any) => void;
  className?: string;
  itemClassName?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidRadioGroup({
  name,
  options,
  value,
  disabled,
  onChange,
  className,
  itemClassName,
}: SolidRadioGroupProps) {
  return (
    <div className={cx("solid-radio-group", className)}>
      {options.map((option, index) => (
        <label key={index} className={cx("solid-radio", itemClassName, disabled && "is-disabled")}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange?.(option.value)}
            className="solid-radio-input"
          />
          <span className="solid-radio-circle" />
          <span className="solid-radio-label">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
