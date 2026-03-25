import React from "react";

type SolidTabProps = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

type SolidTabGroupProps = {
  tabs: SolidTabProps[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidTab(_props: SolidTabProps) {
  return null;
}

export function SolidTabGroup({
  tabs,
  value,
  onValueChange,
  className,
  listClassName,
  panelClassName,
}: SolidTabGroupProps) {
  return (
    <div className={cx("solid-tabs", className)}>
      <div className={cx("solid-tabs-list", listClassName)} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`solid-tab-panel-${tab.value}`}
              id={`solid-tab-${tab.value}`}
              className={cx("solid-tabs-trigger", isActive && "is-active")}
              onClick={() => onValueChange(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <div
            key={tab.value}
            role="tabpanel"
            id={`solid-tab-panel-${tab.value}`}
            aria-labelledby={`solid-tab-${tab.value}`}
            hidden={!isActive}
            className={cx("solid-tabs-panel", panelClassName)}
          >
            {isActive ? tab.content : null}
          </div>
        );
      })}
    </div>
  );
}
