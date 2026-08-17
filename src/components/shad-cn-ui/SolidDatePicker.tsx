import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SolidInput } from "./SolidInput";
import { SolidSelect } from "./SolidSelect";

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

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) => ({
  value: monthIndex,
  label: new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2026, monthIndex, 1)),
}));

function buildYearOptions(selected: Date | null | undefined, minDate?: Date | null, maxDate?: Date | null) {
  const selectedYear = selected?.getFullYear() ?? new Date().getFullYear();
  const minYear = minDate?.getFullYear() ?? 1900;
  const maxYear = maxDate?.getFullYear() ?? Math.max(2100, selectedYear + 25);
  const years: number[] = [];

  for (let year = minYear; year <= maxYear; year += 1) {
    years.push(year);
  }

  return years;
}

export function SolidDatePicker({
  timeOnly,
  showTimeSelect,
  inputClassName,
  selected,
  dateFormat,
  calendarClassName,
  popperClassName,
  className,
  minDate,
  maxDate,
  renderCustomHeader,
  showMonthDropdown,
  showYearDropdown,
  portalId,
  ...props
}: SolidDatePickerProps) {
  const resolvedShowTime = timeOnly ? true : showTimeSelect;
  const resolvedFormat = (Array.isArray(dateFormat) ? dateFormat[0] : dateFormat) ?? "yyyy-MM-dd";
  const displayValue = formatDateValue(selected as Date | null | undefined, resolvedFormat);
  const enableMonthDropdown = showMonthDropdown ?? !timeOnly;
  const enableYearDropdown = showYearDropdown ?? !timeOnly;
  const shouldUseCustomHeader = !timeOnly && !renderCustomHeader;
  const yearOptions = buildYearOptions(selected as Date | null | undefined, minDate as Date | null | undefined, maxDate as Date | null | undefined);

  return (
    <ReactDatePicker
      popperProps={{ strategy: "fixed" }}
      popperPlacement="bottom-start"
      {...props}
      selected={selected}
      minDate={minDate}
      maxDate={maxDate}
      portalId={portalId ?? "solid-datepicker-portal"}
      showTimeSelect={resolvedShowTime}
      showTimeSelectOnly={timeOnly}
      showMonthDropdown={enableMonthDropdown}
      showYearDropdown={enableYearDropdown}
      renderCustomHeader={
        shouldUseCustomHeader
          ? ({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }: any) => (
              <div className="solid-react-datepicker-header">
                <button
                  type="button"
                  className="solid-react-datepicker-nav"
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="solid-react-datepicker-selects">
                  <div className="solid-react-datepicker-select-shell solid-react-datepicker-select-shell--month">
                    <SolidSelect
                      native={false}
                      className="solid-react-datepicker-select-wrap"
                      value={date.getMonth()}
                      options={MONTH_OPTIONS}
                      menuPlacement="bottom"
                      onChange={({ value }) => changeMonth(Number(value))}
                    />
                  </div>

                  <div className="solid-react-datepicker-select-shell solid-react-datepicker-select-shell--year">
                    <SolidSelect
                      native={false}
                      className="solid-react-datepicker-select-wrap"
                      value={date.getFullYear()}
                      options={yearOptions.map((year) => ({ label: String(year), value: year }))}
                      menuPlacement="bottom"
                      onChange={({ value }) => changeYear(Number(value))}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="solid-react-datepicker-nav"
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )
          : renderCustomHeader
      }
      calendarClassName={cx("solid-react-datepicker-calendar", calendarClassName)}
      popperClassName={cx("solid-react-datepicker-popper", popperClassName)}
      customInput={<SolidDatePickerInput className={inputClassName} displayValue={displayValue} />}
      className={cx("solid-datepicker", className)}
    />
  );
}
