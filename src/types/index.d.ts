declare module "react-star-ratings";
declare module "react-js-pagination";
declare module "bcryptjs";
declare module "nodemailer";
declare module "mapbox-gl/dist/mapbox-gl.js";
declare module "react-datepicker";
declare module "moment";

import React, { ReactNode } from 'react';
import {
    LayoutConfig,
    LayoutState,
    LayoutContextProps,
    AppConfigProps
} from './layout';

import {
    SolidUiEvent
} from './solid-core';

type ChildContainerProps = {
    children: ReactNode;
};

export interface MenuContextProps {
    activeMenu: string;
    setActiveMenu: Dispatch<SetStateAction<string>>;
}

export type {
    LayoutConfig,
    LayoutState,
    LayoutContextProps,
    ChildContainerProps,
    AppConfigProps,
    MenuContextProps,
    SolidUiEvent
};
