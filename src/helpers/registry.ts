import React from "react";

type ExtensionRegistry = {
    components: Record<string, React.ComponentType<any>>;
    functions: Record<string, (...args: any[]) => any>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>) => {
    console.log(`registerExtensionComponent invoked... ${name}`);
    extensionRegistry.components[name] = component;
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any) => {
    console.log(`registerExtensionFunction invoked... ${name}`);
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
    console.log(`Registry state: `, extensionRegistry);
    return extensionRegistry.functions[name];
};