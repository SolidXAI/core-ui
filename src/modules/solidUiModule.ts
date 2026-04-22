import type { Middleware, Reducer } from "@reduxjs/toolkit";
import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import {
  registerExtensionComponent,
  registerExtensionFunction,
} from "../helpers/registry";
import type {
  ExtensionComponentType,
  ExtensionFunctionType,
} from "../types/extension-registry";

export type SolidUiModuleRoutes = {
  extraAuthRoutes?: RouteObject[];
  extraAdminRoutes?: RouteObject[];
  extraRoutes?: RouteObject[];
};

export type SolidUiExtensionComponent = {
  name: string;
  component: ComponentType<any>;
  type: ExtensionComponentType;
  aliases?: string[];
  fieldType?: string;
};

export type SolidUiExtensionFunction = {
  name: string;
  fn: (...args: any[]) => any;
  type: ExtensionFunctionType;
};

export type SolidUiModule = {
  name: string;
  routes?: SolidUiModuleRoutes;
  extensionComponents?: SolidUiExtensionComponent[];
  extensionFunctions?: SolidUiExtensionFunction[];
  reducers?: Record<string, Reducer>;
  middlewares?: Middleware[];
};

export type SolidUiModuleImports = Record<string, SolidUiModule>;

export type SolidUiModuleRuntime = {
  modules: SolidUiModule[];
  routes: Required<SolidUiModuleRoutes>;
  reducers: Record<string, Reducer>;
  middlewares: Middleware[];
};

export function getSolidUiModules(moduleImports: SolidUiModuleImports): SolidUiModule[] {
  return Object.entries(moduleImports)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([modulePath, moduleManifest]) => {
      assertSolidUiModule(modulePath, moduleManifest);
      return moduleManifest;
    });
}

export function createSolidUiModuleRuntime(modules: SolidUiModule[]): SolidUiModuleRuntime {
  const routes: Required<SolidUiModuleRoutes> = {
    extraAuthRoutes: [],
    extraAdminRoutes: [],
    extraRoutes: [],
  };
  const reducers: Record<string, Reducer> = {};
  const middlewares: Middleware[] = [];

  modules.forEach((moduleManifest) => {
    routes.extraAuthRoutes.push(...(moduleManifest.routes?.extraAuthRoutes ?? []));
    routes.extraAdminRoutes.push(...(moduleManifest.routes?.extraAdminRoutes ?? []));
    routes.extraRoutes.push(...(moduleManifest.routes?.extraRoutes ?? []));

    Object.entries(moduleManifest.reducers ?? {}).forEach(([reducerPath, reducer]) => {
      if (reducers[reducerPath]) {
        throw new Error(`Duplicate Solid UI reducer path registered: "${reducerPath}"`);
      }

      reducers[reducerPath] = reducer;
    });

    middlewares.push(...(moduleManifest.middlewares ?? []));
  });

  return {
    modules,
    routes,
    reducers,
    middlewares,
  };
}

export function registerSolidUiModuleExtensions(modules: SolidUiModule[]): void {
  const componentNames = new Set<string>();
  const functionNames = new Set<string>();

  modules.forEach((moduleManifest) => {
    (moduleManifest.extensionComponents ?? []).forEach((extensionComponent) => {
      if (componentNames.has(extensionComponent.name)) {
        throw new Error(`Duplicate Solid UI extension component registered: "${extensionComponent.name}"`);
      }

      componentNames.add(extensionComponent.name);
      registerExtensionComponent(
        extensionComponent.name,
        extensionComponent.component,
        extensionComponent.type,
        extensionComponent.aliases,
        extensionComponent.fieldType,
      );
    });

    (moduleManifest.extensionFunctions ?? []).forEach((extensionFunction) => {
      if (functionNames.has(extensionFunction.name)) {
        throw new Error(`Duplicate Solid UI extension function registered: "${extensionFunction.name}"`);
      }

      functionNames.add(extensionFunction.name);
      registerExtensionFunction(
        extensionFunction.name,
        extensionFunction.fn,
        extensionFunction.type,
      );
    });
  });
}

function assertSolidUiModule(modulePath: string, moduleManifest: SolidUiModule): void {
  if (!moduleManifest || typeof moduleManifest !== "object") {
    throw new Error(`Invalid Solid UI module manifest at "${modulePath}"`);
  }

  if (!moduleManifest.name) {
    throw new Error(`Solid UI module manifest at "${modulePath}" is missing a name`);
  }

  const moduleName = getModuleNameFromPath(modulePath);
  if (moduleName && moduleManifest.name !== moduleName) {
    throw new Error(
      `Solid UI module name mismatch at "${modulePath}". Expected "${moduleName}", received "${moduleManifest.name}".`,
    );
  }
}

function getModuleNameFromPath(modulePath: string): string | null {
  const match = modulePath.match(/(?:^|\/)([^/]+)\/\1\.ui-module\.tsx?$/);
  return match?.[1] ?? null;
}
