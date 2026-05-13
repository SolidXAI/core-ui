import React from "react";

type SolidTabProps = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  hasError?: boolean;
};

type SolidTabGroupProps = {
  tabs: SolidTabProps[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
  tabPosition?: "left" | "center" | "right";
  orientation?: "horizontal" | "vertical";
  extra?: React.ReactNode;
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
  tabPosition = "left",
  orientation = "horizontal",
  extra,
}: SolidTabGroupProps) {
  return (
    <div
      className={cx(
        "solid-notebook",
        "solid-tabs",
        `solid-tabs--${tabPosition}`,
        orientation === "vertical" && "solid-tabs--vertical",
        className,
      )}
    >
      <div
        className={cx("solid-notebook-tablist", "solid-tabs-list", listClassName)}
        role="tablist"
        aria-orientation={orientation}
        style={extra ? { display: "flex", alignItems: "center", justifyContent: "space-between" } : undefined}
      >
        {extra ? (
          <div style={{ display: "flex" }}>
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
                  className={cx(
                    "solid-notebook-tab-trigger",
                    "solid-tabs-trigger",
                    tab.hasError && "error",
                    isActive && "active",
                    isActive && "is-active",
                  )}
                  onClick={() => onValueChange(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          tabs.map((tab) => {
            const isActive = tab.value === value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`solid-tab-panel-${tab.value}`}
                id={`solid-tab-${tab.value}`}
                className={cx(
                  "solid-notebook-tab-trigger",
                  "solid-tabs-trigger",
                  tab.hasError && "error",
                  isActive && "active",
                  isActive && "is-active",
                )}
                onClick={() => onValueChange(tab.value)}
              >
                {tab.label}
              </button>
            );
          })
        )}
        {extra && <div>{extra}</div>}
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
            className={cx("solid-notebook-content", "solid-tabs-panel", panelClassName)}
          >
            {isActive ? tab.content : null}
          </div>
        );
      })}
    </div>
  );
}
