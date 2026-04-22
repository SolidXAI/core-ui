import React from "react";

type SolidSliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSlider({ min = 0, max = 100, step = 1, value = 0, disabled, onChange, className }: SolidSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(Number(e.target.value))}
      className={cx("solid-slider", className)}
    />
  );
}
