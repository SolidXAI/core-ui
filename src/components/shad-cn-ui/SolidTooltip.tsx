import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

type SolidTooltipProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  delayDuration?: number;
  skipDelayDuration?: number;
};

type SolidTooltipContentProps = {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
};

type SolidTooltipTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const SolidTooltip = ({
  children,
  defaultOpen,
  delayDuration = 200,
  skipDelayDuration = 300,
}: SolidTooltipProps) => {
  return (
    <Tooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip.Root defaultOpen={defaultOpen}>{children}</Tooltip.Root>
    </Tooltip.Provider>
  );
};

export const SolidTooltipTrigger = ({ children, asChild = false }: SolidTooltipTriggerProps) => {
  return <Tooltip.Trigger asChild={asChild}>{children}</Tooltip.Trigger>;
};

export const SolidTooltipContent = ({
  children,
  side = "top",
  align = "center",
  className,
}: SolidTooltipContentProps) => {
  return (
    <Tooltip.Portal>
      <Tooltip.Content
        side={side}
        align={align}
        className={cx(
          "solid-tooltip-content",
          className
        )}
        sideOffset={6}
      >
        {children}
      </Tooltip.Content>
    </Tooltip.Portal>
  );
};
