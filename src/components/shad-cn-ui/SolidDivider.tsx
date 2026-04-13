import React from "react";

export function SolidDivider({ className }: { className?: string }) {
  return <div className={`solid-divider ${className ?? ""}`} />;
}
