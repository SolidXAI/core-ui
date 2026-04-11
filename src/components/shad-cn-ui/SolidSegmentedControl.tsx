import React from "react";

type SolidSegmentedOption = {
  label: React.ReactNode;
  value: any;
};

type SolidSegmentedControlProps = {
  options: SolidSegmentedOption[];
  value?: any;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (value: any) => void;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSegmentedControl({
  options,
  value,
  multiple,
  disabled,
  readOnly,
  onChange,
  className,
}: SolidSegmentedControlProps) {
  const isSelected = (val: any) => (multiple ? Array.isArray(value) && value.includes(val) : value === val);

  const handleClick = (val: any) => {
    if (disabled || readOnly) return;
    if (multiple) {
      const next = Array.isArray(value) ? [...value] : [];
      const exists = next.includes(val);
      onChange?.(exists ? next.filter((item) => item !== val) : [...next, val]);
      return;
    }
    onChange?.(val);
  };

  return (
    <div className={cx("solid-segmented", className)}>
      {options.map((opt, index) => (
        <button
          key={index}
          type="button"
          className={cx("solid-segmented-item", isSelected(opt.value) && "is-active", disabled && "is-disabled")}
          onClick={() => handleClick(opt.value)}
          aria-pressed={isSelected(opt.value)}
          aria-disabled={disabled || readOnly}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
