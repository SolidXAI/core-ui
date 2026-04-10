import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SolidInput } from "./SolidInput";

type SolidDatePickerProps = React.ComponentProps<typeof ReactDatePicker> & {
  timeOnly?: boolean;
  inputClassName?: string;
};

export function SolidDatePicker({ timeOnly, showTimeSelect, inputClassName, ...props }: SolidDatePickerProps) {
  const resolvedShowTime = timeOnly ? true : showTimeSelect;

  return (
    <ReactDatePicker
      {...props}
      showTimeSelect={resolvedShowTime}
      showTimeSelectOnly={timeOnly}
      customInput={<SolidInput className={inputClassName} />}
      className="solid-datepicker"
    />
  );
}
