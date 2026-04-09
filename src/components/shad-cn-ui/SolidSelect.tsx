import React from "react";
import { ChevronDown } from "lucide-react";

type SolidSelectOption = Record<string, any>;

type SolidSelectProps = {
  value?: any;
  options?: SolidSelectOption[];
  optionLabel?: string;
  optionValue?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (event: { value: any }) => void;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSelect({
  value,
  options = [],
  optionLabel = "label",
  optionValue = "value",
  placeholder,
  className,
  disabled,
  onChange,
}: SolidSelectProps) {
  const normalized = options.map((option, index) => ({
    key: String(index),
    label: option?.[optionLabel] ?? "",
    value: option?.[optionValue],
  }));

  const selectedIndex = normalized.findIndex((item) => item.value === value);
  const selectedKey = selectedIndex >= 0 ? normalized[selectedIndex].key : "";

  return (
    <div className={cx("solid-select-wrap", className)}>
      <select
        className="solid-select"
        value={selectedKey}
        disabled={disabled}
        onChange={(event) => {
          const next = normalized.find((item) => item.key === event.target.value);
          onChange?.({ value: next?.value });
        }}
      >
        <option value="" disabled>
          {placeholder || "Select"}
        </option>
        {normalized.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="solid-select-icon" aria-hidden="true">
        <ChevronDown size={14} />
      </span>
    </div>
  );
}
