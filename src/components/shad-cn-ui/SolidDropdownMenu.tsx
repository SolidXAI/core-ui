import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const SolidDropdownMenu = DropdownMenu.Root;
export const SolidDropdownMenuTrigger = DropdownMenu.Trigger;
export const SolidDropdownMenuSub = DropdownMenu.Sub;
export const SolidDropdownMenuRadioGroup = DropdownMenu.RadioGroup;

export const SolidDropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>
>(function SolidDropdownMenuContent({ className, sideOffset = 6, align = "end", ...props }, ref) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cx("solid-dropdown-menu-content", className)}
        {...props}
      />
    </DropdownMenu.Portal>
  );
});

export const SolidDropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Item>
>(function SolidDropdownMenuItem({ className, ...props }, ref) {
  return <DropdownMenu.Item ref={ref} className={cx("solid-dropdown-menu-item", className)} {...props} />;
});

export const SolidDropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.CheckboxItem>
>(function SolidDropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return (
    <DropdownMenu.CheckboxItem
      ref={ref}
      checked={checked}
      className={cx("solid-dropdown-menu-item solid-dropdown-menu-checkbox-item", className)}
      {...props}
    >
      <span className="solid-dropdown-menu-indicator">
        <DropdownMenu.ItemIndicator>
          <i className="pi pi-check" />
        </DropdownMenu.ItemIndicator>
      </span>
      <span className="solid-dropdown-menu-item-text">{children}</span>
    </DropdownMenu.CheckboxItem>
  );
});

export const SolidDropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.RadioItem>
>(function SolidDropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenu.RadioItem
      ref={ref}
      className={cx("solid-dropdown-menu-item solid-dropdown-menu-radio-item", className)}
      {...props}
    >
      <span className="solid-dropdown-menu-indicator">
        <DropdownMenu.ItemIndicator>
          <span className="solid-dropdown-menu-radio-dot" />
        </DropdownMenu.ItemIndicator>
      </span>
      <span className="solid-dropdown-menu-item-text">{children}</span>
    </DropdownMenu.RadioItem>
  );
});

export const SolidDropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Label>
>(function SolidDropdownMenuLabel({ className, ...props }, ref) {
  return <DropdownMenu.Label ref={ref} className={cx("solid-dropdown-menu-label", className)} {...props} />;
});

export const SolidDropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Separator>
>(function SolidDropdownMenuSeparator({ className, ...props }, ref) {
  return <DropdownMenu.Separator ref={ref} className={cx("solid-dropdown-menu-separator", className)} {...props} />;
});

export const SolidDropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.SubTrigger>
>(function SolidDropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <DropdownMenu.SubTrigger
      ref={ref}
      className={cx("solid-dropdown-menu-item solid-dropdown-menu-subtrigger", className)}
      {...props}
    >
      {children}
      <i className="pi pi-chevron-right solid-dropdown-menu-subtrigger-icon" />
    </DropdownMenu.SubTrigger>
  );
});

export const SolidDropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.SubContent>
>(function SolidDropdownMenuSubContent({ className, sideOffset = 2, alignOffset = -4, ...props }, ref) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        ref={ref}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={cx("solid-dropdown-menu-content solid-dropdown-menu-subcontent", className)}
        {...props}
      />
    </DropdownMenu.Portal>
  );
});
