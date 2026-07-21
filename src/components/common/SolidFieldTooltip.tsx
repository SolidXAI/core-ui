import React from "react";
import {
    SolidTooltip,
    SolidTooltipContent,
    SolidTooltipTrigger,
} from "../shad-cn-ui/SolidTooltip";
import { SolidIcon } from "../shad-cn-ui";

export const SolidFieldTooltip = ({ fieldContext }: any) => {
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const fieldLayoutInfo = fieldContext.field;
    const fieldMetadata = fieldContext.fieldMetadata;
    const showTooltip =
        solidFormViewMetaData.data.solidView?.layout?.attrs?.showTooltip ?? true;
    const fieldDescription =
        fieldLayoutInfo.attrs.description ?? fieldMetadata.description;

    if (!showTooltip || !fieldDescription) return null;

    return (
        <SolidTooltip>
            <SolidTooltipTrigger asChild>
                <button
                    type="button"
                    className="solid-field-tooltip-icon"
                    aria-label="Field info"
                >
                    <SolidIcon name="si-info-circle" />
                </button>
            </SolidTooltipTrigger>
            <SolidTooltipContent side="top" align="center">
                {fieldDescription}
            </SolidTooltipContent>
        </SolidTooltip>
    );
};
