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
  return pattern
    .replace(/yyyy/g, String(value.getFullYear()))
    .replace(/MM/g, pad(value.getMonth() + 1))
    .replace(/dd/g, pad(value.getDate()))
    .replace(/HH/g, pad(value.getHours()))
    .replace(/mm/g, pad(value.getMinutes()));
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
      {...props}
      selected={selected}
      showTimeSelect={resolvedShowTime}
      showTimeSelectOnly={timeOnly}
      customInput={<SolidDatePickerInput className={inputClassName} displayValue={displayValue} />}
      className={cx("solid-datepicker", className)}
    />
  );
}
