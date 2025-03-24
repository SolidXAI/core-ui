import hanldeEmailFormTypeChange from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeChangeHandler";
import hanldeEmailFormTypeLoad from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeLoad";
import { RolePermissionsManyToManyFieldWidget } from "@/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget";
import { SolidRelationManyToManyAutocompleteWidget } from "@/components/core/form/fields/relations/widgets/SolidRelationManyToManyAutocompleteWidget";
import { SolidRelationManyToManyCheckboxWidget } from "@/components/core/form/fields/relations/widgets/SolidRelationManyToManyCheckboxWidget";
import { CustomHtml } from "@/components/core/form/widgets/CustomHtml";
import React from "react";

type ExtensionRegistry = {
    components: Record<string, React.ComponentType<any>>;
    functions: Record<string, (...args: any[]) => any>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>, aliases: string[] = []) => {
    // console.log(`registerExtensionComponent invoked... ${name}`);
    extensionRegistry.components[name] = component;
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        extensionRegistry.components[alias] = component;
    }
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any) => {
    // console.log(`registerExtensionFunction invoked... ${name}`);
    extensionRegistry.functions[name] = fn;
};

export const getExtensionComponent = (name: string): React.ComponentType<any> | null => {
    if (extensionRegistry.components[name]) {
        return extensionRegistry.components[name];
    }

    return null;

    // const extensionsPath = process.env.NEXT_PUBLIC_SOLID_EXTENSIONS_PATH || "";

    // // Ensure the environment variable is set
    // if (!extensionsPath) {
    //     console.warn(`No overrides path found. Using default components.`);
    //     return () => React.createElement("div", { className: "error-message" }, "Loading dynamic component failed (extensions path not found)");
    // }

    // try {
    //     // return dynamic(() => import(`@solid-extensions/${name}`).then((mod) => mod.default));
    //     return dynamic(() => import(`${extensionsPath}/${name}`).then((mod) => mod.default));
    // } catch (error) {
    //     console.warn(`Component ${name} not found, returning fallback.`);
    // }

    // // Return an empty component
    // return () => React.createElement("div", { className: "error-message" }, "Loading dynamic component failed (component not found)");
};

export const getExtensionFunction = (name: string) => {
    // console.log(`Registry state: `, extensionRegistry);
    return extensionRegistry.functions[name];
};


// Register all the dynamic widget & functions from inside solid-core-ui
// Common
registerExtensionComponent("CustomHtml", CustomHtml, []);
registerExtensionComponent("SolidRelationManyToManyCheckboxWidget", SolidRelationManyToManyCheckboxWidget, ["checkbox"]);
registerExtensionComponent("SolidRelationManyToManyAutocompleteWidget", SolidRelationManyToManyAutocompleteWidget, ["autocomplete"]);


// ModuleMetadata


// ModelMetadata


// Email Template
registerExtensionFunction("emailFormTypeChangeHandler", hanldeEmailFormTypeChange);
registerExtensionFunction("emailFormTypeLoad", hanldeEmailFormTypeLoad);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ["inputSwitch"]);
