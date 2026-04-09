import React, { useState } from "react";

type SolidAccordionItemProps = {
  value: string;
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

type SolidAccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactElement<SolidAccordionItemProps>[];
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidAccordion({ type = "single", defaultValue, children, className }: SolidAccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  );

  const toggle = (value: string) => {
    setOpenValues((prev) => {
      const exists = prev.includes(value);
      if (type === "single") return exists ? [] : [value];
      return exists ? prev.filter((v) => v !== value) : [...prev, value];
    });
  };

  return (
    <div className={cx("solid-accordion", className)}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        const isOpen = openValues.includes(child.props.value);
        return React.cloneElement(child, {
          open: isOpen,
          onToggle: () => toggle(child.props.value),
        } as any);
      })}
    </div>
  );
}

export function SolidAccordionItem({
  value,
  title,
  children,
  defaultOpen,
  open,
  onToggle,
}: SolidAccordionItemProps & { open?: boolean; onToggle?: () => void }) {
  const isOpen = open ?? defaultOpen;
  return (
    <div className="solid-accordion-item">
      <button type="button" className="solid-accordion-trigger" aria-expanded={isOpen} onClick={onToggle}>
        {title}
        <span className="solid-accordion-icon" aria-hidden>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && <div className="solid-accordion-content">{children}</div>}
    </div>
  );
}
