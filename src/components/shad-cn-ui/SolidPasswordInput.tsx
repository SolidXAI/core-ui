import React, { useState } from "react";
import { SolidInput } from "./SolidInput";

type SolidPasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  toggle?: boolean;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidPasswordInput({ className, toggle = true, ...props }: SolidPasswordInputProps) {
  const [shown, setShown] = useState(false);
  const inputType = toggle ? (shown ? "text" : "password") : "password";

  return (
    <div className="solid-password">
      <SolidInput {...props} type={inputType} className={cx("solid-input", className)} />
      {toggle && (
        <button
          type="button"
          className="solid-password-toggle"
          onClick={() => setShown((prev) => !prev)}
          aria-label={shown ? "Hide password" : "Show password"}
        >
          {shown ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}
