import React, { useEffect } from "react";
import {SolidPopover,SolidPopoverContent,SolidPopoverTrigger,} from "../shad-cn-ui";
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
    const [useTapPopover, setUseTapPopover] = React.useState(false);
    const showTooltip =
        solidFormViewMetaData.data.solidView?.layout?.attrs?.showTooltip ?? true;
    const fieldDescription =
        fieldLayoutInfo.attrs.description ?? fieldMetadata.description;

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
        const responsiveMedia = window.matchMedia("(max-width: 991px)");
        const updateMode = () => {
            setUseTapPopover(touchMedia.matches || responsiveMedia.matches);
        };

        updateMode();

        const addChangeListener = (mediaQuery: MediaQueryList, listener: () => void) => {
            if (typeof mediaQuery.addEventListener === "function") {
                mediaQuery.addEventListener("change", listener);
                return () => mediaQuery.removeEventListener("change", listener);
            }

            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        };

        const removeTouchListener = addChangeListener(touchMedia, updateMode);
        const removeResponsiveListener = addChangeListener(responsiveMedia, updateMode);

        return () => {
            removeTouchListener();
            removeResponsiveListener();
        };
    }, []);

    if (!showTooltip || !fieldDescription) return null;

    const triggerButton = (
        <button
            type="button"
            className="solid-field-tooltip-icon"
            aria-label="Field info"
        >
            <SolidIcon name="si-info-circle" />
        </button>
    );

    if (useTapPopover) {
        return (
            <SolidPopover>
                <SolidPopoverTrigger asChild>
                    {triggerButton}
                </SolidPopoverTrigger>
                <SolidPopoverContent
                    side="top"
                    align="center"
                    sideOffset={6}
                    className="solid-field-tooltip-popover"
                >
                    {fieldDescription}
                </SolidPopoverContent>
            </SolidPopover>
        );
    }

    return (
        <SolidTooltip>
            <SolidTooltipTrigger asChild>
                {triggerButton}
            </SolidTooltipTrigger>
            <SolidTooltipContent side="top" align="center">
                {fieldDescription}
            </SolidTooltipContent>
        </SolidTooltip>
    );
};
