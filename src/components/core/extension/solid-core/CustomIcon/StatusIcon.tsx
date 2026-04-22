import React from "react";
import { SolidIcon } from "../../../../shad-cn-ui/SolidIcon";

interface StatusIconProps {
  isPublished: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ isPublished }) => (
  <span
    className={`status-icon ${isPublished ? "success" : "danger"}`}
    title={isPublished ? "Published" : "Not Published"}
  >
    <SolidIcon name={isPublished ? "si-check" : "si-times"} aria-hidden />
  </span>
);
