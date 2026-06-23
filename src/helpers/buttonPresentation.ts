type ButtonAttrs = {
  icon?: string;
  label?: string;
  showLabel?: boolean;
  iconPos?: "left" | "right" | string;
  tooltip?: string;
  action?: string;
  className?: string;
  buttonClassName?: string;
  classes?: string;
};

export type ButtonPresentation = {
  icon?: string;
  label?: string;
  showIcon: boolean;
  showLabel: boolean;
  iconPos: "left" | "right";
  isIconOnly: boolean;
  tooltip?: string;
  buttonClassName?: string;
};

export function resolveButtonPresentation(attrs?: ButtonAttrs): ButtonPresentation {
  const rawIcon = typeof attrs?.icon === "string" ? attrs.icon.trim() : "";
  const rawLabel = typeof attrs?.label === "string" ? attrs.label.trim() : "";
  const iconPos = attrs?.iconPos === "right" ? "right" : "left";

  const showIcon = rawIcon.length > 0;
  const showLabel = attrs?.showLabel !== false && rawLabel.length > 0;
  const isIconOnly = showIcon && !showLabel;
  const buttonClassName = [attrs?.className, attrs?.buttonClassName, attrs?.classes]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .join(" ");

  const tooltip = typeof attrs?.tooltip === "string" && attrs.tooltip.trim().length > 0
    ? attrs.tooltip.trim()
    : isIconOnly
      ? (attrs?.action || undefined)
      : undefined;

  return {
    icon: showIcon ? rawIcon : undefined,
    label: showLabel ? rawLabel : undefined,
    showIcon,
    showLabel,
    iconPos,
    isIconOnly,
    tooltip,
    buttonClassName: buttonClassName || undefined
  };
}
