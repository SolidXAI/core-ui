import React, { useState } from "react";

type SolidPanelProps = {
  header?: React.ReactNode;
  toggleable?: boolean;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidPanel({ header, toggleable, defaultCollapsed, children, className }: SolidPanelProps) {
  const [collapsed, setCollapsed] = useState(!!defaultCollapsed);
  const handleToggle = () => toggleable && setCollapsed((prev) => !prev);

  return (
    <div className={cx("solid-panel", className)}>
      <div className="solid-panel-header">
        <div className="solid-panel-title">{header}</div>
        {toggleable && (
          <button type="button" className="solid-panel-toggle" onClick={handleToggle} aria-expanded={!collapsed}>
            <i className={collapsed ? "pi pi-chevron-down" : "pi pi-chevron-up"} aria-hidden />
          </button>
        )}
      </div>
      {!collapsed && <div className="solid-panel-content">{children}</div>}
    </div>
  );
}
