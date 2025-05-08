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
    closable: boolean
}


export const useHandleFormCustomButtonClickaction = () => {
    const dispatch = useDispatch();

    return (buttonAttrs: any, event: any) => {
        const { action, openInPopup, closable }: CustomButtonData = buttonAttrs;

        if (openInPopup === true) {
            const eventData = { ...event, action: action, closable: closable };
            dispatch(openPopup(eventData));

        } else {
            const eventData = { ...event, action: action, closable: closable};
            const dynamicFunction = getExtensionFunction(action);
            if (!dynamicFunction) {
                console.error(`Action function "${action}" not found.`);
                return;
            }
            dynamicFunction(eventData);
        }

    };
};
