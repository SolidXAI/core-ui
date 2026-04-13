import React from "react";
import { SolidTabGroup } from "../shad-cn-ui";

type Tab = {
  key: string;
  label: string;
  content: React.ReactNode;
};

type AuthTabsProps = {
  tabs: Tab[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export const AuthTabs = ({ tabs, activeIndex, onChange }: AuthTabsProps) => {
  if (!tabs.length) return null;

  const activeValue = tabs[activeIndex]?.key || tabs[0].key;

  return (
    <SolidTabGroup
      className="solid-auth-tabs"
      listClassName="solid-auth-tabs-list"
      panelClassName="solid-auth-tabs-panel"
      tabs={tabs.map((tab) => ({
        value: tab.key,
        label: tab.label,
        content: tab.content,
      }))}
      value={activeValue}
      onValueChange={(value) => {
        const nextIndex = tabs.findIndex((tab) => tab.key === value);
        if (nextIndex >= 0) onChange(nextIndex);
      }}
    />
  );
};
