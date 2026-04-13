import React from "react";
import { Loader2 } from "lucide-react";
import { SolidIcon, parseSolidIconMeta } from "./SolidIcon";

type SolidButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type SolidButtonSize = "sm" | "md" | "lg" | "small" | "medium" | "large";

type SolidButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SolidButtonVariant;
  size?: SolidButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // Compatibility props
  icon?: string;
  iconPos?: "left" | "right";
  label?: string;
  text?: boolean;
  outlined?: boolean;
  severity?: "primary" | "secondary" | "danger" | "success" | "info" | "warning";
  rounded?: boolean;
  tooltip?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidButton({
  variant,
  size = "md",
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = "button",
  icon,
  iconPos = "left",
  label,
  text,
  outlined,
  severity,
  rounded,
  tooltip,
  ...props
}: SolidButtonProps) {
  const isDisabled = disabled || loading;
  const resolvedVariant: SolidButtonVariant =
    variant
      ?? (outlined
        ? "outline"
        : severity === "danger"
          ? "destructive"
          : severity === "secondary"
            ? "secondary"
            : text
              ? "ghost"
              : "primary");
  const resolvedSize: "sm" | "md" | "lg" =
    size === "small" ? "sm" : size === "large" ? "lg" : size === "medium" ? "md" : size === "lg" ? "lg" : size === "sm" ? "sm" : "md";
  const iconMeta = icon ? parseSolidIconMeta(icon) : undefined;
  const iconNode = iconMeta ? <SolidIcon name={iconMeta.name} spin={iconMeta.spin} aria-hidden /> : null;
  const resolvedChildren = label ?? children;
  const hasOnlyIcon = !loading && !resolvedChildren && !label && (leftIcon || rightIcon || iconNode);

  return (
    <button
      type={type}
      className={cx(
        "solid-btn",
        `solid-btn--${resolvedVariant}`,
        `solid-btn--${resolvedSize}`,
        fullWidth && "solid-btn--full",
        loading && "is-loading",
        rounded && "solid-btn-rounded",
        className
      )}
      disabled={isDisabled}
      title={tooltip}
      {...props}
    >
      {loading && (
        <span className="solid-btn-spinner" aria-hidden="true">
          <Loader2 size={14} className="animate-spin" />
        </span>
      )}
      {!loading && (leftIcon || (iconNode && iconPos === "left")) ? (
        <span className="solid-btn-icon">{leftIcon ?? iconNode}</span>
      ) : null}
      {!hasOnlyIcon && <span className="solid-btn-label">{resolvedChildren}</span>}
      {!loading && (rightIcon || (iconNode && iconPos === "right")) ? (
        <span className="solid-btn-icon">{rightIcon ?? iconNode}</span>
      ) : null}
    </button>
  );
}
