import React from "react";

type SolidButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type SolidButtonSize = "sm" | "md" | "lg";

type SolidButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SolidButtonVariant;
  size?: SolidButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidButton({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: SolidButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cx(
        "solid-btn",
        `solid-btn--${variant}`,
        `solid-btn--${size}`,
        fullWidth && "solid-btn--full",
        loading && "is-loading",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <span className="solid-btn-spinner" aria-hidden="true" />}
      {!loading && leftIcon ? <span className="solid-btn-icon">{leftIcon}</span> : null}
      <span className="solid-btn-label">{children}</span>
      {!loading && rightIcon ? <span className="solid-btn-icon">{rightIcon}</span> : null}
    </button>
  );
}
