import React from "react";
import { SolidInput } from "./SolidInput";

type SolidNumberInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value?: number | string | null;
  onChange?: (event: { value: number | null }) => void;
};

export function SolidNumberInput({ value, onChange, ...props }: SolidNumberInputProps) {
  const normalizedValue = value ?? "";

  return (
    <SolidInput
      {...props}
      type="number"
      value={normalizedValue}
      onChange={(event) => {
        const raw = event.target.value;
        onChange?.({ value: raw === "" ? null : Number(raw) });
      }}
    />
  );
}

