import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const SolidAccordion = Accordion.Root;

export const SolidAccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Accordion.Item>
>(function SolidAccordionItem({ className, ...props }, ref) {
  return <Accordion.Item ref={ref} className={cx("solid-accordion-item", className)} {...props} />;
});

export const SolidAccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Accordion.Trigger>
>(function SolidAccordionTrigger({ className, children, ...props }, ref) {
  return (
    <Accordion.Header className="solid-accordion-header">
      <Accordion.Trigger ref={ref} className={cx("solid-accordion-trigger", className)} {...props}>
        <span className="solid-accordion-trigger-label">{children}</span>
        <i className="pi pi-chevron-down solid-accordion-trigger-icon" />
      </Accordion.Trigger>
    </Accordion.Header>
  );
});

export const SolidAccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Accordion.Content>
>(function SolidAccordionContent({ className, children, ...props }, ref) {
  return (
    <Accordion.Content ref={ref} className={cx("solid-accordion-content", className)} {...props}>
      <div className="solid-accordion-content-inner">{children}</div>
    </Accordion.Content>
  );
});
