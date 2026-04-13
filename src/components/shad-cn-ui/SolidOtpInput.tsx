import React, { useMemo, useRef } from "react";

type SolidOtpInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange?: (value: string) => void;
  length?: number;
  integerOnly?: boolean;
  invalid?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidOtpInput({
  value = "",
  onChange,
  length = 6,
  integerOnly = true,
  className,
  invalid,
  disabled,
  autoComplete = "one-time-code",
  id,
  name,
  ...inputProps
}: SolidOtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const values = useMemo(() => {
    const safeValue = (value ?? "").toString().slice(0, length);
    const chars = new Array(length).fill("");
    for (let i = 0; i < safeValue.length && i < length; i += 1) {
      chars[i] = safeValue[i] ?? "";
    }
    return chars;
  }, [value, length]);

  const emitChange = (nextChars: string[]) => {
    onChange?.(nextChars.join("").slice(0, length));
  };

  const focusInput = (index: number) => {
    const target = inputsRef.current[index];
    target?.focus();
    target?.select();
  };

  const handleValueChange = (index: number, raw: string) => {
    if (disabled) return;
    let sanitized = raw;
    if (integerOnly) {
      sanitized = sanitized.replace(/\D/g, "");
    }
    const nextChars = [...values];
    if (!sanitized) {
      nextChars[index] = "";
      emitChange(nextChars);
      return;
    }
    const nextChar = sanitized[sanitized.length - 1] ?? "";
    nextChars[index] = nextChar;
    emitChange(nextChars);
    if (nextChar && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const nextChars = [...values];
      if (values[index]) {
        nextChars[index] = "";
        emitChange(nextChars);
        return;
      }
      if (index > 0) {
        nextChars[index - 1] = "";
        emitChange(nextChars);
        focusInput(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (index > 0) focusInput(index - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (index < length - 1) focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    event.preventDefault();
    let pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    if (integerOnly) pasted = pasted.replace(/\D/g, "");
    if (!pasted) return;
    const nextChars = [...values];
    let cursor = index;
    for (const char of pasted) {
      if (cursor >= length) break;
      nextChars[cursor] = char;
      cursor += 1;
    }
    emitChange(nextChars);
    if (cursor <= length - 1) {
      focusInput(cursor);
    } else {
      inputsRef.current[length - 1]?.blur();
    }
  };

  return (
    <div
      className={cx("solid-otp-input", className, invalid && "is-invalid", disabled && "is-disabled")}
      aria-invalid={invalid || undefined}
    >
      {values.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          id={index === 0 ? id : undefined}
          name={index === 0 ? name : undefined}
          type="text"
          inputMode={integerOnly ? "numeric" : "text"}
          autoComplete={autoComplete}
          maxLength={1}
          pattern={integerOnly ? "\\d" : undefined}
          className="solid-otp-input-field"
          value={char}
          disabled={disabled}
          onChange={(event) => handleValueChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          onPaste={(event) => handlePaste(index, event)}
          {...inputProps}
        />
      ))}
    </div>
  );
}
