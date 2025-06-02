"usec client";

import { useDispatch } from "react-redux";
import { getExtensionComponent, getExtensionFunction } from "@/helpers/registry";
import { openPopup } from "@/redux/features/popupSlice";
import React, { ComponentType } from "react";

type CustomButtonData = {
    className?: string,
    label: string,
    action: string,
    openInPopup: boolean,
    actionInContextMenu: boolean,
    customComponentIsSystem: string,
    popupWidth?: string,
    closable?: boolean
}


export const useHandleListCustomButtonClick = () => {
    const dispatch = useDispatch();

    return (buttonAttrs: any, event: any) => {
        const { action, openInPopup }: CustomButtonData = buttonAttrs;

        if (openInPopup === true) {
            const eventData = { ...event, ...buttonAttrs };
            dispatch(openPopup(eventData));

        } else {
            const eventData = { ...event, ...buttonAttrs };
            const dynamicFunction = getExtensionFunction(action);
            if (!dynamicFunction) {
                console.error(`Action function "${action}" not found.`);
                return;
            }
            dynamicFunction(eventData);
        }

    };
};
