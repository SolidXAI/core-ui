import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SolidInput } from "./SolidInput";

type SolidDatePickerProps = React.ComponentProps<typeof ReactDatePicker> & {
  timeOnly?: boolean;
  inputClassName?: string;
};

type SolidDatePickerInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  displayValue?: string;
};

function formatDateValue(value: Date | null | undefined, pattern?: string) {
  if (!value || !(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  if (!pattern) {
    return value.toISOString();
  }
  const pad = (num: number, length = 2) => String(num).padStart(length, "0");
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const seconds = value.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;

  return pattern
    .replace(/yyyy/g, String(value.getFullYear()))
    .replace(/MM/g, pad(value.getMonth() + 1))
    .replace(/dd/g, pad(value.getDate()))
    .replace(/HH/g, pad(hours))
    .replace(/hh/g, pad(h12))
    .replace(/h/g, String(h12))
    .replace(/mm/g, pad(minutes))
    .replace(/ss/g, pad(seconds))
    .replace(/aa/g, ampm)
    .replace(/a/g, ampm);
}

const SolidDatePickerInput = React.forwardRef<HTMLInputElement, SolidDatePickerInputProps>(
  ({ className, displayValue, ...props }, ref) => (
    <SolidInput
      ref={ref}
      {...props}
      value={displayValue ?? (typeof props.value === "string" ? props.value : "")}
      readOnly
      className={className}
    />
  )
);

SolidDatePickerInput.displayName = "SolidDatePickerInput";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidDatePicker({
  timeOnly,
  showTimeSelect,
  inputClassName,
  selected,
  dateFormat,
  className,
  ...props
}: SolidDatePickerProps) {
  const resolvedShowTime = timeOnly ? true : showTimeSelect;
  const resolvedFormat = (Array.isArray(dateFormat) ? dateFormat[0] : dateFormat) ?? "yyyy-MM-dd";
  const displayValue = formatDateValue(selected as Date | null | undefined, resolvedFormat);

  return (
    <ReactDatePicker
      popperProps={{ strategy: "fixed" }}
      popperPlacement="bottom-start"
      {...props}
      selected={selected}
      showTimeSelect={resolvedShowTime}
      showTimeSelectOnly={timeOnly}
      customInput={<SolidDatePickerInput className={inputClassName} displayValue={displayValue} />}
      className={cx("solid-datepicker", className)}
    />
  );
}
