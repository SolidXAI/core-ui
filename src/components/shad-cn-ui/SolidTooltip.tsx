import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "./SolidPopover";

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

type SolidTooltipContextValue = {
  isTouchDevice: boolean;
  useTapPopover: boolean;
  setUseTapPopover: (value: boolean) => void;
};

const SolidTooltipContext = React.createContext<SolidTooltipContextValue | null>(null);

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function canUseTapPopoverTrigger(children: React.ReactNode, asChild: boolean, isTouchDevice: boolean) {
  if (!isTouchDevice) {
    return false;
  }

  if (!asChild || !React.isValidElement(children)) {
    return true;
  }

  const childProps = children.props as Record<string, unknown>;

  return (
    typeof childProps.onClick !== "function" &&
    typeof childProps.href !== "string" &&
    typeof childProps.to !== "string"
  );
}

export const SolidTooltip = ({
  children,
  defaultOpen,
  delayDuration = 200,
  skipDelayDuration = 300,
}: SolidTooltipProps) => {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [useTapPopover, setUseTapPopover] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
    const updateMode = () => setIsTouchDevice(touchMedia.matches);

    updateMode();

    if (typeof touchMedia.addEventListener === "function") {
      touchMedia.addEventListener("change", updateMode);
      return () => touchMedia.removeEventListener("change", updateMode);
    }

    touchMedia.addListener(updateMode);
    return () => touchMedia.removeListener(updateMode);
  }, []);

  React.useEffect(() => {
    if (!isTouchDevice && useTapPopover) {
      setUseTapPopover(false);
    }
  }, [isTouchDevice, useTapPopover]);

  const content = (
    <SolidTooltipContext.Provider value={{ isTouchDevice, useTapPopover, setUseTapPopover }}>
      {children}
    </SolidTooltipContext.Provider>
  );

  if (isTouchDevice && useTapPopover) {
    return <SolidPopover autoCloseGroup="solid-tooltip">{content}</SolidPopover>;
  }

  return (
    <Tooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip.Root defaultOpen={defaultOpen}>{content}</Tooltip.Root>
    </Tooltip.Provider>
  );
};

export const SolidTooltipTrigger = ({ children, asChild = false }: SolidTooltipTriggerProps) => {
  const context = React.useContext(SolidTooltipContext);
  const shouldUseTapPopover = canUseTapPopoverTrigger(children, asChild, context?.isTouchDevice ?? false);

  React.useEffect(() => {
    context?.setUseTapPopover(shouldUseTapPopover);
  }, [context, shouldUseTapPopover]);

  if (context?.useTapPopover) {
    return <SolidPopoverTrigger asChild={asChild}>{children}</SolidPopoverTrigger>;
  }

  return <Tooltip.Trigger asChild={asChild}>{children}</Tooltip.Trigger>;
};

export const SolidTooltipContent = ({
  children,
  side = "top",
  align = "center",
  className,
}: SolidTooltipContentProps) => {
  const context = React.useContext(SolidTooltipContext);

  if (context?.isTouchDevice && context.useTapPopover) {
    return (
      <SolidPopoverContent
        side={side}
        align={align}
        className={cx(
          "solid-tooltip-content",
          className
        )}
        sideOffset={6}
      >
        {children}
      </SolidPopoverContent>
    );
  }

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
